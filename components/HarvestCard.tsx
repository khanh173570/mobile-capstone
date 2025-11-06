import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Harvest } from '../services/harvestService';
import { Calendar, TrendingUp, DollarSign, Package, Edit3 } from 'lucide-react-native';

interface HarvestCardProps {
  harvest: Harvest;
  onEdit?: () => void;
}

export default function HarvestCard({ harvest, onEdit }: HarvestCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Chưa có';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStatus = () => {
    if (harvest.harvestDate) {
      return { text: 'Đã hoàn thành', color: '#22C55E', bg: '#D1FAE5' };
    }
    return { text: 'Đang tiến hành', color: '#F59E0B', bg: '#FEF3C7' };
  };

  const status = getStatus();

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Text style={[styles.statusText, { color: status.color }]}>
            {status.text}
          </Text>
        </View>
        {onEdit && (
          <TouchableOpacity 
            style={styles.editButton}
            onPress={onEdit}
          >
            <Edit3 size={18} color="#6B7280" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Calendar size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Ngày bắt đầu</Text>
            <Text style={styles.infoValue}>{formatDate(harvest.startDate)}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Calendar size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Ngày thu hoạch</Text>
            <Text style={styles.infoValue}>{formatDate(harvest.harvestDate)}</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Package size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Sản lượng</Text>
            <Text style={styles.infoValue}>{harvest.totalQuantity} {harvest.unit}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <DollarSign size={16} color="#6B7280" />
            <Text style={styles.infoLabel}>Giá bán</Text>
            <Text style={styles.infoValue}>{formatCurrency(harvest.salePrice)}</Text>
          </View>
        </View>

        {harvest.note && harvest.note !== 'Không có' && (
          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>Ghi chú:</Text>
            <Text style={styles.noteText}>{harvest.note}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  editButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBody: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  noteSection: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  noteLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
});
