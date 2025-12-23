import { fetchWithTokenRefresh } from './authService';

const API_BASE_URL = 'https://gateway.a-379.store/api/auction-service';

export interface BuyRequestDetail {
  id: string;
  buyRequestId: string;
  grade: number;
  quantity: number;
  price: number;
  allowedDeviationPercent: number;
  unit: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface BuyRequest {
  id: string;
  requiredDate: string;
  expectedPrice: number;
  message: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Completed' | 'Canceled';
  isBuyingBulk: boolean;
  totalQuantity: number;
  wholesalerId: string;
  harvestId: string;
  farmerId: string;
  details: BuyRequestDetail[];
  createdAt: string;
  updatedAt: string | null;
}

export interface BuyRequestHistoryResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: null | string[];
  data: BuyRequest[];
}

export interface BuyRequestHistoryFilters {
  status?: string;
  district?: string;
  typeName?: string;
  fromStartDate?: string;
  toStartDate?: string;
  minTotalQuantity?: number;
  maxTotalQuantity?: number;
  orderBy?: string;
  sortType?: string;
}

export const getBuyRequestHistory = async (filters?: BuyRequestHistoryFilters | string): Promise<BuyRequest[]> => {
  try {
    let url = `${API_BASE_URL}/buyrequest/my-requests`;
    
    // Support backward compatibility with string status parameter
    if (typeof filters === 'string') {
      url += `?status=${filters}`;
    } else if (filters) {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.district) params.append('District', filters.district);
      if (filters.typeName) params.append('TypeName', filters.typeName);
      if (filters.fromStartDate) params.append('FromStartDate', filters.fromStartDate);
      if (filters.toStartDate) params.append('ToStartDate', filters.toStartDate);
      if (filters.minTotalQuantity) params.append('MinTotalQuantity', filters.minTotalQuantity.toString());
      if (filters.maxTotalQuantity) params.append('MaxTotalQuantity', filters.maxTotalQuantity.toString());
      if (filters.orderBy) params.append('OrderBy', filters.orderBy);
      if (filters.sortType) params.append('SortType', filters.sortType);
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
    }

    const response = await fetchWithTokenRefresh(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result: BuyRequestHistoryResponse = await response.json();

    if (result.isSuccess && result.data) {
      return result.data;
    }

    return [];
  } catch (error) {
    console.error('Error fetching buy request history:', error);
    throw error;
  }
};

export const getAllBuyRequests = async (): Promise<BuyRequest[]> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_BASE_URL}/buyrequest/my-requests`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result: BuyRequestHistoryResponse = await response.json();

    if (result.isSuccess && result.data) {
      return result.data;
    }

    return [];
  } catch (error) {
    console.error('Error fetching all buy requests:', error);
    throw error;
  }
};
