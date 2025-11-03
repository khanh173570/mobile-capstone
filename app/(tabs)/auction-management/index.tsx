import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Clock, Eye, Edit, Trash2, Bell } from 'lucide-react-native';
import Header from '../../../components/Header';

interface Auction {
  id: string;
  title: string;
  status: 'active' | 'pending' | 'completed';
  currentBid: number;
  startingPrice: number;
  endDate: string;
  bidCount: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'bid' | 'winner' | 'ended';
  time: string;
  read: boolean;
}

export default function AuctionManagementScreen() {
  const [activeTab, setActiveTab] = useState<'auctions' | 'notifications'>('auctions');

  // Mock data - sẽ được thay thế bằng API calls
  const auctions: Auction[] = [
    {
      id: '1',
      title: 'Cà chua cherry organic',
      status: 'active',
      currentBid: 45000,
      startingPrice: 30000,
      endDate: '2025-11-05T10:00:00Z',
      bidCount: 8,
    },
    {
      id: '2',
      title: 'Rau xà lách thủy canh',
      status: 'pending',
      currentBid: 0,
      startingPrice: 25000,
      endDate: '2025-11-06T14:00:00Z',
      bidCount: 0,
    },
    {
      id: '3',
      title: 'Dưa chuột Nhật Bản',
      status: 'completed',
      currentBid: 65000,
      startingPrice: 40000,
      endDate: '2025-11-02T18:00:00Z',
      bidCount: 12,
    },
  ];

  const notifications: Notification[] = [
    {
      id: '1',
      title: 'Có lượt đấu giá mới',
      message: 'Sản phẩm "Cà chua cherry organic" có lượt đấu giá 45,000 VND',
      type: 'bid',
      time: '5 phút trước',
      read: false,
    },
    {
      id: '2',
      title: 'Phiên đấu giá kết thúc',
      message: 'Sản phẩm "Dưa chuột Nhật Bản" đã kết thúc với giá 65,000 VND',
      type: 'ended',
      time: '2 giờ trước',
      read: true,
    },
    {
      id: '3',
      title: 'Bạn đã thắng đấu giá',
      message: 'Chúc mừng! Sản phẩm "Rau muống" đã được bán với giá 35,000 VND',
      type: 'winner',
      time: '1 ngày trước',
      read: true,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Đang đấu giá';
      case 'pending':
        return 'Chờ bắt đầu';
      case 'completed':
        return 'Đã kết thúc';
      default:
        return 'Không xác định';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderAuction = ({ item }: { item: Auction }) => (
    <View style={styles.auctionCard}>
      <View style={styles.auctionHeader}>
        <Text style={styles.auctionTitle}>{item.title}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>
            {getStatusText(item.status)}
          </Text>
        </View>
      </View>

      <View style={styles.priceRow}>
        <View>
          <Text style={styles.priceLabel}>Giá hiện tại</Text>
          <Text style={styles.priceValue}>
            {formatPrice(item.currentBid || item.startingPrice)}
          </Text>
        </View>
        <View style={styles.bidCountContainer}>
          <Text style={styles.priceLabel}>Số lượt đấu giá</Text>
          <Text style={styles.bidCount}>
            {item.bidCount}
          </Text>
        </View>
      </View>

      <View style={styles.timeRow}>
        <Clock size={16} color="#6B7280" />
        <Text style={styles.timeText}>
          Kết thúc: {formatDate(item.endDate)}
        </Text>
      </View>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.viewButton}>
          <Eye size={16} color="white" />
          <Text style={styles.buttonText}>Xem chi tiết</Text>
        </TouchableOpacity>
        
        {item.status !== 'completed' && (
          <TouchableOpacity style={styles.editButton}>
            <Edit size={16} color="white" />
            <Text style={styles.buttonText}>Chỉnh sửa</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.deleteButton}>
          <Trash2 size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNotification = ({ item }: { item: Notification }) => (
    <View className={`bg-white rounded-lg p-4 mb-3 shadow-sm ${!item.read ? 'border-l-4 border-green-500' : ''}`}>
      <View className="flex-row items-start justify-between mb-2">
        <Text className={`text-base font-semibold ${!item.read ? 'text-gray-800' : 'text-gray-600'} flex-1`}>
          {item.title}
        </Text>
        <Text className="text-xs text-gray-500">{item.time}</Text>
      </View>
      
      <Text className={`text-sm ${!item.read ? 'text-gray-700' : 'text-gray-500'} mb-2`}>
        {item.message}
      </Text>
      
      <View className="flex-row items-center">
        <View className={`w-2 h-2 rounded-full mr-2 ${
          item.type === 'bid' ? 'bg-blue-500' : 
          item.type === 'winner' ? 'bg-green-500' : 'bg-gray-500'
        }`} />
        <Text className="text-xs text-gray-500 capitalize">
          {item.type === 'bid' ? 'Đấu giá' : 
           item.type === 'winner' ? 'Thắng cuộc' : 'Kết thúc'}
        </Text>
      </View>
    </View>
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <View style={styles.container}>
      <Header title="Quản lý Đấu giá" />

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('auctions')}
          style={[styles.tab, activeTab === 'auctions' && styles.activeTab]}
        >
          <Text style={[styles.tabText, activeTab === 'auctions' && styles.activeTabText]}>
            Đấu giá của tôi
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => setActiveTab('notifications')}
          style={[styles.tab, activeTab === 'notifications' && styles.activeTab]}
        >
          <View style={styles.notificationTab}>
            <Bell size={16} color={activeTab === 'notifications' ? 'white' : '#6B7280'} />
            <Text style={[styles.tabText, activeTab === 'notifications' && styles.activeTabText]}>
              Thông báo
            </Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'auctions' ? (
          <FlatList
            data={auctions}
            renderItem={renderAuction}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        )}
      </ScrollView>

      {/* Summary Stats */}
      {activeTab === 'auctions' && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {auctions.filter(a => a.status === 'active').length}
            </Text>
            <Text style={styles.statLabel}>Đang đấu giá</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#F59E0B' }]}>
              {auctions.filter(a => a.status === 'pending').length}
            </Text>
            <Text style={styles.statLabel}>Chờ bắt đầu</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#6B7280' }]}>
              {auctions.filter(a => a.status === 'completed').length}
            </Text>
            <Text style={styles.statLabel}>Đã hoàn thành</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabContainer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    marginTop: 120,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 4,
    backgroundColor: '#F3F4F6',
  },
  activeTab: {
    backgroundColor: '#22C55E',
  },
  tabText: {
    textAlign: 'center',
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#fff',
  },
  notificationTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statsContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  auctionCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  auctionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  auctionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  priceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#22C55E',
  },
  bidCountContainer: {
    alignItems: 'flex-end',
  },
  bidCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeText: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  viewButton: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
});