import { getCurrentUser, fetchWithTokenRefresh } from './authService';

const API_BASE_URL = 'https://gateway.a-379.store/api/auction-service';
const AUTH_API_BASE_URL = 'https://gateway.a-379.store/api/auth';

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

export interface WholesalerInfo {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  communes: string;
  province: string;
  phoneNumber: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface FarmerBuyRequest {
  id: string;
  requiredDate: string;
  expectedPrice: number;
  message: string;
  status: 'Pending' | 'Accepted' | 'Rejected' | 'Completed' | 'Cancelled';
  isBuyingBulk: boolean;
  totalQuantity: number;
  wholesalerId: string;
  harvestId: string;
  farmerId: string;
  details: BuyRequestDetail[];
  createdAt: string;
  updatedAt: string | null;
}

export interface BuyRequestListResponse {
  items: FarmerBuyRequest[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  previousPage: boolean;
  nextPage: boolean;
}

export const getFarmerBuyRequests = async (
  pageNumber: number = 1,
  pageSize: number = 10,
  sortBy: string = 'createdAt'
): Promise<BuyRequestListResponse> => {
  try {
    const user = await getCurrentUser();
    if (!user?.id) {
      throw new Error('User not found');
    }

    const response = await fetchWithTokenRefresh(
      `${API_BASE_URL}/buyrequest/farmer/${user.id}?pageNumber=${pageNumber}&pageSize=${pageSize}&sortBy=${sortBy}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (result.isSuccess) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch buy requests');
    }
  } catch (error) {
    console.error('Error fetching farmer buy requests:', error);
    throw error;
  }
};

export const updateBuyRequestStatus = async (
  buyRequestId: string,
  status: 'Accepted' | 'Rejected'
): Promise<void> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_BASE_URL}/buyrequest/${buyRequestId}/status`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.isSuccess) {
      throw new Error(result.message || 'Failed to update buy request status');
    }
  } catch (error) {
    console.error('Error updating buy request status:', error);
    throw error;
  }
};

export const getBuyRequestById = async (buyRequestId: string): Promise<FarmerBuyRequest> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_BASE_URL}/buyrequest/${buyRequestId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (result.isSuccess) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch buy request');
    }
  } catch (error) {
    console.error('Error fetching buy request:', error);
    throw error;
  }
};

export const getWholesalerInfo = async (userId: string): Promise<WholesalerInfo> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${AUTH_API_BASE_URL}/username?userId=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (result.isSuccess) {
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to fetch wholesaler info');
    }
  } catch (error) {
    console.error('Error fetching wholesaler info:', error);
    throw error;
  }
};
