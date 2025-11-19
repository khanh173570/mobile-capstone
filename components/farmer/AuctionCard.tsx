import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FarmerAuction, getAuctionStatusInfo } from '../../services/auctionService';
import { 
  Calendar, 
  DollarSign, 
  Clock,
  Package,
  User,
  ArrowRight,
  CheckCircle
} from 'lucide-react-native';

// Icon wrapper component that renders icons safely
const IconText = ({ icon: Icon, size = 16, color = '#059669' }: any) => {
  return (
    <View pointerEvents="none">
      <Icon size={size} color={color} />
    </View>
  );
};

interface AuctionCardProps {
  auction: FarmerAuction;
  onPress?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

export default function AuctionCard({ auction, onPress, isFirst, isLast }: AuctionCardProps) {
  const statusInfo = getAuctionStatusInfo(auction.status);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' VND';
  };

  // Logic để xác định màu ngày
  const getDateColor = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= -2) return '#DC2626'; // Đỏ (< -2 ngày)
    if (diffDays === -1) return '#F59E0B'; // Vàng (-1 ngày)
    return '#059669'; // Xanh (> today)
  };

  const isExpired = new Date(auction.endDate) < new Date();
  const isActive = auction.status === 'OnGoing';

  return (
    <TouchableOpacity 
      style={[
        styles.card,
        isFirst && styles.cardFirst,
        isLast && styles.cardLast
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.auctionInfo}>
          <Text style={styles.sessionCode}>{auction.sessionCode}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>
              ✓ {statusInfo.name}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardContent}>
        {/* Price Information */}
        <View style={styles.priceSection}>
          <View style={styles.priceRow}>
            <IconText icon={DollarSign} size={16} color="#059669" />
            <Text style={styles.priceLabel}>Giá khởi điểm:</Text>
            <Text style={styles.startingPrice}>{formatPrice(auction.startingPrice)}</Text>
          </View>
      {typeof auction.currentPrice === "number" && (
  <View style={styles.priceRow}>
    <IconText icon={DollarSign} size={16} color="#059669" />
    <Text style={styles.priceLabel}>Giá hiện tại:</Text>
    <Text style={styles.currentPrice}>{formatPrice(auction.currentPrice)}</Text>
  </View>
)}


{auction.enableBuyNow && typeof auction.buyNowPrice === "number" && (
  <View style={styles.priceRow}>
    <IconText icon={DollarSign} size={16} color="#059669" />
    <Text style={styles.priceLabel}>Mua ngay:</Text>
    <Text style={styles.buyNowPrice}>{formatPrice(auction.buyNowPrice)}</Text>
  </View>
)}

        </View>

        {/* Time Information */}
        <View style={styles.timeSection}>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>📅 Bắt đầu:</Text>
            <Text style={[styles.timeText, { color: getDateColor(auction.publishDate) }]}>
              {formatDate(auction.publishDate)}
            </Text>
          </View>
          
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>⏰ Kết thúc:</Text>
            <Text style={[styles.timeText, { color: getDateColor(auction.endDate) }]}>
              {formatDate(auction.endDate)}
            </Text>
          </View>

          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>📅 Thu hoạch dự kiến:</Text>
            <Text style={[styles.timeText, { color: getDateColor(auction.expectedHarvestDate) }]}>
              {formatDate(auction.expectedHarvestDate)}
            </Text>
          </View>
        </View>

        {/* Quantity Information */}
        <View style={styles.quantitySection}>
          <View style={styles.quantityRow}>
            <Text style={styles.quantityLabel}>📦 Số lượng dự kiến:</Text>
            <Text style={styles.quantityText}>
              {auction.expectedTotalQuantity > 0 
                ? `${auction.expectedTotalQuantity} kg` 
                : 'Chưa xác định'}
            </Text>
          </View>
        </View>

        {/* Note */}
        {auction.note && (
          <View style={styles.noteSection}>
            <Text style={styles.noteLabel}>Ghi chú:</Text>
            <Text style={styles.noteText}>{auction.note}</Text>
          </View>
        )}

        {/* Bid increment */}
        <View style={styles.bidSection}>
          <Text style={styles.bidLabel}>
            Bước giá tối thiểu: {formatPrice(auction.minBidIncrement)}
          </Text>
        </View>

        {/* Winner information */}
        {auction.winnerId && (
          <View style={styles.winnerSection}>
            <Text style={styles.winnerText}>🏆 Có người thắng đấu giá</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 4,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardFirst: {
    marginTop: 20,
  },
  cardLast: {
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  auctionInfo: {
    flex: 1,
  },
  sessionCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    gap: 16,
  },
  priceSection: {
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  startingPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#059669',
  },
  currentPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
  },
  buyNowPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563EB',
  },
  timeSection: {
    gap: 8,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  timeText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  expiredText: {
    color: '#DC2626',
  },
  quantitySection: {
    gap: 8,
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  quantityText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  noteSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  noteLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  noteText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  bidSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  bidLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  winnerSection: {
    backgroundColor: '#D1FAE5',
    borderRadius: 8,
    padding: 12,
  },
  winnerText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '600',
  },
});