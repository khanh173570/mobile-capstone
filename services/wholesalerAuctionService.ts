import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

export interface WholesalerAuction {
  id: string;
  publishDate: string;
  endDate: string;
  farmerId: string;
  sessionCode: string;
  startingPrice: number;
  currentPrice: number;
  winningPrice: number | null;
  minBidIncrement: number;
  enableBuyNow: boolean;
  buyNowPrice: number | null;
  enableAntiSniping: boolean;
  antiSnipingExtensionSeconds: number | null;
  status: string;
  winnerId: string | null;
  note: string;
  expectedHarvestDate: string;
  expectedTotalQuantity: number;
  createdAt: string;
  updatedAt: string;
  harvests: any[];
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: T;
}

/**
 * Get wholesaler's participated auctions
 */
export const getWholesalerAuctions = async (): Promise<WholesalerAuction[]> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    const response = await fetch(`${API_URL}/auction-service/englishauction/wholesaler/my-auctions`, {
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

    let result: ApiResponse<WholesalerAuction[]>;
    try {
      result = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return [];
    }

    if (!response.ok) {
      console.error('API error:', result.message || 'Failed to fetch wholesaler auctions');
      throw new Error(result.message || 'Không thể tải lịch sử đấu thầu');
    }

    if (result.isSuccess && result.data && Array.isArray(result.data)) {
      return result.data;
    }

    return [];
  } catch (error) {
    console.error('Get wholesaler auctions error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Đã xảy ra lỗi khi tải lịch sử đấu thầu');
  }
};

/**
 * Get auction status display info
 */
export const getAuctionStatusInfo = (status: string): { label: string; color: string; backgroundColor: string } => {
  const statusMap: { [key: string]: { label: string; color: string; backgroundColor: string } } = {
    'Draft': {
      label: 'Nháp',
      color: '#6B7280',
      backgroundColor: '#F3F4F6',
    },
    'Pending': {
      label: 'Chờ duyệt',
      color: '#F59E0B',
      backgroundColor: '#FEF3C7',
    },
    'Active': {
      label: 'Đang diễn ra',
      color: '#22C55E',
      backgroundColor: '#D1FAE5',
    },
    'Completed': {
      label: 'Hoàn thành',
      color: '#3B82F6',
      backgroundColor: '#DBEAFE',
    },
    'Cancelled': {
      label: 'Đã hủy',
      color: '#EF4444',
      backgroundColor: '#FEE2E2',
    },
    'NoWinner': {
      label: 'Không có người thắng',
      color: '#9CA3AF',
      backgroundColor: '#F3F4F6',
    },
  };

  return statusMap[status] || {
    label: status,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
  };
};

/**
 * Format price to VND
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
};

/**
 * Check if user is the winner
 */
export const isWinner = (auction: WholesalerAuction, userId: string): boolean => {
  return auction.winnerId === userId && auction.status === 'Completed';
};
