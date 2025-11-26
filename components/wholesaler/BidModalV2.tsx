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

interface CreateBidModalProps {
  visible: boolean;
  onClose: () => void;
  onBidCreated?: () => void;
  currentPrice: number;
  minBidIncrement: number;
  auctionSessionId: string;
  sessionCode: string;
  existingBid?: BidResponse;
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
}: CreateBidModalProps) {
  const [isAutoBid, setIsAutoBid] = useState(!existingBid);
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
      // Create mode: reset to auto bid mode
      setIsAutoBid(true);
      setAutoBidMaxLimit('');
      setManualBidAmount('');
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
  // In create mode, use validation based on isAutoBid toggle
  const isValid = existingBid 
    ? manualBidValidation.isValid 
    : (isAutoBid ? autoBidValidation.isValid : manualBidValidation.isValid);

  const handleSelectSuggestion = (value: number) => {
    console.log('Selected suggestion:', value);
    setManualBidAmount(value.toString());
    setSelectedSuggestion(value);
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
    
    if (!isValid) {
      const errorMessage = existingBid
        ? (manualBidValidation.message || 'Vui lòng kiểm tra giá đặt')
        : (isAutoBid 
            ? (autoBidValidation.message || 'Vui lòng kiểm tra giá đặt')
            : (manualBidValidation.message || 'Vui lòng kiểm tra giá đặt'));
      Alert.alert('Lỗi', errorMessage);
      return;
    }

    setLoading(true);
    try {
      if (existingBid) {
        const amountValue = parseFloat(manualBidAmount);
        const response = await updateBid({
          auctionSessionId,
          bidAmount: amountValue,
        });

        if (response.isSuccess) {
          await sendLocalNotification({
            title: '💰 Cập nhật giá thành công',
            body: `Giá mới: ${amountValue.toLocaleString('vi-VN')} ₫`,
            type: 'auction_log',
            auctionId: auctionSessionId,
            data: {
              bidAmount: amountValue,
              sessionCode,
            },
          });

          // Wait a bit for backend to process
          await new Promise(resolve => setTimeout(resolve, 500));

          Alert.alert('Thành công', 'Cập nhật giá thành công!', [
            {
              text: 'OK',
              onPress: () => {
                onBidCreated?.();
                onClose();
                setManualBidAmount('');
                setAutoBidMaxLimit('');
                setSelectedSuggestion(null);
              },
            },
          ]);
        } else {
          Alert.alert('Lỗi', response.message || 'Không thể cập nhật giá');
        }
      } else {
        const request: CreateBidRequest = {
          isAutoBid,
          auctionSessionId,
          ...(isAutoBid && { autoBidMaxLimit: parseFloat(autoBidMaxLimit) }),
        };

        const response = await createBid(request);

        if (response.isSuccess) {
          const displayValue = isAutoBid 
            ? parseFloat(autoBidMaxLimit)
            : parseFloat(manualBidAmount);

          await sendLocalNotification({
            title: '💰 Đặt giá thành công',
            body: `${isAutoBid ? 'Giá tối đa' : 'Giá đặt'}: ${displayValue.toLocaleString('vi-VN')} ₫`,
            type: 'auction_log',
            auctionId: auctionSessionId,
            data: {
              bidType: isAutoBid ? 'auto' : 'manual',
              bidValue: displayValue,
              sessionCode,
            },
          });

          Alert.alert('Thành công', 'Đặt giá thành công!', [
            {
              text: 'OK',
              onPress: () => {
                onBidCreated?.();
                onClose();
                setManualBidAmount('');
                setAutoBidMaxLimit('');
                setSelectedSuggestion(null);
              },
            },
          ]);
        } else {
          Alert.alert('Lỗi', response.message || 'Không thể đặt giá');
        }
      }
    } catch (error) {
      console.error('Error creating/updating bid:', error);
      Alert.alert('Lỗi', error instanceof Error ? error.message : 'Có lỗi xảy ra');
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
                  <Text style={styles.inputLabel}>Giá tối đa</Text>
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

              {/* Manual Bid Input */}
              {!isAutoBid && (
                <>
                  <View style={styles.inputSection}>
                    <Text style={styles.inputLabel}>Giá đặt</Text>
                    <View style={[
                      styles.inputWrapper,
                      manualBidValidation.isValid === false && manualBidAmount
                        ? styles.inputError
                        : null,
                    ]}>
                      <TextInput
                        style={styles.input}
                        placeholder="Nhập giá đặt"
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

                  {/* Suggestions */}
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
                  • Tự động: Hệ thống tự động nâng giá
                </Text>
                <Text style={styles.infoBoxText}>
                  • Thủ công: Bạn chỉ định giá cố định
                </Text>
                <Text style={styles.infoBoxText}>
                  • Giá phải ≥ Giá hiện tại + n × Bước giá (n ≥ 1)
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
            onPress={handleCreateOrUpdateBid}
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
});
