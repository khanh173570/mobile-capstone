import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { getMyReports, getReportTypes } from '../../services/reportService';
import Header from '../../components/shared/Header';
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

export default function ReportHistoryScreen({ isTab = false }: { isTab?: boolean }) {
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
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const renderReportCard = ({ item }: { item: Report }) => (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <View style={styles.typeIconContainer}>
            <AlertCircle size={18} color="#16A34A" />
          </View>
          <View style={styles.titleContent}>
            <Text style={styles.typeLabel}>{getReportTypeLabel(item.reportType)}</Text>
            {/* <Text style={styles.auctionId} numberOfLines={1}>
              Đấu giá: {item.auctionId.substring(0, 8)}...
            </Text> */}
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.reportStatus) }]}>
          <Text style={styles.statusText}>{getStatusLabel(item.reportStatus)}</Text>
        </View>
      </View>

      {/* Note */}
      <View style={styles.noteSection}>
        <Text style={styles.noteLabel}>Nội dung báo cáo</Text>
        <Text style={styles.noteText} numberOfLines={3}>
          {item.note}
        </Text>
      </View>

      {/* Footer - Date */}
      <View style={styles.cardFooter}>
        <View style={styles.dateContainer}>
          <Clock size={14} color="#6B7280" />
          <Text style={styles.dateText}>
            {formatDate(item.createdAt)}
          </Text>
        </View>
        {/* <Text style={styles.reportId}>ID: {item.id.substring(0, 2)}...</Text> */}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        {!isTab && <Header title="Lịch sử báo cáo" />}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#16A34A" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!isTab && <Header title="Lịch sử báo cáo" />}
      <FlatList
        data={reports}
        renderItem={renderReportCard}
        keyExtractor={item => item.id}
        contentContainerStyle={isTab ? styles.listContentTab : styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <AlertCircle size={48} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>Chưa có báo cáo nào</Text>
            <Text style={styles.emptyText}>
              Bạn chưa gửi báo cáo nào cho các đấu giá
            </Text>
          </View>
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
  },
  listContent: {
    padding: 16,
    paddingTop: 100,
    paddingBottom: 120,
  },
  listContentTab: {
    padding: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginRight: 12,
  },
  typeIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContent: {
    flex: 1,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  auctionId: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noteSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 6,
  },
  noteText: {
    fontSize: 13,
    color: '#111827',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#6B7280',
  },
  reportId: {
    fontSize: 11,
    color: '#9CA3AF',
  },
});
