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
import CreateBidModal from '../../../../../components/wholesaler/BidModalV2';
import BidListDisplay from '../../../../../components/wholesaler/BidListDisplay';
import { useAuctionContext } from '../../../../../hooks/useAuctionContext';
import { getBidsForAuction, BidResponse } from '../../../../../services/bidService';
import { sendLocalNotification } from '../../../../../services/notificationService';

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
  harvests?: Array<{
    id: string;
    harvestDate: string | null;
    startDate: string;
    totalQuantity: number;
    unit: string;
    note: string;
    salePrice: number;
    harvestGradeDetails: Array<{
      id: string;
      grade: string;
      quantity: number;
      unit: string;
    }>;
  }>;
}

export default function WholesalerAuctionDetailScreen() {
  const { auctionId } = useLocalSearchParams();
  const { setCurrentAuctionId } = useAuctionContext();
  const [auction, setAuction] = useState<Auction | null>(null);
  const [farms, setFarms] = useState<Map<string, Farm>>(new Map());
  const [crops, setCrops] = useState<Crop[]>([]);
  const [currentHarvests, setCurrentHarvests] = useState<{ [key: string]: CurrentHarvest }>({});
  const [loading, setLoading] = useState(true);
  const [showBidModal, setShowBidModal] = useState(false);
  const [bids, setBids] = useState<BidResponse[]>([]);
  const [loadingBids, setLoadingBids] = useState(false);
  const [selectedBidForEdit, setSelectedBidForEdit] = useState<BidResponse | undefined>(undefined);

  useEffect(() => {
    if (auctionId) {
      // Set current auction ID for global polling
      setCurrentAuctionId(auctionId as string);
      loadAuctionDetail();
    }

    // Cleanup: Reset auction ID when leaving
    return () => {
      setCurrentAuctionId(null);
    };
  }, [auctionId, setCurrentAuctionId]);

  const loadAuctionDetail = async () => {
    try {
      setLoading(true);
      
      // Get full auction detail including harvests
      const auctionDetailData = await getAuctionDetail(auctionId as string);
      console.log('Auction detail:', auctionDetailData);
      
      if (auctionDetailData) {
        setAuction(auctionDetailData);

        // Get farm and crop info from harvests
        const harvests = auctionDetailData.harvests || [];
        
        if (harvests.length > 0) {
          const farmsMap = new Map<string, Farm>();
          const cropsArray: Crop[] = [];

          // For each harvest, try to get farm and crop info
          for (const harvest of harvests) {
            try {
              // Try to get harvest details by ID which should have cropID
              const harvestDetail = await getHarvestById(harvest.id);
              console.log('Harvest detail:', harvestDetail);
              
              if (harvestDetail && harvestDetail.cropID) {
                // Get crop info
                try {
                  const cropData = await getCropById(harvestDetail.cropID);
                  if (cropData) {
                    cropsArray.push(cropData);
                    
                    // Get farm info from crop
                    if (cropData.farmID) {
                      try {
                        const farmData = await getFarmById(cropData.farmID);
                        if (farmData && 'data' in farmData && farmData.data) {
                          farmsMap.set(farmData.data.id, farmData.data);
                        }
                      } catch (error) {
                        console.log('Error getting farm:', error);
                      }
                    }
                  }
                } catch (error) {
                  console.log('Error getting crop:', error);
                }
              }
            } catch (error) {
              console.log('Error getting harvest detail:', error);
            }
          }

          if (cropsArray.length > 0) {
            setCrops(cropsArray);
          }
          if (farmsMap.size > 0) {
            setFarms(farmsMap);
          }
        }
      }
    } catch (error) {
      console.error('Error loading auction detail:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin đấu giá');
    } finally {
      setLoading(false);
    }

    // Fetch bids for this auction if loaded successfully
    if (auctionId) {
      await loadBids(auctionId as string);
    }
  };

  const loadBids = async (auctionSessionId: string) => {
    try {
      setLoadingBids(true);
      const bidsList = await getBidsForAuction(auctionSessionId);
      console.log('Fetched bids:', bidsList);
      setBids(bidsList);
    } catch (error) {
      console.error('Error loading bids:', error);
      // Silently fail - bids not loading shouldn't block UI
    } finally {
      setLoadingBids(false);
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
                {/* <DollarSign size={20} color="#059669" /> */}
                <Text style={styles.infoLabel}>Giá khởi điểm</Text>
                <Text style={styles.infoValue}>{formatCurrency(auction.startingPrice)}</Text>
              </View>

              {currentPrice > 0 && (
                <View style={styles.infoRow}>
                  {/* <DollarSign size={20} color="#DC2626" /> */}
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
                {/* <Clock size={20} color="#16A34A" /> */}
                <Text style={[styles.infoLabel, { color: '#16A34A', fontWeight: '600' }]}>Thời gian còn lại</Text>
                <Text style={[styles.infoValue, { color: '#16A34A' }]}>
                  {getTimeRemaining(auction.endDate)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                {/* <Calendar size={20} color="#16A34A" /> */}
                <Text style={[styles.infoLabel, { color: '#16A34A', fontWeight: '600' }]}>Kết thúc</Text>
                <Text style={styles.infoValue}>
                  {formatDate(auction.endDate)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                {/* <Calendar size={20} color="#16A34A" /> */}
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
                {/* <Package size={20} color="#16A34A" /> */}
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

        {/* Harvest Information */}
        {auction.harvests && auction.harvests.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thông tin vụ thu hoạch</Text>
            {auction.harvests.map((harvest, index) => (
              <View key={harvest.id} style={styles.harvestCard}>
                {/* <View style={styles.harvestHeader}>
                  <Text style={styles.harvestTitle}>Vụ {index + 1}</Text>
                </View> */}

                <View style={styles.currentHarvestDetails}>
                  {harvest.harvestDate ? (
                    <View style={styles.harvestDetailRow}>
                      {/* <Calendar size={16} color="#059669" /> */}
                      <Text style={styles.harvestDetailLabel}>Ngày thu hoạch:</Text>
                      <Text style={styles.harvestDetailValue}>
                        {formatDate(harvest.harvestDate)}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.harvestDetailRow}>
                      {/* <Calendar size={16} color="#F59E0B" /> */}
                      <Text style={styles.harvestDetailLabel}>Bắt đầu:</Text>
                      <Text style={styles.harvestDetailValue}>
                        {formatDate(harvest.startDate)}
                      </Text>
                    </View>
                  )}

                  <View style={styles.harvestDetailRow}>
                    {/* <Package size={16} color="#059669" /> */}
                    <Text style={styles.harvestDetailLabel}>Tổng số lượng:</Text>
                    <Text style={styles.harvestDetailValue}>
                      {harvest.totalQuantity} {harvest.unit}
                    </Text>
                  </View>

                  {harvest.salePrice > 0 && (
                    <View style={styles.harvestDetailRow}>
                      {/* <DollarSign size={16} color="#059669" /> */}
                      <Text style={styles.harvestDetailLabel}>Giá bán:</Text>
                      <Text style={styles.harvestDetailValue}>
                        {formatCurrency(harvest.salePrice)}
                      </Text>
                    </View>
                  )}

                  {harvest.note && harvest.note !== 'Không có' && (
                    <View style={styles.harvestDetailRow}>
                      <Text style={styles.harvestNote}>Ghi chú: {harvest.note}</Text>
                    </View>
                  )}
                </View>

                {/* Harvest Grade Details */}
                {harvest.harvestGradeDetails && harvest.harvestGradeDetails.length > 0 && (
                  <View style={styles.gradeDetailsSection}>
                    <Text style={styles.gradeDetailsSectionTitle}>
                      Chi tiết phân loại chất lượng:
                    </Text>
                    {harvest.harvestGradeDetails.map((gradeDetail) => {
                      const gradeMap: { [key: string]: { name: string; color: string } } = {
                        'Grade1': { name: 'Hàng Loại 1', color: '#10B981' },
                        'Grade2': { name: 'Hàng Loại 2', color: '#F59E0B' },
                        'Grade3': { name: 'Hàng Loại 3', color: '#EF4444' },
                      };
                      const gradeInfo = gradeMap[gradeDetail.grade] || { name: gradeDetail.grade, color: '#6B7280' };
                      
                      return (
                        <View key={gradeDetail.id} style={styles.gradeDetailRow}>
                          <View style={styles.gradeDetailContent}>
                            <Text style={[styles.gradeName, { color: gradeInfo.color }]}>
                              {gradeInfo.name}
                            </Text>
                            <Text style={styles.gradeQuantity}>
                              {gradeDetail.quantity} {gradeDetail.unit || 'kg'}
                            </Text>
                          </View>
                          <View style={styles.gradeBadge}>
                            <View style={[styles.gradeIndicator, { backgroundColor: gradeInfo.color }]} />
                          </View>
                        </View>
                      );
                    })}

                    {/* Total calculation */}
                    <View style={styles.gradeTotalRow}>
                      <Text style={styles.gradeTotalLabel}>Tổng cộng:</Text>
                      <Text style={styles.gradeTotalValue}>
                        {harvest.harvestGradeDetails.reduce((sum, grade) => sum + grade.quantity, 0)} kg
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Crop Information */}
        {crops.length > 0 && crops.map((crop, cropIndex) => {
          const farm = crop.farmID ? farms.get(crop.farmID) : null;
          const currentHarvest = currentHarvests[crop.id];
          
          return (
            <View key={crop.id} style={styles.section}>
              {/* <Text style={styles.sectionTitle}>Chi tiết vườn</Text> */}

              {/* Farm Information */}
              {farm && (
                <>
                  <Text style={styles.subsectionTitle}>Thông tin Nông trại</Text>
                  <View style={styles.farmCard}>
                    <View style={styles.farmHeader}>
                      <View style={styles.farmIcon}>
                        <MapPin size={20} color="#22C55E" />
                      </View>
                      <View style={styles.farmInfo}>
                        <Text style={styles.farmTitle}>{farm.name}</Text>
                        <Text style={styles.farmSubtitle}>Mã vườn: {farm.id.substring(0, 8)}...</Text>
                      </View>
                    </View>
                  </View>
                </>
              )}

              {/* Crop Details */}
              <View style={styles.miniDivider} />
              <Text style={styles.subsectionTitle}>Thông tin vườn trồng</Text>
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
                <>
                  <Text style={styles.subsectionTitle}>Vụ thu hoạch hiện tại</Text>
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
                          {/* <DollarSign size={16} color="#059669" /> */}
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
                </>
              )}
            </View>
          );
        })}

        {/* Bid List Display */}
        <BidListDisplay
          bids={bids}
          loading={loadingBids}
          minBidIncrement={auction?.minBidIncrement || 0}
          onEditBid={(bid) => {
            setSelectedBidForEdit(bid);
            setShowBidModal(true);
          }}
        />

        {/* Bidding Button - Only show if no bids yet */}
        {bids.length === 0 && (
          <TouchableOpacity 
            style={[
              styles.bidButton,
              (!auction || auction.status !== '3') && styles.bidButtonDisabled
            ]}
            onPress={() => {
              console.log('Bid button pressed, current auction status:', auction?.status);
              setSelectedBidForEdit(undefined);
              setShowBidModal(true);
            }}
            disabled={!auction}
          >
            <Text style={styles.bidButtonText}>Tham gia đấu giá</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Create Bid Modal */}
      {auction && (
        <CreateBidModal
          visible={showBidModal}
          onClose={() => {
            console.log('Closing bid modal');
            setShowBidModal(false);
            setSelectedBidForEdit(undefined);
          }}
          onBidCreated={() => {
            // Reload bids after creating/updating
            if (auctionId) {
              loadBids(auctionId as string);
              
              // Send notification to trigger home screen refresh
              sendLocalNotification({
                title: 'Cập nhật bid mới',
                body: 'Đang làm mới dữ liệu đấu giá...',
                type: 'auction_log',
                auctionId: auctionId as string,
                data: {
                  action: 'refresh_bids',
                },
              });
            }
          }}
          currentPrice={auction.currentPrice || auction.startingPrice}
          minBidIncrement={auction.minBidIncrement}
          auctionSessionId={auction.id}
          sessionCode={auction.sessionCode}
          existingBid={selectedBidForEdit}
        />
      )}
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
    marginTop: 4,
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
    marginBottom: 12,
  },
  harvestHeader: {
    marginBottom: 12,
  },
  harvestTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16A34A',
  },
  currentHarvestDetails: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
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
    backgroundColor: '#F3F4F6',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#16A34A',
  },
  bidButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  bidButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
});
