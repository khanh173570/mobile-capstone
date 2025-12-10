import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { fetchWithTokenRefresh } from './authService';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

export interface Transaction {
  id: string;
  code: string;
  desc: string;
  success: boolean;
  orderCode: number;
  amount: number;
  transactionDateTime: string;
  currency: string;
  paymentLinkId: string;
  escrowId: string;
  transactionType: number; // 1: Nạp tiền, 6: Thanh toán cọc, etc
  paymentType: number;
  fromWalletId: string | null;
  toWalletId: string;
  signature: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface Ledger {
  id: string;
  walletId: string;
  transactionId: string;
  direction: number; // 2: Thanh toán (Out), 1: Nạp tiền (In)
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface TransactionResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: Transaction[];
}

export interface TransactionDetailResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: Transaction;
}

export interface LedgerResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: Ledger[];
}

export interface LedgerDetailResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: Ledger;
}

/**
 * Get user's transactions
 */
export const getMyTransactions = async (): Promise<Transaction[]> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_URL}/payment-service/transaction/my-transactions`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result: TransactionResponse = await response.json();

    if (!result.isSuccess) {
      throw new Error(result.message || 'Failed to get transactions');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error getting transactions:', error);
    throw error;
  }
};

/**
 * Get transactions for a specific escrow contract
 */
export const getTransactionsByEscrow = async (escrowId: string): Promise<Transaction[]> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_URL}/payment-service/transaction/escrow/${escrowId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result: TransactionResponse = await response.json();

    if (!result.isSuccess) {
      throw new Error(result.message || 'Failed to get escrow transactions');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error getting escrow transactions:', error);
    throw error;
  }
};

/**
 * Get ledger entries for a specific transaction
 */
export const getTransactionLedgers = async (transactionId: string): Promise<Ledger[]> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_URL}/payment-service/ledger/transaction/${transactionId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result: LedgerResponse = await response.json();

    if (!result.isSuccess) {
      throw new Error(result.message || 'Failed to get transaction ledgers');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error getting transaction ledgers:', error);
    throw error;
  }
};

/**
 * Get ledger detail by ID
 */
export const getLedgerDetail = async (ledgerId: string): Promise<Ledger> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_URL}/payment-service/ledger/${ledgerId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result: LedgerDetailResponse = await response.json();

    if (!result.isSuccess) {
      throw new Error(result.message || 'Failed to get ledger detail');
    }

    return result.data;
  } catch (error) {
    console.error('Error getting ledger detail:', error);
    throw error;
  }
};

/**
 * Get transaction type name
 * Enum TransactionType:
 * 1: PayEscrow (Thanh toán cọc)
 * 2: ReleaseEscrow (Phát hành cọc)
 * 3: RefundEscrow (Hoàn cọc)
 * 4: AddFunds (Nạp tiền)
 * 5: WithdrawFunds (Rút tiền)
 * 6: PayRemainingEscrow (Thanh toán phần còn lại)
 */
export const getTransactionTypeName = (type: number): string => {
  const transactionTypes: { [key: number]: string } = {
    1: 'Thanh toán cọc',
    2: 'Phát hành cọc',
    3: 'Hoàn cọc',
    4: 'Nạp tiền',
    5: 'Rút tiền',
    6: 'Thanh toán phần còn lại',
  };
  return transactionTypes[type] || 'Giao dịch';
};

/**
 * Get ledger direction name
 */
export const getLedgerDirectionName = (direction: number): string => {
  const directions: { [key: number]: string } = {
    1: 'Nạp tiền',
    2: 'Thanh toán',
    3: 'Hoàn tiền',
  };
  return directions[direction] || 'Giao dịch';
};

/**
 * Get ledger direction color
 */
export const getLedgerDirectionColor = (direction: number): string => {
  const colors: { [key: number]: string } = {
    1: '#10B981', // Green - In
    2: '#EF4444', // Red - Out
    3: '#3B82F6', // Blue - Refund
  };
  return colors[direction] || '#6B7280';
};

/**
 * Format currency VND
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) {
    return '0 ₫';
  }
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Format date
 */
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    return 'N/A';
  }
};
