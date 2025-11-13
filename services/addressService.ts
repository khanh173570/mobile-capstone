// API địa chỉ Việt Nam mới - sau sáp nhập còn 34 tỉnh thành (2025)
// Sử dụng API từ esgoo.net cho cơ cấu hành chính mới
const BASE_URL = 'https://esgoo.net/api-tinhthanh-new';

export interface Province {
  id: string;
  name: string;
  full_name: string;
}

export interface District {
  id: string;
  name: string;
  full_name: string;
  id_province: string;
}

export interface Ward {
  id: string;
  name: string;
  full_name: string;
  id_district: string;
}

// Lấy danh sách tỉnh/thành phố (34 tỉnh thành mới)
export const getProvinces = async (): Promise<Province[]> => {
  console.log('🔍 [API] Starting getProvinces...');
  try {
    const url = `${BASE_URL}/1/0.htm`;
    console.log('🌐 [API] Fetching provinces from:', url);
    
    const response = await fetch(url);
    console.log('📡 [API] Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error('Failed to fetch provinces');
    }
    
    const data = await response.json();
    console.log('📦 [API] Raw data received:', data);
    
    if (data.error === 0) {
      console.log('✅ [API] Success! Found', data.data.length, 'provinces');
      console.log('📋 [API] First few provinces:', data.data.slice(0, 3));
      return data.data;
    } else {
      console.error('❌ [API] API error:', data.error_text);
      throw new Error('API returned error');
    }
  } catch (error) {
    console.error('💥 [API] Error fetching provinces:', error);
    throw error;
  }
};

// Lấy danh sách phường/xã theo tỉnh (API 34 tỉnh thành mới)
export const getWardsFromProvince = async (provinceId: string): Promise<Ward[]> => {
  console.log('🔍 [API] Starting getWardsFromProvince for province:', provinceId);
  try {
    const url = `${BASE_URL}/2/${provinceId}.htm`;
    console.log('🌐 [API] Fetching wards from:', url);
    
    const response = await fetch(url);
    console.log('📡 [API] Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      throw new Error('Failed to fetch wards');
    }
    
    const data = await response.json();
    console.log('📦 [API] Raw ward data received:', data);
    
    if (data.error === 0) {
      const wards = data.data.map((item: any) => ({
        id: item.id,
        name: item.name,
        full_name: item.full_name,
        id_district: '', // API mới không có cấp quận/huyện
      }));
      console.log('✅ [API] Success! Found', wards.length, 'wards');
      console.log('📋 [API] First few wards:', wards.slice(0, 3));
      return wards;
    } else {
      console.error('❌ [API] API error:', data.error_text);
      throw new Error('API returned error');
    }
  } catch (error) {
    console.error('💥 [API] Error fetching wards:', error);
    throw error;
  }
};

// Tương thích với API cũ - deprecated
export const getDistricts = async (provinceId: string): Promise<District[]> => {
  // API 34 tỉnh thành không có cấp quận/huyện
  return [];
};

// Tương thích với API cũ - deprecated  
export const getWards = async (districtId: string): Promise<Ward[]> => {
  // API 34 tỉnh thành không có cấp quận/huyện
  return [];
};

// Interface cho địa chỉ đã chọn (cấu trúc 34 tỉnh thành mới)
export interface SelectedAddress {
  province: Province | null;
  district: District | null; // Giữ để tương thích, nhưng sẽ luôn null với API 34 tỉnh
  ward: Ward | null;
  detailAddress: string; // Địa chỉ chi tiết (số nhà, tên đường)
}

// Hàm format địa chỉ đầy đủ (cấu trúc 34 tỉnh thành mới)
export const formatFullAddress = (selectedAddress: SelectedAddress): string => {
  const parts = [];
  
  if (selectedAddress.detailAddress.trim()) {
    parts.push(selectedAddress.detailAddress.trim());
  }
  
  if (selectedAddress.ward) {
    parts.push(selectedAddress.ward.full_name);
  }
  
  // Không có cấp quận/huyện trong API 34 tỉnh thành
  if (selectedAddress.province) {
    parts.push(selectedAddress.province.full_name);
  }
  
  return parts.join(', ');
};