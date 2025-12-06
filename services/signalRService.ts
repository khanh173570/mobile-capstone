import * as SignalR from '@microsoft/signalr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { refreshAccessToken } from './authService';

const SIGNALR_HUB_URL = 'https://gateway.a-379.store/api/auction-service/hubs/global';

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
  type: string;
  title: string;
  message: string;
  createdAt: string;
  data?: any;
  relatedEntityId?: string;
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
      console.log('SignalR: Already connected');
      return;
    }

    try {
      // Refresh token first to ensure it's not expired
      console.log('SignalR: Refreshing access token before connection...');
      const refreshed = await refreshAccessToken();
      
      if (!refreshed) {
        console.error('SignalR: Failed to refresh access token');
        return;
      }

      // Get JWT token from storage
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        console.error('SignalR: No access token found after refresh');
        return;
      }

      console.log('SignalR: Access token ready, establishing WebSocket connection...');

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
        console.log('SignalR: Connection closed', error);
        this.notifyConnectionState(false);
        
        if (!this.isManuallyDisconnected && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`SignalR: Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => this.connect(), this.reconnectDelay);
        }
      });

      this.connection.onreconnecting((error) => {
        console.log('SignalR: Reconnecting...', error);
        this.notifyConnectionState(false);
      });

      this.connection.onreconnected((connectionId) => {
        console.log('SignalR: Reconnected', connectionId);
        this.reconnectAttempts = 0;
        this.notifyConnectionState(true);
        
        // Rejoin all auction groups after reconnection
        this.rejoinAuctionGroups();
      });

      // Start connection
      this.isManuallyDisconnected = false;
      await this.connection.start();
      console.log('SignalR: Connected successfully');
      this.reconnectAttempts = 0;
      this.notifyConnectionState(true);

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
        console.log(`SignalR: Retrying connection (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        setTimeout(() => this.connect(), this.reconnectDelay);
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
        console.log('SignalR: Disconnected');
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

    // BidPlaced event
    this.connection.on('BidPlaced', (event: BidPlacedEvent) => {
      console.log('SignalR: BidPlaced event received', event);
      this.bidPlacedHandlers.forEach(handler => handler(event));
    });

    // BuyNow event
    this.connection.on('BuyNow', (event: BuyNowEvent) => {
      console.log('SignalR: BuyNow event received', event);
      this.buyNowHandlers.forEach(handler => handler(event));
    });

    // NewNotification event
    this.connection.on('NewNotification', (event: NewNotificationEvent) => {
      console.log('SignalR: NewNotification event received', event);
      this.newNotificationHandlers.forEach(handler => handler(event));
    });

    // SystemNotification event
    this.connection.on('SystemNotification', (event: SystemNotificationEvent) => {
      console.log('SignalR: SystemNotification event received', event);
      this.systemNotificationHandlers.forEach(handler => handler(event));
    });
  }

  /**
   * Join an auction group to receive updates for specific auction
   */
  async joinAuctionGroup(auctionId: string): Promise<void> {
    if (!this.connection || this.connection.state !== SignalR.HubConnectionState.Connected) {
      console.warn('SignalR: Not connected, cannot join auction group');
      return;
    }

    try {
      await this.connection.invoke('JoinAuctionGroup', auctionId);
      this.joinedAuctions.add(auctionId);
      console.log(`SignalR: Joined auction group: ${auctionId}`);
    } catch (error) {
      console.error(`SignalR: Failed to join auction group ${auctionId}`, error);
    }
  }

  /**
   * Leave an auction group
   */
  async leaveAuctionGroup(auctionId: string): Promise<void> {
    if (!this.connection || this.connection.state !== SignalR.HubConnectionState.Connected) {
      console.warn('SignalR: Not connected, cannot leave auction group');
      return;
    }

    try {
      await this.connection.invoke('LeaveAuctionGroup', auctionId);
      this.joinedAuctions.delete(auctionId);
      console.log(`SignalR: Left auction group: ${auctionId}`);
    } catch (error) {
      console.error(`SignalR: Failed to leave auction group ${auctionId}`, error);
    }
  }

  /**
   * Rejoin all auction groups after reconnection
   */
  private async rejoinAuctionGroups(): Promise<void> {
    console.log('SignalR: Rejoining auction groups...', Array.from(this.joinedAuctions));
    
    for (const auctionId of this.joinedAuctions) {
      try {
        await this.connection?.invoke('JoinAuctionGroup', auctionId);
        console.log(`SignalR: Rejoined auction group: ${auctionId}`);
      } catch (error) {
        console.error(`SignalR: Failed to rejoin auction group ${auctionId}`, error);
      }
    }
  }

  /**
   * Subscribe to BidPlaced events
   */
  onBidPlaced(handler: BidPlacedHandler): () => void {
    this.bidPlacedHandlers.push(handler);
    // Return unsubscribe function
    return () => {
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
}

// Export singleton instance
export const signalRService = new SignalRService();
