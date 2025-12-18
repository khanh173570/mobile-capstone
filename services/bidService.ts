import { fetchWithTokenRefresh } from './authService';

const API_BASE_URL = 'https://gateway.a-379.store/api';

export interface CreateBidRequest {
  isAutoBid: boolean;
  autoBidMaxLimit?: number;
  auctionSessionId: string;
}

export interface UpdateBidRequest {
  auctionSessionId: string;
  bidAmount: number;
}

export interface BidResponse {
  userId: string;
  bidAmount: number;
  isAutoBid: boolean;
  autoBidMaxLimit: number;
  isWinning: boolean;
  isCancelled: boolean;
  auctionSessionId: string;
}

export interface BidApiResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: BidResponse | BidResponse[];
}

/**
 * Calculate minimum valid autoBidMaxLimit
 * Formula: currentPrice + n * minBidIncrement
 * where n >= 1
 */
export const calculateMinAutoBidLimit = (
  currentPrice: number,
  minBidIncrement: number,
  steps: number = 1
): number => {
  return currentPrice + steps * minBidIncrement;
};

/**
 * Get current user's bids for a specific auction
 */
export const getBidsForAuction = async (auctionSessionId: string): Promise<BidResponse[]> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_BASE_URL}/auction-service/bid/my-bids/auction/${auctionSessionId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch bids');
    }

    return Array.isArray(data.data) ? data.data : [];
  } catch (error) {
    console.error('Error fetching bids:', error);
    throw error;
  }
};

/**
 * Bid Log interface matching API response
 */
export interface BidLog {
  id: string;
  bidId: string;
  userId: string;
  userName: string;
  type: string; // 'Created' or 'Updated'
  isAutoBidding: boolean;
  dateTimeUpdate: string;
  oldEntity: string; // JSON string
  newEntity: string; // JSON string
  createdAt: string;
  updatedAt: string | null;
}

/**
 * Get all bids for a specific auction (for viewing bid logs)
 */
export const getAllBidsForAuction = async (auctionSessionId: string): Promise<BidLog[]> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_BASE_URL}/auction-service/bidlog/auction/${auctionSessionId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch bid logs');
    }

    // Parse oldEntity and newEntity from JSON strings
    const bidLogs: BidLog[] = Array.isArray(data.data) ? data.data : [];
    
    // No need to parse - API already returns parsed objects
    // The oldEntity and newEntity are already JSON strings as per the interface
    return bidLogs;
  } catch (error) {
    console.error('Error fetching bid logs:', error);
    throw error;
  }
};

/**
 * Calculate minimum valid bid amount
 * Formula: currentPrice + n * minBidIncrement
 * where n >= 1
 */
export const calculateMinBidAmount = (
  currentPrice: number,
  minBidIncrement: number,
  steps: number = 1
): number => {
  return currentPrice + steps * minBidIncrement;
};

/**
 * Validate bid amount (for manual bid)
 */
export const validateBidAmount = (
  bidAmount: number,
  currentPrice: number,
  minBidIncrement: number
): { isValid: boolean; minAmount: number; message?: string } => {
  const minAmount = calculateMinBidAmount(currentPrice, minBidIncrement);
  
  if (bidAmount < minAmount) {
    return {
      isValid: false,
      minAmount,
      message: `Giá đặt phải >= ${minAmount.toLocaleString('vi-VN')} (Giá hiện tại + ${minBidIncrement.toLocaleString('vi-VN')})`
    };
  }

  // Check that it aligns with bid increment
  const remainder = (bidAmount - currentPrice) % minBidIncrement;
  if (remainder !== 0) {
    const adjustedAmount = bidAmount - remainder + minBidIncrement;
    return {
      isValid: false,
      minAmount: adjustedAmount,
      message: `Giá đặt phải là bội số của bước giá. Giá trị gợi ý: ${adjustedAmount.toLocaleString('vi-VN')}`
    };
  }

  return { isValid: true, minAmount };
};

