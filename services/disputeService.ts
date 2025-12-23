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
  refundAmount?: number; // Optional - amount to refund (calculated by client if not provided)
  attachments: File[] | string[]; // Can be File objects or URLs
  isWholeSalerCreated?: boolean; // true if wholesaler created, false if farmer created
}

export interface ReviewDisputeRequest {
  isApproved: boolean;
}

export interface DisputeResolution {
  id: string;
  escrowId: string;
  refundAmount: number;
  isFinalDecision: boolean;
  adminNote: string;
  createdAt: string;
  disputeStatus: number;
}

export interface DisputeResolutionResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: DisputeResolution;
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
    formData.append('Message', request.disputeMessage);  // Chỉnh: DisputeMessage → Message
    formData.append('ActualAmount', request.actualAmount.toString());
    formData.append('ActualGrade1Amount', request.actualGrade1Amount.toString());
    formData.append('ActualGrade2Amount', request.actualGrade2Amount.toString());
    formData.append('ActualGrade3Amount', request.actualGrade3Amount.toString());
    
    // Add RefundAmount - REQUIRED for backend to auto-generate dispute resolution
    // Backend yêu cầu RefundAmount phải được gửi trong nested object CreateDistupeResolve
    // Đảm bảo luôn gửi giá trị (ngay cả khi là 0) để backend có thể tạo resolution
    const refundAmount = request.refundAmount ?? 0;
    const refundAmountStr = refundAmount.toString();
    console.log('💰 [disputeService] RefundAmount value:', refundAmount, 'Type:', typeof refundAmount, 'String:', refundAmountStr);
    
    // Gửi RefundAmount theo format mà backend yêu cầu (có typo trong spec: CreateDistupeResolve)
    // Format: CreateDistupeResolve.RefundAmount (ASP.NET Core model binding với nested object)
    // React Native FormData có thể xử lý khác với web, nên thử cả format với dấu ngoặc vuông
    // Format 1: Dấu chấm (ASP.NET Core standard)
    formData.append('CreateDistupeResolve.RefundAmount', refundAmountStr);
    console.log('✅ [disputeService] Appended CreateDistupeResolve.RefundAmount (dot notation):', refundAmountStr);
    
    // Format 2: Dấu ngoặc vuông (alternative cho React Native)
    // Một số backend ASP.NET Core có thể nhận cả hai format
    formData.append('CreateDistupeResolve[RefundAmount]', refundAmountStr);
    console.log('✅ [disputeService] Appended CreateDistupeResolve[RefundAmount] (bracket notation):', refundAmountStr);
    
    // Lưu ý: Nếu backend chỉ nhận một format, có thể cần xóa format kia
    // Nhưng gửi cả hai để đảm bảo backend nhận được (một trong hai sẽ được ignore)
    
    // Add IsWholeSalerCreated flag - Always send this, default to true if not specified
    const isWholeSalerCreated = request.isWholeSalerCreated ?? true;
    formData.append('IsWholeSalerCreated', isWholeSalerCreated.toString());

    console.log('📦 [disputeService] Building FormData for dispute creation:', {
      escrowId: request.escrowId,
      disputeMessage: request.disputeMessage?.substring(0, 50) + '...',
      actualAmount: request.actualAmount,
      actualGrade1Amount: request.actualGrade1Amount,
      actualGrade2Amount: request.actualGrade2Amount,
      actualGrade3Amount: request.actualGrade3Amount,
      refundAmount: refundAmount,
      isWholeSalerCreated: isWholeSalerCreated,
      attachmentCount: request.attachments?.length || 0
    });

    // Add attachments - React Native FormData format
    if (request.attachments && request.attachments.length > 0) {
      console.log('📎 [disputeService] Adding attachments:', request.attachments.length);
      
      for (let i = 0; i < request.attachments.length; i++) {
        const attachment = request.attachments[i];
        console.log(`   Processing Attachment ${i + 1}:`, attachment);
        
        try {
          // Check if attachment is a string URI (from ImagePicker) or already an object
          if (typeof attachment === 'string') {
            // React Native FormData format: { uri, name, type }
            const filename = attachment.split('/').pop() || `image_${i}.jpg`;
            const uriParts = attachment.split('.');
            const fileExtension = uriParts.length > 1 ? uriParts[uriParts.length - 1].toLowerCase() : 'jpg';
            
            // Determine MIME type based on extension
            let mimeType = 'image/jpeg'; // default
            if (fileExtension === 'png') {
              mimeType = 'image/png';
            } else if (fileExtension === 'gif') {
              mimeType = 'image/gif';
            } else if (fileExtension === 'webp') {
              mimeType = 'image/webp';
            } else if (fileExtension === 'mp4') {
              mimeType = 'video/mp4';
            } else if (fileExtension === 'webm') {
              mimeType = 'video/webm';
            } else if (fileExtension === 'mov') {
              mimeType = 'video/quicktime';
            }
            
            // Append in React Native FormData format
            const imageData: any = {
              uri: attachment,
              name: filename,
              type: mimeType,
            };
            
            formData.append('Attachments', imageData);
            console.log(`   ✅ Attachment ${i + 1} appended:`, filename, 'Type:', mimeType);
          } else {
            // Already in correct format (object with uri, name, type)
            formData.append('Attachments', attachment as any);
            console.log(`   ✅ Attachment ${i + 1} appended as object`);
          }
        } catch (error) {
          console.error(`   ❌ Error processing attachment ${i + 1}:`, error);
          // Continue with next attachment
        }
      }
    }

    const url = `${API_URL}/dispute`;
    console.log('🌐 [disputeService] POST request to:', url);
    
    // Debug: Log FormData contents
    console.log('📋 [disputeService] FormData fields being sent:');
    if (formData instanceof FormData) {
      const entries = (formData as any).entries?.() || [];
      for (const [key, value] of entries) {
        if (value instanceof File) {
          console.log(`   - ${key}: File(${(value as File).name}, ${(value as File).size} bytes, type: ${(value as File).type})`);
        } else {
          console.log(`   - ${key}: ${value}`);
        }
      }
    }

    const response = await fetchWithTokenRefresh(url, {
      method: 'POST',
      body: formData,
    });

    console.log('📨 [disputeService] Response status:', response.status);

    const result: DisputeResponse = await response.json();
    
    if (!result.isSuccess) {
      console.error('❌ [disputeService] API returned isSuccess=false:', result);
      throw new Error(result.message || 'Failed to create dispute');
    }

    console.log('✅ [disputeService] Dispute created successfully:', {
      id: result.data?.id,
      escrowId: result.data?.escrowId,
      status: result.data?.disputeStatus,
      attachmentsCount: result.data?.attachments?.length || 0
    });

    return result.data;
  } catch (error) {
    console.error('❌ [disputeService] Error creating dispute:', error);
    if (error instanceof TypeError) {
      console.error('   Network error details:', {
        message: error.message,
        stack: error.stack
      });
    }
    throw error;
  }
};

