import { fetchWithTokenRefresh } from './authService';

const FARM_API = 'https://gateway.a-379.store/api/farm-service';
const AUCTION_API = 'https://gateway.a-379.store/api/auction-service';

// Fallback provinces in case API fails
const FALLBACK_PROVINCES: Province[] = [
  { id: '1', name: 'Tây Ninh' },
  { id: '2', name: 'Hồ Chí Minh' },
  { id: '3', name: 'Bình Dương' },
  { id: '4', name: 'Đồng Nai' },
  { id: '5', name: 'Long An' },
];
export interface Province {
  id: string;
  name: string;
}

export interface District {
  id: string;
  name: string;
  provinceId: string;
}

export interface ProvinceResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: Province[];
}

export interface DistrictResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: District[];
}

export interface HarvestGradeDetail {
  id: string;
  grade: number;
  quantity: number;
  unit: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface Harvest {
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
  harvestGradeDetailDTOs: HarvestGradeDetail[];
}

export interface HarvestResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: Harvest[];
}

export interface SearchResult {
  id: string;
  cropID: string;
  harvestDate: string | null;
  startDate: string;
  totalQuantity: number;
  unit: string;
  note: string;
  salePrice: number;
  cropName: string;
  farmerID: string;
  cropArea: number;
  custardAppleTypeName: string;
  custardAppleTypeDescription: string;
  imageUrls: string[];
  district: string;
  province: string;
  address: string;
  createdAt: string;
  updatedAt: string | null;
  harvestGradeDetailDTOs: HarvestGradeDetail[];
}

export interface SearchResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: SearchResult[];
}

export interface BuyRequestDetail {
  grade: number;
  quantity: number;
  price: number;
  allowedDeviationPercent: number;
  unit: string;
}

export interface CreateBuyRequestPayload {
  requiredDate: string;
  expectedPrice: number;
  message: string;
  status: string;
  isBuyingBulk: boolean;
  wholesalerId: string;
  harvestId: string;
  farmerId: string;
  details: BuyRequestDetail[];
}

export interface BuyRequest {
  id: string;
  requiredDate: string;
  expectedPrice: number;
  message: string;
  status: string;
  isBuyingBulk: boolean;
  wholesalerId: string;
  harvestId: string;
  farmerId: string;
  createdAt: string;
  updatedAt: string | null;
  details: BuyRequestDetail[];
}

export interface BuyRequestResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: BuyRequest;
}

/**
 * Search harvests based on filters
 */
export const searchHarvests = async (filters?: {
  District?: string;
  TypeName?: string;
  MinTotalQuantity?: number;
  MaxTotalQuantity?: number;
}): Promise<SearchResult[]> => {
  try {
    let url = `${FARM_API}/harvest/search`;
    
    if (filters) {
      const params = new URLSearchParams();
      if (filters.District) params.append('District', filters.District);
      if (filters.TypeName) params.append('TypeName', filters.TypeName);
      if (filters.MinTotalQuantity) params.append('MinTotalQuantity', filters.MinTotalQuantity.toString());
      if (filters.MaxTotalQuantity) params.append('MaxTotalQuantity', filters.MaxTotalQuantity.toString());
      
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

    const result: SearchResponse = await response.json();

    if (!result.isSuccess) {
      throw new Error(result.message || 'Failed to search harvests');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error searching harvests:', error);
    throw error;
  }
};

/**
 * Get harvests for a specific crop
 */
export const getHarvestsByCrop = async (cropId: string): Promise<Harvest[]> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${FARM_API}/crop/${cropId}/harvest`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result: HarvestResponse = await response.json();

    if (!result.isSuccess) {
      throw new Error(result.message || 'Failed to get harvests');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error fetching harvests:', error);
    throw error;
  }
};

/**
 * Get list of provinces
 */
export const getProvinces = async (): Promise<Province[]> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${FARM_API}/province`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn('Province API error status:', response.status, 'using fallback');
      return FALLBACK_PROVINCES;
    }

    const text = await response.text();
    if (!text) {
      console.warn('Province API returned empty response, using fallback');
      return FALLBACK_PROVINCES;
    }

    try {
      const result: ProvinceResponse = JSON.parse(text);

      if (!result.isSuccess || !result.data) {
        console.warn('Province API error, using fallback');
        return FALLBACK_PROVINCES;
      }

      return result.data;
    } catch (parseError) {
      console.warn('Failed to parse province response, using fallback');
      return FALLBACK_PROVINCES;
    }
  } catch (error) {
    console.error('Error fetching provinces:', error);
    // Use fallback data instead of returning empty
    return FALLBACK_PROVINCES;
  }
};

/**
 * Get list of districts by province ID
 */
export const getDistrictsByProvince = async (provinceId: string): Promise<District[]> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${FARM_API}/province/${provinceId}/district`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.warn('Districts API error status:', response.status);
      return [];
    }

    const text = await response.text();
    if (!text) {
      console.warn('Districts API returned empty response');
      return [];
    }

    try {
      const result: DistrictResponse = JSON.parse(text);

      if (!result.isSuccess || !result.data) {
        console.warn('Districts API error');
        return [];
      }

      return result.data;
    } catch (parseError) {
      console.warn('Failed to parse districts response');
      return [];
    }
  } catch (error) {
    console.error('Error fetching districts:', error);
    return [];
  }
};

/**
 * Create a buy request
 */
export const createBuyRequest = async (
  payload: CreateBuyRequestPayload
): Promise<BuyRequest> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${AUCTION_API}/buyrequest`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const result: BuyRequestResponse = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create buy request');
    }

    return result.data;
  } catch (error) {
    console.error('Error creating buy request:', error);
    throw error;
  }
};

/**
 * Get a single buy request by ID
 */
export const getBuyRequestDetail = async (id: string): Promise<any> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${AUCTION_API}/buyrequest/${id}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch buy request detail');
    }

    const result: BuyRequestResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching buy request detail:', error);
    throw error;
  }
};

/**
 * Get custard apple types (placeholder - returns empty array)
 */
export const getCustardAppleTypes = async (): Promise<any[]> => {
  try {
    // This should return custard apple types from the API
    // For now, returning empty array as a placeholder
    return [];
  } catch (error) {
    console.error('Error fetching custard apple types:', error);
    throw error;
  }
};
