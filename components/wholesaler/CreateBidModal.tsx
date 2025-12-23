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
  calculateMinAutoBidLimit,
  getBidSuggestions,
  createBid,
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
  enableReserveProxy?: boolean;
}

export default function CreateBidModal({
  visible,
  onClose,
  onBidCreated,
  currentPrice,
  minBidIncrement,
  auctionSessionId,
  sessionCode,
  enableReserveProxy = false,
}: CreateBidModalProps) {
  const [autoBidMaxLimit, setAutoBidMaxLimit] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);

  // If auto-bid not allowed, close modal immediately
  React.useEffect(() => {
    if (visible && !enableReserveProxy) {
      Alert.alert('Không hỗ trợ auto-bid', 'Phiên này không bật đặt giá tự động.', [
        { text: 'OK', onPress: onClose },
      ]);
    }
  }, [visible, enableReserveProxy, onClose]);

  // Log visibility changes
  React.useEffect(() => {
    //console.log('CreateBidModal visible changed:', visible);
  }, [visible]);

  // Calculate minimum valid limit
  const minAutoBidLimit = useMemo(
    () => calculateMinAutoBidLimit(currentPrice, minBidIncrement),
    [currentPrice, minBidIncrement]
  );

  // Get bid suggestions
  const suggestions = useMemo(
    () => getBidSuggestions(currentPrice, minBidIncrement, 5),
    [currentPrice, minBidIncrement]
  );

  // Validate input
  const validation = useMemo(() => {
    if (!autoBidMaxLimit) {
      return { isValid: false, message: '' };
    }
    const limitValue = parseFloat(autoBidMaxLimit);
    if (isNaN(limitValue)) {
      return { isValid: false, message: 'Vui lòng nhập số hợp lệ' };
    }
    return validateAutoBidLimit(limitValue, currentPrice, minBidIncrement);
  }, [autoBidMaxLimit, currentPrice, minBidIncrement]);

  const handleSelectSuggestion = (value: number) => {
    setAutoBidMaxLimit(value.toString());
    setSelectedSuggestion(value);
  };

  const handleCreateBid = async () => {
    if (!validation.isValid) {
      Alert.alert('Lỗi', validation.message || 'Vui lòng kiểm tra giá đặt');
      return;
    }

    setLoading(true);
    try {
      const limitValue = parseFloat(autoBidMaxLimit);
      const request: CreateBidRequest = {
        isAutoBid: true,
        autoBidMaxLimit: limitValue,
        auctionSessionId,
      };

      if (!enableReserveProxy) {
        Alert.alert('Thông báo', 'Phiên này không bật đặt giá tự động.', [{ text: 'OK' }]);
        setLoading(false);
        return;
      }

      const response = await createBid(request);

      if (response.isSuccess) {
        // Send notification
        await sendLocalNotification({
          title: '💰 Đặt giá thành công',
          body: `Giá tối đa: ${limitValue.toLocaleString('vi-VN')} ₫`,
          type: 'auction_log',
          auctionId: auctionSessionId,
          data: {
            bidMaxLimit: limitValue,
            sessionCode,
          },
        });

        Alert.alert('Thành công', 'Đặt giá thành công!', [
          {
            text: 'OK',
            onPress: () => {
              onBidCreated?.();
              onClose();
              // Reset form
              setAutoBidMaxLimit('');
              setSelectedSuggestion(null);
            },
          },
        ]);
      } else {
        Alert.alert('Lỗi', response.message || 'Không thể đặt giá');
      }
    } catch (error) {
      // console.error('Error creating bid:', error);
      
      let errorMessage = 'Có lỗi xảy ra';
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      // Check if error is due to insufficient funds
      if (errorMessage.toLowerCase().includes('insufficient funds') ||
          errorMessage.toLowerCase().includes('insufficient') ||
          errorMessage.toLowerCase().includes('wallet')) {
        Alert.alert(
          '❌ Không đủ tiền trong ví',
          'Bạn không có đủ tiền trong ví để đặt giá này. Vui lòng nạp tiền vào ví.'
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
          <Text style={styles.title}>Đặt giá tự động</Text>
          <TouchableOpacity onPress={onClose} disabled={loading}>
            <X size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Auction Info */}
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
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Giá tối thiểu:</Text>
              <Text style={[styles.infoValue, { color: '#DC2626', fontWeight: '700' }]}>
                {minAutoBidLimit.toLocaleString('vi-VN')} ₫
              </Text>
            </View>
          </View>

          {/* Input Section */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Giá tối đa tự động đặt</Text>
            <View style={[styles.inputWrapper, !validation.isValid && autoBidMaxLimit ? styles.inputError : null]}>
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

            {!validation.isValid && autoBidMaxLimit && (
              <View style={styles.errorContainer}>
                <AlertCircle size={16} color="#DC2626" />
                <Text style={styles.errorText}>{validation.message}</Text>
              </View>
            )}

            {validation.isValid && autoBidMaxLimit && (
              <View style={styles.successContainer}>
                <Check size={16} color="#10B981" />
                <Text style={styles.successText}>Giá hợp lệ ✓</Text>
              </View>
            )}
          </View>

          {/* Suggestions */}
          <View style={styles.suggestionsSection}>
            <Text style={styles.suggestionsTitle}>Gợi ý giá đặt</Text>
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

          {/* Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxTitle}>ℹ️ Thông tin đặt giá tự động</Text>
            <Text style={styles.infoBoxText}>
              • Hệ thống sẽ tự động đặt giá cao hơn các lượt đặt khác cho tới khi đạt giá tối đa bạn chỉ định
            </Text>
            <Text style={styles.infoBoxText}>
              • Giá tối đa phải ≥ Giá hiện tại + n × Bước giá (n ≥ 1)
            </Text>
            <Text style={styles.infoBoxText}>
              • Bạn sẽ nhận thông báo khi có người đặt giá cao hơn
            </Text>
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
              (!validation.isValid || loading) && styles.bidButtonDisabled,
            ]}
            onPress={handleCreateBid}
            disabled={!validation.isValid || loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.bidButtonText}>Đặt giá ngay</Text>
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

  // Info Card
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

  // Input Section
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 20,
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

  // Suggestions
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

  // Info Box
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

  // Footer
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
