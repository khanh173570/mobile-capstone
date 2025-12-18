import { fetchWithTokenRefresh } from './authService';

const API_URL = 'https://gateway.a-379.store/api/payment-service';

export interface DisputeAttachment {
  id: string;
  url: string;
}

export interface Dispute {
  id: string;
  escrowId: string;
  actualAmount: number;
  actualGrade1Amount: number;
  actualGrade2Amount: number;
  actualGrade3Amount: number;
  disputeMessage: string;
  disputeStatus: number; // 0: Pending, 1: Approved, 2: Rejected, 3: InAdminReview, 4: Resolved
  isWholeSalerCreated: boolean; // true if wholesaler created, false if farmer created
  reviewNote?: string | null;
  resolvedAt?: string | null;
  attachments: DisputeAttachment[];
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateDisputeRequest {
  escrowId: string;
  disputeMessage: string;
  actualAmount: number;
  actualGrade1Amount: number;
  actualGrade2Amount: number;
  actualGrade3Amount: number;
  attachments: File[] | string[]; // Can be File objects or URLs
  isWholeSalerCreated?: boolean; // true if wholesaler created, false if farmer created
}

export interface ReviewDisputeRequest {
  isApproved: boolean;
}

export interface DisputeResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: Dispute;
}

/**
 * Create a new dispute
 */
export const createDispute = async (request: CreateDisputeRequest): Promise<Dispute> => {
  try {
    const formData = new FormData();
    formData.append('EscrowId', request.escrowId);
    formData.append('DisputeMessage', request.disputeMessage);
    formData.append('ActualAmount', request.actualAmount.toString());
    formData.append('ActualGrade1Amount', request.actualGrade1Amount.toString());
    formData.append('ActualGrade2Amount', request.actualGrade2Amount.toString());
    formData.append('ActualGrade3Amount', request.actualGrade3Amount.toString());
    
    // Add IsWholeSalerCreated flag
    if (request.isWholeSalerCreated !== undefined) {
      formData.append('IsWholeSalerCreated', request.isWholeSalerCreated.toString());
    }

    // Add attachments
    if (request.attachments && request.attachments.length > 0) {
      request.attachments.forEach((attachment) => {
        formData.append('Attachments', attachment);
      });
    }

    const response = await fetchWithTokenRefresh(`${API_URL}/dispute`, {
      method: 'POST',
      body: formData,
    });

    const result: DisputeResponse = await response.json();

    if (!result.isSuccess) {
      throw new Error(result.message || 'Failed to create dispute');
    }

    return result.data;
  } catch (error) {
    console.error('Error creating dispute:', error);
    throw error;
  }
};

/**
 * Get dispute by escrow ID
 */
export const getDisputeByEscrowId = async (escrowId: string): Promise<Dispute | null> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_URL}/dispute/escrow/${escrowId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const result: DisputeResponse = await response.json();

    if (!result.isSuccess) {
      // No dispute found is not an error
      if (result.statusCode === 404) {
        return null;
      }
      throw new Error(result.message || 'Failed to get dispute');
    }

    // Fix backend typo: distupeStatus -> disputeStatus
    if (result.data && (result.data as any).distupeStatus !== undefined) {
      result.data.disputeStatus = (result.data as any).distupeStatus;
      console.log('Fixed typo: distupeStatus -> disputeStatus:', result.data.disputeStatus);
    }

    return result.data;
  } catch (error) {
    console.error('Error getting dispute:', error);
    return null;
  }
};

/**
 * Review dispute (Farmer only)
 * PATCH /dispute/{id}/review
 */
export const reviewDispute = async (
  disputeId: string,
  review: ReviewDisputeRequest
): Promise<Dispute> => {
  try {
    const response = await fetchWithTokenRefresh(`${API_URL}/dispute/${disputeId}/review`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(review),
    });

    const result: DisputeResponse = await response.json();

    if (!result.isSuccess) {
      // Convert error messages to Vietnamese
      let errorMessage = result.message || 'Không thể xét duyệt tranh chấp';
      
      if (errorMessage.includes('Only Pending disputes can be reviewed')) {
        if (errorMessage.includes('Approved')) {
          errorMessage = 'Tranh chấp này đã được chấp nhận rồi';
        } else if (errorMessage.includes('Rejected')) {
          errorMessage = 'Tranh chấp này đã bị từ chối rồi';
        } else {
          errorMessage = 'Chỉ có thể xét duyệt tranh chấp đang chờ duyệt';
        }
      }
      
      throw new Error(errorMessage);
    }

    return result.data;
  } catch (error: any) {
    console.error('Error reviewing dispute:', error);
    // If error already has Vietnamese message, keep it
    if (error.message) {
      throw error;
    }
    throw new Error('Không thể xét duyệt tranh chấp');
  }
};

/**
 * Get dispute status label
 */
export const getDisputeStatusLabel = (status: number): string => {
  // Convert to number if it's a string
  const statusNum = typeof status === 'string' ? parseInt(status, 10) : status;
  
  console.log('getDisputeStatusLabel - Original status:', status, 'Type:', typeof status, 'Converted:', statusNum);
  
  switch (statusNum) {
    case 0:
      return 'Chờ xét duyệt'; // Pending - Waiting for other party to review
    case 1:
      return 'Đã chấp nhận'; // Approved - Other party approved
    case 2:
      return 'Đã từ chối'; // Rejected - Other party rejected, needs admin review
    case 3:
      return 'Đang xem xét bởi Admin'; // InAdminReview - Admin is reviewing
    case 4:
      return 'Đã giải quyết'; // Resolved - Admin resolved
    default:
      console.warn('Unknown dispute status:', statusNum);
      return 'Không xác định';
  }
};

/**
 * Get dispute status color
 */
export const getDisputeStatusColor = (status: number): string => {
  // Convert to number if it's a string
  const statusNum = typeof status === 'string' ? parseInt(status, 10) : status;
  
  switch (statusNum) {
    case 0:
      return '#F59E0B'; // Orange - Pending
    case 1:
      return '#10B981'; // Green - Approved
    case 2:
      return '#EF4444'; // Red - Rejected
    case 3:
      return '#3B82F6'; // Blue - InAdminReview
    case 4:
      return '#059669'; // Dark Green - Resolved
    default:
      return '#6B7280';
  }
};
