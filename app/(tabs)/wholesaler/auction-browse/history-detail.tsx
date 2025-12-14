import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Package, Calendar, DollarSign, Tag, ChevronLeft } from 'lucide-react-native';
import { BuyRequest } from '../../../../services/buyRequestHistoryService';

export default function BuyRequestHistoryDetailScreen() {
  const params = useLocalSearchParams();
  const buyRequest = params.buyRequest ? JSON.parse(params.buyRequest as string) : null;

  if (!buyRequest) {
    return (
      <View style={styles.container}>
        <Text>Không tìm thấy yêu cầu</Text>
      </View>
    );
  }

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'Pending':
        return '#F59E0B';
      case 'Accepted':
        return '#10B981';
      case 'Rejected':
        return '#EF4444';
      case 'Completed':
        return '#3B82F6';
      case 'Canceled':
        return '#6B7280';
      default:
        return '#6B7280';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'Pending':
        return 'Chờ xử lý';
      case 'Accepted':
        return 'Đã chấp nhận';
      case 'Rejected':
        return 'Bị từ chối';
      case 'Completed':
        return 'Hoàn thành';
      case 'Canceled':
        return 'Đã hủy';
      default:
        return status;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết yêu cầu</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusCardRow}>
            <Text style={styles.statusCardLabel}>Trạng thái</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(buyRequest.status) },
              ]}
            >
              <Text style={styles.statusBadgeText}>
                {getStatusLabel(buyRequest.status)}
              </Text>
            </View>
          </View>
        </View>

        {/* Request Info Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin yêu cầu</Text>

          <View style={styles.infoCard}>
            {/* <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Tag size={18} color="#6B7280" />
              </View>
              {/* <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Mã yêu cầu</Text>
                <Text style={styles.infoValue}>{buyRequest.id}</Text>
              </View> */}
            {/* </View> */} 

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Calendar size={18} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ngày cần thiết</Text>
                <Text style={styles.infoValue}>
                  {new Date(buyRequest.requiredDate).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <DollarSign size={18} color="#059669" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Giá dự kiến</Text>
                <Text style={styles.infoValuePrice}>
                  {buyRequest.expectedPrice.toLocaleString('vi-VN')} ₫
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Package size={18} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Loại mua</Text>
                <Text style={styles.infoValue}>
                  {buyRequest.isBuyingBulk ? 'Mua toàn bộ' : 'Mua theo loại'}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Calendar size={18} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ngày tạo</Text>
                <Text style={styles.infoValue}>
                  {new Date(buyRequest.createdAt).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Message Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ghi chú</Text>
          <View style={styles.messageCard}>
            <Text style={styles.messageText}>{buyRequest.message}</Text>
          </View>
        </View>

        {/* Details Section */}
        {buyRequest.details && buyRequest.details.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Chi tiết loại hàng ({buyRequest.details.length})
            </Text>

            {buyRequest.details.map((detail: any, index: number) => (
              <View key={detail.id || index} style={styles.detailCard}>
                <View style={styles.detailCardHeader}>
                  <Text style={styles.detailCardTitle}>Hạng {detail.grade}</Text>
                  <Text style={styles.detailCardBadge}>{detail.unit}</Text>
                </View>

                <View style={styles.detailCardContent}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Số lượng:</Text>
                    <Text style={styles.detailValue}>
                      {detail.quantity} {detail.unit}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Giá:</Text>
                    <Text style={styles.detailValuePrice}>
                      {detail.price.toLocaleString('vi-VN')} ₫
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Độ lệch cho phép:</Text>
                    <Text style={styles.detailValue}>
                      ±{detail.allowedDeviationPercent}%
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Tổng giá trị:</Text>
                    <Text style={styles.detailValuePrice}>
                      {(detail.quantity * detail.price).toLocaleString('vi-VN')} ₫
                    </Text>
                  </View>
                </View>
              </View>
            ))}

            {/* Summary */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Tóm tắt</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tổng số lượng:</Text>
                <Text style={styles.summaryValue}>
                  {buyRequest.details.reduce((sum: number, d: any) => sum + d.quantity, 0)} kg
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tổng giá trị:</Text>
                <Text style={styles.summaryValuePrice}>
                  {buyRequest.details
                    .reduce((sum: number, d: any) => sum + d.quantity * d.price, 0)
                    .toLocaleString('vi-VN')} ₫
                </Text>
              </View>
            </View>
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  statusCard: {
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 16,
  },
  statusCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusCardLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
  },
  infoValuePrice: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
  },
  messageCard: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    lineHeight: 18,
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 12,
  },
  detailCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  detailCardBadge: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  detailCardContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '600',
  },
  detailValuePrice: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginTop: 12,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '700',
  },
  summaryValuePrice: {
    fontSize: 13,
    color: '#059669',
    fontWeight: '700',
  },
});
