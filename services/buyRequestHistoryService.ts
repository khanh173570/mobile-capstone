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

export const getBuyRequestHistory = async (status?: string): Promise<BuyRequest[]> => {
  try {
    const url = status
      ? `${API_BASE_URL}/buyrequest/my-requests?status=${status}`
      : `${API_BASE_URL}/buyrequest/my-requests`;

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
