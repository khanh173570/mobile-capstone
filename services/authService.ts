import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
// Import Farm type and functions from farmService
import type { Farm } from './farmService';
import { getUserFarms } from './farmService';
// Removing regular FileSystem import as we're now using the legacy version explicitly

// Get API URL from environment variables
const API_URL = Constants.expoConfig?.extra?.apiUrl;

// Tạm thời thêm fallback để debug
if (!API_URL || API_URL === undefined) {
  console.error('❌ API_URL is undefined! Using fallback...');
  // Uncomment dòng dưới nếu cần fallback tạm thời
  // API_URL = 'https://gateway.a-379.store/api';
}

// Types
export interface Role {
  id: string;
  name: string;
  normalizedName: string;
  fullName: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface RolesResponse {
  items: Role[];
  pageNumber: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  previousPage: boolean;
  nextPage: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  address: string;
  communes: string;
  province: string;
  phoneNumber: string;
  roleId: string;
  userVerifications: {
    document: string; // Image URI from device storage (file://, content://)
    documentType: number; // 0 = front ID, 1 = back ID
    hasDocument?: boolean;
  }[];
}

export interface LoginData {
  email: string;
  password: string;
}

export interface User {
  id: string;
  userName: string | null;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  communes: string;
  province: string;
  phoneNumber: string;
  role?: string;
  userVerification: any[];
  createdAt: string;
  updatedAt: string;
  reputationScore?: number;
  reputation?: {
    trustScore: number;
    history: any[];
  };
}

export interface TokenData {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  farm: Farm;
  user: User;
  token: TokenData;
}

export interface LoginHandlerResponse {
  success: boolean;
  needsFarmUpdate: boolean;
  farmData?: Farm;
  message?: string;
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any | null;
  data: T;
}

// Import the legacy FileSystem API (kept for fallback JSON method)
import * as FileSystemLegacy from 'expo-file-system/legacy';

// Helper function to convert image URI to base64 (used for fallback JSON method)
const imageURIToBase64 = async (uri: string): Promise<string> => {
  try {
    // Check if URI exists
    if (!uri) {
      console.error('Empty image URI provided');
      throw new Error('Empty image URI provided');
    }
    
    console.log('Converting image URI to base64:', uri.substring(0, 50) + '...');
    
    // For content:// or file:// URIs
    if (uri.startsWith('content://') || uri.startsWith('file://')) {
      // Read the file as base64 using legacy API
      try {
        // Use the legacy API explicitly
        const base64Data = await FileSystemLegacy.readAsStringAsync(uri, {
          encoding: 'base64',
        });
        
        // Verify we got proper data
        if (!base64Data || base64Data.length < 100) {
          console.error('Base64 conversion failed or produced too small output:', base64Data?.length || 0);
          throw new Error('Chuyển đổi ảnh thất bại - dữ liệu không hợp lệ');
        }
        
        console.log(`Successfully converted image to base64 string (length: ${base64Data.length})`);
        return base64Data;
      } catch (readError) {
        console.error('Error reading file with legacy API:', readError);
        throw new Error(`Không thể đọc file ảnh: ${readError instanceof Error ? readError.message : String(readError)}`);
      }
    } 
    // If it's already a base64 string
    else if (uri.startsWith('data:image')) {
      const base64Data = uri.split(',')[1];
      console.log(`Image is already in base64 format (length: ${base64Data.length})`);
      return base64Data;
    }
    // Other URI formats - we'll return as is and report a warning
    else {
      console.warn('Unknown image URI format, will attempt direct base64 conversion:', uri.substring(0, 50) + '...');
      // Try to read it anyway
      try {
        const base64Data = await FileSystemLegacy.readAsStringAsync(uri, {
          encoding: 'base64',
        });
        
        if (!base64Data || base64Data.length < 100) {
          throw new Error('Conversion produced invalid data');
        }
        
        console.log(`Fallback conversion successful (length: ${base64Data.length})`);
        return base64Data;
      } catch (fallbackError) {
        console.error('Fallback conversion failed:', fallbackError);
        throw new Error(`Không thể chuyển đổi ảnh từ URI: ${uri}`);
      }
    }
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw error;
  }
};

// Helper function to validate and prepare user verification data
const validateUserVerifications = (userVerifications: RegisterData['userVerifications']): void => {
  if (!Array.isArray(userVerifications) || userVerifications.length === 0) {
    throw new Error('Thiếu ảnh CCCD/CMND để xác minh');
  }
  
  userVerifications.forEach((verification, index) => {
    if (!verification.document) {
      const docTypeName = verification.documentType === 0 ? 'Mặt trước CCCD' : 'Mặt sau CCCD';
      throw new Error(`Thiếu ảnh ${docTypeName.toLowerCase()}`);
    }
    
    const docTypeName = verification.documentType === 0 ? 'Mặt trước' : 'Mặt sau';
    console.log(`Validating ${docTypeName} CCCD - URI: ${verification.document.substring(0, 30)}...`);
  });
};

// Legacy JSON-based registration function (kept as fallback)
export const registerUserWithJSON = async (userData: RegisterData): Promise<ApiResponse<User>> => {
  try {
    console.log('Using JSON/Base64 approach for registration (fallback)...');
    console.log('Registration request URL:', `${API_URL}/Auth/Register`);
    
    // Validate user verifications
    validateUserVerifications(userData.userVerifications);
    
    // Convert images to base64
    const userVerificationsWithBase64 = await Promise.all(
      userData.userVerifications.map(async (verification, index) => {
        try {
          const docTypeName = verification.documentType === 0 ? 'Mặt trước' : 'Mặt sau';
          console.log(`Converting ${docTypeName} CCCD to base64...`);
          
          const base64Data = await imageURIToBase64(verification.document);
          
          return {
            documentType: verification.documentType,
            hasDocument: true,
            document: base64Data
          };
        } catch (conversionError) {
          const docTypeName = verification.documentType === 0 ? 'Mặt trước' : 'Mặt sau';
          throw new Error(`Lỗi chuyển đổi ảnh ${docTypeName} CCCD: ${conversionError instanceof Error ? conversionError.message : String(conversionError)}`);
        }
      })
    );

    const registrationPayload = {
      email: userData.email,
      password: userData.password,
      firstName: userData.firstName,
      lastName: userData.lastName,
      address: userData.address,
      communes: userData.communes,
      province: userData.province,
      phoneNumber: userData.phoneNumber,
      roleId: userData.roleId,
      userVerifications: userVerificationsWithBase64
    };

    const response = await fetch(`${API_URL}/Auth/Register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(registrationPayload),
    });

    const responseText = await response.text();
    
    let data: ApiResponse<User>;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Không thể parse response: ${responseText}`);
    }

    return data;
  } catch (error) {
    console.error('JSON registration error:', error);
    throw error;
  }
};

