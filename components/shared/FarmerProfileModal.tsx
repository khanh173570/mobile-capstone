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
import { X, MapPin, Phone, Mail, Leaf, Star, Award, Calendar, Shield, User } from 'lucide-react-native';
import { getFarmsByUserId, Farm } from '../../services/farmService';
import { getUserByUsername, User as UserType } from '../../services/authService';

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
  const [farmerData, setFarmerData] = useState<UserType | null>(null);

  useEffect(() => {
    if (visible && farmerId) {
      loadFarmerInfo();
    }
  }, [visible, farmerId]);

  const loadFarmerInfo = async () => {
    setLoading(true);
    try {
      // Get farmer user data with reputation
      const userData = await getUserByUsername(farmerId);
      if (userData) {
        setFarmerData(userData);
      }
      
      // Get farmer's farms
      const farmsData = await getFarmsByUserId(farmerId);
      setFarms(farmsData);
    } catch (error) {
      console.error('Error loading farmer info:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusInfo = (status: number) => {
    switch (status) {
      case 1:
        return { bg: '#DCFCE7', text: '#16A34A', label: 'Đang hoạt động' };
      case 0:
        return { bg: '#FEF3C7', text: '#F59E0B', label: 'Chưa kích hoạt' };
      default:
        return { bg: '#F3F4F6', text: '#6B7280', label: 'Không xác định' };
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
              {/* Farmer Information Section */}
              {farmerData && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <User size={18} color="#22C55E" />
                    <Text style={styles.sectionTitle}>Thông tin nông dân</Text>
                  </View>

                  {/* Name and Status */}
                  <View style={styles.farmerInfoCard}>
                    <View style={styles.farmerHeader}>
                      <Text style={styles.farmerName}>
                        {farmerData.firstName} {farmerData.lastName}
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          (farmerData.status ?? 0) === 1
                            ? styles.activeBadge
                            : styles.inactiveBadge,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusText,
                            (farmerData.status ?? 0) === 1
                              ? styles.activeText
                              : styles.inactiveText,
                          ]}
                        >
                          {getStatusInfo(farmerData.status ?? 0).label}
                        </Text>
                      </View>
                    </View>

                    {/* Reputation Score */}
                    <View style={styles.reputationCard}>
                      <View style={styles.reputationIconContainer}>
                        <Star size={20} color="#F59E0B" fill="#F59E0B" />
                      </View>
                      <View style={styles.reputationContent}>
                        <Text style={styles.reputationLabel}>Điểm uy tín</Text>
                        <Text style={styles.reputationValue}>
                          {farmerData.reputationScore ?? 0} điểm
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Location & Trust Score */}
                  <View style={styles.infoGroup}>
                    <Text style={styles.infoGroupTitle}>📍 Vị trí & Uy tín</Text>
                    {farmerData.address && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Địa chỉ</Text>
                        <Text style={styles.infoValue}>{farmerData.address}</Text>
                      </View>
                    )}
                    {farmerData.province && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Tỉnh/TP</Text>
                        <Text style={styles.infoValue}>{farmerData.province}</Text>
                      </View>
                    )}
                    {farmerData.communes && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Xã/Phường</Text>
                        <Text style={styles.infoValue}>{farmerData.communes}</Text>
                      </View>
                    )}
                    {farmerData.reputation?.trustScore !== undefined && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Trust Score</Text>
                        <Text style={styles.infoValueHighlight}>
                          {farmerData.reputation.trustScore} điểm
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Account Info */}
                  <View style={styles.infoGroup}>
                    <Text style={styles.infoGroupTitle}>📅 Tài khoản</Text>
                    {farmerData.role && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Vai trò</Text>
                        <Text style={styles.infoValue}>
                          {farmerData.role === 'farmer' ? 'Nông dân' : farmerData.role}
                        </Text>
                      </View>
                    )}
                    {farmerData.createdAt && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Ngày tạo</Text>
                        <Text style={styles.infoValue}>
                          {formatDate(farmerData.createdAt)}
                        </Text>
                      </View>
                    )}
                    {farmerData.updatedAt && (
                      <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Cập nhật</Text>
                        <Text style={styles.infoValue}>
                          {formatDate(farmerData.updatedAt)}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Certifications */}
                  {farmerData.certifications && farmerData.certifications.length > 0 && (
                    <View style={styles.section}>
                      <View style={styles.sectionHeader}>
                        <Award size={18} color="#22C55E" />
                        <Text style={styles.sectionTitle}>
                          Chứng chỉ ({farmerData.certifications.length})
                        </Text>
                      </View>
                      {farmerData.certifications.map((cert: any) => (
                        <View key={cert.id} style={styles.certCard}>
                          {cert.certificateUrl && (
                            <Image
                              source={{ uri: cert.certificateUrl }}
                              style={styles.certImage}
                              resizeMode="cover"
                            />
                          )}
                          <View style={styles.certInfo}>
                            <View style={styles.certHeader}>
                              <Text style={styles.certName}>{cert.certificationName}</Text>
                              <View
                                style={[
                                  styles.certStatusBadge,
                                  cert.status === 1 ? styles.certApproved : styles.certPending,
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.certStatusText,
                                    cert.status === 1 ? styles.certApprovedText : styles.certPendingText,
                                  ]}
                                >
                                  {cert.status === 1 ? '✓ Đã xác nhận' : 'Chờ xác nhận'}
                                </Text>
                              </View>
                            </View>
                            
                            <View style={styles.certDetails}>
                              <View style={styles.certRow}>
                                <Text style={styles.certLabel}>Tổ chức cấp:</Text>
                                <Text style={styles.certValue}>{cert.issuingOrganization}</Text>
                              </View>
                              <View style={styles.certRow}>
                                <Text style={styles.certLabel}>Ngày cấp:</Text>
                                <Text style={styles.certValue}>{formatDate(cert.issueDate)}</Text>
                              </View>
                              <View style={styles.certRow}>
                                <Text style={styles.certLabel}>Ngày hết hạn:</Text>
                                <Text style={styles.certValue}>{formatDate(cert.expiryDate)}</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              {/* Farms Section */}
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  {/* <Leaf size={18} color="#22C55E" /> */}
                  {/* <Text style={styles.sectionTitle}>
                    Trang trại ({farms.length})
                  </Text> */}
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
                      {/* <View style={styles.statusRow}>
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
                      </View> */}
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 24,
    maxHeight: '95%',
    paddingTop: 12,
  },
  closeButton: {
    alignSelf: 'flex-end',
    paddingRight: 16,
    paddingTop: 8,
    paddingBottom: 8,
    zIndex: 10,
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
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
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 6,
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
    fontWeight: '700',
    color: '#1F2937',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    minWidth: 90,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    flex: 1,
  },
  infoValueHighlight: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F59E0B',
    flex: 1,
  },
  farmCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  farmImage: {
    width: '100%',
    height: 160,
    backgroundColor: '#F3F4F6',
  },
  farmInfo: {
    padding: 16,
  },
  farmName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
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
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#6B7280',
  },
  certCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  certImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F3F4F6',
  },
  certInfo: {
    padding: 16,
  },
  certHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 8,
  },
  certName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  certStatusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  certApproved: {
    backgroundColor: '#DCFCE7',
  },
  certPending: {
    backgroundColor: '#FEF3C7',
  },
  certStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  certApprovedText: {
    color: '#166534',
  },
  certPendingText: {
    color: '#92400E',
  },
  certDetails: {
    gap: 8,
  },
  certRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  certLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  certValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  farmerInfoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  farmerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
  },
  reputationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  reputationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  reputationContent: {
    flex: 1,
  },
  reputationLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  reputationValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F59E0B',
  },
  reputationSection: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  reputationItem: {
    flex: 1,
    backgroundColor: '#FFF7ED',
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  infoGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  infoGroupTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#F9FAFB',
  },
});
