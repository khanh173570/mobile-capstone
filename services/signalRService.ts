import * as SignalR from '@microsoft/signalr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { refreshAccessToken } from './authService';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://gateway.a-379.store/api';
const SIGNALR_HUB_URL = `${API_URL}/messaging-service/hubs/global`;

// Event types
export type BidPlacedEvent = {
  auctionId: string;
  bidId: string;
  userId: string;
  userName: string;
  bidAmount: number;
  previousPrice: number;
  newPrice: number;
  placedAt: string;
  isAutoBid?: boolean;
  autoBidMaxLimit?: number;
};

export type BuyNowEvent = {
  auctionId: string;
  bidId: string;
  userId: string;
  userName: string;
  buyNowPrice: number;
  purchasedAt: string;
};

export type NewNotificationEvent = {
  id: string;
  userId: string;
  type: number; // 1-16 notification type
  severity: 'Info' | 'Warning' | 'Critical';
  title: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  data?: string; // JSON string with extra data
  relatedEntityId?: string;
  relatedEntityType?: string;
  createdAt: string;
};

export type SystemNotificationEvent = {
  type: string;
  content: string;
  timestamp: string;
};

// Event handler types
type BidPlacedHandler = (event: BidPlacedEvent) => void;
type BuyNowHandler = (event: BuyNowEvent) => void;
type NewNotificationHandler = (event: NewNotificationEvent) => void;
type SystemNotificationHandler = (event: SystemNotificationEvent) => void;
type ConnectionStateHandler = (isConnected: boolean) => void;

class SignalRService {
  private connection: SignalR.HubConnection | null = null;
  
  /**
   * Normalize severity from backend format (number or string) to frontend format
   */
  private normalizeSeverity(severity: any): 'Info' | 'Warning' | 'Critical' {
    if (typeof severity === 'number') {
      // Backend sends: 1 = Info, 2 = Warning, 3 = Critical
      if (severity === 1) return 'Info';
      if (severity === 2) return 'Warning';
      if (severity === 3) return 'Critical';
      return 'Info'; // default
    }
    if (typeof severity === 'string') {
      const lower = severity.toLowerCase();
      if (lower === 'info' || lower === 'warning' || lower === 'critical') {
        return severity as 'Info' | 'Warning' | 'Critical';
      }
    }
    return 'Info'; // default
  }
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000; // 3 seconds
  private isManuallyDisconnected = false;

  // Event handlers storage
  private bidPlacedHandlers: BidPlacedHandler[] = [];
  private buyNowHandlers: BuyNowHandler[] = [];
  private newNotificationHandlers: NewNotificationHandler[] = [];
  private systemNotificationHandlers: SystemNotificationHandler[] = [];
  private connectionStateHandlers: ConnectionStateHandler[] = [];

  // Joined auction groups
  private joinedAuctions: Set<string> = new Set();

