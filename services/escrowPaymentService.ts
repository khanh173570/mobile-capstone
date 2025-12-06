import { fetchWithTokenRefresh } from './authService';

const API_URL = 'https://gateway.a-379.store/api/payment-service';

export interface EscrowPaymentResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: boolean;
}

/**
 * Pay escrow using wallet
 */
export const payEscrowWithWallet = async (escrowId: string): Promise<boolean> => {
  try {
    console.log('Paying escrow with wallet, escrowId:', escrowId);
    
    const response = await fetchWithTokenRefresh(
      `${API_URL}/escrow/payescrow?escrowId=${escrowId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result: EscrowPaymentResponse = await response.json();
    console.log('Escrow payment response:', result);

    if (!result.isSuccess) {
      throw new Error(result.message || 'Failed to pay escrow');
    }

    return result.data;
  } catch (error) {
    console.error('Error paying escrow:', error);
    throw error;
  }
};
