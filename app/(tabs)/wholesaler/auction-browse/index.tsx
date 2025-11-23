import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import CreateBuyRequestModal from '../../../../components/wholesaler/CreateBuyRequestModal';
import BuyRequestHistoryScreen from '../../../../components/wholesaler/BuyRequestHistoryScreen';
import Header from '../../../../components/shared/Header';

export default function AuctionBrowseScreen() {
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  return (
    <View style={styles.container}>
      {activeTab === 'create' ? (
        <CreateBuyRequestModal />
      ) : (
        <BuyRequestHistoryScreen />
      )}

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'create' && styles.tabButtonActive]}
          onPress={() => setActiveTab('create')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'create' && styles.tabButtonTextActive]}>
            Tạo yêu cầu
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.tabButtonActive]}
          onPress={() => setActiveTab('history')}
        >
          <Text style={[styles.tabButtonText, activeTab === 'history' && styles.tabButtonTextActive]}>
            Lịch sử yêu cầu
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  tabNavigation: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomColor: '#16A34A',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabButtonTextActive: {
    color: '#16A34A',
  },
});
