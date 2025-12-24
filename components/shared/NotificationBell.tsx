import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Bell, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useNotificationContext } from '../../contexts/NotificationContext';
import { BackendNotification ,
  getNotificationTypeName,
  getNotificationTypeColor,
  getNotificationIcon,
} from '../../services/notificationService';
import { NotificationPopup } from './NotificationPopup';
import { getAuctionDetail } from '../../services/auctionService';
import { getCurrentUser } from '../../services/authService';

interface NotificationBellProps {
  role?: 'farmer' | 'wholesaler'; // Optional, will be fetched from user data if not provided
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ role: propRole }) => {
  const [actualRole, setActualRole] = useState<'farmer' | 'wholesaler'>(propRole || 'farmer');
  const router = useRouter();
  const [modalVisible, setModalVisible] = useState(false);
  const [navigatingNotificationId, setNavigatingNotificationId] = useState<string | null>(null);
  const {
    notifications,
    unreadCount,
    isLoading,
    latestNotification,
    refreshNotifications,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    dismissLatestNotification,
  } = useNotificationContext();

  // Fetch actual role from user data if not provided as prop
  useEffect(() => {
    const fetchUserRole = async () => {
      if (propRole) {
        setActualRole(propRole);
        return;
      }
      
      try {
        const user = await getCurrentUser();
        if (user && user.role) {
          const userRole = user.role === 'farmer' ? 'farmer' : 'wholesaler';
          setActualRole(userRole);
          console.log('🔍 [NotificationBell] Fetched user role:', userRole);
        }
      } catch (error) {
        console.error('❌ [NotificationBell] Error fetching user role:', error);
        // Keep default 'farmer' if fetch fails
      }
    };

    fetchUserRole();
  }, [propRole]);

  const handleNotificationPress = async (notification: BackendNotification) => {
    // Mark as read (don't wait, do it in background)
    if (!notification.isRead) {
      markAsRead(notification.id).catch(() => {
        // Silent fail
      });
    }

    // Set navigating state to show loading in modal
    setNavigatingNotificationId(notification.id);

    try {
      // Navigate based on notification type and related entity
      await navigateToNotificationTarget(notification);
      
      // Close modal after navigation starts
      setTimeout(() => {
        setModalVisible(false);
        setNavigatingNotificationId(null);
      }, 300);
    } catch (error) {
      console.error('❌ [NotificationBell] Navigation error:', error);
      setNavigatingNotificationId(null);
    }
  };

  const handlePopupPress = () => {
    if (latestNotification) {
      // Dismiss popup
      dismissLatestNotification();
      
      // Open modal and navigate to notification
      setModalVisible(true);
      handleNotificationPress(latestNotification);
    }
  };

  const navigateToNotificationTarget = async (notification: BackendNotification) => {
    const { type, relatedEntityType, relatedEntityId, auctionId, escrowId, data } = notification;
    
    // Always fetch current user role to ensure accuracy
    let currentRole: 'farmer' | 'wholesaler' = actualRole;
    try {
      const currentUser = await getCurrentUser();
      if (currentUser && currentUser.role) {
        currentRole = currentUser.role === 'farmer' ? 'farmer' : 'wholesaler';
        console.log('🔍 [NotificationBell] Current role for navigation:', currentRole);
      }
    } catch (error) {
      console.warn('⚠️ [NotificationBell] Could not fetch current user, using actualRole:', actualRole);
      currentRole = actualRole;
    }

    // Parse data if available
    let parsedData: any = null;
    if (data) {
      try {
        parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        console.log('📦 [NotificationBell] Parsed notification data:', parsedData);
      } catch (e) {
        console.warn('Failed to parse notification data:', e);
      }
    }

    // Helper function to get escrow ID from various sources
    const getEscrowId = (): string | null => {
      // Priority 1: Try relatedEntityId if type is Escrow (most reliable)
      if (relatedEntityType === 'Escrow' && relatedEntityId) {
        console.log('🔍 [NotificationBell] Found escrowId from relatedEntityId (Escrow type):', relatedEntityId);
        return relatedEntityId;
      }
      
      // Priority 2: Try escrowId field directly
      if (escrowId) {
        console.log('🔍 [NotificationBell] Found escrowId from notification.escrowId:', escrowId);
        return escrowId;
      }
      
      // Priority 3: Try parsedData (from data field) - for Dispute notifications
      if (parsedData) {
        if (parsedData.EscrowId) {
          console.log('🔍 [NotificationBell] Found escrowId from parsedData.EscrowId:', parsedData.EscrowId);
          return parsedData.EscrowId;
        }
        if (parsedData.escrowId) {
          console.log('🔍 [NotificationBell] Found escrowId from parsedData.escrowId:', parsedData.escrowId);
          return parsedData.escrowId;
        }
      }
      
      console.warn('⚠️ [NotificationBell] No escrow ID found in notification:', {
        escrowId,
        relatedEntityId,
        relatedEntityType,
        parsedData,
      });
      return null;
    };

    // Helper function to get BuyRequest ID from various sources
    const getBuyRequestId = (): string | null => {
      // Priority 1: Try relatedEntityId if type is BuyRequest
      if (relatedEntityType === 'BuyRequest' && relatedEntityId) {
        console.log('🔍 [NotificationBell] Found buyRequestId from relatedEntityId (BuyRequest type):', relatedEntityId);
        return relatedEntityId;
      }
      
      // Priority 2: Try parsedData (from data field)
      if (parsedData) {
        if (parsedData.BuyRequestId) {
          console.log('🔍 [NotificationBell] Found buyRequestId from parsedData.BuyRequestId:', parsedData.BuyRequestId);
          return parsedData.BuyRequestId;
        }
        if (parsedData.buyRequestId) {
          console.log('🔍 [NotificationBell] Found buyRequestId from parsedData.buyRequestId:', parsedData.buyRequestId);
          return parsedData.buyRequestId;
        }
      }
      
      // Priority 3: Try relatedEntityId as fallback
      if (relatedEntityId) {
        console.log('🔍 [NotificationBell] Using relatedEntityId as fallback buyRequestId:', relatedEntityId);
        return relatedEntityId;
      }
      
      console.warn('⚠️ [NotificationBell] No buyRequest ID found in notification:', {
        relatedEntityId,
        relatedEntityType,
        parsedData,
      });
      return null;
    };

    // Modal is already closed in handleNotificationPress
    // Don't close again here

    // Helper function to get auction ID from various sources
    const getAuctionId = (): string | null => {
      // Priority 1: Try relatedEntityId if type is Auction (most reliable)
      if (relatedEntityType === 'Auction' && relatedEntityId) {
        console.log('🔍 [NotificationBell] Found auctionId from relatedEntityId (Auction type):', relatedEntityId);
        return relatedEntityId;
      }
      
      // Priority 2: Try auctionId field directly
      if (auctionId) {
        console.log('🔍 [NotificationBell] Found auctionId from notification.auctionId:', auctionId);
        return auctionId;
      }
      
      // Priority 3: Try parsedData (from data field)
      if (parsedData) {
        if (parsedData.AuctionId) {
          console.log('🔍 [NotificationBell] Found auctionId from parsedData.AuctionId:', parsedData.AuctionId);
          return parsedData.AuctionId;
        }
        if (parsedData.auctionId) {
          console.log('🔍 [NotificationBell] Found auctionId from parsedData.auctionId:', parsedData.auctionId);
          return parsedData.auctionId;
        }
        // For Bid type notifications, try AuctionSessionId
        if (parsedData.AuctionSessionId) {
          console.log('🔍 [NotificationBell] Found auctionId from parsedData.AuctionSessionId:', parsedData.AuctionSessionId);
          return parsedData.AuctionSessionId;
        }
      }
      
      console.warn('⚠️ [NotificationBell] No auction ID found in notification:', {
        auctionId,
        relatedEntityId,
        relatedEntityType,
        parsedData,
        data,
      });
      return null;
    };

    // Navigate based on notification type
    switch (type) {
      case 1: // Outbid
      case 2: // AuctionEnded
      case 3: // AuctionWon
      case 5: // AuctionPaused
      case 6: // AuctionStarted
      case 12: // AuctionJoinSuccess
      case 15: // AuctionCreated
      case 16: // AuctionRejected
      case 20: // AuctionExtended
        // Navigate to auction detail
        // Use relatedEntityId if relatedEntityType is Auction (most reliable)
        const targetAuctionId = getAuctionId();
        if (targetAuctionId) {
          console.log('🔗 [NotificationBell] Navigating to auction detail:', {
            role: currentRole,
            auctionId: targetAuctionId,
            notificationType: type,
            relatedEntityId,
            relatedEntityType,
          });
          try {
            if (currentRole === 'wholesaler') {
              // Wholesaler: Navigate to auction detail in bidding-history tab
              // This is the correct page for viewing auction details of auctions the wholesaler has bid on
              // It can view both active and expired auctions
              console.log('✅ [NotificationBell] Navigating wholesaler to bidding-history/auction-detail');
              router.push({
                pathname: '/(tabs)/wholesaler/bidding-history/auction-detail',
                params: { auctionId: targetAuctionId },
              } as any);
            } else {
              // Farmer: Navigate to farmer auction detail page
              // Use relatedEntityId directly (same as wholesaler logic)
              console.log('✅ [NotificationBell] Navigating farmer to auction-detail');
              try {
                const auctionDetail = await getAuctionDetail(targetAuctionId);
                if (auctionDetail) {
                  router.push({
                    pathname: '/pages/farmer/auction-detail',
                    params: { auctionData: JSON.stringify(auctionDetail) },
                  } as any);
                } else {
                  console.warn('⚠️ [NotificationBell] Could not fetch farmer auction detail for:', targetAuctionId);
                  // Fallback: try with auctionId anyway (in case farmer page was updated)
                  router.push({
                    pathname: '/pages/farmer/auction-detail',
                    params: { auctionId: targetAuctionId },
                  } as any);
                }
              } catch (fetchError) {
                console.error('❌ [NotificationBell] Error fetching farmer auction detail:', fetchError);
                // Fallback: try with auctionId anyway
                router.push({
                  pathname: '/pages/farmer/auction-detail',
                  params: { auctionId: targetAuctionId },
                } as any);
              }
            }
          } catch (error) {
            console.error('❌ [NotificationBell] Navigation error:', error);
            // Fallback: try with query string
            if (currentRole === 'wholesaler') {
              router.push(`/(tabs)/wholesaler/bidding-history/auction-detail?auctionId=${targetAuctionId}` as any);
            } else {
              router.push(`/pages/farmer/auction-detail?auctionId=${targetAuctionId}` as any);
            }
          }
        } else {
          console.warn('⚠️ [NotificationBell] No auction ID found for notification:', {
            type,
            notification,
            auctionId,
            relatedEntityId,
            relatedEntityType,
            parsedData,
          });
        }
        break;

      case 4: // AuctionApproved
        // Farmer: Navigate to my auction detail
        const approvedAuctionId = getAuctionId();
        if (currentRole === 'farmer' && approvedAuctionId) {
          console.log('🔗 [NotificationBell] Navigating to farmer auction detail:', approvedAuctionId);
          try {
            const auctionDetail = await getAuctionDetail(approvedAuctionId);
            if (auctionDetail) {
              router.push({
                pathname: '/pages/farmer/auction-detail',
                params: { auctionData: JSON.stringify(auctionDetail) },
              } as any);
            } else {
              router.push({
                pathname: '/pages/farmer/auction-detail',
                params: { auctionId: approvedAuctionId },
              } as any);
            }
          } catch (fetchError) {
            console.error('❌ [NotificationBell] Error fetching farmer auction detail:', fetchError);
            router.push({
              pathname: '/pages/farmer/auction-detail',
              params: { auctionId: approvedAuctionId },
            } as any);
          }
        }
        break;

      case 8: // EscrowDepositSuccess - Thanh toán cọc thành công
      case 9: // EscrowRemainingPaymentSuccess - Thanh toán còn lại thành công
      case 10: // EscrowReleaseReceived - Nhận tiền từ escrow
      case 13: // EscrowCancelled - Hủy hợp đồng đấu giá
        // Navigate to transactions page in profile tab (escrow detail is shown via modal)
        const targetEscrowId = getEscrowId();
        if (targetEscrowId) {
          console.log('🔗 [NotificationBell] Navigating to transactions page:', {
            type,
            escrowId: targetEscrowId,
            role: currentRole,
          });
          if (currentRole === 'farmer') {
            router.push({
              pathname: '/(tabs)/farmer/profile/transactions',
              params: { escrowId: targetEscrowId },
            } as any);
          } else {
            router.push({
              pathname: '/(tabs)/wholesaler/profile/transactions',
              params: { escrowId: targetEscrowId },
            } as any);
          }
        } else {
          console.warn('⚠️ [NotificationBell] No escrow ID found for notification type:', type);
        }
        break;

      case 14: // DistupeOpened (Dispute)
        // Navigate to transactions page to view dispute (dispute is shown in escrow detail modal)
        // For Dispute, relatedEntityType is "Dispute" but we need EscrowId from data
        let disputeEscrowId: string | null = null;
        
        // Priority 1: Try parsedData.EscrowId (Dispute notifications have EscrowId in data)
        if (parsedData) {
          if (parsedData.EscrowId) {
            disputeEscrowId = parsedData.EscrowId;
            console.log('🔍 [NotificationBell] Found escrowId from parsedData.EscrowId for dispute:', disputeEscrowId);
          } else if (parsedData.escrowId) {
            disputeEscrowId = parsedData.escrowId;
            console.log('🔍 [NotificationBell] Found escrowId from parsedData.escrowId for dispute:', disputeEscrowId);
          }
        }
        
        // Priority 2: Try getEscrowId() as fallback
        if (!disputeEscrowId) {
          disputeEscrowId = getEscrowId();
        }
        
        if (disputeEscrowId) {
          console.log('🔗 [NotificationBell] Navigating to transactions page for dispute:', {
            type,
            escrowId: disputeEscrowId,
            role: currentRole,
          });
          if (currentRole === 'farmer') {
            router.push({
              pathname: '/(tabs)/farmer/profile/transactions',
              params: { escrowId: disputeEscrowId },
            } as any);
          } else {
            router.push({
              pathname: '/(tabs)/wholesaler/profile/transactions',
              params: { escrowId: disputeEscrowId },
            } as any);
          }
        } else {
          console.warn('⚠️ [NotificationBell] No escrow ID found for dispute notification');
        }
        break;

      case 7: // System
        // System notifications can have different relatedEntityTypes
        // Examples:
        // - "Nông dân đã sẵn sàng thu hoạch" → relatedEntityType: "Escrow"
        // - "Nông dân đã chấp nhận yêu cầu mua" → relatedEntityType: "BuyRequest"
        // - Other system notifications → no navigation
        
        if (relatedEntityType === 'Escrow') {
          // "Nông dân đã sẵn sàng thu hoạch" → Navigate to transactions page
          const systemEscrowId = getEscrowId();
          if (systemEscrowId) {
            console.log('🔗 [NotificationBell] System notification (Escrow): Navigating to transactions page:', {
              type,
              escrowId: systemEscrowId,
              role: currentRole,
            });
            if (currentRole === 'farmer') {
              router.push({
                pathname: '/(tabs)/farmer/profile/transactions',
                params: { escrowId: systemEscrowId },
              } as any);
            } else {
              router.push({
                pathname: '/(tabs)/wholesaler/profile/transactions',
                params: { escrowId: systemEscrowId },
              } as any);
            }
          } else {
            console.warn('⚠️ [NotificationBell] System notification (Escrow) but no escrow ID found');
          }
        } else if (relatedEntityType === 'BuyRequest') {
          // "Nông dân đã chấp nhận yêu cầu mua" → Navigate to buy request detail
          const systemBuyRequestId = getBuyRequestId();
          if (systemBuyRequestId) {
            console.log('🔗 [NotificationBell] System notification (BuyRequest): Navigating to buy request detail:', {
              type,
              buyRequestId: systemBuyRequestId,
              role: currentRole,
            });
            if (currentRole === 'farmer') {
              router.push({
                pathname: '/(tabs)/farmer/buy-request-management/[id]',
                params: { id: systemBuyRequestId },
              } as any);
            } else {
              router.push({
                pathname: '/pages/wholesaler/buy-request-detail',
                params: { id: systemBuyRequestId },
              } as any);
            }
          } else {
            console.warn('⚠️ [NotificationBell] System notification (BuyRequest) but no buyRequest ID found');
          }
        } else {
          // Other system notifications don't navigate anywhere
          console.log('ℹ️ [NotificationBell] System notification, no navigation:', {
            type,
            relatedEntityType,
            relatedEntityId,
          });
        }
        break;

      case 11: // WalletFundsAdded
      case 17: // WithdrawalRequested
      case 18: // WithdrawalCompleted
      case 19: // WithdrawalRejected
        // Navigate to wallet page
        console.log('🔗 [NotificationBell] Navigating to wallet page');
        if (currentRole === 'farmer') {
          router.push({
            pathname: '/(tabs)/farmer/profile/wallet',
          } as any);
        } else {
          router.push({
            pathname: '/(tabs)/wholesaler/profile/wallet',
          } as any);
        }
        break;

      // BuyRequest related notifications (if any other types have BuyRequest)
      // These would typically have relatedEntityType === 'BuyRequest'
      default:
        // Check if it's a BuyRequest notification
        const buyRequestId = getBuyRequestId();
        if (relatedEntityType === 'BuyRequest' && buyRequestId) {
          console.log('🔗 [NotificationBell] Navigating to buy request detail:', {
            type,
            buyRequestId,
            role: currentRole,
            relatedEntityType,
          });
          if (currentRole === 'farmer') {
            router.push({
              pathname: '/(tabs)/farmer/buy-request-management/[id]',
              params: { id: buyRequestId },
            } as any);
          } else {
            router.push({
              pathname: '/pages/wholesaler/buy-request-detail',
              params: { id: buyRequestId },
            } as any);
          }
        } else {
          console.warn('⚠️ [NotificationBell] Unknown notification type or no navigation handler:', {
            type,
            relatedEntityType,
            relatedEntityId,
            parsedData,
          });
        }
        break;
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };

  const handleRefresh = async () => {
    await refreshNotifications();
    await refreshUnreadCount();
  };

  const renderNotificationItem = ({ item }: { item: BackendNotification }) => {
    const typeColor = getNotificationTypeColor(item.type);
    const typeIcon = getNotificationIcon(item.type);
    const typeName = getNotificationTypeName(item.type);

    return (
      <TouchableOpacity
        style={[
          styles.notificationItem, 
          !item.isRead && styles.unreadItem,
          navigatingNotificationId === item.id && styles.navigatingItem,
        ]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.7}
        disabled={navigatingNotificationId === item.id}
      >
        <View style={[styles.iconContainer, { backgroundColor: typeColor + '20' }]}>
          <Text style={styles.icon}>{typeIcon}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.isRead && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.message} numberOfLines={2}>
            {item.message}
          </Text>
          <View style={styles.footer}>
            <Text style={styles.typeLabel}>{typeName}</Text>
            <Text style={styles.timestamp}>
              {new Date(item.createdAt).toLocaleDateString('vi-VN', {
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          {navigatingNotificationId === item.id && (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#22C55E" />
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          )}
        </View>

        {navigatingNotificationId !== item.id && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteNotification(item.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={16} color="#9CA3AF" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Bell size={48} color="#D1D5DB" />
      <Text style={styles.emptyText}>Không có thông báo nào</Text>
      <Text style={styles.emptySubText}>
        Bạn sẽ nhận thông báo khi có sự kiện mới
      </Text>
    </View>
  );

  return (
    <>
      <TouchableOpacity
        style={styles.bellButton}
        onPress={() => {
          setModalVisible(true);
          refreshNotifications();
        }}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Bell size={24} color="#111827" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Notification Popup - hiển thị khi có notification mới từ SignalR */}
      {latestNotification && (
        <NotificationPopup
          notification={latestNotification}
          onDismiss={dismissLatestNotification}
          onPress={handlePopupPress}
          duration={5000}
        />
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Thông báo</Text>
                {unreadCount > 0 && (
                  <Text style={styles.unreadLabel}>
                    {unreadCount} thông báo chưa đọc
                  </Text>
                )}
              </View>
              <View style={styles.headerActions}>
                {unreadCount > 0 && (
                  <TouchableOpacity
                    onPress={handleMarkAllAsRead}
                    style={styles.markAllButton}
                  >
                    <Text style={styles.markAllButtonText}>Đọc tất cả</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color="#111827" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Content */}
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#22C55E" />
              </View>
            ) : (
              <FlatList
                data={notifications}
                renderItem={renderNotificationItem}
                keyExtractor={(item) => item.id}
                ListEmptyComponent={renderEmpty}
                contentContainerStyle={
                  notifications.length === 0 ? styles.listContent : undefined
                }
                refreshing={false}
                onRefresh={handleRefresh}
                refreshControl={
                  <RefreshControl
                    refreshing={isLoading}
                    onRefresh={handleRefresh}
                    colors={['#22C55E']}
                  />
                }
              />
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bellButton: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flex: 0.9,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  unreadLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  markAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F0FDF4',
    borderRadius: 6,
  },
  markAllButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#22C55E',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  unreadItem: {
    backgroundColor: '#F9FAFB',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginLeft: 8,
  },
  message: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
  },
  timestamp: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
    marginTop: -4,
  },
  navigatingItem: {
    opacity: 0.6,
    backgroundColor: '#F0FDF4',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#22C55E',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
});

