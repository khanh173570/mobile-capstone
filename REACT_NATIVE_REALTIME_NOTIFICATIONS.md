# 📱 Hướng dẫn kết nối Realtime Notifications cho React Native

## 📋 Mục lục
1. [Tổng quan](#tổng-quan)
2. [Cài đặt](#cài-đặt)
3. [Cấu hình](#cấu-hình)
4. [Kết nối SignalR](#kết-nối-signalr)
5. [Xử lý Notifications](#xử-lý-notifications)
6. [Notification Types](#notification-types)
7. [Ví dụ hoàn chỉnh](#ví-dụ-hoàn-chỉnh)
8. [Troubleshooting](#troubleshooting)

---

## 🎯 Tổng quan

AgriMart sử dụng **SignalR** để gửi realtime notifications đến mobile app. Mỗi notification được gửi qua SignalR với:
- **Method name**: Tên của NotificationType (ví dụ: `Outbid`, `AuctionEnded`, `System`)
- **Message**: JSON string chứa thông tin Notification object
- **Authentication**: JWT token trong header

### Kiến trúc
```
React Native App
    ↓ (WebSocket Connection)
Gateway API (/api/messaging-service/hubs/global)
    ↓
Messaging.API (SignalR Hub: GlobalHub)
    ↓
Notification Service
```

---

## 📦 Cài đặt

### 1. Cài đặt package

```bash
npm install @microsoft/signalr
# hoặc
yarn add @microsoft/signalr
```

### 2. Cài đặt polyfills (nếu cần)

SignalR yêu cầu một số polyfills cho React Native:

```bash
npm install react-native-get-random-values
npm install text-encoding-polyfill
```

Trong file `index.js` hoặc `App.js`:

```javascript
import 'react-native-get-random-values';
import 'text-encoding-polyfill';
```

---

## ⚙️ Cấu hình

### 1. Tạo file config

```javascript
// config/signalr.js
export const SIGNALR_CONFIG = {
  // Development
  // BASE_URL: 'http://localhost:5000',
  
  // Production (qua Gateway)
  BASE_URL: 'https://gateway.a-379.store',
  
  HUB_PATH: '/api/messaging-service/hubs/global',
  
  // Reconnect settings
  RECONNECT_DELAYS: [0, 2000, 10000, 30000, 60000], // milliseconds
};
```

### 2. Tạo Notification Service

```javascript
// services/NotificationService.js
import * as signalR from '@microsoft/signalr';
import { SIGNALR_CONFIG } from '../config/signalr';

class NotificationService {
  constructor() {
    this.connection = null;
    this.listeners = new Map();
    this.isConnected = false;
  }

  /**
   * Kết nối đến SignalR Hub
   * @param {string} token - JWT token từ authentication
   */
  async connect(token) {
    if (!token) {
      throw new Error('JWT token is required');
    }

    try {
      const hubUrl = `${SIGNALR_CONFIG.BASE_URL}${SIGNALR_CONFIG.HUB_PATH}`;
      
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(hubUrl, {
          accessTokenFactory: () => token,
          skipNegotiation: false,
          transport: signalR.HttpTransportType.WebSockets | 
                     signalR.HttpTransportType.ServerSentEvents | 
                     signalR.HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: (retryContext) => {
            const delay = SIGNALR_CONFIG.RECONNECT_DELAYS[retryContext.previousRetryCount] || 60000;
            return delay;
          },
        })
        .configureLogging(signalR.LogLevel.Information)
        .build();

      // Setup event handlers
      this.setupEventHandlers();

      // Start connection
      await this.connection.start();
      this.isConnected = true;
      
      // console.log('[SignalR] Connected successfully');
      
      // Setup notification listeners
      this.setupNotificationListeners();
      
      return true;
    } catch (error) {
      console.error('[SignalR] Connection failed:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Setup connection lifecycle handlers
   */
  setupEventHandlers() {
    // Reconnecting
    this.connection.onreconnecting((error) => {
      console.warn('[SignalR] Reconnecting...', error);
      this.isConnected = false;
      this.notifyListeners('reconnecting', { error });
    });

    // Reconnected
    this.connection.onreconnected((connectionId) => {
      // console.log('[SignalR] Reconnected! Connection ID:', connectionId);
      this.isConnected = true;
      this.notifyListeners('reconnected', { connectionId });
      // Re-setup notification listeners after reconnect
      this.setupNotificationListeners();
    });

    // Closed
    this.connection.onclose((error) => {
      // console.log('[SignalR] Connection closed', error);
      this.isConnected = false;
      this.notifyListeners('closed', { error });
    });
  }

  /**
   * Setup listeners cho tất cả Notification Types
   */
  setupNotificationListeners() {
    // Danh sách tất cả Notification Types
    const notificationTypes = [
      'Outbid',                    // 1
      'AuctionEnded',             // 2
      'AuctionWon',               // 3
      'AuctionApproved',          // 4
      'AuctionPaused',            // 5
      'AuctionStarted',           // 6
      'System',                   // 7
      'EscrowDepositSuccess',     // 8
      'EscrowRemainingPaymentSuccess', // 9
      'EscrowReleaseReceived',     // 10
      'WalletFundsAdded',         // 11
      'AuctionJoinSuccess',       // 12
      'EscrowCancelled',          // 13
      'DistupeOpened',            // 14
      'AuctionCreated',           // 15
      'AuctionRejected',          // 16
      'WithdrawalRequested',      // 17
      'WithdrawalCompleted',      // 18
      'WithdrawalRejected',       // 19
      'AuctionExtended',          // 20
    ];

    notificationTypes.forEach((type) => {
      this.connection.on(type, (message) => {
        try {
          const notification = typeof message === 'string' 
            ? JSON.parse(message) 
            : message;
          
          console.log(`[SignalR] Received ${type}:`, notification);
          
          // Notify all listeners
          this.notifyListeners('notification', {
            type,
            notification,
          });
        } catch (error) {
          console.error(`[SignalR] Error parsing ${type} notification:`, error);
        }
      });
    });
  }

  /**
   * Disconnect từ SignalR Hub
   */
  async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      this.isConnected = false;
      // console.log('[SignalR] Disconnected');
    }
  }

  /**
   * Join vào auction group để nhận realtime updates
   * @param {string} auctionId - Auction ID
   */
  async joinAuctionGroup(auctionId) {
    if (!this.isConnected) {
      throw new Error('Not connected to SignalR');
    }

    try {
      await this.connection.invoke('JoinAuctionGroup', auctionId);
      console.log(`[SignalR] Joined auction group: ${auctionId}`);
    } catch (error) {
      console.error('[SignalR] Error joining auction group:', error);
      throw error;
    }
  }

  /**
   * Leave khỏi auction group
   * @param {string} auctionId - Auction ID
   */
  async leaveAuctionGroup(auctionId) {
    if (!this.isConnected) {
      return;
    }

    try {
      await this.connection.invoke('LeaveAuctionGroup', auctionId);
      console.log(`[SignalR] Left auction group: ${auctionId}`);
    } catch (error) {
      console.error('[SignalR] Error leaving auction group:', error);
    }
  }

  /**
   * Lấy số lượng notification chưa đọc
   * @returns {Promise<number>}
   */
  async getUnreadNotificationCount() {
    if (!this.isConnected) {
      throw new Error('Not connected to SignalR');
    }

    try {
      const count = await this.connection.invoke('GetUnreadNotificationCount');
      return count;
    } catch (error) {
      console.error('[SignalR] Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Đăng ký listener cho events
   * @param {string} event - 'notification', 'reconnecting', 'reconnected', 'closed'
   * @param {Function} callback
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Notify tất cả listeners
   */
  notifyListeners(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`[SignalR] Error in listener for ${event}:`, error);
        }
      });
    }
  }
}

// Export singleton instance
export default new NotificationService();
```

---

## 🔌 Kết nối SignalR

### 1. Trong App Component

```javascript
// App.js
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import NotificationService from './services/NotificationService';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { token, user } = useAuth();

  useEffect(() => {
    if (token && user) {
      // Kết nối SignalR khi user đã login
      connectSignalR();
    }

    return () => {
      // Disconnect khi component unmount
      NotificationService.disconnect();
    };
  }, [token, user]);

  const connectSignalR = async () => {
    try {
      await NotificationService.connect(token);
      // console.log('SignalR connected successfully');
    } catch (error) {
      console.error('Failed to connect SignalR:', error);
    }
  };

  return (
    <View>
      <Text>App Content</Text>
    </View>
  );
}
```

### 2. Sử dụng trong Component

```javascript
// components/NotificationHandler.js
import React, { useEffect, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import NotificationService from '../services/NotificationService';

export default function NotificationHandler() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Listen for notifications
    const unsubscribe = NotificationService.on('notification', handleNotification);

    // Listen for connection events
    const unsubscribeReconnecting = NotificationService.on('reconnecting', () => {
      // console.log('Reconnecting to SignalR...');
    });

    const unsubscribeReconnected = NotificationService.on('reconnected', () => {
      // console.log('Reconnected to SignalR');
      // Refresh unread count
      refreshUnreadCount();
    });

    // Get initial unread count
    refreshUnreadCount();

    return () => {
      unsubscribe();
      unsubscribeReconnecting();
      unsubscribeReconnected();
    };
  }, []);

  const handleNotification = ({ type, notification }) => {
    // console.log('New notification:', type, notification);
         
    // Show alert hoặc update UI
    Alert.alert(
      notification.title || 'Thông báo mới',
      notification.message,
      [{ text: 'OK' }]
    );

    // Update unread count
    refreshUnreadCount();

    // Có thể trigger local notification ở đây
    // showLocalNotification(notification);
  };

  const refreshUnreadCount = async () => {
    try {
      const count = await NotificationService.getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error getting unread count:', error);
    }
  };

  return (
    <View>
      {/* Badge hiển thị unread count */}
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount}</Text>
        </View>
      )}
    </View>
  );
}
```

---

## 📨 Xử lý Notifications

### Notification Object Structure

```typescript
interface Notification {
  id: string;
  userId: string;
  type: number;                    // NotificationType enum
  severity: number;                // 1 = Info, 2 = Warning, 3 = Error
  title: string;
  message: string;
  data?: string;                   // JSON string (optional)
  relatedEntityId?: string;        // ID của entity liên quan
  relatedEntityType?: string;      // "Auction", "BuyRequest", "Dispute", etc.
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt?: string;
}
```

### Ví dụ xử lý từng loại notification

```javascript
// utils/notificationHandler.js
import { Alert, Linking } from 'react-native';

export const handleNotificationByType = (notification) => {
  const { type, title, message, data, relatedEntityId, relatedEntityType } = notification;

  // Parse data nếu có
  let parsedData = null;
  if (data) {
    try {
      parsedData = JSON.parse(data);
    } catch (e) {
      console.error('Error parsing notification data:', e);
    }
  }

  switch (type) {
    case 1: // Outbid
      handleOutbidNotification(notification, parsedData);
      break;

    case 2: // AuctionEnded
      handleAuctionEndedNotification(notification, parsedData);
      break;

    case 3: // AuctionWon
      handleAuctionWonNotification(notification, parsedData);
      break;

    case 7: // System
      handleSystemNotification(notification, parsedData);
      break;

    case 8: // EscrowDepositSuccess
      handleEscrowDepositSuccess(notification, parsedData);
      break;

    case 14: // DistupeOpened
      handleDisputeOpened(notification, parsedData);
      break;

    default:
      // Default handler
      Alert.alert(title, message);
  }
};

const handleOutbidNotification = (notification, data) => {
  Alert.alert(
    'Bạn đã bị outbid',
    notification.message,
    [
      { text: 'Xem đấu giá', onPress: () => navigateToAuction(data?.AuctionId) },
      { text: 'Đóng' },
    ]
  );
};

const handleAuctionWonNotification = (notification, data) => {
  Alert.alert(
    '🎉 Bạn đã thắng đấu giá!',
    notification.message,
    [
      { text: 'Xem chi tiết', onPress: () => navigateToAuction(data?.AuctionId) },
      { text: 'Thanh toán', onPress: () => navigateToPayment(data?.EscrowId) },
    ]
  );
};

const handleDisputeOpened = (notification, data) => {
  Alert.alert(
    'Tranh chấp mới',
    notification.message,
    [
      { text: 'Xem tranh chấp', onPress: () => navigateToDispute(data?.EscrowId) },
      { text: 'Đóng' },
    ]
  );
};
```

---

## 📋 Notification Types

| Type | Code | Method Name | Mô tả |
|------|------|-------------|-------|
| Outbid | 1 | `Outbid` | Bị outbid trong đấu giá |
| AuctionEnded | 2 | `AuctionEnded` | Đấu giá đã kết thúc |
| AuctionWon | 3 | `AuctionWon` | Thắng đấu giá |
| AuctionApproved | 4 | `AuctionApproved` | Đấu giá được duyệt |
| AuctionPaused | 5 | `AuctionPaused` | Đấu giá bị tạm dừng |
| AuctionStarted | 6 | `AuctionStarted` | Đấu giá bắt đầu |
| System | 7 | `System` | Thông báo hệ thống |
| EscrowDepositSuccess | 8 | `EscrowDepositSuccess` | Thanh toán cọc thành công |
| EscrowRemainingPaymentSuccess | 9 | `EscrowRemainingPaymentSuccess` | Thanh toán còn lại thành công |
| EscrowReleaseReceived | 10 | `EscrowReleaseReceived` | Nhận tiền từ escrow |
| WalletFundsAdded | 11 | `WalletFundsAdded` | Nạp tiền vào ví |
| AuctionJoinSuccess | 12 | `AuctionJoinSuccess` | Tham gia đấu giá thành công |
| EscrowCancelled | 13 | `EscrowCancelled` | Hủy hợp đồng đấu giá |
| DistupeOpened | 14 | `DistupeOpened` | Tranh chấp được mở |
| AuctionCreated | 15 | `AuctionCreated` | Đấu giá được tạo |
| AuctionRejected | 16 | `AuctionRejected` | Đấu giá bị từ chối |
| WithdrawalRequested | 17 | `WithdrawalRequested` | Yêu cầu rút tiền đã tạo |
| WithdrawalCompleted | 18 | `WithdrawalCompleted` | Rút tiền hoàn thành |
| WithdrawalRejected | 19 | `WithdrawalRejected` | Rút tiền bị từ chối |
| AuctionExtended | 20 | `AuctionExtended` | Đấu giá được gia hạn |

---

## 💡 Ví dụ hoàn chỉnh

### 1. Notification Context

```javascript
// contexts/NotificationContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import NotificationService from '../services/NotificationService';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { token, user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (token && user) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [token, user]);

  const connect = async () => {
    try {
      await NotificationService.connect(token);
      setIsConnected(true);
      setupListeners();
      refreshUnreadCount();
    } catch (error) {
      console.error('Failed to connect SignalR:', error);
      setIsConnected(false);
    }
  };

  const disconnect = async () => {
    await NotificationService.disconnect();
    setIsConnected(false);
  };

  const setupListeners = () => {
    // Notification listener
    NotificationService.on('notification', ({ type, notification }) => {
      // Add to notifications list
      setNotifications((prev) => [notification, ...prev]);
      
      // Update unread count
      refreshUnreadCount();
      
      // Handle notification by type
      handleNotificationByType(notification);
    });

    // Connection listeners
    NotificationService.on('reconnecting', () => {
      setIsConnected(false);
    });

    NotificationService.on('reconnected', () => {
      setIsConnected(true);
      refreshUnreadCount();
    });
  };

  const refreshUnreadCount = async () => {
    try {
      const count = await NotificationService.getUnreadNotificationCount();
      setUnreadCount(count);
    } catch (error) {
      console.error('Error getting unread count:', error);
    }
  };

  const handleNotificationByType = (notification) => {
    // Implement notification handling logic
    // Có thể show local notification, update badge, etc.
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isConnected,
        refreshUnreadCount,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};
```

### 2. Notification Badge Component

```javascript
// components/NotificationBadge.js
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNotifications } from '../contexts/NotificationContext';

export default function NotificationBadge({ onPress }) {
  const { unreadCount } = useNotifications();

  if (unreadCount === 0) {
    return null;
  }

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {unreadCount > 99 ? '99+' : unreadCount}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  badge: {
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
```

### 3. Sử dụng trong Navigation

```javascript
// navigation/AppNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import NotificationBadge from '../components/NotificationBadge';

const Tab = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View>
              <Icon name="home" size={size} color={color} />
              <NotificationBadge />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          tabBarBadge: () => <NotificationBadge />,
        }}
      />
    </Tab.Navigator>
  );
}
```

---

## 🔧 Troubleshooting

### 1. Connection Failed

**Lỗi**: `Failed to connect to SignalR`

**Giải pháp**:
- Kiểm tra JWT token có hợp lệ không
- Kiểm tra BASE_URL có đúng không
- Kiểm tra network connection
- Thử các transport khác (WebSockets, ServerSentEvents, LongPolling)

### 2. Authentication Failed

**Lỗi**: `401 Unauthorized`

**Giải pháp**:
- Đảm bảo JWT token được truyền đúng trong `accessTokenFactory`
- Kiểm tra token chưa hết hạn
- Kiểm tra token có claim `id` (userId)

### 3. Notifications không nhận được

**Giải pháp**:
- Kiểm tra connection status: `NotificationService.isConnected`
- Kiểm tra đã setup listeners chưa
- Kiểm tra console logs để xem có message nào được gửi không
- Thử reconnect: `await NotificationService.disconnect()` rồi `connect()` lại

### 4. Reconnect không hoạt động

**Giải pháp**:
- Kiểm tra `withAutomaticReconnect()` đã được setup
- Kiểm tra network connection
- Thử manual reconnect

### 5. Performance Issues

**Giải pháp**:
- Giới hạn số lượng notifications trong memory
- Implement pagination cho notification list
- Debounce refresh unread count

---

## 📝 Best Practices

1. **Connection Management**
   - Chỉ connect khi user đã login
   - Disconnect khi user logout
   - Handle reconnection gracefully

2. **Memory Management**
   - Giới hạn số lượng notifications lưu trong memory
   - Clear old notifications khi không cần

3. **Error Handling**
   - Luôn wrap connection calls trong try-catch
   - Show user-friendly error messages
   - Log errors để debug

4. **Performance**
   - Debounce/throttle các operations
   - Lazy load notification list
   - Cache unread count

5. **User Experience**
   - Show connection status indicator
   - Show loading state khi connecting
   - Handle offline/online states

---

## 🔗 Tài liệu tham khảo

- [SignalR JavaScript Client Documentation](https://docs.microsoft.com/en-us/aspnet/core/signalr/javascript-client)
- [@microsoft/signalr npm package](https://www.npmjs.com/package/@microsoft/signalr)
- [React Native SignalR Guide](https://github.com/oclock/react-native-signalr)

---

**Version**: 1.0  
**Last Updated**: December 2024  
**Maintainer**: Mobile Team

