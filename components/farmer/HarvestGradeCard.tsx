import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { HarvestGradeDetail, GRADE_LABELS } from '../../services/harvestGradeDetailService';
import { Package, Calendar, MoreVertical } from 'lucide-react-native';

interface HarvestGradeCardProps {
  grade: HarvestGradeDetail;
  onEdit?: () => void;
  onDelete?: () => void;
}

const GRADE_COLORS: Record<1 | 2 | 3, { bg: string; border: string; text: string }> = {
  1: { bg: '#FEF3C7', border: '#FBBF24', text: '#D97706' },
  2: { bg: '#E0E7FF', border: '#C7D2FE', text: '#4F46E5' },
  3: { bg: '#F3E8FF', border: '#E9D5FF', text: '#A855F7' },
};

export default function HarvestGradeCard({ grade, onEdit, onDelete }: HarvestGradeCardProps) {
  const colors = GRADE_COLORS[grade.grade];
  const [showMenu, setShowMenu] = React.useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  return (
    <View style={[styles.card, { borderLeftColor: colors.border }]}>
      <View style={styles.header}>
        <View style={[styles.gradeBadge, { backgroundColor: colors.bg, borderColor: colors.border }]}>
          <Text style={[styles.gradeText, { color: colors.text }]}>
            {GRADE_LABELS[grade.grade]}
          </Text>
        </View>
        
        {(onEdit || onDelete) && (
          <View style={styles.menuContainer}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setShowMenu(!showMenu)}
            >
              <MoreVertical size={18} color="#6B7280" />
            </TouchableOpacity>

            {showMenu && (
              <>
                <TouchableOpacity 
                  style={styles.invisibleOverlay}
                  activeOpacity={1}
                  onPress={() => setShowMenu(false)}
                />
                <View style={styles.menuDropdown}>
                  {onEdit && (
                    <TouchableOpacity 
                      style={styles.menuItem}
                      onPress={() => {
                        setShowMenu(false);
                        onEdit();
                      }}
                    >
                      <Text style={styles.menuItemText}>Cập nhật</Text>
                    </TouchableOpacity>
                  )}
                  {onDelete && (
                    <TouchableOpacity 
                      style={[styles.menuItem, styles.deleteMenuItem]}
                      onPress={() => {
                        setShowMenu(false);
                        onDelete();
                      }}
                    >
                      <Text style={[styles.menuItemText, styles.deleteMenuText]}>Xóa</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Package size={14} color="#6B7280" />
            <Text style={styles.label}>Số lượng</Text>
            <Text style={styles.value}>{grade.quantity} {grade.unit}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Calendar size={14} color="#6B7280" />
            <Text style={styles.label}>Ngày tạo</Text>
            <Text style={styles.value}>{formatDate(grade.createdAt)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderLeftWidth: 4,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  header: {
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  gradeText: {
    fontSize: 12,
    fontWeight: '600',
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
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 1001,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  content: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  infoItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 8,
    borderRadius: 6,
    gap: 4,
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
});
