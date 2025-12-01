import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

export interface HarvestImage {
  id: string;
  harvestID: string;
  imageUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: T;
}

/**
 * Upload image for harvest
 */
export const uploadHarvestImage = async (harvestId: string, formData: FormData): Promise<ApiResponse<HarvestImage>> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    console.log('=== Uploading harvest image ===');
    console.log('HarvestId:', harvestId);
    console.log('API URL:', `${API_URL}/farm-service/harvestimage`);

    const response = await fetch(`${API_URL}/farm-service/harvestimage`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
      },
      body: formData,
    });

    console.log('Upload response status:', response.status);
    
    const data = await response.json();
    console.log('Upload response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('Upload failed:', data.message || data);
      throw new Error(data.message || 'Không thể tải ảnh lên');
    }

    console.log('Upload successful!');
    return data as ApiResponse<HarvestImage>;
  } catch (error) {
    console.error('Upload harvest image error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Đã xảy ra lỗi khi tải ảnh lên');
  }
};

/**
 * Get all images for a harvest
 */
export const getHarvestImages = async (harvestId: string): Promise<HarvestImage[]> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    console.log('\n📥 === GET HARVEST IMAGES ===');
    console.log('HarvestId:', harvestId);
    const url = `${API_URL}/farm-service/harvestimage/harvest/${harvestId}/images`;
    console.log('Request URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    const data = await response.json();
    console.log('📦 Raw response data:', JSON.stringify(data, null, 2));

    if (!response.ok) {
      console.error('❌ API Error:', data.message);
      throw new Error(data.message || 'Không thể tải danh sách ảnh');
    }

    // Check different possible response structures
    let imagesList: HarvestImage[] = [];
    
    console.log('🔍 Checking response structure...');
    console.log('Is array?', Array.isArray(data));
    console.log('Has data property?', 'data' in data);
    console.log('Has isSuccess?', 'isSuccess' in data);
    
    if (Array.isArray(data)) {
      console.log('✅ Response is direct array');
      imagesList = data;
    } else if (data.data && Array.isArray(data.data)) {
      console.log('✅ Response has data property with array');
      imagesList = data.data;
    } else if (data.isSuccess && data.data && Array.isArray(data.data)) {
      console.log('✅ Response has isSuccess and data property');
      imagesList = data.data;
    } else {
      console.warn('⚠️ Unexpected response structure:', data);
      console.log('Response keys:', Object.keys(data));
    }

    console.log('📊 Parsed images list:', imagesList.length, 'images');
    if (imagesList.length > 0) {
      console.log('First image:', JSON.stringify(imagesList[0], null, 2));
    }
    console.log('=== END GET HARVEST IMAGES ===\n');
    
    return imagesList;
  } catch (error) {
    console.error('❌ Get harvest images error:', error);
    return [];
  }
};

/**
 * Delete a harvest image
 */
export const deleteHarvestImage = async (imageId: string): Promise<ApiResponse<null>> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    const response = await fetch(`${API_URL}/farm-service/harvestimage/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Không thể xóa ảnh');
    }

    return data as ApiResponse<null>;
  } catch (error) {
    console.error('Delete harvest image error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Đã xảy ra lỗi khi xóa ảnh');
  }
};
