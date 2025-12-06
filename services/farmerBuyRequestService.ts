import { fetchWithTokenRefresh } from './authService';

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

export interface BuyRequestListResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: {
    items: BuyRequest[];
    pageNumber: number;
    pageSize: number;
    totalPages: number;
    totalCount: number;
    previousPage: boolean;
    nextPage: boolean;
  };
}

export async function getFarmerBuyRequests(
  farmerId: string,
  pageNumber: number = 1,
  pageSize: number = 10,
  sortBy: string = 'price'
): Promise<BuyRequest[]> {
  try {
    const url = `${process.env.EXPO_PUBLIC_GATEWAY_URL}/api/auction-service/buyrequest/farmer/${farmerId}?pageNumber=${pageNumber}&pageSize=${pageSize}&sortBy=${sortBy}`;
    console.log('📡 Fetching farmer buy requests from:', url);
    
    const response = await fetchWithTokenRefresh(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      console.error(`❌ Error: ${response.status} - ${response.statusText}`);
      const errorText = await response.text();
      console.error('Error response body:', errorText);
      return [];
    }

    const data: BuyRequestListResponse = await response.json();
    console.log('✅ Buy requests response:', data);
    
    if (data.isSuccess && data.data) {
      console.log(`✅ Loaded ${data.data.items.length} buy requests`);
      return data.data.items;
    }
    
    console.warn('⚠️ Response not successful:', data.message);
    return [];
  } catch (error) {
    console.error('❌ Error fetching farmer buy requests:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return [];
  }
}

export async function getFarmerBuyRequestsWithPagination(
  farmerId: string,
  pageNumber: number = 1,
  pageSize: number = 10,
  sortBy: string = 'price'
): Promise<BuyRequestListResponse['data']> {
  try {
    const url = `${process.env.EXPO_PUBLIC_GATEWAY_URL}/api/auction-service/buyrequest/farmer/${farmerId}?pageNumber=${pageNumber}&pageSize=${pageSize}&sortBy=${sortBy}`;
    
    const response = await fetchWithTokenRefresh(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Error: ${response.status}`);
      return {
        items: [],
        pageNumber: 1,
        pageSize: 10,
        totalPages: 0,
        totalCount: 0,
        previousPage: false,
        nextPage: false,
      };
    }

    const data: BuyRequestListResponse = await response.json();
    
    if (data.isSuccess && data.data) {
      return data.data;
    }
    
    return {
      items: [],
      pageNumber: 1,
      pageSize: 10,
      totalPages: 0,
      totalCount: 0,
      previousPage: false,
      nextPage: false,
    };
  } catch (error) {
    console.error('❌ Error fetching farmer buy requests with pagination:', error);
    throw error;
  }
}
