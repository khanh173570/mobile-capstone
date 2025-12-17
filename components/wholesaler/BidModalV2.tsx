import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import { X, Check, AlertCircle } from 'lucide-react-native';
import {
  CreateBidRequest,
  validateAutoBidLimit,
  validateBidAmount,
  calculateMinAutoBidLimit,
  calculateMinBidAmount,
  getBidSuggestions,
  createBid,
  updateBid,
  BidResponse,
  UpdateBidRequest,
} from '../../services/bidService';
import { sendLocalNotification } from '../../services/notificationService';
import { signalRService } from '../../services/signalRService';

interface CreateBidModalProps {
  visible: boolean;
  onClose: () => void;
  onBidCreated?: () => void;
  currentPrice: number;
  minBidIncrement: number;
  auctionSessionId: string;
  sessionCode: string;
  existingBid?: BidResponse;
  auctionStatus?: string;
  userProfile?: { userId: string; fullName: string } | null;
  startingPrice?: number;
  buyNowPrice?: number;
}

export default function CreateBidModal({
  visible,
  onClose,
  onBidCreated,
  currentPrice,
  minBidIncrement,
  auctionSessionId,
  sessionCode,
  existingBid,
  auctionStatus,
  userProfile,
  startingPrice = 0,
  buyNowPrice,
}: CreateBidModalProps) {
  const [isAutoBid, setIsAutoBid] = useState(false); // Default to manual bid (safer)
  const [autoBidMaxLimit, setAutoBidMaxLimit] = useState<string>('');
  const [manualBidAmount, setManualBidAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);

  // Log visibility changes
  React.useEffect(() => {
    console.log('CreateBidModal visible changed:', visible, 'existingBid:', existingBid);
    if (visible && existingBid) {
      // Update mode: set manual bid amount from existing bid
      setManualBidAmount(existingBid.bidAmount.toString());
      setIsAutoBid(false); // Force to manual mode in update
      setAutoBidMaxLimit('');
      setSelectedSuggestion(null);
    } else if (visible && !existingBid) {
      // Create mode: reset based on auto/manual selection
      // Auto mode: clear manual bid, keep auto bid limit input
      // Manual mode: clear auto bid, keep manual bid input
      if (isAutoBid) {
        setManualBidAmount('');
        // Keep autoBidMaxLimit for user to input
      } else {
        setAutoBidMaxLimit('');
        // Keep manualBidAmount for user to input
      }
      setSelectedSuggestion(null);
    }
  }, [visible, existingBid]);

  const minAutoBidLimit = useMemo(
    () => calculateMinAutoBidLimit(currentPrice, minBidIncrement),
    [currentPrice, minBidIncrement]
  );

  const minManualBidAmount = useMemo(
    () => calculateMinBidAmount(currentPrice, minBidIncrement),
    [currentPrice, minBidIncrement]
  );

  const suggestions = useMemo(
    () => getBidSuggestions(currentPrice, minBidIncrement, 5),
    [currentPrice, minBidIncrement]
  );

  const autoBidValidation = useMemo(() => {
    if (!autoBidMaxLimit) {
      return { isValid: false, message: '' };
    }
    const limitValue = parseFloat(autoBidMaxLimit);
    if (isNaN(limitValue)) {
      return { isValid: false, message: 'Vui lòng nhập số hợp lệ' };
    }
    return validateAutoBidLimit(limitValue, currentPrice, minBidIncrement);
  }, [autoBidMaxLimit, currentPrice, minBidIncrement]);

  const manualBidValidation = useMemo(() => {
    if (!manualBidAmount) {
      return { isValid: false, message: '' };
    }
    const amountValue = parseFloat(manualBidAmount);
    if (isNaN(amountValue)) {
      return { isValid: false, message: 'Vui lòng nhập số hợp lệ' };
    }
    const result = validateBidAmount(amountValue, currentPrice, minBidIncrement);
    console.log('manualBidValidation:', {
      manualBidAmount,
      amountValue,
      currentPrice,
      minBidIncrement,
      result,
    });
    return result;
  }, [manualBidAmount, currentPrice, minBidIncrement]);

  // In update mode, always use manual bid validation
  // In create mode: auto mode needs autoBidMaxLimit, manual mode is always valid (no input needed)
  const isValid = existingBid 
    ? manualBidValidation.isValid 
    : (isAutoBid ? autoBidValidation.isValid : true); // Manual mode is always valid

  const handleSelectSuggestion = (value: number) => {
    console.log('Selected suggestion:', value);
    setManualBidAmount(value.toString());
    setSelectedSuggestion(value);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const handleConfirmBid = () => {
    // Prevent double submission
    if (loading) {
      console.log('⚠️ Already processing, ignoring duplicate click');
      return;
    }
    
    // If updating existing bid, skip fee notification
    if (existingBid) {
      handleCreateOrUpdateBid();
      return;
    }

    // Calculate 10% fee
    const feeAmount = startingPrice * 0.1;
    const feeText = formatCurrency(feeAmount);

    Alert.alert(
      'Xác nhận tham gia đấu giá',
      `Khi bạn tham gia đấu giá, bạn phải đóng 1 khoản phí bằng 10% giá khởi điểm của phiên đấu giá này.\n\nPhí tham gia: ${feeText}`,
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đồng ý',
          onPress: () => {
            console.log('✅ User confirmed fee, proceeding to create bid');
            handleCreateOrUpdateBid();
          },
        },
      ]
    );
  };

  const handleCreateOrUpdateBid = async () => {
    console.log('=== BidModal: handleCreateOrUpdateBid ===');
    console.log('existingBid:', existingBid);
    console.log('isAutoBid:', isAutoBid);
    console.log('manualBidAmount:', manualBidAmount);
    console.log('autoBidMaxLimit:', autoBidMaxLimit);
    console.log('isValid:', isValid);
    console.log('autoBidValidation:', autoBidValidation);
    console.log('manualBidValidation:', manualBidValidation);
    
    // Check if auction is still ongoing
    if (auctionStatus !== 'OnGoing') {
      Alert.alert(
        'Không thể đặt giá',
        'Phiên đấu giá này không còn hoạt động.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (!isValid) {
      const errorMessage = existingBid
        ? (manualBidValidation.message || 'Vui lòng kiểm tra giá đặt')
        : (isAutoBid 
            ? (autoBidValidation.message || 'Vui lòng nhập giá tối đa')
            : 'Lỗi không xác định'); // Manual should always be valid
      Alert.alert('Lỗi', errorMessage);
      return;
    }

    setLoading(true);
    try {
      if (existingBid) {
        const amountValue = parseFloat(manualBidAmount);
        
        // Check if bid amount actually changed
        if (amountValue === existingBid.bidAmount) {
          console.log('⚠️ Bid amount unchanged:', amountValue, '=', existingBid.bidAmount);
          Alert.alert('Thông báo', 'Giá đặt không thay đổi. Vui lòng nhập giá khác.');
          setLoading(false);
          return;
        }
        
        console.log('✏️ Updating bid from', existingBid.bidAmount, 'to', amountValue);
        const response = await updateBid({
          auctionSessionId,
          bidAmount: amountValue,
        });

        console.log('🔵 UpdateBid Response:', {
          isSuccess: response.isSuccess,
          statusCode: response.statusCode,
          message: response.message,
          data: response.data,
          errors: response.errors,
        });

        if (response.isSuccess) {
          console.log('✅ Bid updated successfully! New value:', amountValue);
          
          // DEBUG: Auto-trigger BidPlaced event for updated bid
          setTimeout(() => {
            console.log('🧪 DEBUG: Auto-triggering BidPlaced event for updated bid');
            signalRService.debugTriggerBidPlaced({
              auctionId: auctionSessionId,
              bidId: 'updated-' + Date.now(),
              userId: userProfile?.userId || 'unknown',
              userName: userProfile?.fullName || 'Thương Lái',
              bidAmount: amountValue,
              previousPrice: existingBid.bidAmount,
              newPrice: amountValue,
              placedAt: new Date().toISOString(),
            });
          }, 500);

          // Wait a bit for backend to process
          await new Promise(resolve => setTimeout(resolve, 500));

          // Show success alert with details
          Alert.alert(
            'Cập nhật thành công!',
            `Bạn đã thay đổi giá thành công!\n\nPhiên đấu giá: ${sessionCode}\nGiá cũ: ${existingBid.bidAmount.toLocaleString('vi-VN')} ₫\nGiá mới: ${amountValue.toLocaleString('vi-VN')} ₫`,
            [
              {
                text: 'OK',
                onPress: () => {
                  onBidCreated?.();
                  onClose();
                  setManualBidAmount('');
                  setAutoBidMaxLimit('');
                  setSelectedSuggestion(null);
                }
              }
            ]
          );
        } else {
          Alert.alert('Lỗi', response.message || 'Không thể cập nhật giá');
        }
      } else {
        // Create new bid
        console.log('🔍 Debug Before CreateBid:', {
          isAutoBid,
          manualBidAmount,
          autoBidMaxLimit,
          currentPrice,
          minBidIncrement,
          auctionSessionId,
        });
        
        // Validate inputs
        if (isAutoBid) {
          if (!autoBidMaxLimit || autoBidMaxLimit.trim() === '') {
            Alert.alert('Lỗi', 'Vui lòng nhập giá tối đa cho đấu giá tự động');
            setLoading(false);
            return;
          }
          
          // Parse and validate the number
          const maxLimitValue = parseFloat(autoBidMaxLimit.replace(/,/g, ''));
          if (isNaN(maxLimitValue) || maxLimitValue <= 0) {
            Alert.alert('Lỗi', 'Giá tối đa phải là số hợp lệ và lớn hơn 0');
            setLoading(false);
            return;
          }
          
          // Check if exceeds buy now price
          if (buyNowPrice && maxLimitValue > buyNowPrice) {
            Alert.alert(
              'Giá tối đa vượt quá giá mua ngay',
              `Giá tối đa không được vượt quá giá mua ngay: ${buyNowPrice.toLocaleString('vi-VN')} ₫\n\nNếu bạn muốn mua ngay với giá này, vui lòng sử dụng chức năng "Mua ngay".`
            );
            setLoading(false);
            return;
          }
          
          // Validate against current price and increment
          const validation = validateAutoBidLimit(maxLimitValue, currentPrice, minBidIncrement);
          if (!validation.isValid) {
            Alert.alert('Lỗi', validation.message || 'Giá tối đa không hợp lệ');
            setLoading(false);
            return;
          }
        }
        
        // Create bid - only 3 fields:
        // Manual: { isAutoBid: false, auctionSessionId }
        // Auto: { isAutoBid: true, autoBidMaxLimit, auctionSessionId }
        
        const request: CreateBidRequest = {
          isAutoBid,
          auctionSessionId,
        };
        
        // Only add autoBidMaxLimit if auto bid
        if (isAutoBid && autoBidMaxLimit) {
          const maxLimitValue = parseFloat(autoBidMaxLimit.replace(/,/g, '').replace(/\./g, ''));
          console.log('🔍 Parsing autoBidMaxLimit:', {
            original: autoBidMaxLimit,
            afterReplace: autoBidMaxLimit.replace(/,/g, '').replace(/\./g, ''),
            parsed: maxLimitValue,
            isNaN: isNaN(maxLimitValue),
            type: typeof maxLimitValue,
          });
          
          if (isNaN(maxLimitValue) || maxLimitValue <= 0) {
            Alert.alert('Lỗi', 'Giá tối đa không hợp lệ. Vui lòng kiểm tra lại số nhập vào.');
            setLoading(false);
            return;
          }
          
          request.autoBidMaxLimit = maxLimitValue;
        }
        
        console.log('🔍 CreateBid Request:', {
          isAutoBid,
          auctionSessionId,
          autoBidMaxLimit: request.autoBidMaxLimit,
          autoBidMaxLimitType: typeof request.autoBidMaxLimit,
          note: isAutoBid ? 'Auto bid with max limit' : 'Manual bid - join only',
        });
        
        console.log('🔍 Final Request Object:', JSON.stringify(request, null, 2));

        console.log('🔵 Final Request Object:', JSON.stringify(request, null, 2));

        const response = await createBid(request);

        console.log('🔵 CreateBid Response:', {
          isSuccess: response.isSuccess,
          statusCode: response.statusCode,
          message: response.message,
          data: response.data,
          errors: response.errors,
        });

        if (response.isSuccess) {
          const displayValue = isAutoBid 
            ? parseFloat(autoBidMaxLimit)
            : parseFloat(manualBidAmount); // Use actual manual bid amount

          console.log('✅ Bid created successfully! Display value:', displayValue);
          console.log('   isAutoBid:', isAutoBid);
          console.log('   autoBidMaxLimit:', autoBidMaxLimit);
          console.log('   manualBidAmount:', manualBidAmount);
          console.log('   Calculated displayValue:', displayValue);

          // Close modal and trigger callback without alert
          console.log('🧪 DEBUG: Auto-triggering BidPlaced event IMMEDIATELY');
          // Trigger event IMMEDIATELY
          signalRService.debugTriggerBidPlaced({
            auctionId: auctionSessionId,
            bidId: 'generated-' + Date.now(),
            userId: userProfile?.userId || 'unknown',
            userName: userProfile?.fullName || 'Thương Lái',
            bidAmount: displayValue,
            previousPrice: currentPrice,
            newPrice: displayValue,
            placedAt: new Date().toISOString(),
          });

          // Then call onBidCreated and close modal
          onBidCreated?.();
          onClose();
          setManualBidAmount('');
          setAutoBidMaxLimit('');
          setSelectedSuggestion(null);
        } else {
          console.error('❌ Bid creation failed:', {
            isSuccess: response.isSuccess,
            statusCode: response.statusCode,
            message: response.message,
            errors: response.errors,
          });
          Alert.alert('Lỗi', response.message || 'Không thể đặt giá');
        }
      }
    } catch (error: any) {
      console.error('❌ Error creating/updating bid:', error);
      
      // Try to extract detailed errors from response
      let errorMessage = 'Có lỗi xảy ra';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // If error has response data with errors array, use it
        if (error.cause && typeof error.cause === 'object') {
          const cause = error.cause as any;
          if (cause.errors && Array.isArray(cause.errors) && cause.errors.length > 0) {
            errorMessage = cause.errors.join('\n');
          }
        }
      }
      
      console.log('📋 Error details:', {
        message: errorMessage,
        error: error,
      });
      
      // Check if error is due to someone else bidding (only check outbid/higher bid messages)
      if (errorMessage.toLowerCase().includes('outbid') ||
          errorMessage.toLowerCase().includes('higher bid') ||
          errorMessage.toLowerCase().includes('đã đặt giá cao hơn')) {
        Alert.alert(
          '⏰ Ai đó đã đặt giá cao hơn',
          'Có người khác vừa đặt giá cao hơn của bạn. Vui lòng kiểm tra giá hiện tại và thử lại.',
          [
            {
              text: 'Làm lại',
              onPress: () => {
                // Reset and let user try again
                setManualBidAmount('');
                setAutoBidMaxLimit('');
                setSelectedSuggestion(null);
              },
            },
            { text: 'Đóng', style: 'cancel' }
          ]
        );
      } else {
        Alert.alert('Lỗi', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {existingBid ? 'Cập nhật giá đặt' : 'Đặt giá'}
          </Text>
          <TouchableOpacity onPress={onClose} disabled={loading}>
            <X size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Info Card */}
          <View style={styles.infoCard}>
            <Text style={styles.label}>Phiên đấu giá</Text>
            <Text style={styles.sessionCode}>{sessionCode}</Text>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Giá hiện tại:</Text>
              <Text style={styles.infoValue}>{currentPrice.toLocaleString('vi-VN')} ₫</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bước giá:</Text>
              <Text style={styles.infoValue}>{minBidIncrement.toLocaleString('vi-VN')} ₫</Text>
            </View>
            {existingBid && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Giá hiện tại của bạn:</Text>
                <Text style={[styles.infoValue, { color: '#16A34A', fontWeight: '700' }]}>
                  {existingBid.bidAmount.toLocaleString('vi-VN')} ₫
                </Text>
              </View>
            )}
          </View>

          {!existingBid && (
            <>
              {/* Bid Type Toggle */}
              <View style={styles.bidTypeSection}>
                <Text style={styles.bidTypeLabel}>Chọn loại đặt giá</Text>
                <View style={styles.bidTypeContainer}>
                  <TouchableOpacity
                    style={[
                      styles.bidTypeButton,
                      isAutoBid && styles.bidTypeButtonActive,
                    ]}
                    onPress={() => setIsAutoBid(true)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.bidTypeText,
                        isAutoBid && styles.bidTypeTextActive,
                      ]}
                    >
                      🤖 Tự động
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.bidTypeButton,
                      !isAutoBid && styles.bidTypeButtonActive,
                    ]}
                    onPress={() => setIsAutoBid(false)}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.bidTypeText,
                        !isAutoBid && styles.bidTypeTextActive,
                      ]}
                    >
                      🤝 Thủ công
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Auto Bid Input */}
              {isAutoBid && (
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>Giá tối đa (Auto Bid)</Text>
                  <View style={[
                    styles.inputWrapper,
                    autoBidValidation.isValid === false && autoBidMaxLimit
                      ? styles.inputError
                      : null,
                  ]}>
                    <TextInput
                      style={styles.input}
                      placeholder="Nhập giá tối đa"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                      value={autoBidMaxLimit}
                      onChangeText={setAutoBidMaxLimit}
                      editable={!loading}
                    />
                    <Text style={styles.currency}>₫</Text>
                  </View>

                  {autoBidValidation.isValid === false && autoBidMaxLimit && (
                    <View style={styles.errorContainer}>
                      <AlertCircle size={16} color="#DC2626" />
                      <Text style={styles.errorText}>{autoBidValidation.message}</Text>
                    </View>
                  )}

                  {autoBidValidation.isValid && autoBidMaxLimit && (
                    <View style={styles.successContainer}>
                      <Check size={16} color="#10B981" />
                      <Text style={styles.successText}>Giá hợp lệ ✓</Text>
                    </View>
                  )}
                </View>
              )}

              {/* Auto Bid Info - Separated */}
              {isAutoBid && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoBoxTitle}>ℹ️ Auto Bid</Text>
                  <Text style={styles.infoBoxText}>
                    • Hệ thống sẽ tự động đặt giá cho bạn
                  </Text>
                  <Text style={styles.infoBoxText}>
                    • Giá sẽ tăng dần cho đến khi đạt giá tối đa bạn nhập
                  </Text>
                </View>
              )}

              {/* Manual Bid Input */}
              {!isAutoBid && (
                <>
                  <View style={styles.manualBidInfo}>
                    <Text style={styles.manualBidInfoTitle}>✅ Đặt giá thủ công</Text>
                    <Text style={styles.manualBidInfoText}>
                      Hệ thống sẽ tự động đặt giá = Giá hiện tại + Bước giá
                    </Text>
                    <Text style={styles.manualBidInfoText}>
                      Bạn không cần nhập giá, chỉ cần nhấn "Đặt giá"
                    </Text>
                  </View>
                </>
              )}
            </>
          )}

          {existingBid && (
            <>
              <View style={styles.inputSection}>
                <Text style={styles.inputLabel}>Giá đặt mới</Text>
                <View style={[
                  styles.inputWrapper,
                  manualBidValidation.isValid === false && manualBidAmount
                    ? styles.inputError
                    : null,
                ]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập giá đặt mới"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                    value={manualBidAmount}
                    onChangeText={setManualBidAmount}
                    editable={!loading}
                  />
                  <Text style={styles.currency}>₫</Text>
                </View>

                {manualBidValidation.isValid === false && manualBidAmount && (
                  <View style={styles.errorContainer}>
                    <AlertCircle size={16} color="#DC2626" />
                    <Text style={styles.errorText}>{manualBidValidation.message}</Text>
                  </View>
                )}

                {manualBidValidation.isValid && manualBidAmount && (
                  <View style={styles.successContainer}>
                    <Check size={16} color="#10B981" />
                    <Text style={styles.successText}>Giá hợp lệ ✓</Text>
                  </View>
                )}
              </View>

              <View style={styles.suggestionsSection}>
                <Text style={styles.suggestionsTitle}>Gợi ý giá</Text>
                <View style={styles.suggestionsGrid}>
                  {suggestions.map((suggestion: number, index: number) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.suggestionButton,
                        selectedSuggestion === suggestion && styles.suggestionButtonSelected,
                      ]}
                      onPress={() => handleSelectSuggestion(suggestion)}
                      disabled={loading}
                    >
                      <Text
                        style={[
                          styles.suggestionText,
                          selectedSuggestion === suggestion && styles.suggestionTextSelected,
                        ]}
                      >
                        +{(minBidIncrement * (index + 1)).toLocaleString('vi-VN')}₫
                      </Text>
                      <Text
                        style={[
                          styles.suggestionValue,
                          selectedSuggestion === suggestion && styles.suggestionValueSelected,
                        ]}
                      >
                        {suggestion.toLocaleString('vi-VN')}₫
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>ℹ️ Thông tin</Text>
            {!existingBid ? (
              <>
                <Text style={styles.infoBoxText}>
                  • Tự động: Nhập giá tối đa, hệ thống tự động nâng giá
                </Text>
                <Text style={styles.infoBoxText}>
                  • Thủ công: Hệ thống tự động đặt = Giá hiện tại + Bước giá
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.infoBoxText}>
                  • Cập nhật giá sẽ thay thế giá hiện tại
                </Text>
                <Text style={styles.infoBoxText}>
                  • Giá phải ≥ Giá hiện tại + n × Bước giá (n ≥ 1)
                </Text>
              </>
            )}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Hủy</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.button,
              styles.bidButton,
              (!isValid || loading) && styles.bidButtonDisabled,
            ]}
            onPress={handleConfirmBid}
            disabled={!isValid || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.bidButtonText}>
                {existingBid ? 'Cập nhật' : 'Đặt giá'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: Platform.OS === 'ios' ? 60 : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  infoCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#F9FAFB',
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  sessionCode: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  bidTypeSection: {
    marginBottom: 20,
  },
  bidTypeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  bidTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  bidTypeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  bidTypeButtonActive: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  bidTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  bidTypeTextActive: {
    color: '#16A34A',
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  inputError: {
    borderColor: '#DC2626',
    borderWidth: 2,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  currency: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#DC2626',
    marginLeft: 6,
    flex: 1,
  },
  successContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  successText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 6,
    fontWeight: '600',
  },
  suggestionsSection: {
    marginBottom: 20,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  suggestionsGrid: {
    flexDirection: 'column',
    gap: 8,
  },
  suggestionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  suggestionButtonSelected: {
    borderColor: '#16A34A',
    backgroundColor: '#F0FDF4',
  },
  suggestionText: {
    fontSize: 13,
    color: '#6B7280',
  },
  suggestionTextSelected: {
    color: '#16A34A',
    fontWeight: '600',
  },
  suggestionValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
  },
  suggestionValueSelected: {
    color: '#16A34A',
  },
  infoBox: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: '#16A34A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  infoBoxTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#15803D',
    marginBottom: 8,
  },
  infoBoxText: {
    fontSize: 12,
    color: '#166534',
    marginBottom: 6,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  bidButton: {
    backgroundColor: '#16A34A',
  },
  bidButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  bidButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  manualBidInfo: {
    backgroundColor: '#DBEAFE',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
  },
  manualBidInfoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: 10,
  },
  manualBidInfoText: {
    fontSize: 13,
    color: '#1E40AF',
    marginBottom: 6,
    lineHeight: 20,
  },
});
