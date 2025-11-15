import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function BiddingHistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lịch sử đấu thầu</Text>
      <Text style={styles.subtitle}>Xem lịch sử các lần đấu thầu của bạn</Text>
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