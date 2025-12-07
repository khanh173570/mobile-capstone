import { fetchWithTokenRefresh } from './authService';

const AUCTION_API = 'https://gateway.a-379.store/api/auction-service';

export interface BuyNowResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: {
    id: string;
    publishDate: string;
    endDate: string;
    farmerId: string;
    sessionCode: string;
    startingPrice: number;
    currentPrice: number;
    winningPrice: number;
    minBidIncrement: number;
    enableBuyNow: boolean;
    buyNowPrice: number;
    enableAntiSniping: boolean;
    antiSnipingExtensionSeconds: number;
    status: string;
    winnerId: string;
    note: string;
    expectedHarvestDate: string;
    expectedTotalQuantity: number;
    createdAt: string;
    updatedAt: string;
    harvests: any[];
  };
}

/**
 * Execute Buy Now for an auction
 * @param auctionId - The auction ID to buy now
 */
export const executeBuyNow = async (auctionId: string): Promise<any> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${AUCTION_API}/englishauction/${auctionId}/buynow`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to execute buy now');
    }

    const result: BuyNowResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error executing buy now:', error);
    throw error;
  }
};

/**
 * Get escrow record by auction ID
 * @param auctionId - The auction ID
 */
export const getEscrowByAuctionId = async (auctionId: string): Promise<any> => {
  try {
    const response = await fetchWithTokenRefresh(
      `https://gateway.a-379.store/api/payment-service/escrow/auction/${auctionId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch escrow record');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching escrow:', error);
    throw error;
  }
};

/**
 * Get payment URL from PayOS
 * @param escrowId - The escrow ID
 */
export const getPaymentUrl = async (escrowId: string): Promise<string> => {
  try {
    const response = await fetchWithTokenRefresh(
      `https://gateway.a-379.store/api/payment-service/payos/paymenturl?escrow=${escrowId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to get payment URL');
    }

    const result = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error getting payment URL:', error);
    throw error;
  }
};

/**
 * Get all wholesaler escrow records
 */
export const getWholesalerEscrows = async (): Promise<any[]> => {
  try {
    const response = await fetchWithTokenRefresh(
      'https://gateway.a-379.store/api/payment-service/escrow/wholesaler',
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch wholesaler escrows');
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching wholesaler escrows:', error);
    throw error;
  }
};
