import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WebView } from 'react-native-webview';
import { ArrowLeft } from 'lucide-react-native';

export default function PaymentRemainingScreen() {
  const router = useRouter();
  const { paymentUrl, amount, escrowId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);

  const handleGoBack = () => {
    router.back();
  };

  const handlePaymentSuccess = () => {
    Alert.alert(
      'Thanh toán thành công',
      'Giao dịch của bạn đã được xử lý thành công!',
      [{ 
        text: 'OK', 
        onPress: () => {
          router.back();
        }
      }]
    );
  };

  const handlePaymentFailure = () => {
    Alert.alert(
      'Thanh toán thất bại',
      'Giao dịch không thành công. Vui lòng thử lại.',
      [{ 
        text: 'OK', 
        onPress: () => {
          router.back();
        }
      }]
    );
  };

  const handleShouldStartLoad = (request: any): boolean => {
    const url = request.url;
    console.log('Payment navigation URL:', url);

    // Check for PayOS success/failure and prevent loading callback website
    if (url.includes('keychain-teal.vercel.app//payment-success')) {
      handlePaymentSuccess();
      return false; // Prevent loading callback website
    }
    
    if (url.includes('keychain-teal.vercel.app//payment-fail')) {
      handlePaymentFailure();
      return false; // Prevent loading callback website
    }

    return true;
  };

  if (!paymentUrl || typeof paymentUrl !== 'string') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleGoBack}>
            <ArrowLeft size={24} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Thanh toán phần còn lại</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Không thể lấy trang thanh toán</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack}>
          <ArrowLeft size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thanh toán phần còn lại</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Amount Display */}
    

      {/* WebView */}
      <View style={styles.webviewContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#22C55E" />
            <Text style={styles.loadingText}>Đang tải trang thanh toán...</Text>
          </View>
        )}
        <WebView
          source={{ uri: paymentUrl }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={() => setLoading(false)}
          onShouldStartLoadWithRequest={handleShouldStartLoad}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={true}
          scalesPageToFit={true}
        />
      </View>
    </View>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingTop: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  amountSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  amountLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 6,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#10B981',
  },
  webviewContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 12,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
  },
});
