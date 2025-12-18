import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { AlertCircle, FileText, Image as ImageIcon } from 'lucide-react-native';
import {
  Dispute,
  getDisputeStatusLabel,
  getDisputeStatusColor,
} from '../../services/disputeService';

interface DisputeInfoCardProps {
  dispute: Dispute;
  onReview?: () => void;
  showReviewButton?: boolean;
}

export const DisputeInfoCard: React.FC<DisputeInfoCardProps> = ({
  dispute,
  onReview,
  showReviewButton = false,
}) => {
  const statusLabel = getDisputeStatusLabel(dispute.disputeStatus);
  const statusColor = getDisputeStatusColor(dispute.disputeStatus);

  // Debug attachments
  console.log('DisputeInfoCard - Attachments:', dispute.attachments);
  console.log('DisputeInfoCard - Attachments length:', dispute.attachments?.length);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <AlertCircle size={20} color="#EF4444" />
          <Text style={styles.title}>Tranh chấp</Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: `${statusColor}20` },
          ]}
        >
          <Text style={[styles.statusText, { color: statusColor }]}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Message */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <FileText size={16} color="#6B7280" />
          <Text style={styles.sectionTitle}>Lý do tranh chấp</Text>
        </View>
        <Text style={styles.message}>{dispute.disputeMessage}</Text>
      </View>

      {/* Actual Amounts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Số lượng thực tế</Text>
        <View style={styles.amountGrid}>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Tổng</Text>
            <Text style={styles.amountValue}>
              {dispute.actualAmount.toLocaleString('vi-VN')} kg
            </Text>
          </View>

          {dispute.actualGrade1Amount > 0 && (
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Loại 1</Text>
              <Text style={styles.amountValue}>
                {dispute.actualGrade1Amount.toLocaleString('vi-VN')} kg
              </Text>
            </View>
          )}

          {dispute.actualGrade2Amount > 0 && (
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Loại 2</Text>
              <Text style={styles.amountValue}>
                {dispute.actualGrade2Amount.toLocaleString('vi-VN')} kg
              </Text>
            </View>
          )}

          {dispute.actualGrade3Amount > 0 && (
            <View style={styles.amountItem}>
              <Text style={styles.amountLabel}>Loại 3</Text>
              <Text style={styles.amountValue}>
                {dispute.actualGrade3Amount.toLocaleString('vi-VN')} kg
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Attachments */}
      {dispute.attachments && dispute.attachments.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ImageIcon size={16} color="#6B7280" />
            <Text style={styles.sectionTitle}>
              Hình ảnh đính kèm ({dispute.attachments.length})
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.imageScroll}
          >
            {dispute.attachments.map((attachment, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image
                  source={{ uri: attachment.url }}
                  style={styles.attachmentImage}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Review Note (if approved, rejected, or resolved) */}
      {dispute.reviewNote && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phản hồi từ nông dân</Text>
          <View
            style={[
              styles.reviewNote,
              {
                backgroundColor:
                  dispute.disputeStatus === 1
                    ? '#ECFDF5' // Approved - Green
                    : dispute.disputeStatus === 2
                    ? '#FEF2F2' // Rejected - Red
                    : dispute.disputeStatus === 3
                    ? '#EFF6FF' // InAdminReview - Blue
                    : dispute.disputeStatus === 4
                    ? '#ECFDF5' // Resolved - Green
                    : '#F3F4F6', // Pending - Gray
              },
            ]}
          >
            <Text style={styles.reviewNoteText}>{dispute.reviewNote}</Text>
          </View>
        </View>
      )}

      {/* Dates */}
      <View style={styles.footer}>
        <Text style={styles.dateText}>
          Tạo: {new Date(dispute.createdAt).toLocaleDateString('vi-VN')}
        </Text>
        {dispute.resolvedAt && (
          <Text style={styles.dateText}>
            Xét duyệt: {new Date(dispute.resolvedAt).toLocaleDateString('vi-VN')}
          </Text>
        )}
      </View>

      {/* Review Button (for farmer) */}
      {showReviewButton && dispute.disputeStatus === 0 && onReview && (
        <TouchableOpacity style={styles.reviewButton} onPress={onReview}>
          <Text style={styles.reviewButtonText}>Xét duyệt</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  message: {
    fontSize: 15,
    color: '#1F2937',
    lineHeight: 22,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#374151',
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  amountItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    minWidth: 110,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  amountLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  imageScroll: {
    flexDirection: 'row',
  },
  imageWrapper: {
    marginRight: 12,
  },
  attachmentImage: {
    width: 120,
    height: 120,
    borderRadius: 10,
  },
  reviewNote: {
    padding: 12,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  reviewNoteText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  reviewButton: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  reviewButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
});