// Register a new user
export const registerUser = async (userData: RegisterData): Promise<ApiResponse<User>> => {
  try {
    console.log('Registration request URL:', `${API_URL}/Auth/Register`);
    
    // Create a working copy of the user data
    const processedUserData = { ...userData };
    
    // For debugging, let's see if userVerifications array is valid
    console.log('User verifications array length:', processedUserData.userVerifications?.length || 0);
    
    // Make sure userVerifications is an array
    if (!Array.isArray(processedUserData.userVerifications)) {
      console.error('userVerifications is not an array:', processedUserData.userVerifications);
      processedUserData.userVerifications = [];
    }
    
    // Process verification documents - use FormData approach for IFormFile
    if (processedUserData.userVerifications.length > 0) {
      try {
        // Validate user verifications
        validateUserVerifications(processedUserData.userVerifications);
        
        console.log('Creating FormData for registration with IFormFile support...');
        
        // Create FormData object
        const formData = new FormData();
        
        // Add basic user information
        formData.append('Email', processedUserData.email);
        formData.append('Password', processedUserData.password);
        formData.append('FirstName', processedUserData.firstName);
        formData.append('LastName', processedUserData.lastName);
        formData.append('Address', processedUserData.address);
        formData.append('Communes', processedUserData.communes);
        formData.append('Province', processedUserData.province);
        formData.append('PhoneNumber', processedUserData.phoneNumber);
        formData.append('RoleId', processedUserData.roleId);
        
        // Add verification documents as IFormFile
        processedUserData.userVerifications.forEach((verification, index) => {
          const docTypeName = verification.documentType === 0 ? 'Mặt trước' : 'Mặt sau';
          console.log(`Adding ${docTypeName} CCCD to FormData (${index + 1}/${processedUserData.userVerifications.length})...`);
          
          // Create file object for React Native FormData
          const fileObject = {
            uri: verification.document,
            type: 'image/jpeg',
            name: `cccd_${verification.documentType === 0 ? 'front' : 'back'}.jpg`,
          } as any;
          
          // Append file as IFormFile
          formData.append(`UserVerifications[${index}].Document`, fileObject);
          formData.append(`UserVerifications[${index}].DocumentType`, verification.documentType.toString());
          formData.append(`UserVerifications[${index}].HasDocument`, 'true');
        });

        console.log('Sending FormData to register API (multipart/form-data)');
        
        // Send the API request with FormData (multipart/form-data)
        const response = await fetch(`${API_URL}/Auth/Register`, {
          method: 'POST',
          // Don't set Content-Type header - let fetch set it automatically with boundary for multipart/form-data
          body: formData,
        });
        
        console.log('Registration response status:', response.status);
        
        // Get response text first for debugging
        const responseText = await response.text();
        console.log('Raw response text:', responseText.substring(0, 200) + (responseText.length > 200 ? '...' : ''));
        
        // Try to parse response as JSON
        let data: ApiResponse<User>;
        try {
          data = JSON.parse(responseText);
        } catch (parseError) {
          console.error('Error parsing API response:', parseError);
          
          // Special handling for different HTTP status codes
          if (response.status === 415) {
            console.error('Server rejected the content type. This should not happen with FormData.');
            throw new Error('Server không chấp nhận định dạng dữ liệu multipart/form-data.');
          } else if (response.status === 400) {
            throw new Error('Dữ liệu đăng ký không hợp lệ. Vui lòng kiểm tra lại thông tin.');
          } else if (response.status >= 500) {
            throw new Error('Lỗi máy chủ. Vui lòng thử lại sau.');
          } else {
            throw new Error(`Không thể xử lý phản hồi từ máy chủ: ${responseText.substring(0, 100)}`);
          }
        }
        
        console.log('Registration API response:', data);
        
        // Log the API response
        if (data.isSuccess) {
          console.log('Registration successful with FormData!');
        } else {
          console.error('Registration failed:', data);
          
          // Check for specific error types
          if (data.errors && Array.isArray(data.errors)) {
            console.error('Registration errors:', data.errors);
          }
        }
        
        return data;
      } catch (apiError) {
        console.error('API request error:', apiError);
        throw new Error(`Lỗi khi gửi yêu cầu đăng ký: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
      }
    } else {
      console.error('No user verification documents found in request');
      throw new Error('Thiếu ảnh CCCD/CMND để xác minh');
    }
  } catch (error) {
    console.error('Registration error:', error);
    
    // Return a formatted error response
    const errorMessage = error instanceof Error ? error.message : 'Đã xảy ra lỗi khi đăng ký';
    const errorString = error instanceof Error ? error.toString() : String(error);
    
    return {
      isSuccess: false,
      statusCode: 500,
      message: errorMessage,
      errors: { general: [errorString] },
      data: {} as User // Empty user object to satisfy TypeScript
    } as ApiResponse<User>;
  }
};

// Get user profile
export const getUserProfile = async (): Promise<ApiResponse<User>> => {
  try {
    console.log('Get user profile request URL:', `${API_URL}/Auth/Me`);
    
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }
    
    const response = await fetch(`${API_URL}/Auth/Me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    // Handle empty or invalid response
    const text = await response.text();
    if (!text || text.trim() === '') {
      throw new Error('Không nhận được phản hồi từ máy chủ');
    }

    let data: ApiResponse<User>;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Response text:', text);
      throw new Error('Dữ liệu từ máy chủ không hợp lệ');
    }
    
    console.log('Get user profile response:', data);
    
    if (!response.ok) {
      throw new Error(data.message || 'Không thể lấy thông tin người dùng');
    }
    
    return data;
  } catch (error) {
    console.error('Get user profile error:', error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Đã xảy ra lỗi khi lấy thông tin người dùng');
  }
};

// Get user by ID
export const getUserById = async (userId: string): Promise<User | null> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    
    if (!token) {
      console.warn('No token available for getUserById');
      return null;
    }
    
    const response = await fetch(`${API_URL}/Auth/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch user ${userId}:`, response.status);
      return null;
    }
    
    const text = await response.text();
    if (!text || text.trim() === '') {
      return null;
    }

    const data: ApiResponse<User> = JSON.parse(text);
    
    if (data.isSuccess) {
      return data.data;
    }
    
    return null;
  } catch (error) {
    console.error('Get user by ID error:', error);
    return null;
  }
};

