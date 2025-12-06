import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { fetchWithTokenRefresh } from './authService';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

export interface Wallet {
  id: string;
  userId: string;
  isSystemWallet: boolean;
  balance: number;
  walletStatus: number;
  currency: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface Ledger {
  id: string;
  walletId: string;
  transactionId: string;
  direction: number; // 1: Nạp tiền (In), 0: Rút tiền (Out)
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface LedgersResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: Ledger[];
}

export interface WalletResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: Wallet;
}

export interface AddFundsUrlResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: string; // Payment URL
}

/**
 * Get user's wallet information
 */
export const getMyWallet = async (): Promise<Wallet> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_URL}/payment-service/wallet/my-wallet`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result: WalletResponse = await response.json();

    if (!result.isSuccess) {
      throw new Error(result.message || 'Failed to get wallet information');
    }

    return result.data;
  } catch (error) {
    console.error('Error getting wallet:', error);
    throw error;
  }
};

/**
 * Get payment URL for adding funds to wallet
 */
export const getAddFundsUrl = async (
  userId: string,
  amount: number
): Promise<string> => {
  try {
    console.log('Getting add funds URL for userId:', userId, 'amount:', amount);
    
    const url = `${API_URL}/payment-service/payos/addfunds-url?userId=${userId}&amount=${amount}`;
    console.log('Request URL:', url);
    
    const response = await fetchWithTokenRefresh(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Response status:', response.status);

    const result: AddFundsUrlResponse = await response.json();
    console.log('Response data:', result);

    if (!result.isSuccess) {
      throw new Error(result.message || 'Failed to get payment URL');
    }

    return result.data;
  } catch (error: any) {
    console.error('Error getting add funds URL:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    // Provide more specific error message
    if (error.response?.status === 404) {
      throw new Error('Endpoint nạp tiền chưa khả dụng. Vui lòng liên hệ hỗ trợ.');
    }
    
    throw error;
  }
};

/**
 * Get my wallet ledgers (transaction history)
 */
export const getMyLedgers = async (): Promise<Ledger[]> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_URL}/payment-service/ledger/my-ledgers`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result: LedgersResponse = await response.json();

    if (!result.isSuccess) {
      throw new Error(result.message || 'Failed to get ledgers');
    }

    return result.data || [];
  } catch (error: any) {
    console.error('Error getting ledgers:', error);
    throw error;
  }
};

/**
 * Get ledger direction name
 */
export const getLedgerDirectionName = (direction: number): string => {
  return direction === 1 ? 'Nạp tiền' : 'Rút tiền';
};

/**
 * Get ledger direction color
 */
export const getLedgerDirectionColor = (direction: number): string => {
  return direction === 1 ? '#10B981' : '#EF4444'; // Green for in, Red for out
};

/**
 * Get wallet status name
 */
export const getWalletStatusName = (status: number): string => {
  switch (status) {
    case 0:
      return 'Hoạt động';
    case 1:
      return 'Bị khóa';
    case 2:
      return 'Tạm ngưng';
    default:
      return 'Không xác định';
  }
};

/**
 * Get wallet status color
 */
export const getWalletStatusColor = (status: number): string => {
  switch (status) {
    case 0:
      return '#10B981'; // Green - Active
    case 1:
      return '#EF4444'; // Red - Locked
    case 2:
      return '#F59E0B'; // Yellow - Suspended
    default:
      return '#6B7280'; // Gray - Unknown
  }
};

/**
 * Format currency amount
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};
