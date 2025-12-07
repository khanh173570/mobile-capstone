import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { EscrowContract, formatCurrency, getEscrowStatusLabel } from '../../services/escrowContractService';
import { AuctionSession } from './../../services/auctionService';

interface EscrowContractCardProps {
  contract: EscrowContract;
  onPress: () => void;
  role: 'farmer' | 'wholesaler';
}

export const EscrowContractCard: React.FC<EscrowContractCardProps> = ({
  contract,
  onPress,
  role,
}) => {
  const getStatusColor = (status: number): string => {
    const colors: Record<number, string> = {
      0: '#F59E0B',
      1: '#3B82F6',
      2: '#8B5CF6',
      3: '#10B981',
      4: '#059669',
      5: '#EF4444',
      6: '#6B7280',
      7: '#9CA3AF',
      8: '#D1D5DB',
    };
    return colors[status] || '#6B7280';
  };

  const createdDate = new Date(contract.createdAt).toLocaleDateString('vi-VN');
  const statusLabel = getEscrowStatusLabel(contract.escrowStatus);
  const statusColor = getStatusColor(contract.escrowStatus);

  return (
    <TouchableOpacity
      style={[styles.container, { borderLeftColor: statusColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleSection}>
          <Text style={styles.auctionId}>{contract.sessionCode}</Text>
          <Text style={styles.date}>{createdDate}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{statusLabel}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailsSection}>
        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Tổng tiền</Text>
            <Text style={styles.amount}>{formatCurrency(contract.totalAmount)}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>Phí dịch vụ</Text>
            <Text style={styles.amount}>{formatCurrency(contract.feeAmount)}</Text>
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.column}>
            <Text style={styles.label}>Số tiền cọc</Text>
            <Text style={styles.amount}>{formatCurrency(contract.escrowAmount)}</Text>
          </View>
          <View style={styles.column}>
            <Text style={styles.label}>
              {role === 'farmer' ? 'Bạn nhận' : 'Bạn thanh toán'}
            </Text>
            <Text style={styles.amount}>
              {role === 'farmer'
                ? formatCurrency(contract.sellerReceiveAmount)
                : formatCurrency(contract.totalAmount)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <MaterialIcons name="arrow-forward-ios" size={18} color="#9CA3AF" />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleSection: {
    flex: 1,
  },
  auctionId: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginBottom: 12,
  },
  detailsSection: {
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  column: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 4,
  },
  amount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  footer: {
    alignItems: 'flex-end',
    paddingTop: 4,
  },
});
