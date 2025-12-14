import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { Award, Plus, X, Calendar, Building2, FileCheck, ZoomIn, ChevronLeft } from 'lucide-react-native';
import {
  getMyCertifications,
  getCertificationTypeName,
  getCertificationStatusInfo,
  type Certification,
} from '../../services/certificationService';

interface CertificationListModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateNew: () => void;
}

export default function CertificationListModal({
  visible,
  onClose,
  onCreateNew,
}: CertificationListModalProps) {
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCert, setSelectedCert] = useState<Certification | null>(null);
  const [showImageZoom, setShowImageZoom] = useState(false);

  const loadCertifications = async () => {
    try {
      setLoading(true);
      const data = await getMyCertifications();
      setCertifications(data);
    } catch (error) {
      console.error('Error loading certifications:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách chứng chỉ');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadCertifications();
    setRefreshing(false);
  };

  useEffect(() => {
    if (visible) {
      loadCertifications();
    }
  }, [visible]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const renderCertificationCard = (cert: Certification) => {
    const statusInfo = getCertificationStatusInfo(cert.status);
    
    return (
      <TouchableOpacity
        key={cert.id}
        style={styles.certCard}
        onPress={() => setSelectedCert(cert)}
      >
        <View style={styles.certHeader}>
          <View style={styles.certTitleRow}>
            <Award size={20} color="#22C55E" />
            <Text style={styles.certName}>{cert.certificationName}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.icon} {statusInfo.name}
            </Text>
          </View>
        </View>

        <View style={styles.certInfo}>
          <View style={styles.certInfoRow}>
            <Building2 size={16} color="#6B7280" />
            <Text style={styles.certInfoText}>{cert.issuingOrganization}</Text>
          </View>
          <View style={styles.certInfoRow}>
            <Calendar size={16} color="#6B7280" />
            <Text style={styles.certInfoText}>
              {formatDate(cert.issueDate)} - {formatDate(cert.expiryDate)}
            </Text>
          </View>
        </View>

        {cert.rejectionReason && (
          <View style={styles.rejectionBox}>
            <Text style={styles.rejectionLabel}>Lý do từ chối:</Text>
            <Text style={styles.rejectionText}>{cert.rejectionReason}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <FileCheck size={24} color="#22C55E" />
            <Text style={styles.headerTitle}>Chứng chỉ của tôi</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading && certifications.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={styles.loadingText}>Đang tải...</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.content}
            contentContainerStyle={styles.contentContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            {certifications.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Award size={48} color="#D1D5DB" />
                <Text style={styles.emptyText}>Chưa có chứng chỉ nào</Text>
                <Text style={styles.emptySubText}>
                  Nhấn nút bên dưới để tạo chứng chỉ mới
                </Text>
              </View>
            ) : (
              certifications.map(renderCertificationCard)
            )}
          </ScrollView>
        )}

        {/* Create Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.createButton}
            onPress={onCreateNew}
          >
            <Plus size={20} color="#FFFFFF" />
            <Text style={styles.createButtonText}>Tạo chứng chỉ mới</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Detail Modal - Full Screen */}
      {selectedCert && (
        <Modal
          visible={!!selectedCert}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setSelectedCert(null)}
        >
          <View style={styles.detailPage}>
            {/* Header */}
            <View style={styles.detailPageHeader}>
              <TouchableOpacity
                onPress={() => setSelectedCert(null)}
                style={styles.backButton}
              >
                <ChevronLeft size={24} color="#111827" />
              </TouchableOpacity>
              <Text style={styles.detailPageTitle}>Chi tiết chứng chỉ</Text>
              <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.detailPageContent}>
              {/* Status Badge */}
              <View style={styles.detailStatusSection}>
                <View
                  style={[
                    styles.detailStatusBadge,
                    { backgroundColor: getCertificationStatusInfo(selectedCert.status).color },
                  ]}
                >
                  <Text style={styles.detailStatusText}>
                    {getCertificationStatusInfo(selectedCert.status).icon}{' '}
                    {getCertificationStatusInfo(selectedCert.status).name}
                  </Text>
                </View>
              </View>

              {/* Certificate Image */}
              {selectedCert.certificateUrl && (
                <TouchableOpacity
                  style={styles.imageContainer}
                  onPress={() => setShowImageZoom(true)}
                >
                  <Image
                    source={{ uri: selectedCert.certificateUrl }}
                    style={styles.certDetailImage}
                    resizeMode="contain"
                  />
                  <View style={styles.zoomHint}>
                    <ZoomIn size={20} color="#FFFFFF" />
                    <Text style={styles.zoomHintText}>Nhấn để phóng to</Text>
                  </View>
                </TouchableOpacity>
              )}

              {/* Information Card */}
              <View style={styles.infoCard}>
                <Text style={styles.infoCardTitle}>Thông tin chứng chỉ</Text>

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Award size={20} color="#8B5CF6" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoRowLabel}>Tên chứng chỉ</Text>
                    <Text style={styles.infoRowValue}>{selectedCert.certificationName}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <FileCheck size={20} color="#3B82F6" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoRowLabel}>Loại chứng chỉ</Text>
                    <Text style={styles.infoRowValue}>
                      {getCertificationTypeName(selectedCert.type)}
                    </Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Building2 size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoRowLabel}>Tổ chức cấp</Text>
                    <Text style={styles.infoRowValue}>{selectedCert.issuingOrganization}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Calendar size={20} color="#22C55E" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoRowLabel}>Ngày cấp</Text>
                    <Text style={styles.infoRowValue}>{formatDate(selectedCert.issueDate)}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={styles.infoRow}>
                  <View style={styles.infoIconContainer}>
                    <Calendar size={20} color="#EF4444" />
                  </View>
                  <View style={styles.infoTextContainer}>
                    <Text style={styles.infoRowLabel}>Ngày hết hạn</Text>
                    <Text style={styles.infoRowValue}>{formatDate(selectedCert.expiryDate)}</Text>
                  </View>
                </View>

                {selectedCert.rejectionReason && (
                  <>
                    <View style={styles.divider} />
                    <View style={styles.rejectionSection}>
                      <Text style={styles.rejectionSectionLabel}>Lý do từ chối</Text>
                      <Text style={styles.rejectionSectionText}>
                        {selectedCert.rejectionReason}
                      </Text>
                    </View>
                  </>
                )}
              </View>

              {/* Metadata */}
              <View style={styles.metadataCard}>
                <Text style={styles.metadataLabel}>Ngày tạo</Text>
                <Text style={styles.metadataValue}>
                  {new Date(selectedCert.createdAt).toLocaleString('vi-VN')}
                </Text>
                {selectedCert.reviewedAt && (
                  <>
                    <Text style={[styles.metadataLabel, { marginTop: 12 }]}>Ngày duyệt</Text>
                    <Text style={styles.metadataValue}>
                      {new Date(selectedCert.reviewedAt).toLocaleString('vi-VN')}
                    </Text>
                  </>
                )}
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}

      {/* Image Zoom Modal */}
      {selectedCert && (
        <Modal
          visible={showImageZoom}
          animationType="fade"
          transparent
          onRequestClose={() => setShowImageZoom(false)}
        >
          <View style={styles.zoomOverlay}>
            <TouchableOpacity
              style={styles.zoomCloseButton}
              onPress={() => setShowImageZoom(false)}
            >
              <X size={32} color="#FFFFFF" />
            </TouchableOpacity>
            <Image
              source={{ uri: selectedCert.certificateUrl }}
              style={styles.zoomImage}
              resizeMode="contain"
            />
          </View>
        </Modal>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  certCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  certHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  certTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  certName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  certInfo: {
    gap: 8,
  },
  certInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  certInfoText: {
    fontSize: 14,
    color: '#6B7280',
  },
  rejectionBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  rejectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 4,
  },
  rejectionText: {
    fontSize: 13,
    color: '#DC2626',
  },
  footer: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22C55E',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  detailContainer: {
    width: '100%',
    maxHeight: '80%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  detailContent: {
    padding: 16,
  },
  certImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
  },
  detailSection: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    color: '#111827',
  },
  // Detail Page Styles
  detailPage: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  detailPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailPageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  detailPageContent: {
    flex: 1,
  },
  detailStatusSection: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  detailStatusBadge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  detailStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  imageContainer: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  certDetailImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#F3F4F6',
  },
  zoomHint: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  zoomHintText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoRowLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoRowValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 4,
  },
  rejectionSection: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  rejectionSectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#991B1B',
    marginBottom: 4,
  },
  rejectionSectionText: {
    fontSize: 14,
    color: '#DC2626',
    lineHeight: 20,
  },
  metadataCard: {
    backgroundColor: '#FFFFFF',
    marginTop: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metadataLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  metadataValue: {
    fontSize: 14,
    color: '#6B7280',
  },
  // Image Zoom Modal
  zoomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomCloseButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  zoomImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
});
