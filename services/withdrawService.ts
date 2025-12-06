import { fetchWithTokenRefresh } from './authService';

const API_URL = 'https://gateway.a-379.store/api/payment-service';

export interface Bank {
  id: number;
  name: string;
  code: string;
  shortName: string;
  logo: string;
}

export interface BankResponse {
  isSuccess?: boolean;
  statusCode?: number;
  message?: string;
  errors?: any;
  data?: Bank[];
}

export interface UserBankAccount {
  id: string;
  userId: string;
  accountNumber: string;
  accountName: string;
  bankId: number;
  bank?: Bank;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface UserBankAccountResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: UserBankAccount[];
}

export interface CreateUserBankAccountRequest {
  userId: string;
  accountNumber: string;
  accountName: string;
  bankId: number;
  isPrimary: boolean;
}

export interface WithdrawRequest {
  id: string;
  userId: string;
  walletId: string;
  amount: number;
  transactionId: string;
  status: number; // 0: Pending, 1: Processing, 2: Completed, 3: Failed
  userBankAccountId: string;
  reason: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface WithdrawRequestResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: WithdrawRequest[];
}

export interface CreateWithdrawRequest {
  userId: string;
  walletId: string;
  userBankAccountId: string;
  amount: number;
}

/**
 * Get list of available banks
 */
export const getBanks = async (): Promise<Bank[]> => {
  try {
    const response = await fetch(`${API_URL}/bank`);
    const result: BankResponse = await response.json();

    if (!result.data) {
      return [];
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching banks:', error);
    throw error;
  }
};

/**
 * Get user's bank accounts
 */
export const getMyBankAccounts = async (): Promise<UserBankAccount[]> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_URL}/userbankaccount/my-accounts`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result: UserBankAccountResponse = await response.json();

    if (!result.isSuccess) {
      throw new Error(result.message || 'Failed to get bank accounts');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    throw error;
  }
};

/**
 * Create user bank account
 */
export const createUserBankAccount = async (
  request: CreateUserBankAccountRequest
): Promise<UserBankAccount> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_URL}/userbankaccount`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create bank account');
    }

    return result.data;
  } catch (error) {
    console.error('Error creating bank account:', error);
    throw error;
  }
};

/**
 * Update user bank account
 */
export const updateUserBankAccount = async (
  accountId: string,
  request: Omit<CreateUserBankAccountRequest, 'userId'>
): Promise<UserBankAccount> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_URL}/userbankaccount/${accountId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to update bank account');
    }

    return result.data;
  } catch (error) {
    console.error('Error updating bank account:', error);
    throw error;
  }
};

/**
 * Delete user bank account
 */
export const deleteUserBankAccount = async (
  accountId: string
): Promise<void> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_URL}/userbankaccount/${accountId}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || 'Failed to delete bank account');
    }
  } catch (error) {
    console.error('Error deleting bank account:', error);
    throw error;
  }
};

/**
 * Create withdraw request
 */
export const createWithdrawRequest = async (
  request: CreateWithdrawRequest
): Promise<WithdrawRequest> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_URL}/withdrawrequest`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Failed to create withdraw request');
    }

    return result.data;
  } catch (error) {
    console.error('Error creating withdraw request:', error);
    throw error;
  }
};

/**
 * Get user's withdraw requests
 */
export const getMyWithdrawRequests = async (): Promise<WithdrawRequest[]> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_URL}/withdrawrequest/my-requests`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result: WithdrawRequestResponse = await response.json();

    if (!result.isSuccess) {
      throw new Error(result.message || 'Failed to get withdraw requests');
    }

    return result.data || [];
  } catch (error) {
    console.error('Error fetching withdraw requests:', error);
    throw error;
  }
};

/**
 * Get withdraw request detail by ID
 */
export const getWithdrawRequestById = async (
  requestId: string
): Promise<WithdrawRequest> => {
  try {
    const response = await fetchWithTokenRefresh(
      `${API_URL}/withdrawrequest/${requestId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result = await response.json();

    if (!result.isSuccess) {
      throw new Error(result.message || 'Failed to get withdraw request');
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching withdraw request:', error);
    throw error;
  }
};

/**
 * Get withdraw request status name
 */
export const getWithdrawStatusName = (status: number): string => {
  switch (status) {
    case 0:
      return 'Chờ xử lý';
    case 1:
      return 'Đang xử lý';
    case 2:
      return 'Hoàn thành';
    case 3:
      return 'Thất bại';
    default:
      return 'Không xác định';
  }
};

/**
 * Get withdraw request status color
 */
export const getWithdrawStatusColor = (status: number): string => {
  switch (status) {
    case 0:
      return '#F59E0B'; // Amber
    case 1:
      return '#3B82F6'; // Blue
    case 2:
      return '#10B981'; // Green
    case 3:
      return '#EF4444'; // Red
    default:
      return '#6B7280'; // Gray
  }
};
