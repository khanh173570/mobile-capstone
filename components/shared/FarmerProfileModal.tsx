import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { X, MapPin, Phone, Mail, Leaf } from 'lucide-react-native';
import { getFarmsByUserId, Farm } from '../../services/farmService';

interface FarmerProfileModalProps {
  visible: boolean;
  farmerId: string;
  onClose: () => void;
}

export default function FarmerProfileModal({
  visible,
  farmerId,
  onClose,
}: FarmerProfileModalProps) {
  const [loading, setLoading] = useState(false);
  const [farms, setFarms] = useState<Farm[]>([]);

  useEffect(() => {
    if (visible && farmerId) {
      loadFarmerInfo();
    }
  }, [visible, farmerId]);

  const loadFarmerInfo = async () => {
    setLoading(true);
    try {
      // Get farmer's farms
      const farmsData = await getFarmsByUserId(farmerId);
      setFarms(farmsData);
    } catch (error) {
      console.error('Error loading farmer info:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22C55E" />
              <Text style={styles.loadingText}>Đang tải thông tin...</Text>
            </View>
          ) : farms.length > 0 ? (
            <ScrollView
              style={styles.content}
              showsVerticalScrollIndicator={false}
            >
              {/* Farms Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Leaf size={18} color="#22C55E" />
                  <Text style={styles.sectionTitle}>
                    Trang trại nông dân ({farms.length})
                  </Text>
                </View>

                {farms.map((farm) => (
                  <View key={farm.id} style={styles.farmCard}>
                    {farm.farmImage && (
                      <Image
                        source={{ uri: farm.farmImage }}
                        style={styles.farmImage}
                      />
                    )}
                    <View style={styles.farmInfo}>
                      <Text style={styles.farmName}>{farm.name}</Text>
                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusBadge,
                            farm.isActive
                              ? styles.activeBadge
                              : styles.inactiveBadge,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              farm.isActive
                                ? styles.activeText
                                : styles.inactiveText,
                            ]}
                          >
                            {farm.isActive ? 'Hoạt động' : 'Không hoạt động'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          ) : (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Không có trang trại nào</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingTop: 16,
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
    backgroundColor: '#F3F4F6',
  },
  defaultProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#22C55E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  defaultProfileInitial: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  farmerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  farmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  farmImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#F3F4F6',
  },
  farmInfo: {
    padding: 12,
  },
  farmName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  activeBadge: {
    backgroundColor: '#DCFCE7',
  },
  inactiveBadge: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: '#166534',
  },
  inactiveText: {
    color: '#991B1B',
  },
  errorContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#DC2626',
  },
});
