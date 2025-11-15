import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function WholesalerHomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Trang chủ - Nhà bán buôn</Text>
      <Text style={styles.subtitle}>Chào mừng bạn đến với trang dành cho nhà bán buôn</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});