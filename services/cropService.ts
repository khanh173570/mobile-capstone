import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

export interface CustardAppleType {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface Crop {
  id: string;
  farmID: string;
  name: string; // Added: name field for crop
  area: number;
  cropType: string | null;
  custardAppleType: string; // Added: actual type name from API
  custardAppleTypeID: string;
  farmingDuration: number;
  status: number; // Added: status field (0, 1, 2, 3, 4)
  startPlantingDate: string;
  nearestHarvestDate: string | null; // Can be null
  note: string;
  treeCount: number;
}

export interface CreateCropData {
  farmID?: string;
  name: string; // Added: name field for crop
  area: number;
  custardAppleTypeID: string;
  farmingDuration: number;
  status?: number; // 0: Mới trồng, 1: Đang phát triển, 2: Đang ra hoa, 3: Đã thu hoạch, 4: Ngừng canh tác
  startPlantingDate: string;
  nearestHarvestDate?: string; // Made optional
  note: string;
  treeCount: number;
}

export interface UpdateCropData {
  name: string; // Added: name field for crop
  area: number;
  custardAppleTypeID: string;
  farmingDuration: number;
  status?: number; // 0: Mới trồng, 1: Đang phát triển, 2: Đang ra hoa, 3: Đã thu hoạch, 4: Ngừng canh tác
  startPlantingDate: string;
  nearestHarvestDate?: string; // Made optional
  note: string;
  treeCount: number;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: T;
}

/**
 * Get all custard apple types
 */
export const getCustardAppleTypes = async (): Promise<CustardAppleType[]> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      console.log('No access token, returning empty array');
      return [];
    }

    const response = await fetch(`${API_URL}/farm-service/custardappletype`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Check if response is empty or not valid JSON
    const text = await response.text();
    if (!text || text.trim() === '') {
      console.log('Empty response, returning empty array');
      return [];
    }

    let result: ApiResponse<CustardAppleType[]>;
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return [];
    }

    if (!response.ok) {
      console.error('API error:', result.message || 'Failed to fetch custard apple types');
      return [];
    }

    if (result.isSuccess && result.data && Array.isArray(result.data)) {
      return result.data;
    }

    return [];
  } catch (error) {
    console.error('Get custard apple types error:', error);
    return []; // Return empty array instead of throwing error
  }
};

/**
 * Get crop by ID
 */
export const getCropById = async (cropId: string): Promise<Crop | null> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('No access token found');
    }

    const url = `${API_URL}/farm-service/crop/${cropId}`;
    console.log('Fetching crop from URL:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    const text = await response.text();
    console.log('Response text:', text);
    
    if (!text || text.trim() === '') {
      console.log('Empty response, returning null');
      return null;
    }

    let result: ApiResponse<Crop>;
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return null;
    }

    if (!response.ok) {
      console.error('API error:', result.message || 'Failed to fetch crop');
      return null;
    }

    if (result.isSuccess && result.data) {
      return result.data;
    }

    return null;
  } catch (error) {
    console.error('Get crop error:', error);
    return null;
  }
};

/**
 * Get crops by farm ID
 */
export const getCropsByFarmId = async (farmId: string): Promise<Crop[]> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('No access token found');
    }

    const url = `${API_URL}/farm-service/farm/${farmId}/crop`;
    console.log('Fetching crops from URL:', url);
    console.log('Using token:', token ? 'Token exists' : 'No token');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    // Check if response is empty or not valid JSON
    const text = await response.text();
    console.log('Response text:', text);
    console.log('Response text length:', text ? text.length : 0);
    
    if (!text || text.trim() === '') {
      console.log('Empty response, returning empty array');
      return [];
    }

    let result: ApiResponse<Crop[]>;
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return [];
    }

    if (!response.ok) {
      console.error('API error:', result.message || 'Failed to fetch crops');
      return [];
    }

    if (result.isSuccess && result.data && Array.isArray(result.data)) {
      return result.data;
    }

    return [];
  } catch (error) {
    console.error('Get crops error:', error);
    return []; // Return empty array instead of throwing error
  }
};