export const getUserProfileById = async (userId: string): Promise<User | null> => {
  try {
    const response = await fetch(`${API_URL}/username?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch user profile ${userId}:`, response.status);
      return null;
    }
    
    const text = await response.text();
    if (!text || text.trim() === '') {
      return null;
    }

    const data: ApiResponse<User> = JSON.parse(text);
    
    if (data.isSuccess) {
      return data.data;
    }
    
    return null;
  } catch (error) {
    console.error('Get user profile error:', error);
    return null;
  }
};

export const getUserInfoByUsername = async (userId: string): Promise<User | null> => {
  try {
    const response = await fetch(`${API_URL}/auth/username?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      console.warn(`Failed to fetch user info ${userId}:`, response.status);
      return null;
    }
    
    const text = await response.text();
    if (!text || text.trim() === '') {
      return null;
    }

    const data: ApiResponse<User> = JSON.parse(text);
    
    if (data.isSuccess) {
      return data.data;
    }
    
    return null;
  } catch (error) {
    console.error('Get user info error:', error);
    return null;
  }
};

// Login user với logic xử lý farm
export const loginUser = async (loginData: LoginData): Promise<ApiResponse<LoginResponse>> => {
  try {
    // Validate required fields
    if (!loginData.email || !loginData.password) {
      return {
        isSuccess: false,
        statusCode: 400,
        message: 'Vui lòng nhập email và mật khẩu',
        errors: { form: ['Email và mật khẩu là bắt buộc'] },
        data: null as any
      };
    }
    
    // Send login request
    let response;
    try {
      response = await fetch(`${API_URL}/Auth/Login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      });
    } catch (fetchError) {
      return {
        isSuccess: false,
        statusCode: 0,
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.',
        errors: { network: ['Lỗi kết nối'] },
        data: null as any
      };
    }
    
    // Parse response
    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      return {
        isSuccess: false,
        statusCode: response.status,
        message: 'Không thể xử lý phản hồi từ máy chủ',
        errors: { server: ['Lỗi định dạng phản hồi'] },
        data: null as any
      };
    }
    
    // Handle successful login
    if (data.isSuccess) {
      
      // Add farm status to response for navigation logic
      if (data.data.farm) {
        data.farmNeedsUpdate = !data.data.farm.isActive;
      }
      
      // Store user data and tokens
      try {
        await AsyncStorage.setItem('accessToken', data.data.token.accessToken);
        await AsyncStorage.setItem('refreshToken', data.data.token.refreshToken);
        await AsyncStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Xử lý logic farm sau khi login thành công
        if (data.data.farm) {
          await AsyncStorage.setItem('farm', JSON.stringify(data.data.farm));
          
          // Store farm status for navigation decision
          const farmNeedsUpdate = !data.data.farm.isActive;
          await AsyncStorage.setItem('farmNeedsUpdate', JSON.stringify(farmNeedsUpdate));
          
          if (farmNeedsUpdate) {
            // Don't update automatically, let user fill the form
            await AsyncStorage.setItem('pendingFarmId', data.data.farm.id);
          } else {
            // Farm đã active, lấy thông tin farms của user
            try {
              const userFarmsResult = await getUserFarms();
              
              if (userFarmsResult.isSuccess && userFarmsResult.data.length > 0) {
                // Lưu danh sách farms
                await AsyncStorage.setItem('userFarms', JSON.stringify(userFarmsResult.data));
                // Cập nhật farm hiện tại
                const currentFarm = userFarmsResult.data[0]; // Lấy farm đầu tiên
                await AsyncStorage.setItem('farm', JSON.stringify(currentFarm));
                data.data.farm = currentFarm;
              }
            } catch (getFarmsError) {
              // Ignore errors getting farms
            }
          }
        }
      } catch (storageError) {
        // Continue anyway since we have the response data
      }
    }
    
    return data as ApiResponse<LoginResponse>;
  } catch (error: any) {
    return {
      isSuccess: false,
      statusCode: 500,
      message: error instanceof Error ? error.message : 'Đã xảy ra lỗi khi đăng nhập',
      errors: { general: [error instanceof Error ? error.toString() : String(error)] },
      data: null as any
    };
  }
};

