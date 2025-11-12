import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ChevronDown, MapPin, Home } from 'lucide-react-native';
import {
  Province,
  District,
  Ward,
  SelectedAddress,
  getProvinces,
  getWardsFromProvince,
  formatFullAddress,
} from '../services/addressService';

interface AddressPickerProps {
  selectedAddress: SelectedAddress;
  onAddressChange: (address: SelectedAddress) => void;
}

const AddressPicker: React.FC<AddressPickerProps> = ({
  selectedAddress,
  onAddressChange,
}) => {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  
  const [showProvinceModal, setShowProvinceModal] = useState(false);
  const [showWardModal, setShowWardModal] = useState(false);
  
  const [loading, setLoading] = useState({
    provinces: false,
    wards: false,
  });

  // Load provinces khi component mount
  useEffect(() => {
    loadProvinces();
  }, []);

  const loadProvinces = async () => {
    console.log('🚀 [UI] Loading provinces...');
    setLoading(prev => ({ ...prev, provinces: true }));
    try {
      console.log('📞 [UI] Calling getProvinces API...');
      const data = await getProvinces();
      console.log('📦 [UI] Received provinces data:', data.length, 'items');
      setProvinces(data);
    } catch (error) {
      console.error('❌ [UI] Error loading provinces:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách tỉnh/thành phố');
    } finally {
      setLoading(prev => ({ ...prev, provinces: false }));
      console.log('✅ [UI] Provinces loading finished');
    }
  };

  const loadWards = async (provinceId: string) => {
    console.log('🚀 [UI] Loading wards for province:', provinceId);
    setLoading(prev => ({ ...prev, wards: true }));
    try {
      console.log('📞 [UI] Calling getWardsFromProvince API...');
      const data = await getWardsFromProvince(provinceId);
      console.log('📦 [UI] Received wards data:', data.length, 'items');
      setWards(data);
    } catch (error) {
      console.error('❌ [UI] Error loading wards:', error);
      Alert.alert('Lỗi', 'Không thể tải danh sách phường/xã');
    } finally {
      setLoading(prev => ({ ...prev, wards: false }));
      console.log('✅ [UI] Wards loading finished');
    }
  };

  const handleProvinceSelect = (province: Province) => {
    console.log('🎯 [UI] User selected province:', province.name, '(ID:', province.id, ')');
    
    const newAddress: SelectedAddress = {
      ...selectedAddress,
      province,
      district: null, // Luôn null với API 34 tỉnh thành
      ward: null,
    };
    onAddressChange(newAddress);
    setWards([]);
    setShowProvinceModal(false);
    
    // Load phường/xã cho tỉnh được chọn
    console.log('🔄 [UI] Now loading wards for selected province...');
    loadWards(province.id);
  };

  const handleWardSelect = (ward: Ward) => {
    const newAddress: SelectedAddress = {
      ...selectedAddress,
      ward,
    };
    onAddressChange(newAddress);
    setShowWardModal(false);
  };

  const handleDetailAddressChange = (detailAddress: string) => {
    const newAddress: SelectedAddress = {
      ...selectedAddress,
      detailAddress,
    };
    onAddressChange(newAddress);
  };

  const renderDropdownItem = useCallback(({ item }: { item: Province | Ward }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => {
        if (showProvinceModal) handleProvinceSelect(item as Province);
        else if (showWardModal) handleWardSelect(item as Ward);
      }}
    >
      <Text style={styles.dropdownItemText}>
        {(item as Province).full_name || (item as Ward).full_name}
      </Text>
    </TouchableOpacity>
  ), [showProvinceModal, showWardModal]);

  const renderModal = useCallback((
    visible: boolean,
    onClose: () => void,
    data: any[],
    title: string,
    isLoading: boolean
  ) => {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#22C55E" />
              <Text style={styles.loadingText}>Đang tải...</Text>
            </View>
          ) : (
            <FlatList
              data={data}
              renderItem={renderDropdownItem}
              keyExtractor={(item) => (item as Province).id || (item as Ward).id}
              style={styles.dropdownList}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={{ paddingBottom: 20 }}
              maxToRenderPerBatch={15}
              initialNumToRender={20}
              windowSize={10}
            />
          )}
        </View>
      </View>
    </Modal>
    );
  }, [renderDropdownItem]);

  return (
    <View style={styles.container}>
      {/* Địa chỉ chi tiết */}
      <View style={styles.inputContainer}>
        <Home size={20} color="#6B7280" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Số nhà, tên đường..."
          placeholderTextColor="#9CA3AF"
          value={selectedAddress.detailAddress}
          onChangeText={handleDetailAddressChange}
        />
      </View>

      {/* Tỉnh/Thành phố */}
      <TouchableOpacity
        style={styles.dropdownContainer}
        onPress={() => {
          console.log('👆 [UI] User clicked on Province dropdown');
          console.log('📊 [UI] Current provinces count:', provinces.length);
          console.log('🎭 [UI] Setting showProvinceModal to true');
          setShowProvinceModal(true);
        }}
        disabled={loading.provinces}
      >
        <MapPin size={20} color="#6B7280" style={styles.inputIcon} />
        <Text
          style={[
            styles.dropdownText,
            !selectedAddress.province && styles.placeholderText,
          ]}
        >
          {selectedAddress.province?.name || 'Chọn Tỉnh/Thành phố'}
        </Text>
        <ChevronDown size={20} color="#6B7280" />
      </TouchableOpacity>

{/* API 34 tỉnh thành không có cấp quận/huyện */}

      {/* Phường/Xã */}
      <TouchableOpacity
        style={[
          styles.dropdownContainer,
          !selectedAddress.province && styles.disabled,
        ]}
        onPress={() => {
          console.log('👆 [UI] User clicked on Ward dropdown');
          console.log('📊 [UI] Current wards count:', wards.length);
          console.log('🏘️ [UI] Selected province:', selectedAddress.province?.name);
          setShowWardModal(true);
        }}
        disabled={!selectedAddress.province || loading.wards}
      >
        <MapPin size={20} color="#6B7280" style={styles.inputIcon} />
        <Text
          style={[
            styles.dropdownText,
            !selectedAddress.ward && styles.placeholderText,
          ]}
        >
          {selectedAddress.ward?.full_name || 'Chọn Phường/Xã'}
        </Text>
        <ChevronDown size={20} color="#6B7280" />
      </TouchableOpacity>

      {/* Hiển thị địa chỉ đầy đủ */}
      {formatFullAddress(selectedAddress) && (
        <View style={styles.fullAddressContainer}>
          <Text style={styles.fullAddressLabel}>Địa chỉ đầy đủ:</Text>
          <Text style={styles.fullAddressText}>
            {formatFullAddress(selectedAddress)}
          </Text>
        </View>
      )}

      {/* Modals */}
      {renderModal(
        showProvinceModal,
        () => setShowProvinceModal(false),
        provinces,
        'Chọn Tỉnh/Thành phố',
        loading.provinces
      )}

      {renderModal(
        showWardModal,
        () => setShowWardModal(false),
        wards,
        'Chọn Phường/Xã',
        loading.wards
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#9CA3AF',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: '#1F2937',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#9CA3AF',
    height: 56,
  },
  disabled: {
    opacity: 0.5,
  },
  dropdownText: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  fullAddressContainer: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  fullAddressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  fullAddressText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '95%',
    minHeight: 700,
    width: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 18,
    color: '#6B7280',
  },
  dropdownList: {
    flex: 1,
    maxHeight: 600,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    minHeight: 50,
    justifyContent: 'center',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#1F2937',
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
});

export default AddressPicker;