import { fetchWithTokenRefresh } from './authService';

const PAYMENT_API = 'https://gateway.a-379.store/api/payment-service';

export interface EscrowContract {
  id: string;
  auctionId: string;
  sessionCode?: string; // Auction session code for display
  buyRequestId: string | null;
  winnerId: string;
  winnerWalletId: string;
  farmerId: string;
  farmerWalletId: string;
  totalAmount: number;
  feeAmount: number;
  sellerReceiveAmount: number;
  escrowAmount: number;
  escrowStatus: number;
  paymentTransactionId: string | null;
  paymentAt: string | null;
  releasedTransactioId: string | null;
  releasedAt: string | null;
  refundTransactionId: string | null;
  refundAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface EscrowListResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: EscrowContract[];
}

export interface EscrowDetailResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: EscrowContract;
}

export interface PaymentUrlResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: string;
}

/**
 * Get all escrow contracts for farmer
 */
export const getFarmerEscrows = async (): Promise<EscrowContract[]> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${PAYMENT_API}/escrow/farmer`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch farmer escrows');
    }

    const result: EscrowListResponse = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching farmer escrows:', error);
    throw error;
  }
};

/**
 * Get all escrow contracts for wholesaler
 */
export const getWholesalerEscrows = async (): Promise<EscrowContract[]> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${PAYMENT_API}/escrow/wholesaler`,
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

    const result: EscrowListResponse = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching wholesaler escrows:', error);
    throw error;
  }
};

/**
 * Get escrow detail by auction ID
 */
export const getEscrowByAuctionId = async (auctionId: string): Promise<EscrowContract> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${PAYMENT_API}/escrow/auction/${auctionId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch escrow detail');
    }

    const result: EscrowDetailResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error fetching escrow detail:', error);
    throw error;
  }
};

/**
 * Set escrow status to ReadyToHarvest (2)
 * Only callable by farmer
 */
export const setEscrowReadyToHarvest = async (escrowId: string): Promise<boolean> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${PAYMENT_API}/escrow/auction/readytoharvest?escrowId=${escrowId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to set escrow ready to harvest');
    }

    const result = await response.json();
    return result.data === true;
  } catch (error) {
    console.error('Error setting escrow ready to harvest:', error);
    throw error;
  }
};

/**
 * Get payment URL for pay remaining escrow
 * Only wholesaler can pay remaining
 */
export const getPayRemainingEscrowUrl = async (escrowId: string): Promise<string> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${PAYMENT_API}/payos/payremainingescrow?escrowId=${escrowId}`,
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

    const result: PaymentUrlResponse = await response.json();
    return result.data;
  } catch (error) {
    console.error('Error getting payment URL:', error);
    throw error;
  }
};

/**
 * Pay remaining escrow amount using wallet
 */
export const payRemainingEscrowWithWallet = async (escrowId: string): Promise<boolean> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${PAYMENT_API}/escrow/payremainingescrow?escrowId=${escrowId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.errors?.[0] || errorData.message || 'Failed to pay remaining escrow');
    }

    const result = await response.json();
    return result.isSuccess;
  } catch (error) {
    console.error('Error paying remaining escrow:', error);
    throw error;
  }
};

/**
 * Format currency
 */
export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('vi-VN') + ' ₫';
};

/**
 * Get escrow status label
 */
export const getEscrowStatusLabel = (status: number): string => {
  switch (status) {
    case 0:
      return 'Chờ thanh toán';
    case 1:
      return 'Đã cọc một phần';
    case 2:
      return 'Sẵn sàng thu hoạch';
    case 3:
      return 'Đã thanh toán đủ';
    case 4:
      return 'Hoàn thành';
    case 5:
      return 'Đang tranh chấp';
    case 6:
      return 'Đã hoàn toàn bộ';
    case 7:
      return 'Hoàn tiền một phần';
    case 8:
      return 'Đã hủy';
    default:
      return 'Không xác định';
  }
};

/**
 * Get escrow status color
 */
export const getEscrowStatusColor = (status: number): string => {
  switch (status) {
    case 0:
      return '#F59E0B'; // Orange - Pending
    case 1:
      return '#3B82F6'; // Blue - Partially Funded
    case 2:
      return '#8B5CF6'; // Purple - Ready to Harvest
    case 3:
      return '#10B981'; // Green - Fully Funded
    case 4:
      return '#059669'; // Dark Green - Completed
    case 5:
      return '#EF4444'; // Red - Disputed
    case 6:
      return '#6B7280'; // Gray - Refunded
    case 7:
      return '#9CA3AF'; // Light Gray - Partial Refund
    case 8:
      return '#D1D5DB'; // Light Gray - Canceled
    default:
      return '#6B7280';
  }
};