// Get current user data
export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const userStr = await AsyncStorage.getItem('user');
    if (userStr) {
      return JSON.parse(userStr) as User;
    }
    return null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Get current farm data
export const getCurrentFarm = async (): Promise<Farm | null> => {
  try {
    const farmStr = await AsyncStorage.getItem('farm');
    if (farmStr) {
      return JSON.parse(farmStr) as Farm;
    }
    return null;
  } catch (error) {
    console.error('Error getting current farm:', error);
    return null;
  }
};

// Check if user is logged in
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    return !!token;
  } catch (error) {
    return false;
  }
};

// Logout user
export const logout = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('farm');
    await AsyncStorage.removeItem('userFarms');
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Get available roles
export const getRoles = async (): Promise<ApiResponse<RolesResponse>> => {
  try {
    const response = await fetch(`${API_URL}/Role?index=1&pageSize=10`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    return data as ApiResponse<RolesResponse>;
  } catch (error) {
    console.error('Get roles error:', error);
    throw error;
  }
};

// Upload document for verification
export const uploadVerificationDocument = async (
  userId: string,
  documentFile: string,
  documentType: number
): Promise<ApiResponse<any>> => {
  try {
    const formData = new FormData();
    // @ts-ignore - React Native's FormData accepts this format for file uploads
    formData.append('document', {
      uri: documentFile,
      type: 'image/jpeg',
      name: 'verification.jpg',
    });
    formData.append('documentType', documentType.toString());

    const token = await AsyncStorage.getItem('accessToken');
    
    const response = await fetch(`${API_URL}/UserVerification/${userId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const data = await response.json();
    return data as ApiResponse<any>;
  } catch (error) {
    console.error('Document upload error:', error);
    throw error;
  }
};

// Helper functions for farm management after login
export const checkFarmUpdateStatus = async (): Promise<boolean> => {
  try {
    const needsUpdate = await AsyncStorage.getItem('farmNeedsUpdate');
    return needsUpdate ? JSON.parse(needsUpdate) : false;
  } catch (error) {
    console.error('Error checking farm update status:', error);
    return false;
  }
};

export const getPendingFarmId = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('pendingFarmId');
  } catch (error) {
    console.error('Error getting pending farm ID:', error);
    return null;
  }
};

export const clearFarmUpdateStatus = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('farmNeedsUpdate');
    await AsyncStorage.removeItem('pendingFarmId');
  } catch (error) {
    console.error('Error clearing farm update status:', error);
  }
};

// Refresh access token using refresh token
export const refreshAccessToken = async (): Promise<boolean> => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      console.log('❌ No refresh token available');
      return false;
    }

    console.log('🔄 Attempting to refresh access token...');
    console.log('🔑 Refresh token length:', refreshToken.length);
    console.log('🌐 API URL:', `${API_URL}/auth/refresh`);
    
    // API endpoint: https://gateway.a-379.store/api/auth/refresh
    // Send refresh token in BOTH header AND body (backend may check either)
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${refreshToken}`,
      },
      body: JSON.stringify({
        refreshToken: refreshToken
      }),
    });

    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Failed to refresh token');
      console.error('📄 Response status:', response.status);
      console.error('📄 Response body:', errorText);
      
      // Refresh token has expired, clear tokens
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      return false;
    }

    const responseText = await response.text();
    console.log('📄 Response body:', responseText.substring(0, 200));
    
    const data: ApiResponse<TokenData> = JSON.parse(responseText);

    if (data.isSuccess && data.data?.accessToken) {
      // Store new access token
      await AsyncStorage.setItem('accessToken', data.data.accessToken);
      
      // Update refresh token (API always returns new refresh token)
      if (data.data.refreshToken) {
        await AsyncStorage.setItem('refreshToken', data.data.refreshToken);
      }

      console.log('✅ Access token refreshed successfully');
      console.log('📊 New access token length:', data.data.accessToken.length);
      console.log('📅 Token expires at:', getTokenExpiration(data.data.accessToken));
      return true;
    } else {
      console.error('❌ Refresh token response invalid');
      console.error('📊 isSuccess:', data.isSuccess);
      console.error('📊 message:', data.message);
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      return false;
    }
  } catch (error) {
    console.error('❌ Error refreshing access token:', error);
    console.error('📊 Error details:', error instanceof Error ? error.message : String(error));
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    return false;
  }
};

