import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { fetchWithTokenRefresh } from './authService';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

// Translate API error messages to Vietnamese
export const translateErrorMessage = (englishMessage: string): string => {
  const translations: { [key: string]: string } = {
    'Cannot create auction: Insufficient balance': 'Không thể tạo đấu giá: Ví không đủ tiền',
    'Insufficient balance': 'Ví không đủ tiền',
    'Required': 'Cần thiết',
    'Invalid input': 'Đầu vào không hợp lệ',
    'Unauthorized': 'Không được phép',
    'Not found': 'Không tìm thấy',
    'Bad request': 'Yêu cầu không hợp lệ',
    'This harvest already has an accepted or completed buy request; cannot link it to an auction.': 'Sản phẩm này đã có yêu cầu mua hàng được chấp nhận hoặc hoàn thành; không thể liên kết với đấu giá.',
  };

  let translatedMessage = englishMessage;
  
  // Replace known English phrases with Vietnamese translations
  for (const [english, vietnamese] of Object.entries(translations)) {
    translatedMessage = translatedMessage.replace(
      new RegExp(english, 'gi'),
      vietnamese
    );
  }
  
  return translatedMessage;
};

export interface CurrentHarvest {
  id: string;
  harvestDate: string | null;
  startDate: string;
  totalQuantity: number;
  unit: string;
  note: string;
  salePrice: number;
  cropID: string;
  createdAt: string;
  updatedAt: string | null;
  harvestGradeDetailDTOs: Array<{
    id: string;
    grade: 1 | 2 | 3;
    quantity: number;
    unit: string;
    harvestID: string;
    createdAt: string;
    updatedAt: string | null;
  }>;
}

export interface CreateAuctionData {
  publishDate: string;
  endDate: string;
  farmerId: string;
  startingPrice: number;
  minBidIncrement: number;
  enableBuyNow: boolean;
  buyNowPrice: number | null;
  enableAntiSniping: boolean;
  antiSnipingExtensionSeconds: number | null;
  enableReserveProxy: boolean;
  status?: 0 | 1; // 0 = Draft, 1 = Pending
  note: string;
  expectedHarvestDate: string;
  expectedTotalQuantity: number;
}

export interface AuctionSession {
  id: string;
  publishDate: string;
  endDate: string;
  farmerId: string;
  sessionCode: string;
  startingPrice: number;
  currentPrice: number | null;
  winningPrice: number | null;
  minBidIncrement: number;
  enableBuyNow: boolean;
  buyNowPrice: number | null;
  enableAntiSniping: boolean;
  antiSnipingExtensionSeconds: number | null;
  status: number;
  winnerId: string | null;
  note: string;
  expectedHarvestDate: string;
  expectedTotalQuantity: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateAuctionHarvestData {
  auctionSessionId: string;
  harvestId: string;
}

export interface AuctionHarvest {
  auctionSessionId: string;
  harvestId: string;
}

// Get current harvest by crop ID
export const getCurrentHarvest = async (cropId: string): Promise<CurrentHarvest> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Fetching current harvest for crop:', cropId);
    const response = await fetch(`${API_URL}/farm-service/crop/${cropId}/currentharvest`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const text = await response.text();
    let data;
    
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('JSON parse error:', e);
      throw new Error('Invalid response format from server');
    }

    if (!response.ok) {
      // Don't throw error for "harvest not found" cases - this is expected behavior
      // Just return null or throw a specific error that can be handled silently
      const errorMessage = data.message || 'Failed to fetch current harvest';
      const error = new Error(errorMessage);
      // Mark this as an expected error for "no harvest" cases
      (error as any).isExpectedError = !response.ok && response.status === 400;
      throw error;
    }

    console.log('Current harvest fetched successfully:', data.data?.id);
    return data.data;
  } catch (error) {
    // Only log unexpected errors (not the "harvest doesn't exist" case)
    if (!(error as any).isExpectedError) {
      console.error('Error fetching current harvest:', error);
    }
    throw error;
  }
};

