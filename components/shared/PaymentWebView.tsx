import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  Linking,
  ScrollView,
} from 'react-native';
import { WebView, WebViewNavigation } from 'react-native-webview';
import { X, RefreshCw, Smartphone } from 'lucide-react-native';

interface PaymentWebViewProps {
  visible: boolean;
  paymentUrl: string;
  onClose: () => void;
  onPaymentSuccess: () => void;
  onPaymentFailure: () => void;
  skipOptions?: boolean; // Skip payment options and show QR directly
}

export default function PaymentWebView({
  visible,
  paymentUrl,
  onClose,
  onPaymentSuccess,
  onPaymentFailure,
  skipOptions = false,
}: PaymentWebViewProps) {
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [showPaymentOptions, setShowPaymentOptions] = useState(!skipOptions);
  const [selectedOption, setSelectedOption] = useState<'qr' | 'app' | null>(skipOptions ? 'qr' : null);
  const [showBankingApps, setShowBankingApps] = useState(false);
  const [qrData, setQrData] = useState<string>('');
  const webViewRef = useRef<WebView>(null);

  // Extract QR data from payment URL when component mounts
  useEffect(() => {
    if (paymentUrl && visible) {
      extractQRData();
    }
  }, [paymentUrl, visible]);

  const extractQRData = async () => {
    try {
      // Try to fetch the payment page and extract QR data
      const response = await fetch(paymentUrl);
      const html = await response.text();
      
      // Look for QR data in the HTML
      // PayOS typically embeds QR data in the page
      const qrMatch = html.match(/data:image\/png;base64,([^"']+)/);
      const urlMatch = html.match(/https:\/\/img\.vietqr\.io\/[^"']+/);
      
      if (urlMatch) {
        setQrData(urlMatch[0]);
        console.log('Found VietQR URL:', urlMatch[0]);
      } else if (qrMatch) {
        setQrData(`data:image/png;base64,${qrMatch[1]}`);
        console.log('Found QR base64 data');
      } else {
        // Fallback: use the payment URL itself
        setQrData(paymentUrl);
      }
    } catch (error) {
      console.error('Error extracting QR data:', error);
      setQrData(paymentUrl);
    }
  };

  // List of popular banking apps in Vietnam with proper deep link formats
  const bankingApps = [
    { 
      name: 'MoMo', 
      scheme: 'momo://',
      deepLinkFormat: (url: string) => {
        // MoMo accepts VietQR URLs or QR data
        // Format: momo://qr?url={encoded_qr_url}
        const encodedUrl = encodeURIComponent(url);
        return `momo://app?action=qr&url=${encodedUrl}`;
      }
    },
  ];

  const handleSelectQROption = () => {
    setSelectedOption('qr');
    setShowPaymentOptions(false);
  };

  const handleSelectAppOption = async () => {
    setSelectedOption('app');
    setShowPaymentOptions(false);
    
    // Auto open MoMo with payment data
    const momoApp = bankingApps[0]; // MoMo is the only app now
    await handleOpenBankingApp(momoApp);
  };

  const handleOpenBankingApp = async (app: typeof bankingApps[0]) => {
    try {
      // First check if the app is installed using the base scheme
      const canOpen = await Linking.canOpenURL(app.scheme);
      
      if (canOpen) {
        // Try to open with deep link containing payment data
        const deepLink = app.deepLinkFormat(qrData || paymentUrl);
        console.log(`Attempting to open ${app.name} with deep link:`, deepLink);
        
        try {
          await Linking.openURL(deepLink);
          setShowBankingApps(false);
          
          // Show instruction
          setTimeout(() => {
            Alert.alert(
              'Hướng dẫn',
              `Ứng dụng ${app.name} đã được mở. Nếu không thấy thông tin thanh toán, vui lòng quét mã QR trên trang thanh toán.`,
              [{ text: 'OK' }]
            );
          }, 500);
        } catch (deepLinkError) {
          console.error('Deep link failed, trying base scheme:', deepLinkError);
          // Fallback to just opening the app
          await Linking.openURL(app.scheme);
          setShowBankingApps(false);
          
          Alert.alert(
            'Thông báo',
            `Đã mở ${app.name}. Vui lòng sử dụng chức năng quét QR trong ứng dụng để thanh toán.`,
            [{ text: 'OK' }]
          );
        }
      } else {
        Alert.alert(
          'Chưa cài đặt ứng dụng',
          `Bạn chưa cài đặt ${app.name}. Vui lòng cài đặt ứng dụng từ App Store/Play Store hoặc chọn ứng dụng khác.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error opening banking app:', error);
      Alert.alert(
        'Lỗi',
        `Không thể mở ứng dụng ${app.name}. Vui lòng thử ứng dụng khác hoặc chọn "Quét mã QR".`,
        [{ text: 'OK' }]
      );
    }
  };

  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    const { url } = navState;
    
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);

    console.log('Payment navigation URL:', url); // Debug để xem BE redirect về đâu
  };

  const handleClose = () => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn hủy thanh toán?',
      [
        { text: 'Tiếp tục thanh toán', style: 'cancel' },
        { 
          text: 'Hủy', 
          style: 'destructive',
          onPress: () => {
            onClose();
          }
        },
      ]
    );
  };

  const handleReload = () => {
    webViewRef.current?.reload();
  };

  const handleGoBack = () => {
    if (canGoBack) {
      webViewRef.current?.goBack();
    }
  };

  const handleGoForward = () => {
    if (canGoForward) {
      webViewRef.current?.goForward();
    }
  };

  // Handle deep links for banking apps and payment success/failure
  const handleShouldStartLoad = (request: any) => {
    const url = request.url;
    console.log('Should start load URL:', url);

    // Check for PayOS success/failure and prevent loading callback website
    if (url.includes('keychain-teal.vercel.app//payment-success')) {
      Alert.alert(
        'Thanh toán thành công',
        'Giao dịch của bạn đã được xử lý thành công!',
        [{ text: 'OK', onPress: () => {
          onPaymentSuccess();
          onClose();
        }}]
      );
      return false; // Prevent loading callback website
    } 
    
    if (url.includes('keychain-teal.vercel.app//payment-fail')) {
      Alert.alert(
        'Thanh toán thất bại',
        'Giao dịch không thành công. Vui lòng thử lại.',
        [{ text: 'OK', onPress: () => {
          onPaymentFailure();
          onClose();
        }}]
      );
      return false; // Prevent loading callback website
    }

    // List of banking app schemes in Vietnam
    const bankingSchemes = [
      'intent://',
      'vietqr://',
      'bankapp://',
      // Major Vietnamese banks
      'mbbank://',
      'techcombank://',
      'vietcombank://',
      'bidv://',
      'vcb://',
      'acb://',
      'tpb://',
      'vpbank://',
      'agribank://',
      'hdbank://',
      'sacombank://',
      'scb://',
      'vib://',
      'msb://',
      'shb://',
      'ocb://',
      'namabank://',
      'vietinbank://',
      'eximbank://',
      'seabank://',
      'pvcombank://',
      'abbank://',
      'baca://',
      'kienlongbank://',
      'lienvietpostbank://',
      'baovietbank://',
      'gpbank://',
      'cbbank://',
      'oceanbank://',
      'pgbank://',
      'dongabank://',
      // E-wallets
      'viettelpay://',
      'momo://',
      'zalopay://',
      'vnpay://',
      'shopeepay://',
      'airpay://',
      'payoo://',
      // Other payment methods
      'vietqr://',
      'napas://',
    ];

    // Check if URL matches any banking scheme
    const isBankingDeepLink = bankingSchemes.some(scheme => url.startsWith(scheme));

    if (isBankingDeepLink) {
      console.log('Banking deep link detected:', url);
      
      Linking.canOpenURL(url)
        .then(supported => {
          if (supported) {
            return Linking.openURL(url);
          } else {
            console.log('Cannot open URL:', url);
            Alert.alert(
              'Thông báo',
              'Không thể mở ứng dụng ngân hàng. Vui lòng cài đặt ứng dụng hoặc sử dụng phương thức thanh toán khác.',
              [{ text: 'OK' }]
            );
          }
        })
        .catch(err => {
          console.error('Error opening banking app:', err);
          Alert.alert(
            'Lỗi',
            'Không thể mở ứng dụng ngân hàng. Vui lòng thử lại.',
            [{ text: 'OK' }]
          );
        });

      return false; // Don't load in WebView
    }

    // Allow normal navigation
    return true;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Thanh toán</Text>
          <View style={styles.headerButtons}>
            {!showPaymentOptions && selectedOption === 'qr' && (
              <TouchableOpacity
                style={styles.headerButton}
                onPress={handleReload}
              >
                <RefreshCw size={20} color="#6B7280" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleClose}
            >
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Payment Options */}
        {showPaymentOptions && (
          <View style={styles.optionsContainer}>
            <Text style={styles.optionsTitle}>Chọn phương thức thanh toán</Text>
            <Text style={styles.optionsSubtitle}>
              Chọn cách bạn muốn thanh toán
            </Text>

            {/* QR Code Option */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={handleSelectQROption}
            >
              <View style={styles.optionIcon}>
                <Text style={styles.optionIconText}>📱</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Quét mã QR</Text>
                <Text style={styles.optionDescription}>
                  Sử dụng thiết bị khác để quét mã QR
                </Text>
              </View>
            </TouchableOpacity>

            {/* MoMo Option */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={handleSelectAppOption}
            >
              <View style={styles.optionIcon}>
                <Text style={styles.optionIconText}>💳</Text>
              </View>
              <View style={styles.optionContent}>
                <Text style={styles.optionTitle}>Thanh toán MoMo</Text>
                <Text style={styles.optionDescription}>
                  Mở ứng dụng MoMo để thanh toán nhanh
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* WebView - Only show when QR option selected */}
        {!showPaymentOptions && selectedOption === 'qr' && (
          <WebView
            ref={webViewRef}
            source={{ uri: paymentUrl }}
            style={styles.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onNavigationStateChange={handleNavigationStateChange}
            onShouldStartLoadWithRequest={handleShouldStartLoad}
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#3B82F6" />
                <Text style={styles.loadingText}>Đang tải mã QR...</Text>
              </View>
            )}
            scalesPageToFit={true}
            mixedContentMode="always"
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error:', nativeEvent);
              Alert.alert(
                'Lỗi',
                'Không thể tải trang thanh toán. Vui lòng thử lại.',
                [
                  { text: 'Thử lại', onPress: handleReload },
                  { text: 'Đóng', onPress: onClose, style: 'cancel' }
                ]
              );
            }}
            onHttpError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('HTTP error:', nativeEvent.statusCode);
            }}
          />
        )}

        {/* Info for App Option */}
        {!showPaymentOptions && selectedOption === 'app' && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoIcon}>💳</Text>
            <Text style={styles.infoTitle}>Đã mở MoMo</Text>
            <Text style={styles.infoDescription}>
              Vui lòng hoàn tất thanh toán trong ứng dụng MoMo. Thông tin thanh toán đã được tự động điền sẵn.
            </Text>
            <TouchableOpacity
              style={styles.changeMethodButton}
              onPress={() => {
                setShowPaymentOptions(true);
                setSelectedOption(null);
              }}
            >
              <Text style={styles.changeMethodButtonText}>Chọn phương thức khác</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>


    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    padding: 8,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bankingAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    flex: 1,
  },
  bankingAppButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  navButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  navButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#F3F4F6',
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  navButtonTextDisabled: {
    color: '#9CA3AF',
  },
  // Banking Apps Modal
  bankingModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  bankingModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  bankingModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  bankingModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  bankingModalClose: {
    padding: 4,
  },
  bankingAppsList: {
    paddingHorizontal: 20,
  },
  bankingAppsHint: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 16,
    lineHeight: 18,
  },
  bankingAppItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  bankingAppIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  bankingAppName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  // Payment Options
  optionsContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  optionsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  optionsSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionIconText: {
    fontSize: 28,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  // Info Container
  infoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  infoIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  changeMethodButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  changeMethodButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
