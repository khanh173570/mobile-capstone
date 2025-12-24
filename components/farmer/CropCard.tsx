import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Crop } from '../../services/cropService';
import { getCropStatusInfo } from '../../utils/cropStatusUtils';
import { 
  Sprout, 
  Calendar, 
  TrendingUp, 
  MapPin,
  Clock,
  Edit3,
  CheckCircle,
  Eye,
} from 'lucide-react-native';

interface CropCardProps {
  crop: Crop;
  cropIndex?: number; // Add index for numbering
  onPress?: () => void;
  onEdit?: () => void;
  onCreateHarvest?: () => void;
}

export default function CropCard({ crop, cropIndex, onPress, onEdit, onCreateHarvest }: CropCardProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Debug props
  //console.log('CropCard props:', { onEdit: !!onEdit, shouldShowMenu: !!onEdit });
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const calculateDaysSinceLastHarvest = () => {
    if (!crop.nearestHarvestDate) return 0;
    const lastHarvestDate = new Date(crop.nearestHarvestDate);
    const today = new Date();
    const diffTime = today.getTime() - lastHarvestDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysSinceLastHarvest = calculateDaysSinceLastHarvest();
  const statusInfo = getCropStatusInfo(crop.status);

  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cropIcon}>
          <Sprout size={24} color="#22C55E" />
        </View>
        <View style={styles.cropInfo}>
          <Text style={styles.cropType}>
            {crop.name || 'Chưa đặt tên'}
          </Text>
          {/* Status moved to note position */}
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
            <CheckCircle size={14} color={statusInfo.color} />
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.name}
            </Text>
          </View>
        </View>
        {onEdit && (
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => onEdit()}
            >
              {crop.status === 2 ? (
                <Eye size={20} color="#6B7280" />
              ) : (
                <Edit3 size={20} color="#6B7280" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <MapPin size={16} color="#6B7280" />
              <Text style={styles.infoLabel}>Diện tích</Text>
            </View>
            <Text style={styles.infoValue}>{crop.area} ha</Text>
          </View>
          
          <View style={styles.infoItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Sprout size={16} color="#6B7280" />
              <Text style={styles.infoLabel}>Số cây</Text>
            </View>
            <Text style={styles.infoValue}>{crop.treeCount} cây</Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Calendar size={16} color="#6B7280" />
              <Text style={styles.infoLabel}>Ngày trồng</Text>
            </View>
            <Text style={styles.infoValue}>{formatDate(crop.startPlantingDate)}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Clock size={16} color="#6B7280" />
              <Text style={styles.infoLabel}>Thời gian</Text>
            </View>
            <Text style={styles.infoValue}>{crop.farmingDuration} năm</Text>
          </View>
        </View>

        {/* Custard Apple Type Section */}
        <View style={styles.typeSection}>
          <Sprout size={14} color="#22C55E" />
          <Text style={styles.typeText}>
            <Text style={styles.typeLabel}>Loại mãng cầu: </Text>
            <Text style={styles.typeValue}>{crop.custardAppleType || 'Chưa xác định'}</Text>
          </Text>
        </View>

        {crop.nearestHarvestDate && (
          <View style={styles.harvestSection}>
            <TrendingUp size={16} color="#22C55E" />
            <Text style={styles.harvestLabel}>Ngày thu hoạch gần nhất:</Text>
            <Text style={styles.harvestDate}>{formatDate(crop.nearestHarvestDate)}</Text>
          </View>
        )}

        <TouchableOpacity 
          style={[
            styles.createHarvestButton,
            crop.status === 2 && styles.createHarvestButtonViewOnly
          ]}
          onPress={(e) => {
            //console.log('=== CropCard: Create Harvest Button Pressed ===');
            //console.log('onCreateHarvest callback exists?', !!onCreateHarvest);
            e.stopPropagation();
            
            // Allow navigation even if crop has auction (status 2)
            // The harvest list page will handle view-only mode
            if (onCreateHarvest) {
              //console.log('Calling onCreateHarvest...');
              onCreateHarvest();
            } else {
              //console.log('onCreateHarvest is undefined!');
            }
          }}
        >
          <Text style={[
            styles.createHarvestText,
            crop.status === 2 && styles.createHarvestTextViewOnly
          ]}>
            {crop.status === 2 
              ? 'Xem thông tin mùa vụ' 
              : 'Tạo thông tin mùa vụ'
            }
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cropIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cropInfo: {
    flex: 1,
  },
  cropType: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    alignSelf: 'flex-start', // Make badge fit content
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cropNote: {
    fontSize: 14,
    color: '#6B7280',
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
  harvestSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  harvestLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  harvestDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#22C55E',
  },
  typeSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.05)',
    padding: 8,
    borderRadius: 8,
    gap: 6,
  },
  typeText: {
    flex: 1,
    fontSize: 13,
  },
  typeLabel: {
    color: '#6B7280',
  },
  typeValue: {
    fontWeight: '600',
    color: '#22C55E',
  },
  createHarvestButton: {
    backgroundColor: '#22C55E',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createHarvestButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  createHarvestButtonViewOnly: {
    backgroundColor: '#3B82F6',
  },
  createHarvestText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  createHarvestTextDisabled: {
    color: '#9CA3AF',
  },
  createHarvestTextViewOnly: {
    color: '#fff',
  },
  daysRemaining: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  daysRemainingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  harvestReady: {
    backgroundColor: '#D1FAE5',
  },
  harvestReadyText: {
    color: '#22C55E',
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  menuContainer: {
    position: 'relative',
    marginLeft: 8,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    position: 'absolute',
    top: 40,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 4,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 10,
    zIndex: 1001,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  dropdownText: {
    fontSize: 14,
    color: '#374151',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
    backgroundColor: 'transparent',
  },
});