/**
 * Validate autoBidMaxLimit
 */
export const validateAutoBidLimit = (
  autoBidMaxLimit: number,
  currentPrice: number,
  minBidIncrement: number
): { isValid: boolean; minLimit: number; message?: string } => {
  const minLimit = calculateMinAutoBidLimit(currentPrice, minBidIncrement);
  
  if (autoBidMaxLimit < minLimit) {
    return {
      isValid: false,
      minLimit,
      message: `Giá tối đa phải >= ${minLimit.toLocaleString('vi-VN')} (Giá hiện tại + ${minBidIncrement.toLocaleString('vi-VN')})`
    };
  }

  // Also check that it aligns with bid increment
  const remainder = (autoBidMaxLimit - currentPrice) % minBidIncrement;
  if (remainder !== 0) {
    const adjustedLimit = autoBidMaxLimit - remainder + minBidIncrement;
    return {
      isValid: false,
      minLimit: adjustedLimit,
      message: `Giá tối đa phải là bội số của bước giá. Giá trị gợi ý: ${adjustedLimit.toLocaleString('vi-VN')}`
    };
  }

  return { isValid: true, minLimit };
};

/**
 * Create a bid for an auction
 */
export const createBid = async (request: CreateBidRequest): Promise<BidApiResponse> => {
  try {
    // Prepare request body - only 3 fields for create
    const body: any = {
      isAutoBid: request.isAutoBid,
      auctionSessionId: request.auctionSessionId,
    };
    
    // Auto bid: add autoBidMaxLimit
    if (request.isAutoBid && request.autoBidMaxLimit) {
      body.autoBidMaxLimit = request.autoBidMaxLimit;
    }
    // Manual bid: no additional fields needed

    console.log('📤 bidService: Sending createBid request to', `${API_BASE_URL}/auction-service/bid`);
    console.log('   Request type:', request.isAutoBid ? 'AUTO BID' : 'MANUAL BID');
    console.log('   Body:', JSON.stringify(body, null, 2));
    console.log('   Body types:', {
      isAutoBid: typeof body.isAutoBid,
      auctionSessionId: typeof body.auctionSessionId,
      autoBidMaxLimit: typeof body.autoBidMaxLimit,
      autoBidMaxLimitValue: body.autoBidMaxLimit,
      isAutoBidMaxLimitNumber: typeof body.autoBidMaxLimit === 'number',
    });

    const response = await fetchWithTokenRefresh(
      `${API_BASE_URL}/auction-service/bid`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();

    console.log('📥 bidService: createBid response received');
    console.log('   Status:', response.status);
    console.log('   isSuccess:', data.isSuccess);
    console.log('   Message:', data.message);
    console.log('   Errors:', data.errors);
    console.log('   Data:', data.data);

    if (!response.ok) {
      console.error('❌ createBid failed:', data.message);
      console.error('   Errors:', data.errors);
      
      // Create error with detailed message including errors array
      const error: any = new Error(data.message || 'Failed to create bid');
      error.cause = {
        errors: data.errors || [],
        statusCode: data.statusCode,
      };
      throw error;
    }

    console.log('✅ createBid succeeded!');
    return data;
  } catch (error) {
    // console.error('❌ Error creating bid:', error);
    throw error;
  }
};

/**
 * Update bid amount
 */
export const updateBid = async (request: UpdateBidRequest): Promise<BidApiResponse> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_BASE_URL}/auction-service/bid`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update bid');
    }

    return data;
  } catch (error) {
    console.error('Error updating bid:', error);
    throw error;
  }
};

/**
 * Get bid suggestions for better UX
 */
export const getBidSuggestions = (
  currentPrice: number,
  minBidIncrement: number,
  count: number = 5
): number[] => {
  const suggestions: number[] = [];
  for (let i = 1; i <= count; i++) {
    suggestions.push(currentPrice + i * minBidIncrement);
  }
  return suggestions;
};