/**
 * Get dispute by escrow ID
 */
export const getDisputeByEscrowId = async (escrowId: string): Promise<Dispute | null> => {
  try {
    const url = `${API_URL}/dispute/escrow/${escrowId}`;
    //console.log('[disputeService] Fetching dispute from:', url);
    const response = await fetchWithTokenRefresh(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    //console.log('[disputeService] Response status:', response.status);
    
    // Parse response body once
    let result: DisputeResponse;
    try {
      result = await response.json();
      //console.log('[disputeService] Response data:', result);
    } catch (parseError) {
      console.error('[disputeService] Failed to parse response as JSON:', parseError);
      return null;
    }

    if (!result.isSuccess) {
      // No dispute found is not an error
      if (result.statusCode === 404) {
        //console.log('[disputeService] No dispute found (404)');
        return null;
      }
      console.error('[disputeService] API returned isSuccess=false:', result);
      throw new Error(result.message || 'Failed to get dispute');
    }

    // Fix backend typo: distupeStatus -> disputeStatus
    if (result.data && (result.data as any).distupeStatus !== undefined) {
      result.data.disputeStatus = (result.data as any).distupeStatus;
      //console.log('Fixed typo: distupeStatus -> disputeStatus:', result.data.disputeStatus);
    }

    //console.log('[disputeService] Dispute found:', result.data);
    return result.data;
  } catch (error) {
    console.error('[disputeService] Error getting dispute:', error);
    // Also log the full error object
    if (error instanceof Error) {
      console.error('[disputeService] Error message:', error.message);
      console.error('[disputeService] Error stack:', error.stack);
    }
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
  
  //console.log('getDisputeStatusLabel - Original status:', status, 'Type:', typeof status, 'Converted:', statusNum);
  
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

/**
 * Get dispute resolution by escrow ID
 * GET /dispute/resolve/escrow/{escrowId}
 */
export const getDisputeResolution = async (escrowId: string): Promise<DisputeResolution | null> => {
  try {
    const url = `${API_URL}/dispute/resolve/escrow/${escrowId}`;
    console.log('📍 [disputeService] Fetching dispute resolution from:', url);
    
    const response = await fetchWithTokenRefresh(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('📥 [disputeService] Dispute resolution response status:', response.status);
    const result: DisputeResolutionResponse = await response.json();
    console.log('📋 [disputeService] Dispute resolution response:', {
      isSuccess: result.isSuccess,
      statusCode: result.statusCode,
      message: result.message,
      hasData: !!result.data
    });

    if (!result.isSuccess) {
      // No resolution found is not an error
      if (result.statusCode === 404) {
        console.log('⚠️  [disputeService] No dispute resolution found (404) for escrowId:', escrowId);
        return null;
      }
      throw new Error(result.message || 'Failed to get dispute resolution');
    }

    console.log('✅ [disputeService] Dispute resolution found:', {
      id: result.data?.id,
      escrowId: result.data?.escrowId,
      refundAmount: result.data?.refundAmount,
      isFinalDecision: result.data?.isFinalDecision,
      disputeStatus: result.data?.disputeStatus
    });
    return result.data;
  } catch (error) {
    console.error('❌ [disputeService] Error getting dispute resolution:', error);
    return null;
  }
};
