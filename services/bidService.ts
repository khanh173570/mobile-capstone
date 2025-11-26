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
 * Get bids for a specific auction
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
    // Prepare request body - only include autoBidMaxLimit if isAutoBid is true
    const body = {
      isAutoBid: request.isAutoBid,
      auctionSessionId: request.auctionSessionId,
      ...(request.isAutoBid && { autoBidMaxLimit: request.autoBidMaxLimit }),
    };

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

    if (!response.ok) {
      throw new Error(data.message || 'Failed to create bid');
    }

    return data;
  } catch (error) {
    console.error('Error creating bid:', error);
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
