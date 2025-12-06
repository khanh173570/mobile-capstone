import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { CheckCircle } from 'lucide-react-native';

export default function PaymentSuccessScreen() {
  const params = useLocalSearchParams();

  useEffect(() => {
    // Auto redirect to bidding history after 3 seconds
    const timer = setTimeout(() => {
      router.replace('/(tabs)/wholesaler/bidding-history');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <CheckCircle size={80} color="#22C55E" />
        </View>
        
        <Text style={styles.title}>Thanh toán thành công!</Text>
        <Text style={styles.message}>
          Số tiền ký quỹ đã được chuyển vào tài khoản escrow.
        </Text>
        <Text style={styles.subMessage}>
          Vui lòng đợi người bán giao hàng để hoàn tất giao dịch.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.replace('/(tabs)/wholesaler/bidding-history')}
        >
          <Text style={styles.buttonText}>Quay về lịch sử đấu giá</Text>
        </TouchableOpacity>

        <Text style={styles.autoRedirect}>
          Tự động chuyển hướng sau 3 giây...
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 24,
  },
  subMessage: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  autoRedirect: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});