/**
 * Create a new crop
 */
export const createCrop = async (cropData: CreateCropData): Promise<Crop> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    // Prepare request body - remove nearestHarvestDate if empty
    const requestBody: any = {
      ...cropData,
      cropType: null, // Set to null as per requirement
    };

    // Remove nearestHarvestDate if it's empty or undefined
    if (!cropData.nearestHarvestDate || cropData.nearestHarvestDate.trim() === '') {
      delete requestBody.nearestHarvestDate;
    }

    const response = await fetch(`${API_URL}/farm-service/crop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Handle empty or invalid response
    const text = await response.text();
    if (!text || text.trim() === '') {
      throw new Error('Không nhận được phản hồi từ máy chủ');
    }

    let result: ApiResponse<Crop>;
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Dữ liệu từ máy chủ không hợp lệ');
    }

    if (!response.ok) {
      const errorMessage = result.message || 'Không thể tạo vườn mới';
      throw new Error(errorMessage);
    }

    if (result.isSuccess && result.data) {
      return result.data;
    }

    throw new Error('Không thể tạo vườn. Vui lòng thử lại sau.');
  } catch (error) {
    console.error('Create crop error:', error);
    // Re-throw with user-friendly message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Đã xảy ra lỗi khi tạo vườn. Vui lòng kiểm tra kết nối mạng.');
  }
};

/**
 * Update an existing crop
 */
export const updateCrop = async (cropId: string, cropData: UpdateCropData): Promise<Crop> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    // Prepare request body - remove nearestHarvestDate if empty
    const requestBody: any = {
      ...cropData,
      cropType: null, // Set to null as per requirement
    };

    // Remove nearestHarvestDate if it's empty or undefined
    if (!cropData.nearestHarvestDate || cropData.nearestHarvestDate.trim() === '') {
      delete requestBody.nearestHarvestDate;
    }

    const response = await fetch(`${API_URL}/farm-service/crop/${cropId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    // Handle empty or invalid response
    const text = await response.text();
    if (!text || text.trim() === '') {
      throw new Error('Không nhận được phản hồi từ máy chủ');
    }

    let result: ApiResponse<Crop>;
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Dữ liệu từ máy chủ không hợp lệ');
    }

    if (!response.ok) {
      const errorMessage = result.message || 'Không thể cập nhật vườn';
      throw new Error(errorMessage);
    }

    if (result.isSuccess && result.data) {
      return result.data;
    }

    throw new Error('Không thể cập nhật vườn. Vui lòng thử lại sau.');
  } catch (error) {
    console.error('Update crop error:', error);
    // Re-throw with user-friendly message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Đã xảy ra lỗi khi cập nhật vườn. Vui lòng kiểm tra kết nối mạng.');
  }
};

/**
 * Delete a crop
 */
export const deleteCrop = async (cropId: string): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    const response = await fetch(`${API_URL}/farm-service/crop/${cropId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Handle empty or invalid response
    const text = await response.text();
    
    // For DELETE, we might get empty response on success
    if (!response.ok) {
      let errorMessage = 'Không thể xóa vườn';
      
      if (text && text.trim() !== '') {
        try {
          const result = JSON.parse(text);
          errorMessage = result.message || errorMessage;
        } catch (parseError) {
          // Use default error message if can't parse
        }
      }
      
      throw new Error(errorMessage);
    }

    // Success - either empty response or JSON with success flag
    if (text && text.trim() !== '') {
      try {
        const result = JSON.parse(text);
        if (result.isSuccess === false) {
          throw new Error(result.message || 'Không thể xóa vườn');
        }
      } catch (parseError) {
        // If can't parse but response is ok, consider it success
      }
    }
  } catch (error) {
    console.error('Delete crop error:', error);
    // Re-throw with user-friendly message
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Đã xảy ra lỗi khi xóa vườn. Vui lòng kiểm tra kết nối mạng.');
  }
};