// Create auction session
export const createAuctionSession = async (auctionData: CreateAuctionData): Promise<AuctionSession> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Remove null/undefined values from auctionData to avoid API validation errors
    const cleanedData = Object.fromEntries(
      Object.entries(auctionData).filter(([_, value]) => value !== null && value !== undefined)
    );

    console.log('Creating auction session with cleaned data:', JSON.stringify(cleanedData, null, 2));
    console.log('Data fields:', Object.keys(cleanedData));
    
    const response = await fetch(`${API_URL}/auction-service/englishauction`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cleanedData),
    });

    console.log('Response status:', response.status);
    
    const text = await response.text();
    // console.log('Response text:', text);
    
    let data;
    
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('JSON parse error:', e);
      throw new Error('Invalid response format from server');
    }

    if (!response.ok) {
      // console.error('API Error response:', data);
      const error = new Error(data.message || `Failed to create auction session: ${response.status}`) as any;
      error.response = {
        data: data,
        status: response.status
      };
      throw error;
    }

    console.log('Auction session created successfully:', data.data?.id);
    return data.data;
  } catch (error) {
    // console.error('Error creating auction session:', error);
    throw error;
  }
};

// Create auction harvest WITH VALIDATION
export const createAuctionHarvest = async (auctionHarvestData: CreateAuctionHarvestData): Promise<AuctionHarvest> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const { auctionSessionId, harvestId } = auctionHarvestData;
    
    console.log('🔍 [createAuctionHarvest] Bắt đầu validation:', { auctionSessionId, harvestId });

    // ============ VALIDATION 1: Check UUID format ============
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    if (!auctionSessionId || !uuidRegex.test(auctionSessionId)) {
      const error = `❌ Auction Session ID không hợp lệ: "${auctionSessionId}"`;
      console.error('[createAuctionHarvest]', error);
      throw new Error(error);
    }
    
    if (!harvestId || !uuidRegex.test(harvestId)) {
      const error = `❌ Harvest ID không hợp lệ: "${harvestId}"`;
      console.error('[createAuctionHarvest]', error);
      throw new Error(error);
    }

    console.log('✅ UUID format hợp lệ');

    // ============ VALIDATION 2: Check if harvest exists ============
    console.log('🔍 Kiểm tra harvest tồn tại...');
    const harvest = await getHarvestById(harvestId);
    
    if (!harvest) {
      const error = `❌ Harvest không tồn tại: ${harvestId}`;
      console.error('[createAuctionHarvest]', error);
      throw new Error(error);
    }
    
    console.log('✅ Harvest tồn tại:', {
      id: harvest.id,
      cropId: harvest.cropId || harvest.cropID,
      totalQuantity: harvest.totalQuantity,
      unit: harvest.unit
    });

    // ============ VALIDATION 3: Check if harvest already in another active auction ============
    console.log('🔍 Kiểm tra harvest đã có auction khác...');
    const hasActiveAuction = await checkHarvestHasActiveAuction(harvestId);
    
    if (hasActiveAuction) {
      const error = `❌ Harvest này đã có đấu giá khác đang hoạt động`;
      console.error('[createAuctionHarvest]', error);
      throw new Error(error);
    }
    
    console.log('✅ Harvest không có auction khác');

    // ============ VALIDATION 4: Data format check ============
    console.log('🔍 Kiểm tra format dữ liệu...');
    
    if (typeof auctionSessionId !== 'string' || auctionSessionId.trim() === '') {
      throw new Error('❌ auctionSessionId phải là string không rỗng');
    }
    
    if (typeof harvestId !== 'string' || harvestId.trim() === '') {
      throw new Error('❌ harvestId phải là string không rỗng');
    }

    console.log('✅ Format dữ liệu hợp lệ');

    // ============ API CALL with enhanced error logging ============
    console.log('📡 Gửi request tới API...');
    console.log('Request body:', JSON.stringify(auctionHarvestData));
    
    const response = await fetch(`${API_URL}/auction-service/auctionharvest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(auctionHarvestData),
    });

    console.log('Response status:', response.status);

    const text = await response.text();
    console.log('Response text length:', text.length);
    
    let data;
    
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('JSON parse error:', e);
      console.error('Raw response:', text);
      throw new Error(`Invalid response format from server: ${text.substring(0, 100)}`);
    }

    if (!response.ok) {
      console.error('API returned error:', {
        status: response.status,
        message: data.message,
        errors: data.errors,
      });
      
      // Lấy error message cụ thể từ errors array hoặc message
      let errorMessage = data.message || 'Failed to create auction harvest';
      
      // Nếu có error array, lấy error đầu tiên
      if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
        errorMessage = data.errors[0];
      }
      
      // Dịch error message sang Tiếng Việt
      const translatedMessage = translateErrorMessage(errorMessage);
      console.error('📋 Translated error:', translatedMessage);
      
      throw new Error(translatedMessage);
    }

    console.log('✅ Auction harvest tạo thành công');
    return data.data;
  } catch (error: any) {
    console.error('❌ [createAuctionHarvest] Error:', error.message);
    throw error;
  }
};

// Update auction session status
export const updateAuctionSessionStatus = async (auctionSessionId: string, status: 'Draft' | 'Pending'): Promise<AuctionSession> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const statusValue = status === 'Draft' ? 0 : 1; // 0 = Draft, 1 = Pending
    console.log('Updating auction session status:', { auctionSessionId, status, statusValue });
    const response = await fetch(`${API_URL}/auction-service/englishauction/${auctionSessionId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: statusValue }),
    });

    const text = await response.text();
    let data;
    
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('JSON parse error:', e);
      throw new Error('Invalid response format from server');
    }

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update auction session status');
    }

    console.log('Auction session status updated successfully');
    return data.data;
  } catch (error) {
    console.error('Error updating auction session status:', error);
    throw error;
  }
};