// Helper function to get token expiration time
const getTokenExpiration = (token: string): string => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return 'Invalid token';
    
    let decoded = parts[1];
    const padding = 4 - (decoded.length % 4);
    if (padding !== 4) {
      decoded += '='.repeat(padding);
    }
    
    const payload = JSON.parse(atob(decoded));
    
    if (payload.exp) {
      return new Date(payload.exp * 1000).toLocaleString('vi-VN');
    }
    
    return 'No expiration';
  } catch (error) {
    return 'Error parsing token';
  }
};

// Helper function to check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    // JWT token format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return true;

    // Decode payload
    let decoded = parts[1];
    
    // Add padding if needed
    const padding = 4 - (decoded.length % 4);
    if (padding !== 4) {
      decoded += '='.repeat(padding);
    }

    const payload = JSON.parse(atob(decoded));
    
    // Check if exp claim exists and token is expired
    if (payload.exp) {
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      
      // Consider token expired if it expires in less than 2 minutes
      // This gives time to refresh before actual expiration
      const bufferTime = 120000; // 2 minutes in milliseconds
      const isExpired = currentTime >= (expirationTime - bufferTime);
      
      if (isExpired) {
        const expiresIn = Math.round((expirationTime - currentTime) / 1000);
        console.log(`⏰ Token expires in ${expiresIn} seconds (${new Date(expirationTime).toLocaleString('vi-VN')})`);
      }
      
      return isExpired;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error checking token expiration:', error);
    return true; // Consider expired on error
  }
};

