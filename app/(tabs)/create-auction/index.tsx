import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
} from 'react-native';
import { Upload, Calendar, DollarSign } from 'lucide-react-native';
import Header from '../../../components/Header';

export default function CreateAuctionScreen() {
  const [auctionData, setAuctionData] = useState({
    title: '',
    description: '',
    startingPrice: '',
    quantity: '',
    startDate: '',
    endDate: '',
    images: [] as string[],
  });

  const handleImagePicker = () => {
    Alert.alert('Chọn ảnh', 'Chức năng này sẽ sớm được cập nhật');
  };

  const handleCreateAuction = () => {
    Alert.alert('Thành công', 'Chức năng tạo đấu giá sẽ sớm được cập nhật');
  };

  return (
    <View style={styles.container}>
      <Header title="Tạo Phiên Đấu Giá" />
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerInfo}>
          <Text style={styles.subtitle}>
            Đăng sản phẩm của bạn để đấu giá
          </Text>
        </View>

        <View style={styles.formContainer}>
          {/* Tiêu đề */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Tiêu đề sản phẩm *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Nhập tiêu đề sản phẩm..."
              value={auctionData.title}
              onChangeText={(text) =>
                setAuctionData({ ...auctionData, title: text })
              }
            />
          </View>

          {/* Mô tả */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Mô tả sản phẩm *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Mô tả chi tiết về sản phẩm..."
              value={auctionData.description}
              onChangeText={(text) =>
                setAuctionData({ ...auctionData, description: text })
              }
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Giá khởi điểm và Số lượng */}
          <View style={styles.rowContainer}>
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Giá khởi điểm *</Text>
              <View style={styles.priceInputContainer}>
                <DollarSign size={20} color="#6B7280" style={styles.priceIcon} />
                <TextInput
                  style={styles.priceInput}
                  placeholder="0"
                  value={auctionData.startingPrice}
                  onChangeText={(text) =>
                    setAuctionData({ ...auctionData, startingPrice: text })
                  }
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.halfField}>
              <Text style={styles.fieldLabel}>Số lượng (kg) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0"
                value={auctionData.quantity}
                onChangeText={(text) =>
                  setAuctionData({ ...auctionData, quantity: text })
                }
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Thời gian đấu giá */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Thời gian đấu giá</Text>
            <View style={styles.rowContainer}>
              <TouchableOpacity style={styles.dateButton}>
                <Calendar size={20} color="#6B7280" />
                <Text style={styles.dateButtonText}>Ngày bắt đầu</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.dateButton}>
                <Calendar size={20} color="#6B7280" />
                <Text style={styles.dateButtonText}>Ngày kết thúc</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hình ảnh */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Hình ảnh sản phẩm *</Text>
            <TouchableOpacity
              onPress={handleImagePicker}
              style={styles.imageUploadContainer}
            >
              <Upload size={40} color="#6B7280" />
              <Text style={styles.uploadText}>
                Chọn hoặc chụp ảnh sản phẩm
              </Text>
              <Text style={styles.uploadSubtext}>
                Tối đa 5 ảnh
              </Text>
            </TouchableOpacity>
          </View>

          {/* Nút tạo đấu giá */}
          <TouchableOpacity
            onPress={handleCreateAuction}
            style={styles.createButton}
          >
            <Text style={styles.createButtonText}>
              Tạo Phiên Đấu Giá
            </Text>
          </TouchableOpacity>
        </View>

        {/* Note */}
        <View style={styles.noteContainer}>
          <Text style={styles.noteText}>
            📝 <Text style={styles.noteTextBold}>Lưu ý:</Text> Sau khi tạo phiên đấu giá, 
            bạn có thể theo dõi và quản lý trong tab "Quản lý đấu giá".
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  scrollContainer: {
    flex: 1,
    marginTop: 120,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  headerInfo: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 96,
    textAlignVertical: 'top',
  },
  rowContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  halfField: {
    flex: 1,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  priceIcon: {
    marginLeft: 12,
  },
  priceInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  dateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#6B7280',
  },
  imageUploadContainer: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  uploadText: {
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
    fontSize: 16,
  },
  uploadSubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 4,
  },
  createButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  noteContainer: {
    marginTop: 16,
    marginHorizontal: 20,
    backgroundColor: '#EFF6FF',
    padding: 16,
    borderRadius: 12,
  },
  noteText: {
    color: '#1E40AF',
    fontSize: 14,
  },
  noteTextBold: {
    fontWeight: '600',
  },
});