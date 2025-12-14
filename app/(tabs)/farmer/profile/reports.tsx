import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { getMyReports, getReportTypes } from '../../../../services/reportService';
import { Clock, AlertCircle } from 'lucide-react-native';

interface Report {
  id: string;
  auctionId: string;
  reporterId: string;
  note: string;
  reportType: string;
  reportStatus: string;
  createdAt: string;
  updatedAt: string | null;
}

export default function FarmerReportsScreen() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setLoading(true);
      const data = await getMyReports();
      setReports(data);
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      const data = await getMyReports();
      setReports(data);
    } catch (error) {
      console.error('Error refreshing reports:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const getReportTypeLabel = (reportType: string) => {
    const types = getReportTypes();
    const type = types.find(t => t.value === reportType);
    return type?.label || reportType;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return '#F59E0B';
      case 'InReview':
        return '#3B82F6';
      case 'Resolved':
        return '#10B981';
      case 'ActionTaken':
        return '#8B5CF6';
      case 'Rejected':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'Chờ xử lý';
      case 'InReview':
        return 'Đang xem xét';
      case 'Resolved':
        return 'Đã giải quyết';
      case 'ActionTaken':
        return 'Đã xử lý';
      case 'Rejected':
        return 'Bị từ chối';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderReportItem = ({ item }: { item: Report }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.reportTypeContainer}>
          <AlertCircle size={16} color="#EF4444" />
          <Text style={styles.reportType}>{getReportTypeLabel(item.reportType)}</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.reportStatus) + '20' },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.reportStatus) }]}
          >
            {getStatusLabel(item.reportStatus)}
          </Text>
        </View>
      </View>

      <View style={styles.reportContent}>
        <Text style={styles.reportNote} numberOfLines={2}>
          {item.note}
        </Text>
      </View>

      <View style={styles.reportFooter}>
        <View style={styles.dateContainer}>
          <Clock size={14} color="#9CA3AF" />
          <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
        </View>
        <Text style={styles.auctionId} numberOfLines={1}>
          Mã ĐG: {item.auctionId.substring(0, 8)}...
        </Text>
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <AlertCircle size={48} color="#D1D5DB" />
      <Text style={styles.emptyText}>Chưa có báo cáo nào</Text>
      <Text style={styles.emptySubText}>
        Lịch sử báo cáo vi phạm của bạn sẽ hiển thị ở đây
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Đang tải báo cáo...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={reports}
        renderItem={renderReportItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportContent: {
    marginBottom: 12,
  },
  reportNote: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  auctionId: {
    fontSize: 12,
    color: '#9CA3AF',
    maxWidth: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});
