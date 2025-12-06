import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { WholesalerAuction, getAuctionStatusInfo, formatPrice } from '../../services/wholesalerAuctionService';
import { 
  Calendar, 
  TrendingUp, 
  Award,
  Package,
  Clock,
  DollarSign,
} from 'lucide-react-native';
import EscrowPaymentButton from './EscrowPaymentButton';

interface WholesalerAuctionCardProps {
  auction: WholesalerAuction;
  onPress?: () => void;
  isWinner?: boolean;
  showPaymentButton?: boolean;
}

export default function WholesalerAuctionCard({ 
  auction, 
  onPress, 
  isWinner = false,
  showPaymentButton = false 
}: WholesalerAuctionCardProps) {
  const statusInfo = getAuctionStatusInfo(auction.status);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <TouchableOpacity 
      style={[styles.card, isWinner && styles.winnerCard]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.sessionCode}>{auction.sessionCode}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
          </View>
        </View>
        {isWinner && (
          <View style={styles.winnerBadge}>
            <Award size={16} color="#F59E0B" />
            <Text style={styles.winnerText}>Thắng</Text>
          </View>
        )}
      </View>

      {/* Dates */}
      <View style={styles.dateSection}>
        <View style={styles.dateRow}>
          <Calendar size={14} color="#6B7280" />
          <Text style={styles.dateLabel}>Công bố:</Text>
          <Text style={styles.dateValue}>{formatDate(auction.publishDate)}</Text>
        </View>
        <View style={styles.dateRow}>
          <Clock size={14} color="#6B7280" />
          <Text style={styles.dateLabel}>Kết thúc:</Text>
          <Text style={styles.dateValue}>{formatDate(auction.endDate)}</Text>
        </View>
      </View>

      {/* Price Info */}
      <View style={styles.priceSection}>
        <View style={styles.priceRow}>
          <DollarSign size={16} color="#22C55E" />
          <View style={styles.priceInfo}>
            <Text style={styles.priceLabel}>Giá khởi điểm</Text>
            <Text style={styles.priceValue}>{formatPrice(auction.startingPrice)}</Text>
          </View>
        </View>
        <View style={styles.priceRow}>
          <TrendingUp size={16} color="#3B82F6" />
          <View style={styles.priceInfo}>
            <Text style={styles.priceLabel}>Giá hiện tại</Text>
            <Text style={[styles.priceValue, styles.currentPrice]}>{formatPrice(auction.currentPrice)}</Text>
          </View>
        </View>
      </View>

      {/* Winning Price */}
      {auction.winningPrice && (
        <View style={styles.winningSection}>
          <Award size={16} color="#F59E0B" />
          <Text style={styles.winningLabel}>Giá thắng:</Text>
          <Text style={styles.winningPrice}>{formatPrice(auction.winningPrice)}</Text>
        </View>
      )}

      {/* Additional Info */}
      <View style={styles.infoSection}>
        <View style={styles.infoItem}>
          <Package size={14} color="#6B7280" />
          <Text style={styles.infoText}>{auction.expectedTotalQuantity} kg</Text>
        </View>
        {auction.enableBuyNow && auction.buyNowPrice && (
          <View style={styles.buyNowBadge}>
            <Text style={styles.buyNowText}>Mua ngay: {formatPrice(auction.buyNowPrice)}</Text>
          </View>
        )}
      </View>

      {/* Note */}
      {auction.note && auction.note !== 'không có' && (
        <View style={styles.noteSection}>
          <Text style={styles.noteLabel}>Ghi chú:</Text>
          <Text style={styles.noteText} numberOfLines={2}>{auction.note}</Text>
        </View>
      )}

      {/* Escrow Payment Button - Only show for completed auctions where user is winner */}
      {showPaymentButton && isWinner && auction.status === 'Completed' && (
        <EscrowPaymentButton
          auctionId={auction.id}
          isWinner={isWinner}
          currentPrice={auction.currentPrice}
        />
      )}
    </TouchableOpacity>
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
  winnerCard: {
    borderWidth: 2,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionCode: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  winnerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  winnerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  dateSection: {
    gap: 6,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  dateValue: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '500',
  },
  priceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 12,
  },
  priceRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F9FAFB',
    padding: 10,
    borderRadius: 8,
  },
  priceInfo: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  currentPrice: {
    color: '#3B82F6',
  },
  winningSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  winningLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#92400E',
  },
  winningPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F59E0B',
    flex: 1,
    textAlign: 'right',
  },
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  buyNowBadge: {
    backgroundColor: '#DBEAFE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  buyNowText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E40AF',
  },
  noteSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
  },
});
