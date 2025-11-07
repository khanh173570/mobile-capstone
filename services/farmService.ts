import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl || 'https://gateway.a-379.store/api';

// Types
export interface Farm {
  id: string;
  name: string;
  farmImage: string;
  isActive: boolean;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateFarmData {
  id: string;
  name: string;
  farmImage?: string | File | null;
}

export interface FarmFormData {
  name: string;
  farmImage: string;
  description?: string;
}

export interface UpdateFarmFormData {
  id: string;
  name: string;
  farmImageFile?: any; // For file upload
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: T;
}

/**
 * Update farm with file upload
 */
export const updateFarm = async (farmData: UpdateFarmFormData): Promise<ApiResponse<Farm>> => {
  try {
    console.log('Update farm request URL:', `${API_URL}/farm-service/farm/${farmData.id}`);
    
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('name', farmData.name);
    
    // Add file if provided
    if (farmData.farmImageFile) {
      formData.append('FarmImage', farmData.farmImageFile);
    }
    
    console.log('Update farm FormData:', {
      name: farmData.name,
      hasFile: !!farmData.farmImageFile
    });
    
    const response = await fetch(`${API_URL}/farm-service/farm/${farmData.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type, let fetch set it with boundary for FormData
      },
      body: formData,
    });
    
    const data = await response.json();
    console.log('Update farm response:', data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Không thể cập nhật trang trại');
    }
    
    return data as ApiResponse<Farm>;
  } catch (error) {
    console.error('Update farm error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Đã xảy ra lỗi khi cập nhật trang trại');
  }
};

/**
 * Get user farms (user ID from token)
 */
export const getUserFarms = async (): Promise<ApiResponse<Farm[]>> => {
  try {
    console.log('Get user farms request URL:', `${API_URL}/farm-service/farm/user`);
    
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    
    const response = await fetch(`${API_URL}/farm-service/farm/user`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    console.log('Get user farms response:', data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Không thể lấy danh sách trang trại');
    }
    
    return data as ApiResponse<Farm[]>;
  } catch (error) {
    console.error('Get user farms error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Đã xảy ra lỗi khi lấy danh sách trang trại');
  }
};

/**
 * Get farm by ID
 */
export const getFarmById = async (farmId: string): Promise<ApiResponse<Farm>> => {
  try {
    console.log('Get farm by ID request URL:', `${API_URL}/farm-service/farm/${farmId}`);
    
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    
    const response = await fetch(`${API_URL}/farm-service/farm/${farmId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    console.log('Get farm by ID response:', data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Không thể lấy thông tin trang trại');
    }
    
    return data as ApiResponse<Farm>;
  } catch (error) {
    console.error('Get farm by ID error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Đã xảy ra lỗi khi lấy thông tin trang trại');
  }
};

/**
 * Create a new farm
 */
export const createFarm = async (farmData: FarmFormData): Promise<ApiResponse<Farm>> => {
  try {
    console.log('Create farm request URL:', `${API_URL}/farm-service/farm`);
    
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    
    const response = await fetch(`${API_URL}/farm-service/farm`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(farmData),
    });
    
    const data = await response.json();
    console.log('Create farm response:', data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Không thể tạo trang trại mới');
    }
    
    return data as ApiResponse<Farm>;
  } catch (error) {
    console.error('Create farm error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Đã xảy ra lỗi khi tạo trang trại mới');
  }
};

/**
 * Get user farms from AsyncStorage
 */
export const getUserFarmsFromStorage = async (): Promise<Farm[]> => {
  try {
    const farmsStr = await AsyncStorage.getItem('userFarms');
    if (farmsStr) {
      return JSON.parse(farmsStr) as Farm[];
    }
    return [];
  } catch (error) {
    console.error('Error getting user farms from storage:', error);
    return [];
  }
};

/**
 * Delete a farm
 */
export const deleteFarm = async (farmId: string): Promise<ApiResponse<void>> => {
  try {
    console.log('Delete farm request URL:', `${API_URL}/farm-service/farm/${farmId}`);
    
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    
    const response = await fetch(`${API_URL}/farm-service/farm/${farmId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    const data = await response.json();
    console.log('Delete farm response:', data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Không thể xóa trang trại');
    }
    
    return data as ApiResponse<void>;
  } catch (error) {
    console.error('Delete farm error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Đã xảy ra lỗi khi xóa trang trại');
  }
};