// Wrapper to handle token refresh on 401 errors
export const fetchWithTokenRefresh = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  try {
    let accessToken = await AsyncStorage.getItem('accessToken');
    
    // If no access token, return 401-like response
    if (!accessToken) {
      console.log('❌ No access token available');
      return new Response(JSON.stringify({ message: 'No access token' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check if token is expired and refresh if needed
    if (isTokenExpired(accessToken)) {
      console.log('⏰ Token expired, attempting refresh...');
      const refreshed = await refreshAccessToken();
      
      if (!refreshed) {
        console.log('❌ Refresh failed, clearing session...');
        // Clear all auth data
        await logout();
        // Return 401 to trigger login redirect
        return new Response(JSON.stringify({ message: 'Session expired' }), { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      accessToken = await AsyncStorage.getItem('accessToken');
    }

    // Add authorization header
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
    } as HeadersInit;

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // If we get 401, try refreshing token once and retry
    if (response.status === 401) {
      console.log('🔄 Got 401, attempting to refresh token...');
      const refreshed = await refreshAccessToken();
      
      if (refreshed) {
        accessToken = await AsyncStorage.getItem('accessToken');
        
        const retryHeaders = {
          ...options.headers,
          'Authorization': `Bearer ${accessToken}`,
        } as HeadersInit;

        response = await fetch(url, {
          ...options,
          headers: retryHeaders,
        });
        
        // If still 401 after refresh, logout
        if (response.status === 401) {
          console.log('❌ Still 401 after refresh, clearing session...');
          await logout();
        }
      } else {
        // Refresh failed, logout
        console.log('❌ Refresh failed on 401, clearing session...');
        await logout();
      }
    }

    return response;
  } catch (error) {
    console.error('❌ Error in fetchWithTokenRefresh:', error);
    throw error;
  }
};