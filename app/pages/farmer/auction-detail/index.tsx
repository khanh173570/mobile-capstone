import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Package, 
  Clock,
  Leaf,
  Eye,
  History
} from 'lucide-react-native';
import Header from '../../../../components/shared/Header';
import AuctionLogModal from '../../../../components/farmer/AuctionLogModal';
import { 
  FarmerAuction, 
  getAuctionSessionHarvests, 
  getHarvestById, 
  HarvestDetail,
  getAuctionStatusInfo,
  getCurrentHarvest,
  CurrentHarvest
} from '../../../../services/auctionService';
import { getCropById, Crop } from '../../../../services/cropService';
import { getAuctionLogs, AuctionLog } from '../../../../services/auctionLogService';
import { useAuctionContext } from '../../../../hooks/useAuctionContext';

interface AuctionDetailScreenProps {
  auction: FarmerAuction;
}

export default function AuctionDetailScreen() {
  const { auctionData } = useLocalSearchParams();
  const { setCurrentAuctionId } = useAuctionContext();
  const [auction, setAuction] = useState<FarmerAuction | null>(null);
  const [harvests, setHarvests] = useState<HarvestDetail[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [currentHarvests, setCurrentHarvests] = useState<{ [cropId: string]: CurrentHarvest }>({});
  const [loading, setLoading] = useState(true);
  const [harvestsLoading, setHarvestsLoading] = useState(false);
  const [cropsLoading, setCropsLoading] = useState(false);
  const [logs, setLogs] = useState<AuctionLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);

  useEffect(() => {
    if (auctionData) {
      try {
        const parsedAuction = JSON.parse(auctionData as string);
        setAuction(parsedAuction);
        // Set current auction ID for global polling
        setCurrentAuctionId(parsedAuction.id);
        loadAuctionHarvests(parsedAuction.id);
        loadAuctionCrops(parsedAuction.id);
      } catch (error) {
        console.error('Error parsing auction data:', error);
        Alert.alert('Lỗi', 'Không thể tải thông tin đấu giá');
        router.back();
      }
    }
    setLoading(false);

    // Cleanup: Reset auction ID when leaving detail page
    return () => {
      setCurrentAuctionId(null);
    };
  }, [auctionData, setCurrentAuctionId]);

  const loadAuctionLogs = async () => {
    if (!auction?.id) return;
    setLogsLoading(true);
    try {
      const logsData = await getAuctionLogs(auction.id);
      setLogs(logsData);
      setShowLogsModal(true);
    } catch (error) {
      console.error('Error loading auction logs:', error);
      Alert.alert('Lỗi', 'Không thể tải lịch sử thay đổi');
    } finally {
      setLogsLoading(false);
    }
  };

  const loadAuctionHarvests = async (auctionId: string) => {
    setHarvestsLoading(true);
    try {
      const sessionHarvests = await getAuctionSessionHarvests(auctionId);
      console.log('Session harvests:', sessionHarvests);
      
      const harvestDetails = await Promise.all(
        sessionHarvests.map(async (sh) => {
          console.log('Fetching harvest ID:', sh.harvestId);
          const harvest = await getHarvestById(sh.harvestId);
          console.log('Harvest detail received:', harvest ? 
            { id: harvest.id, cropId: harvest.cropId, hasGradeDetails: !!harvest.harvestGradeDetailDTOs } : 
            'null'
          );
          if (harvest?.harvestGradeDetailDTOs) {
            console.log('Harvest grade details count:', harvest.harvestGradeDetailDTOs.length);
          }
          return harvest;
        })
      );

      const validHarvests = harvestDetails.filter(h => h !== null) as HarvestDetail[];
      console.log('Valid harvests count:', validHarvests.length);
      setHarvests(validHarvests);
    } catch (error) {
      console.error('Error loading auction harvests:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin vụ thu hoạch');
    } finally {
      setHarvestsLoading(false);
    }
  };

  const loadAuctionCrops = async (auctionId: string) => {
    setCropsLoading(true);
    try {
      // First get session harvests to find crop IDs
      const sessionHarvests = await getAuctionSessionHarvests(auctionId);
      console.log('Session harvests for crops:', sessionHarvests);
      
      // Get harvest details to extract crop IDs
      const harvestDetails = await Promise.all(
        sessionHarvests.map(async (sh) => {
          const harvest = await getHarvestById(sh.harvestId);
          return harvest;
        })
      );

      // Extract unique crop IDs
      console.log('Harvest details received:', harvestDetails.map(h => h ? { 
        id: h.id, 
        cropId: h.cropId, 
        cropID: h.cropID,
        actualCropId: h.cropId || h.cropID 
      } : 'null'));
      
      const cropIds = [...new Set(
        harvestDetails
          .filter(h => h !== null)
          .map(h => h!.cropId || h!.cropID)
          .filter(id => id !== undefined)
      )];

      console.log('Unique crop IDs:', cropIds);

      // Fetch crop details and current harvests
      const cropPromises = cropIds.map(async (cropId) => {
        const crop = await getCropById(cropId);
        if (crop) {
          // Also get current harvest for each crop
          try {
            const currentHarvest = await getCurrentHarvest(cropId);
            setCurrentHarvests(prev => ({
              ...prev,
              [cropId]: currentHarvest
            }));
          } catch (error) {
            console.log(`No current harvest for crop ${cropId}:`, error);
          }
        }
        return crop;
      });

      const cropDetails = await Promise.all(cropPromises);
      const validCrops = cropDetails.filter(c => c !== null) as Crop[];
      
      console.log('Loaded crops:', validCrops.length);
      setCrops(validCrops);

    } catch (error) {
      console.error('Error loading auction crops:', error);
      Alert.alert('Lỗi', 'Không thể tải thông tin cây trồng');
    } finally {
      setCropsLoading(false);
    }
  };

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

  const getDateStatusColor = (dateString: string) => {
    const targetDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays < -1) {
      // Quá hạn (trên 1 ngày trước) - Đen
      return '#1F2937';
    } else if (diffDays >= -1 && diffDays < 0) {
      // Hôm nay hoặc quá hạn dưới 1 ngày - Xanh (đang thực hiện)
      return '#059669';
    } else if (diffDays === 0) {
      // Hôm nay - Xanh (đang thực hiện)
      return '#059669';
    } else if (diffDays > 0 && diffDays <= 3) {
      // Sắp đến (trong 3 ngày tới) - Vàng
      return '#F59E0B';
    } else {
      // Còn xa - Xanh lá
      return '#16A34A';
    }
  };

  const handleHarvestPress = (harvest: HarvestDetail) => {
    // For now, show alert until proper navigation is set up  
    Alert.alert(
      'Chi tiết vụ thu hoạch',
      `ID: ${harvest.id}\nSố lượng: ${harvest.quantity || 0} kg\nGhi chú: ${harvest.note || 'Không có'}`,
      [{ text: 'OK' }]
    );
  };

  const renderHarvestItem = ({ item }: { item: HarvestDetail }) => (
    <TouchableOpacity 
      style={styles.harvestCard}
      onPress={() => handleHarvestPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.harvestHeader}>
        <View style={styles.harvestIcon}>
          <Leaf size={20} color="#22C55E" />
        </View>
        <View style={styles.harvestInfo}>
          <Text style={styles.harvestTitle}>Vụ thu hoạch #{item.id.slice(-8)}</Text>
          <Text style={styles.harvestDate}>
            {item.harvestDate ? formatDate(item.harvestDate) : 'Chưa thu hoạch'}
          </Text>
        </View>
        <View style={styles.harvestActions}>
          <Eye size={20} color="#6B7280" />
        </View>
      </View>
      
      <View style={styles.harvestDetails}>
        <View style={styles.harvestDetailRow}>
          <Package size={16} color="#059669" />
          <Text style={styles.harvestDetailLabel}>Số lượng:</Text>
          <Text style={styles.harvestDetailValue}>{item.quantity || item.totalQuantity || 0} kg</Text>
        </View>

        {item.salePrice && item.salePrice > 0 && (
          <View style={styles.harvestDetailRow}>
            <DollarSign size={16} color="#059669" />
            <Text style={styles.harvestDetailLabel}>Giá bán:</Text>
            <Text style={styles.harvestDetailValue}>
              {new Intl.NumberFormat('vi-VN').format(item.salePrice)} VND
            </Text>
          </View>
        )}
        
        {item.note && item.note !== 'Không có' && (
          <View style={styles.harvestDetailRow}>
            <Text style={styles.harvestNote}>{item.note}</Text>
          </View>
        )}

        {/* Debug info */}
        <View style={styles.harvestDetailRow}>
          <Text style={styles.harvestNote}>
            Debug: CropID: {item.cropId || item.cropID || 'N/A'} | 
            Grade Details: {item.harvestGradeDetailDTOs ? 
              `${item.harvestGradeDetailDTOs.length} items` : 
              'null/undefined'} | StartDate: {item.startDate || 'N/A'}
          </Text>
        </View>

        {/* Harvest Grade Details */}
        {item.harvestGradeDetailDTOs && item.harvestGradeDetailDTOs.length > 0 ? (
          <View style={styles.gradeDetailsSection}>
            <Text style={styles.gradeDetailsSectionTitle}>Chi tiết phân loại:</Text>
            {item.harvestGradeDetailDTOs.map((gradeDetail) => {
              const gradeNames: { [key: number]: string } = {
                1: 'Hàng Loại 1',
                2: 'Hàng Loại 2',
                3: 'Hàng Loại 3',
              };
              return (
                <View key={gradeDetail.id} style={styles.gradeDetailRow}>
                  <Text style={styles.gradeName}>{gradeNames[gradeDetail.grade] || `Hạng ${gradeDetail.grade}`}</Text>
                  <Text style={styles.gradeQuantity}>{gradeDetail.quantity} {gradeDetail.unit || 'kg'}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.gradeDetailsSection}>
            <Text style={styles.gradeDetailsSectionTitle}>Chưa có phân loại chi tiết</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#22C55E" />
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!auction) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy thông tin đấu giá</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Quay lại</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const statusInfo = getAuctionStatusInfo(auction.status);
  const isExpired = new Date(auction.endDate) < new Date();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết đấu giá</Text>
        <TouchableOpacity 
          style={styles.historyButton}
          onPress={loadAuctionLogs}
          disabled={logsLoading}
        >
          {logsLoading ? (
            <ActivityIndicator size="small" color="#6B7280" />
          ) : (
            <History size={24} color="#6B7280" />
          )}
        </TouchableOpacity>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* General Information Section */}
        <View style={styles.section}>
          <View style={styles.auctionHeader}>
            <Text style={styles.sessionCode}>{auction.sessionCode}</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.backgroundColor }]}>
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
                <Text style={styles.infoValue}>{formatPrice(auction.startingPrice)}</Text>
              </View>
              
              {auction.currentPrice && (
                <View style={styles.infoRow}>
                  <DollarSign size={20} color="#DC2626" />
                  <Text style={styles.infoLabel}>Giá hiện tại</Text>
                  <Text style={[styles.infoValue, { color: '#DC2626', fontWeight: 'bold' }]}>
                    {formatPrice(auction.currentPrice)}
                  </Text>
                </View>
              )}

              {auction.enableBuyNow && auction.buyNowPrice && (
                <View style={styles.infoRow}>
                  <DollarSign size={20} color="#2563EB" />
                  <Text style={styles.infoLabel}>Giá mua ngay</Text>
                  <Text style={[styles.infoValue, { color: '#2563EB' }]}>
                    {formatPrice(auction.buyNowPrice)}
                  </Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <Text style={styles.bidIncrementText}>
                  Bước giá tối thiểu: {formatPrice(auction.minBidIncrement)}
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
                <Calendar size={20} color="#16A34A" />
                <Text style={[styles.infoLabel, { color: '#16A34A', fontWeight: '600' }]}>Bắt đầu</Text>
                <Text style={[styles.infoValue, { color: getDateStatusColor(auction.publishDate) }]}>
                  {formatDate(auction.publishDate)}
                </Text>
              </View>
              
              <View style={styles.infoRow}>
                <Clock size={20} color="#16A34A" />
                <Text style={[styles.infoLabel, { color: '#16A34A', fontWeight: '600' }]}>Kết thúc</Text>
                <Text style={[styles.infoValue, { color: getDateStatusColor(auction.endDate) }]}>
                  {formatDate(auction.endDate)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Calendar size={20} color="#16A34A" />
                <Text style={[styles.infoLabel, { color: '#16A34A', fontWeight: '600' }]}>Thu hoạch dự kiến</Text>
                <Text style={[styles.infoValue, { color: getDateStatusColor(auction.expectedHarvestDate) }]}>
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

          {/* Anti-sniping and Note */}
          {(auction.enableAntiSniping || auction.note) && (
            <>
              <View style={styles.miniDivider} />
              <View style={styles.subsectionContainer}>
                {auction.enableAntiSniping && (
                  <View style={{marginBottom: 8}}>
                    <Text style={styles.bidIncrementText}>
                      Thời gian gia hạn chống sniping: {auction.antiSnipingExtensionSeconds} giây
                    </Text>
                  </View>
                )}
                {auction.note && (
                  <View>
                    <Text style={styles.noteLabel}>Ghi chú:</Text>
                    <Text style={styles.noteText}>{auction.note}</Text>
                  </View>
                )}
              </View>
            </>
          )}
        </View>

        {/* Crops Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chi tiết đấu giá</Text>
          {cropsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#22C55E" />
              <Text style={styles.loadingText}>Đang tải thông tin cây trồng...</Text>
            </View>
          ) : (
            <View style={styles.cropsContainer}>
              {crops.length > 0 ? (
                crops.map((crop) => {
                  const currentHarvest = currentHarvests[crop.id];
                  return (
                    <View key={crop.id} style={styles.cropCard}>
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
                          <Text style={styles.cropDetailValue}>{crop.farmingDuration} ngày</Text>
                        </View>
                        {crop.nearestHarvestDate && (
                          <View style={styles.cropDetailRow}>
                            <Text style={styles.cropDetailLabel}>Thu hoạch gần nhất:</Text>
                            <Text style={styles.cropDetailValue}>{formatDate(crop.nearestHarvestDate)}</Text>
                          </View>
                        )}
                        {crop.note && (
                          <View style={styles.cropDetailRow}>
                            <Text style={styles.cropNote}>Ghi chú: </Text>
                            <Text style={styles.cropDetailValue}>{crop.note}</Text>
                          </View>
                        )}
                      </View>

                      {/* Current Harvest Section */}
                      {currentHarvest ? (
                        <View style={styles.currentHarvestSection}>
                          <Text style={styles.currentHarvestTitle}>
                            Vụ thu hoạch hiện tại
                          </Text>
                          
                          <View style={styles.currentHarvestDetails}>
                            <View style={styles.harvestDetailRow}>
                              {/* <Package size={16} color="#059669" /> */}
                              {/* <Text style={styles.harvestDetailLabel}>Tổng số lượng::</Text>
                              <Text style={styles.harvestDetailValue}>
                                {currentHarvest.totalQuantity} {currentHarvest.unit}
                              </Text> */}
                            </View>
                            
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

                            {currentHarvest.salePrice > 0 && (
                              <View style={styles.harvestDetailRow}>
                                <DollarSign size={16} color="#059669" />
                                <Text style={styles.harvestDetailLabel}>Giá bán:</Text>
                                <Text style={styles.harvestDetailValue}>
                                  {formatPrice(currentHarvest.salePrice)}
                                </Text>
                              </View>
                            )}

                            {currentHarvest.note && (
                              <View style={styles.harvestDetailRow}>
                                <Text style={styles.harvestNote}>Ghi chú:</Text>
                             <Text style={styles.harvestDetailValue}>
                                  {currentHarvest.note}
                                </Text>
                              </View>
                            )}
                          </View>

                          {/* Harvest Grade Details */}
                          {currentHarvest.harvestGradeDetailDTOs && currentHarvest.harvestGradeDetailDTOs.length > 0 && (
                            <View style={styles.gradeDetailsSection}>
                              <Text style={styles.gradeDetailsSectionTitle}>
                                Dự đoán phân loại đánh giá:
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
                      ) : (
                        <View style={styles.noCurrentHarvestSection}>
                          <Text style={styles.noCurrentHarvestText}>
                            Chưa có vụ thu hoạch hiện tại
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>Chưa có thông tin cây trồng</Text>
              )}
            </View>
          )}
        </View>

        {/* Harvests Section */}
        {/* <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vụ thu hoạch trong đấu giá</Text>
          {harvestsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#22C55E" />
              <Text style={styles.loadingText}>Đang tải vụ thu hoạch...</Text>
            </View>
          ) : (
            <View style={styles.harvestsContainer}>
              <Text style={styles.debugText}>
                Debug - Harvests Count: {harvests.length}
              </Text>
              {harvests.length > 0 ? (
                <FlatList
                  data={harvests}
                  renderItem={renderHarvestItem}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <Text style={styles.emptyText}>Chưa có vụ thu hoạch nào</Text>
              )}
            </View>
          )}
        </View> */}

        <View style={{ height: 20 }} />
      </ScrollView>

      <AuctionLogModal
        visible={showLogsModal}
        logs={logs}
        loading={logsLoading}
        onClose={() => setShowLogsModal(false)}
      />
    </View>
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
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
  },
  historyButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    marginBottom: 20,
    textAlign: 'center',
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  auctionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionCode: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 16,
  },
  sectionContent: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: '#6B7280',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  bidIncrementText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 8,
  },
  antiSnipingText: {
    fontSize: 16,
    color: '#1F2937',
  },
  harvestsContainer: {
    marginTop: 8,
  },
  harvestCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  harvestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  harvestIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#D1FAE5',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  harvestInfo: {
    flex: 1,
  },
  harvestTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  harvestDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  harvestActions: {
    padding: 4,
  },
  harvestDetails: {
    gap: 8,
  },
  harvestDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  harvestDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  harvestDetailValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  harvestNote: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
    marginLeft: 24,
  },
  gradeDetailsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 8,
  },
  gradeDetailsSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B45309',
    marginBottom: 8,
  },
  gradeDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#FED7AA',
  },
  gradeName: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '500',
  },
  gradeQuantity: {
    fontSize: 13,
    color: '#B45309',
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#6B7280',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  // Crops styles
  cropsContainer: {
    marginTop: 8,
  },
  cropCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cropInfo: {
    flex: 1,
  },
  cropTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  cropSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  cropDetails: {
    marginBottom: 16,
  },
  cropDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  cropDetailLabel: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
  },
  cropDetailValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  cropNote: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  // Current harvest styles
  currentHarvestSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    marginTop: 8,
  },
  currentHarvestTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#059669',
    marginBottom: 12,
  },
  currentHarvestDetails: {
    marginBottom: 16,
  },
  noCurrentHarvestSection: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  noCurrentHarvestText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  // Enhanced grade details styles
  gradeDetailContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeBadge: {
    marginLeft: 8,
  },
  gradeIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  gradeTotalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 8,
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gradeTotalLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  gradeTotalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  debugText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  miniDivider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  subsectionContainer: {
    marginBottom: 8,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  subsectionContent: {
    gap: 12,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  noteText: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
});