  /**
   * Initialize SignalR connection with JWT authentication
   */
  async connect(): Promise<void> {
    if (this.connection && this.connection.state === SignalR.HubConnectionState.Connected) {
      // console.log('SignalR: Already connected');
      return;
    }

    try {
      // Refresh token first to ensure it's not expired
      // console.log('🔄 SignalR: Refreshing access token before connection...');
      const refreshed = await refreshAccessToken();
      
      if (!refreshed) {
        // console.error('❌ SignalR: Failed to refresh access token');
        return;
      }

      // Get JWT token from storage
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        // console.error('❌ SignalR: No access token found after refresh');
        return;
      }

      // Decode token to verify user info (for debugging)
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
          const userId = payload.sub || payload.uid || payload['user_id'] || payload.nameid;
          // console.log(`🔐 SignalR: User authenticated (ID: ${userId ? userId.substring(0, 8) : 'unknown'}...)`);
        }
      } catch (e) {
        // Token decode failed, but connection can still proceed
        // console.log('🔐 SignalR: User authenticated via token');
      }

      // console.log('📡 SignalR: Establishing WebSocket connection...');

      // Create connection with JWT authentication
      this.connection = new SignalR.HubConnectionBuilder()
        .withUrl(SIGNALR_HUB_URL, {
          accessTokenFactory: () => token,
          transport: SignalR.HttpTransportType.WebSockets,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            // Exponential backoff: 0, 2, 10, 30 seconds
            if (retryContext.elapsedMilliseconds < 60000) {
              return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
            } else {
              // After 1 minute of failed reconnects, stop trying
              return null;
            }
          },
        })
        .configureLogging(SignalR.LogLevel.Information)
        .build();

      // Setup event listeners
      this.setupEventListeners();

      // Setup connection lifecycle handlers
      this.connection.onclose((error) => {
        // console.log('SignalR: Connection closed', error);
        this.notifyConnectionState(false);
        
        if (!this.isManuallyDisconnected && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          // console.log(`SignalR: Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => this.connect(), this.reconnectDelay);
        }
      });

      this.connection.onreconnecting((error) => {
        // console.log('SignalR: Reconnecting...', error);
        this.notifyConnectionState(false);
      });

      this.connection.onreconnected((connectionId) => {
        // console.log('SignalR: Reconnected', connectionId);
        this.reconnectAttempts = 0;
        this.notifyConnectionState(true);
        
        // Rejoin all auction groups after reconnection
        this.rejoinAuctionGroups();
      });

      // Start connection
      this.isManuallyDisconnected = false;
      await this.connection.start();
      // console.log('✅ SignalR: Connected successfully to', SIGNALR_HUB_URL);
      // console.log('   Connection ID:', this.connection?.connectionId);
      // console.log('   Connection State:', this.connection?.state);
      // console.log('🔐 SignalR: Authenticated with JWT token (backend will identify user from token)');
      this.reconnectAttempts = 0;
      this.notifyConnectionState(true);
      // console.log('🎧 SignalR: Event listeners are now active and ready to receive messages');

    } catch (error) {
      console.error('SignalR: Connection failed', error);
      
      // Check if error is 401 Unauthorized
      const errorString = String(error);
      if (errorString.includes('401') || errorString.includes('Unauthorized')) {
        console.error('SignalR: 401 Unauthorized - clearing tokens and stopping reconnect');
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('refreshToken');
        this.notifyConnectionState(false);
        return;
      }

      this.notifyConnectionState(false);
      
      // Retry connection if not manually disconnected
      if (!this.isManuallyDisconnected && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        // console.log(`SignalR: Retrying connection (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        setTimeout(() => this.connect(), this.reconnectDelay);
      } else {
        // Final short retry to handle negotiation stopped edge case
        setTimeout(() => this.connect(), 1500);
      }
    }
  }

  /**
   * Disconnect from SignalR hub
   */
  async disconnect(): Promise<void> {
    this.isManuallyDisconnected = true;
    this.reconnectAttempts = 0;
    
    if (this.connection) {
      try {
        await this.connection.stop();
        // console.log('SignalR: Disconnected');
        this.notifyConnectionState(false);
      } catch (error) {
        console.error('SignalR: Error during disconnect', error);
      }
    }
    
    // Clear joined auctions
    this.joinedAuctions.clear();
  }

  /**
   * Setup event listeners for SignalR events
   */
  private setupEventListeners(): void {
    if (!this.connection) return;

    // console.log('🔔 SignalR: Setting up event listeners on connection...');
    // console.log('   Listening for: BidPlaced, BuyNow, ReceiveNotification, etc.');

    // BidPlaced event
    this.connection.on('BidPlaced', (event: BidPlacedEvent) => {
      // console.log('🎯🎯🎯 BidPlaced event received 🎯🎯🎯');
      // console.log('   Event Details:');
      // console.log('   - Auction ID:', event.auctionId);
      // console.log('   - Bid ID:', event.bidId);
      // console.log('   - User ID:', event.userId);
      // console.log('   - Bidder:', event.userName);
      // console.log('   - Bid Amount:', event.bidAmount);
      // console.log('   - Price Change:', event.previousPrice, '→', event.newPrice);
      // console.log('   - Placed At:', event.placedAt);
      // console.log('   - Full Event Object:', JSON.stringify(event, null, 2));
      // console.log('   - Now calling', this.bidPlacedHandlers.length, 'registered handlers');
      this.bidPlacedHandlers.forEach((handler, index) => {
        // console.log(`   - Calling handler ${index + 1}/${this.bidPlacedHandlers.length}`);
        handler(event);
      });

      // 🔥 WORKAROUND: Convert BidPlaced to NewNotification and trigger notification handler
      // Backend chỉ gửi BidPlaced, frontend tự tạo notification từ đó
      // console.log('🔥 Converting BidPlaced → NewNotification for notification handler');
      const notificationFromBidPlaced: NewNotificationEvent = {
        id: event.bidId, // Sử dụng bidId làm notification ID
        userId: event.userId,
        type: 1, // Outbid notification type
        severity: 'Warning',
        title: `Bạn đã bị Outbid!`,
        message: `${event.userName} vừa đặt giá cao hơn: ${event.newPrice.toLocaleString('vi-VN')}₫`,
        isRead: false,
        data: JSON.stringify({
          auctionId: event.auctionId,
          bidId: event.bidId,
          bidderUserId: event.userId,
          bidderName: event.userName,
          bidAmount: event.bidAmount,
          previousPrice: event.previousPrice,
          newPrice: event.newPrice,
        }),
        relatedEntityId: event.auctionId,
        relatedEntityType: 'Auction',
        createdAt: event.placedAt,
      };
      
      // console.log('📩 Triggering notification handlers with converted data:', notificationFromBidPlaced);
      this.newNotificationHandlers.forEach((handler, index) => {
        // console.log(`   - Calling notification handler ${index + 1}/${this.newNotificationHandlers.length}`);
        try {
          handler(notificationFromBidPlaced);
        } catch (error) {
          // console.error(`   ❌ Error in notification handler ${index}:`, error);
        }
      });
    });

    // BuyNow event
    this.connection.on('BuyNow', (event: BuyNowEvent) => {
      // console.log('🎯 SignalR: 🎯🎯🎯 BuyNow event received 🎯🎯🎯');
      // console.log('   Auction ID:', event.auctionId);
      // console.log('   Buyer:', event.userName);
      // console.log('   Buy Now Price:', event.buyNowPrice);
      this.buyNowHandlers.forEach(handler => handler(event));

      // 🔥 WORKAROUND: Convert BuyNow to NewNotification for notification handler
      // console.log('🔥 Converting BuyNow → NewNotification for notification handler');
      const notificationFromBuyNow: NewNotificationEvent = {
        id: event.bidId, // Sử dụng bidId làm notification ID
        userId: event.userId,
        type: 3, // AuctionWon notification type
        severity: 'Warning',
        title: `Đấu giá đã bán ngay (Buy Now)`,
        message: `${event.userName} vừa mua ngay sản phẩm với giá: ${event.buyNowPrice.toLocaleString('vi-VN')}₫`,
        isRead: false,
        data: JSON.stringify({
          auctionId: event.auctionId,
          bidId: event.bidId,
          buyerUserId: event.userId,
          buyerName: event.userName,
          buyNowPrice: event.buyNowPrice,
        }),
        relatedEntityId: event.auctionId,
        relatedEntityType: 'Auction',
        createdAt: event.purchasedAt,
      };

      // console.log('📩 Triggering notification handlers with converted BuyNow data:', notificationFromBuyNow);
      this.newNotificationHandlers.forEach((handler, index) => {
        // console.log(`   - Calling notification handler ${index + 1}/${this.newNotificationHandlers.length}`);
        try {
          handler(notificationFromBuyNow);
        } catch (error) {
          console.error(`   ❌ Error in notification handler ${index}:`, error);
        }
      });
    });

    // ReceiveNotification event (generic)
    this.connection.on('ReceiveNotification', (message: any) => {
      // console.log('SignalR: ReceiveNotification event received', message);
      
      // Parse message if it's a JSON string
      let rawEvent: any;
      try {
        if (typeof message === 'string') {
          rawEvent = JSON.parse(message);
        } else if (message && typeof message === 'object') {
          rawEvent = message;
        } else {
          console.error('❌ [SignalR] Invalid ReceiveNotification format:', message);
          return;
        }
        
        // Normalize from PascalCase (backend format) to camelCase (frontend format)
        const event: NewNotificationEvent = {
          id: rawEvent.Id || rawEvent.id,
          userId: rawEvent.UserId || rawEvent.userId,
          type: rawEvent.Type !== undefined ? rawEvent.Type : (rawEvent.type !== undefined ? rawEvent.type : undefined),
          severity: this.normalizeSeverity(rawEvent.Severity || rawEvent.severity),
          title: rawEvent.Title || rawEvent.title,
          message: rawEvent.Message || rawEvent.message,
          isRead: rawEvent.IsRead !== undefined ? rawEvent.IsRead : (rawEvent.isRead !== undefined ? rawEvent.isRead : false),
          readAt: rawEvent.ReadAt || rawEvent.readAt,
          data: rawEvent.Data || rawEvent.data,
          relatedEntityId: rawEvent.RelatedEntityId || rawEvent.relatedEntityId,
          relatedEntityType: rawEvent.RelatedEntityType || rawEvent.relatedEntityType,
          createdAt: rawEvent.CreatedAt || rawEvent.createdAt || new Date().toISOString(),
        };
        
        // Validate required fields
        if (!event.id || !event.title || !event.message || event.type === undefined) {
          console.error('❌ [SignalR] Missing required fields in ReceiveNotification:', rawEvent);
          console.error('   - Normalized event:', event);
          return;
        }
        
        // console.log('✅ [SignalR] Parsed ReceiveNotification:', event);
        this.newNotificationHandlers.forEach(handler => handler(event));
      } catch (error) {
        console.error('❌ [SignalR] Error parsing ReceiveNotification:', error);
        console.error('   - Raw message:', message);
      }
    });

    // Listen to ALL notification types according to REACT_NATIVE_REALTIME_NOTIFICATIONS.md
    // Complete list of notification types from backend
    const notificationTypes = [
      'Outbid',                    // 1 - Bị outbid trong đấu giá
      'AuctionEnded',             // 2 - Đấu giá đã kết thúc
      'AuctionWon',               // 3 - Thắng đấu giá
      'AuctionApproved',          // 4 - Đấu giá được duyệt
      'AuctionPaused',            // 5 - Đấu giá bị tạm dừng
      'AuctionStarted',           // 6 - Đấu giá bắt đầu
      'System',                   // 7 - Thông báo hệ thống
      'EscrowDepositSuccess',     // 8 - Thanh toán cọc thành công
      'EscrowRemainingPaymentSuccess', // 9 - Thanh toán còn lại thành công
      'EscrowReleaseReceived',     // 10 - Nhận tiền từ escrow
      'WalletFundsAdded',         // 11 - Nạp tiền vào ví
      'AuctionJoinSuccess',       // 12 - Tham gia đấu giá thành công
      'EscrowCancelled',          // 13 - Hủy hợp đồng đấu giá
      'DistupeOpened',            // 14 - Tranh chấp được mở (typo từ backend: Distupe)
      'AuctionCreated',           // 15 - Đấu giá được tạo
      'AuctionRejected',          // 16 - Đấu giá bị từ chối
      'WithdrawalRequested',      // 17 - Yêu cầu rút tiền đã tạo
      'WithdrawalCompleted',      // 18 - Rút tiền hoàn thành
      'WithdrawalRejected',       // 19 - Rút tiền bị từ chối
      'AuctionExtended',          // 20 - Đấu giá được gia hạn
      // Legacy harvest reminder types (for backward compatibility)
      'HarvestReminderMinus7Days',
      'HarvestReminderMinus3Days',
      'HarvestReminderMinus1Day',
      'HarvestReminderOnDay',
      'HarvestReminderPlus1Day'
    ];

    notificationTypes.forEach(notificationType => {
      this.connection?.on(notificationType, (message: any) => {
        // console.log(`SignalR: ${notificationType} event received`, message);
        
        // Parse message if it's a JSON string
        let rawEvent: any;
        try {
          if (typeof message === 'string') {
            rawEvent = JSON.parse(message);
          } else if (message && typeof message === 'object') {
            rawEvent = message;
          } else {
            console.error(`❌ [SignalR] Invalid notification format for ${notificationType}:`, message);
            return;
          }
          
          // Normalize from PascalCase (backend format) to camelCase (frontend format)
          const event: NewNotificationEvent = {
            id: rawEvent.Id || rawEvent.id,
            userId: rawEvent.UserId || rawEvent.userId,
            type: rawEvent.Type !== undefined ? rawEvent.Type : (rawEvent.type !== undefined ? rawEvent.type : undefined),
            severity: this.normalizeSeverity(rawEvent.Severity || rawEvent.severity),
            title: rawEvent.Title || rawEvent.title,
            message: rawEvent.Message || rawEvent.message,
            isRead: rawEvent.IsRead !== undefined ? rawEvent.IsRead : (rawEvent.isRead !== undefined ? rawEvent.isRead : false),
            readAt: rawEvent.ReadAt || rawEvent.readAt,
            data: rawEvent.Data || rawEvent.data,
            relatedEntityId: rawEvent.RelatedEntityId || rawEvent.relatedEntityId,
            relatedEntityType: rawEvent.RelatedEntityType || rawEvent.relatedEntityType,
            createdAt: rawEvent.CreatedAt || rawEvent.createdAt || new Date().toISOString(),
          };

          // Fallback builder for AuctionExtended (backend may not send id/title/message/type)
          if (notificationType === 'AuctionExtended') {
            const auctionId = rawEvent.AuctionId || rawEvent.auctionId || rawEvent.id || rawEvent.Id;
            const newEndDate = rawEvent.NewEndDate || rawEvent.newEndDate;
            const extensionSeconds = rawEvent.ExtensionSeconds || rawEvent.extensionSeconds;
            const minutes = extensionSeconds ? Math.round(extensionSeconds / 60) : undefined;

            event.id = event.id || `${auctionId || 'auction'}-${event.createdAt}`;
            event.title = event.title || 'Đấu giá được gia hạn';
            event.message = event.message || `Phiên đấu giá được gia hạn${minutes ? ` thêm ${minutes} phút` : ''}${newEndDate ? `. Kết thúc mới: ${new Date(newEndDate).toLocaleString('vi-VN')}` : ''}`;
            event.type = event.type ?? 20;
            event.relatedEntityId = event.relatedEntityId || auctionId;
            event.relatedEntityType = event.relatedEntityType || 'Auction';
            event.data = event.data || rawEvent;
          }
          
          // Validate required fields
          if (!event.id || !event.title || !event.message || event.type === undefined) {
            console.error(`❌ [SignalR] Missing required fields in ${notificationType} notification:`, rawEvent);
            console.error(`   - Normalized event:`, event);
            console.error(`   - id: ${event.id}, title: ${event.title}, message: ${event.message}, type: ${event.type}`);
            return;
          }
          
          // Map notification type name to type number if needed (fallback)
          if (event.type === undefined && notificationType) {
            const typeMap: Record<string, number> = {
              'Outbid': 1,
              'AuctionEnded': 2,
              'AuctionWon': 3,
              'AuctionApproved': 4,
              'AuctionPaused': 5,
              'AuctionStarted': 6,
              'System': 7,
              'EscrowDepositSuccess': 8,
              'EscrowRemainingPaymentSuccess': 9,
              'EscrowReleaseReceived': 10,
              'WalletFundsAdded': 11,
              'AuctionJoinSuccess': 12,
              'EscrowCancelled': 13,
              'DistupeOpened': 14,
              'AuctionCreated': 15,
              'AuctionRejected': 16,
              'WithdrawalRequested': 17,
              'WithdrawalCompleted': 18,
              'WithdrawalRejected': 19,
              'AuctionExtended': 20,
            };
            event.type = typeMap[notificationType] || event.type;
          }
          
          // console.log(`✅ [SignalR] Parsed ${notificationType} notification:`, event);
          this.newNotificationHandlers.forEach(handler => handler(event));
        } catch (error) {
          console.error(`❌ [SignalR] Error parsing ${notificationType} notification:`, error);
          console.error(`   - Raw message:`, message);
        }
      });
    });

    // SystemNotification event
    this.connection.on('SystemNotification', (event: SystemNotificationEvent) => {
      // console.log('🎯 SignalR: SystemNotification event received', event);
      this.systemNotificationHandlers.forEach(handler => handler(event));
    });

    // Debug: Log setup completion
    // console.log('🔔 SignalR: Finished setting up event listeners');
    // console.log('   Listening for: BidPlaced, BuyNow, ReceiveNotification, SystemNotification, and', notificationTypes.length, 'notification types');
    // console.log('   Ready to receive events from backend');
  }

  /**
   * Join an auction group to receive updates for specific auction
   */
  async joinAuctionGroup(auctionId: string): Promise<void> {
    if (!this.connection || this.connection.state !== SignalR.HubConnectionState.Connected) {
      // console.warn('⚠️ SignalR: Not connected, cannot join auction group');
      // console.warn(`   Connection state:`, this.connection?.state);
      return;
    }

    try {
      // console.log(`🎯 SignalR: Attempting to join auction group: ${auctionId}`);
      await this.connection.invoke('JoinAuctionGroup', auctionId);
      this.joinedAuctions.add(auctionId);
      // console.log(`✅ SignalR: Successfully joined auction group: ${auctionId}`);
      // console.log(`📊 SignalR: Total joined auctions: ${this.joinedAuctions.size}`);
    } catch (error) {
      // console.error(`❌ SignalR: Failed to join auction group ${auctionId}`, error);
    }
  }

  /**
   * Leave an auction group
   */
  async leaveAuctionGroup(auctionId: string): Promise<void> {
    if (!this.connection || this.connection.state !== SignalR.HubConnectionState.Connected) {
      // console.warn('SignalR: Not connected, cannot leave auction group');
      return;
    }

    try {
      await this.connection.invoke('LeaveAuctionGroup', auctionId);
      this.joinedAuctions.delete(auctionId);
      // console.log(`SignalR: Left auction group: ${auctionId}`);
    } catch (error) {
      // console.error(`SignalR: Failed to leave auction group ${auctionId}`, error);
    }
  }

  /**
   * Rejoin all auction groups after reconnection
   */
  private async rejoinAuctionGroups(): Promise<void> {
    // console.log('SignalR: Rejoining auction groups...', Array.from(this.joinedAuctions));
    
    for (const auctionId of this.joinedAuctions) {
      try {
        await this.connection?.invoke('JoinAuctionGroup', auctionId);
        // console.log(`SignalR: Rejoined auction group: ${auctionId}`);
      } catch (error) {
        // console.error(`SignalR: Failed to rejoin auction group ${auctionId}`, error);
      }
    }
  }

  /**
   * Subscribe to BidPlaced events
   */
  onBidPlaced(handler: BidPlacedHandler): () => void {
    // console.log('🔔 SignalR: Registering BidPlaced event handler');
    // console.log(`   Total handlers registered: ${this.bidPlacedHandlers.length + 1}`);
    this.bidPlacedHandlers.push(handler);
    // Return unsubscribe function
    return () => {
      // console.log('🔔 SignalR: Unregistering BidPlaced event handler');
      this.bidPlacedHandlers = this.bidPlacedHandlers.filter(h => h !== handler);
    };
  }

  /**
   * Subscribe to BuyNow events
   */
  onBuyNow(handler: BuyNowHandler): () => void {
    this.buyNowHandlers.push(handler);
    return () => {
      this.buyNowHandlers = this.buyNowHandlers.filter(h => h !== handler);
    };
  }

  /**
   * Subscribe to NewNotification events
   */
  onNewNotification(handler: NewNotificationHandler): () => void {
    this.newNotificationHandlers.push(handler);
    return () => {
      this.newNotificationHandlers = this.newNotificationHandlers.filter(h => h !== handler);
    };
  }

  /**
   * Subscribe to SystemNotification events
   */
  onSystemNotification(handler: SystemNotificationHandler): () => void {
    this.systemNotificationHandlers.push(handler);
    return () => {
      this.systemNotificationHandlers = this.systemNotificationHandlers.filter(h => h !== handler);
    };
  }

  /**
   * Subscribe to connection state changes
   */
  onConnectionStateChange(handler: ConnectionStateHandler): () => void {
    this.connectionStateHandlers.push(handler);
    // Immediately notify current state
    if (this.connection) {
      handler(this.connection.state === SignalR.HubConnectionState.Connected);
    }
    return () => {
      this.connectionStateHandlers = this.connectionStateHandlers.filter(h => h !== handler);
    };
  }

  /**
   * Notify all connection state handlers
   */
  private notifyConnectionState(isConnected: boolean): void {
    this.connectionStateHandlers.forEach(handler => handler(isConnected));
  }

  /**
   * Invoke a SignalR hub method (for calling server methods)
   */
  async invoke<T>(methodName: string, ...args: any[]): Promise<T | null> {
    if (!this.connection || this.connection.state !== SignalR.HubConnectionState.Connected) {
      // console.error(`SignalR: Cannot invoke method '${methodName}' - connection not available`);
      return null;
    }

    try {
      const result = await this.connection.invoke<T>(methodName, ...args);
      // console.log(`SignalR: Method '${methodName}' invoked successfully`, result);
      return result;
    } catch (error) {
      // console.error(`SignalR: Error invoking method '${methodName}'`, error);
      return null;
    }
  }

  /**
   * Get current connection state
   */
  isConnected(): boolean {
    return this.connection?.state === SignalR.HubConnectionState.Connected;
  }

  /**
   * Get all joined auction IDs
   */
  getJoinedAuctions(): string[] {
    return Array.from(this.joinedAuctions);
  }

  /**
   * DEBUG: Manually trigger BidPlaced event (for testing when backend doesn't send)
   */
  debugTriggerBidPlaced(event: BidPlacedEvent): void {
    // console.log('🧪 DEBUG: Manually triggering BidPlaced event');
    // console.log('   Event:', event);
    this.bidPlacedHandlers.forEach(handler => handler(event));
  }
}

// Export singleton instance
export const signalRService = new SignalRService();