// Calculate total quantity from harvest grades
export const calculateTotalQuantity = (harvestGradeDetails: CurrentHarvest['harvestGradeDetailDTOs']): number => {
  return harvestGradeDetails.reduce((total, grade) => total + grade.quantity, 0);
};

// New interfaces for farmer auction management
export interface FarmerAuction {
  id: string;
  publishDate: string;
  endDate: string;
  farmerId: string;
  sessionCode: string;
  startingPrice: number;
  currentPrice: number | null;
  winningPrice: number | null;
  minBidIncrement: number;
  enableBuyNow: boolean;
  buyNowPrice: number | null;
  enableAntiSniping: boolean;
  antiSnipingExtensionSeconds: number | null;
  status: 'Draft' | 'Pending' | 'Rejected' | 'Approved' | 'OnGoing' | 'Completed' | 'NoWinner' | 'Cancelled';
  winnerId: string | null;
  note: string;
  expectedHarvestDate: string;
  expectedTotalQuantity: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface AuctionSessionHarvest {
  auctionSessionId: string;
  harvestId: string;
}

export interface HarvestDetail {
  id: string;
  farmId?: string;
  cropId?: string;
  cropID?: string; // Some APIs might use this format
  harvestDate: string | null;
  startDate?: string;
  quantity?: number;
  totalQuantity?: number;
  quality?: string;
  status?: number;
  unit?: string;
  note?: string;
  salePrice?: number;
  createdAt: string;
  updatedAt: string | null;
  harvestGradeDetailDTOs?: Array<{
    id: string;
    grade: 1 | 2 | 3;
    quantity: number;
    unit: string;
    harvestID: string;
    createdAt: string;
    updatedAt: string | null;
  }>;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: T;
}

/**
 * Get farmer's auctions
 */
export const getFarmerAuctions = async (): Promise<FarmerAuction[]> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${API_URL}/auction-service/englishauction/farmer/my-auctions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const text = await response.text();
    if (!text || text.trim() === '') {
      console.log('Empty response, returning empty array');
      return [];
    }

    let result: ApiResponse<FarmerAuction[]>;
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return [];
    }

    if (!response.ok) {
      console.error('API error:', result.message || 'Failed to fetch auctions');
      return [];
    }

    if (result.isSuccess && result.data && Array.isArray(result.data)) {
      return result.data;
    }

    return [];
  } catch (error) {
    console.error('Get farmer auctions error:', error);
    return [];
  }
};

/**
 * Get auction session harvests
 */
