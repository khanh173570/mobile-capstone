import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Alert, RefreshControl } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Plus } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import HarvestGradeCard from '@/components/farmer/HarvestGradeCard';
import CreateGradeModal from '@/components/farmer/CreateGradeModal';
import EditGradeModal from '@/components/farmer/EditGradeModal';
import { HarvestGradeDetail, getHarvestGradeDetails } from '@/services/harvestGradeDetailService';

export default function HarvestGradeDetailPage() {
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const harvestId = params.harvestId as string;
  const harvestName = params.harvestName as string;

  const [grades, setGrades] = useState<HarvestGradeDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<HarvestGradeDetail | null>(null);

  const fetchGrades = async () => {
    try {
      const data = await getHarvestGradeDetails(harvestId);
      setGrades(data);
    } catch (error) {
      console.error('Error fetching grades:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách đánh giá. Vui lòng thử lại.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchGrades();
  };

  const handleCreateSuccess = async () => {
    setShowCreateModal(false);
    await fetchGrades();
  };

  const handleEditGrade = (grade: HarvestGradeDetail) => {
    setSelectedGrade(grade);
    setShowEditModal(true);
  };

  const handleUpdateSuccess = async () => {
    setShowEditModal(false);
    setSelectedGrade(null);
    await fetchGrades();
  };

  useEffect(() => {
    fetchGrades();
  }, [harvestId]);

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  const getTotalQuantity = () => {
    return grades.reduce((total, grade) => total + grade.quantity, 0);
  };

  if (loading && grades.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <ChevronLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đánh giá mùa vụ</Text>
        <View style={styles.backButtonPlaceholder} />
      </View>

      {/* Info */}
      <View style={styles.infoSection}>
        <Text style={styles.harvestName}>{harvestName}</Text>
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Tổng số lượng</Text>
            <Text style={styles.statValue}>{getTotalQuantity()} kg</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Số loại quả</Text>
            <Text style={styles.statValue}>{grades.length}</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      {grades.length === 0 ? (
        <ScrollView
          refreshControl={
            <RefreshControl 
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3B82F6']}
            />
          }
          style={styles.scrollView}
        >
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Chưa có đánh giá mùa vụ</Text>
            <TouchableOpacity 
              style={styles.createButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Plus size={20} color="#fff" />
              <Text style={styles.createButtonText}>Tạo đánh giá mới</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      ) : (
        <FlatList
          data={grades}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <HarvestGradeCard 
              grade={item}
              onEdit={() => handleEditGrade(item)}
            />
          )}
          style={styles.gradeList}
          contentContainerStyle={styles.gradeListContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3B82F6']}
            />
          }
        />
      )}

      {/* Floating Action Button */}
      {grades.length > 0 && (
        <TouchableOpacity 
          style={styles.fab}
          onPress={() => setShowCreateModal(true)}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Create Modal */}
      <CreateGradeModal
        visible={showCreateModal}
        harvestId={harvestId}
        existingGrades={grades.map(g => g.grade)}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Edit Modal */}
      <EditGradeModal
        visible={showEditModal}
        grade={selectedGrade}
        onClose={() => {
          setShowEditModal(false);
          setSelectedGrade(null);
        }}
        onSuccess={handleUpdateSuccess}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonPlaceholder: {
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  infoSection: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  harvestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  gradeList: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  gradeListContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
