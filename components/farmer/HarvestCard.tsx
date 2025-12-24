import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Harvest } from '../../services/harvestService';
import { Calendar, TrendingUp, DollarSign, Package, Edit3, Eye, Image as ImageIcon, MoreHorizontal } from 'lucide-react-native';
import HarvestImagesModal from './HarvestImagesModal';

interface HarvestCardProps {
  harvest: Harvest;
  onEdit?: () => void;
  onViewGrades?: () => void;
}

export default function HarvestCard({ harvest, onEdit, onViewGrades }: HarvestCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showImagesModal, setShowImagesModal] = useState(false);
  
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

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        {onEdit && (
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => onEdit()}
            >
              <MoreHorizontal size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
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

        {/* Grades Button */}
        <TouchableOpacity
          style={styles.gradesButton}
          onPress={() => {
            if (onViewGrades) {
              onViewGrades();
            }
          }}
        >
          <Eye size={16} color="#fff" />
          <Text style={styles.gradesButtonText}>Xem đánh giá mùa vụ</Text>
        </TouchableOpacity>

        {/* Images Button */}
        <TouchableOpacity
          style={styles.imagesButton}
          onPress={() => setShowImagesModal(true)}
        >
          <ImageIcon size={16} color="#fff" />
          <Text style={styles.imagesButtonText}>Quản lý ảnh mùa vụ</Text>
        </TouchableOpacity>
      </View>

      {/* Harvest Images Modal */}
      <HarvestImagesModal
        visible={showImagesModal}
        harvestId={harvest.id}
        harvestName={`Thu hoạch từ ${formatDate(harvest.startDate)}`}
        onClose={() => setShowImagesModal(false)}
      />
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
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuContainer: {
    position: 'relative',
    zIndex: 1000,
  },
  menuButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  invisibleOverlay: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
    zIndex: 999,
  },
  menuDropdown: {
    position: 'absolute',
    top: 36,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 8,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1001,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  deleteMenuItem: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  deleteMenuText: {
    color: '#EF4444',
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
  gradesButton: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  gradesButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  imagesButton: {
    flexDirection: 'row',
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  imagesButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