export const getAuctionSessionHarvests = async (auctionSessionId: string): Promise<AuctionSessionHarvest[]> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('No access token found');
    }

    const response = await fetch(`${API_URL}/auction-service/auctionsession/${auctionSessionId}/harvest`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const text = await response.text();
    if (!text || text.trim() === '') {
      console.log('Empty response, returning empty array');
      return [];
    }

    let result: ApiResponse<AuctionSessionHarvest[]>;
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return [];
    }

    if (!response.ok) {
      console.error('API error:', result.message || 'Failed to fetch auction session harvests');
      return [];
    }

    if (result.isSuccess && result.data && Array.isArray(result.data)) {
      return result.data;
    }

    return [];
  } catch (error) {
    console.error('Get auction session harvests error:', error);
    return [];
  }
};

/**
 * Get harvest details by harvest ID
 */
export const getHarvestById = async (harvestId: string): Promise<HarvestDetail | null> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('No access token found');
    }

    console.log(`Fetching harvest details for ID: ${harvestId}`);
    const response = await fetch(`${API_URL}/farm-service/harvest/${harvestId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Harvest API response status: ${response.status}`);
    const text = await response.text();
    // console.log(`Harvest API response text length: ${text?.length || 0}`);
    
    if (!text || text.trim() === '') {
      console.log('Empty response for harvest:', harvestId);
      return null;
    }

    let result: ApiResponse<HarvestDetail>;
    try {
      result = JSON.parse(text);
      console.log('Parsed harvest result:', {
        isSuccess: result.isSuccess,
        statusCode: result.statusCode,
        hasData: !!result.data,
        dataKeys: result.data ? Object.keys(result.data) : []
      });
    } catch (parseError) {
      // console.error('JSON parse error for harvest:', parseError);
      // console.error('Raw response text:', text);
      return null;
    }

    if (!response.ok) {
      console.error('Harvest API error:', result.message || 'Failed to fetch harvest');
      console.error('Full error response:', result);
      return null;
    }

    if (result.isSuccess && result.data) {
      console.log('Harvest data retrieved successfully:', {
        id: result.data.id,
        cropId: result.data.cropId,
        hasGradeDetails: !!result.data.harvestGradeDetailDTOs,
        gradeDetailsCount: result.data.harvestGradeDetailDTOs?.length || 0
      });
      return result.data;
    }

    console.log('No harvest data in successful response:', result);
    return null;
  } catch (error) {
    console.error('Get harvest by ID error:', error);
    return null;
  }
};

/**
 * Helper function to get auction with its harvests
 */
export const getAuctionWithHarvests = async (auction: FarmerAuction) => {
  try {
    const sessionHarvests = await getAuctionSessionHarvests(auction.id);
    const harvestDetails = await Promise.all(
      sessionHarvests.map(sh => getHarvestById(sh.harvestId))
    );
    
    return {
      ...auction,
      harvests: harvestDetails.filter(h => h !== null)
    };
  } catch (error) {
    console.error('Error getting auction with harvests:', error);
    return {
      ...auction,
      harvests: []
    };
  }
};

/**
 * Helper function to format auction status for display
 */
export const getAuctionStatusInfo = (status: string) => {
  switch (status) {
    case 'Draft':
      return {
        name: 'Nháp',
        color: '#6B7280',
        backgroundColor: '#F3F4F6'
      };
    case 'Pending':
      return {
        name: 'Chờ duyệt',
        color: '#F59E0B',
        backgroundColor: '#FEF3C7'
      };
    case 'Rejected':
      return {
        name: 'Bị từ chối',
        color: '#DC2626',
        backgroundColor: '#FEE2E2'
      };
    case 'Approved':
      return {
        name: 'Đã duyệt',
        color: '#059669',
        backgroundColor: '#D1FAE5'
      };
    case 'OnGoing':
      return {
        name: 'Đang diễn ra',
        color: '#0891B2',
        backgroundColor: '#CFFAFE'
      };
    case 'Completed':
      return {
        name: 'Hoàn thành',
        color: '#2563EB',
        backgroundColor: '#DBEAFE'
      };
    case 'NoWinner':
      return {
        name: 'Không có người thắng',
        color: '#7C3AED',
        backgroundColor: '#EDE9FE'
      };
    case 'Cancelled':
      return {
        name: 'Đã hủy',
        color: '#DC2626',
        backgroundColor: '#FEE2E2'
      };
    default:
      return {
        name: status,
        color: '#6B7280',
        backgroundColor: '#F3F4F6'
      };
  }
};

