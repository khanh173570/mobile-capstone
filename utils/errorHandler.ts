/**
 * Error handling utilities for the application
 * Converts technical errors into user-friendly messages
 */

export interface ErrorResponse {
  message: string;
  statusCode?: number;
  errors?: any;
}

/**
 * Get user-friendly error message from error object
 */
export const getUserFriendlyErrorMessage = (error: unknown): string => {
  // If it's already a user-friendly Error with message
  if (error instanceof Error) {
    return error.message;
  }

  // If it's an error response object
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as ErrorResponse;
    if (errorObj.message) {
      return errorObj.message;
    }
  }

  // Network errors
  if (String(error).includes('Network request failed')) {
    return 'Không có kết nối mạng. Vui lòng kiểm tra và thử lại.';
  }

  if (String(error).includes('timeout')) {
    return 'Kết nối quá chậm. Vui lòng thử lại sau.';
  }

  // Default fallback
  return 'Đã xảy ra lỗi. Vui lòng thử lại sau.';
};

/**
 * Common error messages for different scenarios
 */
export const ErrorMessages = {
  // Network errors
  NO_INTERNET: 'Không có kết nối mạng. Vui lòng kiểm tra và thử lại.',
  TIMEOUT: 'Kết nối quá chậm. Vui lòng thử lại sau.',
  SERVER_ERROR: 'Máy chủ đang bận. Vui lòng thử lại sau.',
  
  // Auth errors
  SESSION_EXPIRED: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
  INVALID_CREDENTIALS: 'Thông tin đăng nhập không chính xác.',
  UNAUTHORIZED: 'Bạn không có quyền thực hiện thao tác này.',
  
  // Data errors
  INVALID_DATA: 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.',
  MISSING_REQUIRED_FIELDS: 'Vui lòng điền đầy đủ thông tin bắt buộc.',
  
  // File/Image errors
  IMAGE_UPLOAD_FAILED: 'Không thể tải ảnh lên. Vui lòng thử lại.',
  INVALID_IMAGE: 'Định dạng ảnh không hợp lệ.',
  IMAGE_TOO_LARGE: 'Ảnh quá lớn. Vui lòng chọn ảnh khác.',
  
  // Permission errors
  PERMISSION_DENIED: 'Bạn đã từ chối quyền truy cập.',
  CAMERA_PERMISSION_DENIED: 'Cần quyền camera để chụp ảnh.',
  LIBRARY_PERMISSION_DENIED: 'Cần quyền truy cập thư viện để chọn ảnh.',
  
  // Generic errors
  GENERIC_ERROR: 'Đã xảy ra lỗi. Vui lòng thử lại sau.',
  UNKNOWN_ERROR: 'Lỗi không xác định. Vui lòng liên hệ hỗ trợ.',
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  const errorString = String(error).toLowerCase();
  return (
    errorString.includes('network') ||
    errorString.includes('timeout') ||
    errorString.includes('connection') ||
    errorString.includes('fetch')
  );
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: unknown): boolean => {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('token') ||
      message.includes('unauthorized') ||
      message.includes('authentication') ||
      message.includes('phiên đăng nhập')
    );
  }
  
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as ErrorResponse;
    return errorObj.statusCode === 401 || errorObj.statusCode === 403;
  }
  
  return false;
};

/**
 * Log error for debugging while showing user-friendly message
 */
export const handleError = (error: unknown, context: string): string => {
  // Log technical details for debugging
  console.error(`[${context}] Error:`, error);
  
  // Return user-friendly message
  return getUserFriendlyErrorMessage(error);
};
