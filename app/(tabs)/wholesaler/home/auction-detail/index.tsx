import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Package, 
  Clock,
  MapPin,
  Leaf,
} from 'lucide-react-native';
import { 
  getAuctionStatusInfo,
  getAuctionSessionHarvests,
  getCurrentHarvest,
  CurrentHarvest,
  getAuctionsByStatus,
  getAuctionDetail
} from '../../../../../services/auctionService';
import { getCropById, Crop, getCropsByFarmId } from '../../../../../services/cropService';
import { getFarmById, Farm } from '../../../../../services/farmService';
import { getHarvestById } from '../../../../../services/harvestService';

interface Auction {
  id: string;
  publishDate: string;
  endDate: string;
  farmerId: string;
  sessionCode: string;
  startingPrice: number;
  currentPrice: number | null;
  minBidIncrement: number;
  status: string;
  expectedHarvestDate: string;
  expectedTotalQuantity: number;
  createdAt: string;
  updatedAt: string;
}

export default function WholesalerAuctionDetailScreen() {
  const { auctionId } = useLocalSearchParams();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [farms, setFarms] = useState<Map<string, Farm>>(new Map());
  const [crops, setCrops] = useState<Crop[]>([]);
  const [currentHarvests, setCurrentHarvests] = useState<{ [key: string]: CurrentHarvest }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auctionId) {
      loadAuctionDetail();
    }
  }, [auctionId]);

  const loadAuctionDetail = async () => {
    try {
      setLoading(true);
      
      // Get auction details
      const auctionData = await getAuctionsByStatus('OnGoing', 1, 50);
      const foundAuction = auctionData.data?.items?.find((a: Auction) => a.id === auctionId);
      
      if (foundAuction) {
        setAuction(foundAuction);
        console.log('Found auction:', foundAuction.id);

        // Get auction detail with harvests
        try {
          const auctionDetailData = await getAuctionDetail(auctionId as string);
          console.log('Auction detail:', auctionDetailData);
          const harvestDetails = auctionDetailData.harvestDetails || [];
          
          if (!harvestDetails || harvestDetails.length === 0) {
            console.warn('No harvest details found for auction:', auctionId);
            setLoading(false);
            return;
          }

          // Extract unique crop IDs - handle both cropId and cropID
          const cropIds = [...new Set(
            harvestDetails
              .filter((h: any) => h !== null)
              .map((h: any) => h.cropID || (h as any).cropId)
              .filter((id: any) => id !== undefined)
          )] as string[];

          console.log('Unique crop IDs:', cropIds);

          if (cropIds.length === 0) {
            console.warn('No crop IDs found in harvests');
            setLoading(false);
            return;
          }

          // Fetch crop details, farms, and current harvests
          const farmsMap = new Map<string, Farm>();
          const harvestsMap: { [key: string]: CurrentHarvest } = {};
          
          const cropPromises = cropIds.map(async (cropId: string) => {
            const crop = await getCropById(cropId);
            if (crop) {
              // Get farm for this crop
              if (crop.farmID) {
                const farmDataResponse = await getFarmById(crop.farmID);
                if (farmDataResponse && 'data' in farmDataResponse) {
                  farmsMap.set(crop.farmID, farmDataResponse.data);
                }
              }

              // Get current harvest for this crop
              try {
                const currentHarvest = await getCurrentHarvest(cropId);
                harvestsMap[cropId] = currentHarvest;
                console.log(`Current harvest for crop ${cropId}:`, currentHarvest);
              } catch (error) {
                console.log(`No current harvest for crop ${cropId}:`, error);
              }
            }
            return crop;
          });

          const cropDetails = await Promise.all(cropPromises);
          const validCrops = cropDetails.filter(c => c !== null) as Crop[];
          
          console.log('Loaded crops:', validCrops.length);
          console.log('Loaded farms:', farmsMap.size);
          console.log('Loaded harvests:', Object.keys(harvestsMap).length);
          
          setCrops(validCrops);
          setFarms(farmsMap);
          setCurrentHarvests(harvestsMap);
        } catch (error) {
          console.error('Error getting auction detail:', error);
          // Even if we can't get harvests, show auction info
        }
      }
    } catch (error) {
      console.error('Error loading auction detail:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin đấu giá');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getTimeRemaining = (endDate: string) => {
    const now = new Date();
    const end = new Date(endDate);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
      return 'Đã kết thúc';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} ngày ${hours} giờ`;
    } else if (hours > 0) {
      return `${hours} giờ ${minutes} phút`;
    } else {
      return `${minutes} phút`;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết đấu giá</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      </View>
    );
  }

  if (!auction) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết đấu giá</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không tìm thấy đấu giá</Text>
        </View>
      </View>
    );
  }

  const statusInfo = getAuctionStatusInfo(auction.status);
  const currentPrice = auction.currentPrice || auction.startingPrice;

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đấu giá</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Status Section */}
        <View style={styles.section}>
          <View style={styles.auctionHeader}>
            <Text style={styles.sessionCode}>{auction.sessionCode}</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusInfo.backgroundColor }
              ]}
            >
              <Text style={[styles.statusText, { color: statusInfo.color }]}>
                {statusInfo.name}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Price Information */}
          <View style={styles.subsectionContainer}>
            <Text style={styles.subsectionTitle}>Thông tin giá</Text>
            <View style={styles.subsectionContent}>
              <View style={styles.infoRow}>
                <DollarSign size={20} color="#059669" />
                <Text style={styles.infoLabel}>Giá khởi điểm</Text>
                <Text style={styles.infoValue}>{formatCurrency(auction.startingPrice)}</Text>
              </View>

              {currentPrice > 0 && (
                <View style={styles.infoRow}>
                  <DollarSign size={20} color="#DC2626" />
                  <Text style={styles.infoLabel}>Giá hiện tại</Text>
                  <Text style={[styles.infoValue, { color: '#DC2626', fontWeight: 'bold' }]}>
                    {formatCurrency(currentPrice)}
                  </Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <Text style={styles.bidIncrementText}>
                  Bước giá tối thiểu: {formatCurrency(auction.minBidIncrement)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.miniDivider} />

          {/* Time Information */}
          <View style={styles.subsectionContainer}>
            <Text style={styles.subsectionTitle}>Thời gian</Text>
            <View style={styles.subsectionContent}>
              <View style={styles.infoRow}>
                <Clock size={20} color="#16A34A" />
                <Text style={[styles.infoLabel, { color: '#16A34A', fontWeight: '600' }]}>Thời gian còn lại</Text>
                <Text style={[styles.infoValue, { color: '#16A34A' }]}>
                  {getTimeRemaining(auction.endDate)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Calendar size={20} color="#16A34A" />
                <Text style={[styles.infoLabel, { color: '#16A34A', fontWeight: '600' }]}>Kết thúc</Text>
                <Text style={styles.infoValue}>
                  {formatDate(auction.endDate)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Calendar size={20} color="#16A34A" />
                <Text style={[styles.infoLabel, { color: '#16A34A', fontWeight: '600' }]}>Thu hoạch dự kiến</Text>
                <Text style={styles.infoValue}>
                  {formatDate(auction.expectedHarvestDate)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.miniDivider} />

          {/* Quantity Information */}
          <View style={styles.subsectionContainer}>
            <Text style={styles.subsectionTitle}>Thông tin sản phẩm</Text>
            <View style={styles.subsectionContent}>
              <View style={styles.infoRow}>
                <Package size={20} color="#16A34A" />
                <Text style={[styles.infoLabel, { color: '#16A34A', fontWeight: '600' }]}>Số lượng dự kiến</Text>
                <Text style={styles.infoValue}>
                  {auction.expectedTotalQuantity > 0 
                    ? `${auction.expectedTotalQuantity} kg` 
                    : 'Chưa xác định'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Farm Information */}
        {farms.size > 0 && Array.from(farms.values()).map((farm) => (
          <View key={farm.id} style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin trang trại</Text>
            <View style={styles.farmCard}>
              <View style={styles.farmHeader}>
                <View style={styles.farmIcon}>
                  <MapPin size={20} color="#22C55E" />
                </View>
                <View style={styles.farmInfo}>
                  <Text style={styles.farmTitle}>{farm.name}</Text>
                  <Text style={styles.farmSubtitle}>ID: {farm.id.substring(0, 8)}...</Text>
                </View>
              </View>
            </View>
          </View>
        ))}

        {/* Crop Information */}
        {crops.length > 0 && crops.map((crop) => {
          const farm = crop.farmID ? farms.get(crop.farmID) : null;
          const currentHarvest = currentHarvests[crop.id];
          
          return (
            <View key={crop.id} style={styles.section}>
              {farm && (
                <>
                  <Text style={styles.sectionTitle}>Thông tin trang trại</Text>
                  <View style={styles.farmCard}>
                    <View style={styles.farmHeader}>
                      <View style={styles.farmIcon}>
                        <MapPin size={20} color="#22C55E" />
                      </View>
                      <View style={styles.farmInfo}>
                        <Text style={styles.farmTitle}>{farm.name}</Text>
                        <Text style={styles.farmSubtitle}>ID: {farm.id.substring(0, 8)}...</Text>
                      </View>
                    </View>
                  </View>
                </>
              )}

              <Text style={styles.sectionTitle}>Chi tiết vườn</Text>
              <View style={styles.cropCard}>
                <View style={styles.cropHeader}>
                  <View style={styles.cropIcon}>
                    <Leaf size={20} color="#22C55E" />
                  </View>
                  <View style={styles.cropInfo}>
                    <Text style={styles.cropTitle}>{crop.name}</Text>
                    <Text style={styles.cropSubtitle}>
                      {crop.custardAppleType} • {crop.area} m²
                    </Text>
                  </View>
                </View>

                <View style={styles.cropDetails}>
                  <View style={styles.cropDetailRow}>
                    <Text style={styles.cropDetailLabel}>Số cây:</Text>
                    <Text style={styles.cropDetailValue}>{crop.treeCount} cây</Text>
                  </View>
                  <View style={styles.cropDetailRow}>
                    <Text style={styles.cropDetailLabel}>Thời gian canh tác:</Text>
                    <Text style={styles.cropDetailValue}>{crop.farmingDuration} năm</Text>
                  </View>
                  {crop.nearestHarvestDate && (
                    <View style={styles.cropDetailRow}>
                      <Text style={styles.cropDetailLabel}>Thu hoạch gần nhất:</Text>
                      <Text style={styles.cropDetailValue}>{formatDate(crop.nearestHarvestDate)}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Current Harvest Section */}
              {currentHarvest && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Vụ thu hoạch hiện tại</Text>
                  <View style={styles.harvestCard}>
                    <View style={styles.currentHarvestDetails}>
                      {currentHarvest.harvestDate ? (
                        <View style={styles.harvestDetailRow}>
                          <Calendar size={16} color="#059669" />
                          <Text style={styles.harvestDetailLabel}>Ngày thu hoạch:</Text>
                          <Text style={styles.harvestDetailValue}>
                            {formatDate(currentHarvest.harvestDate)}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.harvestDetailRow}>
                          <Calendar size={16} color="#F59E0B" />
                          <Text style={styles.harvestDetailLabel}>Bắt đầu:</Text>
                          <Text style={styles.harvestDetailValue}>
                            {formatDate(currentHarvest.startDate)}
                          </Text>
                        </View>
                      )}

                      <View style={styles.harvestDetailRow}>
                        <Package size={16} color="#059669" />
                        <Text style={styles.harvestDetailLabel}>Tổng số lượng:</Text>
                        <Text style={styles.harvestDetailValue}>
                          {currentHarvest.totalQuantity} {currentHarvest.unit}
                        </Text>
                      </View>

                      {currentHarvest.salePrice > 0 && (
                        <View style={styles.harvestDetailRow}>
                          <DollarSign size={16} color="#059669" />
                          <Text style={styles.harvestDetailLabel}>Giá bán:</Text>
                          <Text style={styles.harvestDetailValue}>
                            {formatCurrency(currentHarvest.salePrice)}
                          </Text>
                        </View>
                      )}

                      {currentHarvest.note && currentHarvest.note !== 'không có' && (
                        <View style={styles.harvestDetailRow}>
                          <Text style={styles.harvestNote}>Ghi chú: {currentHarvest.note}</Text>
                        </View>
                      )}
                    </View>

                    {/* Harvest Grade Details */}
                    {currentHarvest.harvestGradeDetailDTOs && currentHarvest.harvestGradeDetailDTOs.length > 0 && (
                      <View style={styles.gradeDetailsSection}>
                        <Text style={styles.gradeDetailsSectionTitle}>
                          Chi tiết phân loại chất lượng:
                        </Text>
                        {currentHarvest.harvestGradeDetailDTOs.map((gradeDetail) => {
                          const gradeNames: { [key: number]: string } = {
                            1: 'Hàng Loại 1',
                            2: 'Hàng Loại 2',
                            3: 'Hàng Loại 3',
                          };
                          const gradeColors: { [key: number]: string } = {
                            1: '#10B981', // Green
                            2: '#F59E0B', // Yellow
                            3: '#EF4444', // Red
                          };
                          return (
                            <View key={gradeDetail.id} style={styles.gradeDetailRow}>
                              <View style={styles.gradeDetailContent}>
                                <Text style={[styles.gradeName, { color: gradeColors[gradeDetail.grade] }]}>
                                  {gradeNames[gradeDetail.grade] || `Hạng ${gradeDetail.grade}`}
                                </Text>
                                <Text style={styles.gradeQuantity}>
                                  {gradeDetail.quantity} {gradeDetail.unit || 'kg'}
                                </Text>
                              </View>
                              <View style={styles.gradeBadge}>
                                <View style={[styles.gradeIndicator, { backgroundColor: gradeColors[gradeDetail.grade] }]} />
                              </View>
                            </View>
                          );
                        })}

                        {/* Total calculation */}
                        <View style={styles.gradeTotalRow}>
                          <Text style={styles.gradeTotalLabel}>Tổng cộng:</Text>
                          <Text style={styles.gradeTotalValue}>
                            {currentHarvest.harvestGradeDetailDTOs.reduce((sum, grade) => sum + grade.quantity, 0)} kg
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* Bidding Button */}
        <TouchableOpacity style={styles.bidButton}>
          <Text style={styles.bidButtonText}>Đặt giá</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginLeft: 12,
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  section: {
    marginTop: 24,
    marginHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  subsectionContainer: {
    marginBottom: 16,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  subsectionContent: {
    paddingLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 12,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  bidIncrementText: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginLeft: 32,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  miniDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginVertical: 12,
  },
  auctionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sessionCode: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Farm Card Styles
  farmCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  farmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  farmIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  farmInfo: {
    marginLeft: 12,
    flex: 1,
  },
  farmTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  farmSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },

  // Crop Card Styles
  cropCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  cropHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cropIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropInfo: {
    marginLeft: 12,
    flex: 1,
  },
  cropTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  cropSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 2,
  },
  cropDetails: {
    paddingLeft: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  cropDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cropDetailLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  cropDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },

  // Harvest Card Styles
  harvestCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  currentHarvestDetails: {
    marginBottom: 12,
  },
  harvestDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  harvestDetailLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 10,
    flex: 1,
  },
  harvestDetailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  harvestNote: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
    marginLeft: 24,
  },

  // Grade Details Section
  gradeDetailsSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
    marginTop: 8,
  },
  gradeDetailsSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  gradeDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 6,
  },
  gradeDetailContent: {
    flex: 1,
  },
  gradeName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  gradeQuantity: {
    fontSize: 12,
    color: '#6B7280',
  },
  gradeBadge: {
    marginLeft: 12,
  },
  gradeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  gradeTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 8,
  },
  gradeTotalLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },
  gradeTotalValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#16A34A',
  },

  // Bidding Button
  bidButton: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#16A34A',
    borderRadius: 12,
    alignItems: 'center',
  },
  bidButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