/**
 * Filter auctions by status
 */
export const filterAuctionsByStatus = (auctions: FarmerAuction[], status: string | null): FarmerAuction[] => {
  if (!status || status === 'All') {
    return auctions;
  }
  
  return auctions.filter(auction => auction.status === status);
};

/**
 * Get auctions by status for wholesaler (OnGoing auctions)
 */
export const getAuctionsByStatus = async (
  status: string = 'OnGoing',
  pageNumber: number = 1,
  pageSize: number = 10
): Promise<any> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const url = `${API_URL}/auction-service/englishauction?status=${status}&pageNumber=${pageNumber}&pageSize=${pageSize}`;
    console.log('Fetching auctions with status:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch auctions: ${response.statusText}`);
    }

    const data = await response.json();
    // console.log('Auctions fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error fetching auctions by status:', error);
    throw error;
  }
};

/**
 * Get auction detail with farm, crop, harvest, and grade information
 */
export const getAuctionDetail = async (auctionId: string): Promise<any> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    // Get full auction detail including harvests using fetchWithTokenRefresh
    const response = await fetchWithTokenRefresh(
      `${API_URL}/auction-service/englishauction/${auctionId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      // Xử lý 404 im lặng (escrow từ buy request không có auction)
      if (response.status === 404) {
        console.log('Auction not found (404), this is expected for buy request escrows');
        return null;
      }
      throw new Error(`Failed to get auction detail: ${response.status}`);
    }

    const data = await response.json();
    return data.data; // Returns full auction object including harvests array
  } catch (error: any) {
    // Nếu là lỗi 404, chỉ log info và return null thay vì throw
    if (error.message?.includes('404')) {
      console.log('Auction not found, this is expected for buy request escrows');
      return null;
    }
    // Các lỗi khác vẫn throw
    console.error('Error getting auction detail:', error);
    throw error;
  }
};

/**
 * Check if a harvest has an active auction
 * Active auction statuses: 'Pending', 'Approved', 'OnGoing'
 */
export const checkHarvestHasActiveAuction = async (harvestId: string): Promise<boolean> => {
  try {
    // Get all farmer auctions
    const auctions = await getFarmerAuctions();
    
    // Filter active auctions
    const activeAuctions = auctions.filter(auction => 
      auction.status === 'Pending' || 
      auction.status === 'Approved' || 
      auction.status === 'OnGoing'
    );
    
    // Check each active auction for the harvest
    for (const auction of activeAuctions) {
      const sessionHarvests = await getAuctionSessionHarvests(auction.id);
      const hasHarvest = sessionHarvests.some(sh => sh.harvestId === harvestId);
      if (hasHarvest) {
        console.log(`Harvest ${harvestId} has active auction:`, auction.id, auction.status);
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking harvest active auction:', error);
    // Return false to allow operations on error (fail-open approach)
    return false;
  }
};

/**
 * Check if any harvest from a crop has an active auction
 * Used to block creation of new harvests when crop has active auctions
 * Active auction statuses: 'Pending', 'Approved', 'OnGoing'
 */
export const checkCropHasActiveAuction = async (cropId: string): Promise<boolean> => {
  try {
    // Get all farmer auctions
    const auctions = await getFarmerAuctions();
    
    // Filter active auctions
    const activeAuctions = auctions.filter(auction => 
      auction.status === 'Pending' || 
      auction.status === 'Approved' || 
      auction.status === 'OnGoing'
    );
    
    // Check each active auction's harvests for matching crop
    for (const auction of activeAuctions) {
      const sessionHarvests = await getAuctionSessionHarvests(auction.id);
      
      // Check each harvest to see if it belongs to the crop
      for (const sessionHarvest of sessionHarvests) {
        const harvestDetail = await getHarvestById(sessionHarvest.harvestId);
        if (harvestDetail && (harvestDetail.cropId === cropId || harvestDetail.cropID === cropId)) {
          console.log(`Crop ${cropId} has active auction:`, auction.id, auction.status);
          return true;
        }
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error checking crop active auction:', error);
    // Return false to allow operations on error (fail-open approach)
    return false;
  }
};
