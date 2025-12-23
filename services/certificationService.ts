/**
 * Certification Service
 * Handles farmer certification CRUD operations
 */

import { fetchWithTokenRefresh } from './authService';

const API_BASE_URL = 'https://gateway.a-379.store/api/certification';

export enum CertificationType {
  VietGAP = 1,
  GlobalGAP = 2,
  Organic = 3,
  OCOP = 4,
  HACCP = 5,
  ISO22000 = 6,
  SafeFoodChain = 7,
  PlantationCode = 8,
  UTZ = 9,
}

export enum CertificationStatus {
  Pending = 0,    // Chờ admin duyệt
  Approved = 1,   // Được duyệt
  Rejected = 2,   // Từ chối
  Expired = 3     // Hết hạn
}

export interface Certification {
  id: string;
  userId: string;
  type: CertificationType;
  certificationName: string;
  issuingOrganization: string;
  issueDate: string; // ISO date string
  expiryDate: string; // ISO date string
  certificateUrl: string;
  status: CertificationStatus;
  rejectionReason: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateCertificationRequest {
  type: CertificationType;
  certificationName: string;
  issuingOrganization: string;
  issueDate: string; // Format: "2025-01-12T10:35:25.162Z"
  expiryDate: string; // Format: "2026-12-12T10:35:25.162Z"
  certificateImage: {
    uri: string;
    name: string;
    type: string;
  };
}

export interface ApiResponse<T> {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any | null;
  data: T;
}

/**
 * Get certification type name in Vietnamese
 */
export const getCertificationTypeName = (type: CertificationType): string => {
  const typeNames: Record<CertificationType, string> = {
    [CertificationType.VietGAP]: 'VietGAP',
    [CertificationType.GlobalGAP]: 'GlobalGAP',
    [CertificationType.Organic]: 'Organic',
    [CertificationType.OCOP]: 'OCOP',
    [CertificationType.HACCP]: 'HACCP',
    [CertificationType.ISO22000]: 'ISO 22000',
    [CertificationType.SafeFoodChain]: 'Safe Food Chain',
    [CertificationType.PlantationCode]: 'Mã vùng trồng',
    [CertificationType.UTZ]: 'UTZ',
  };
  return typeNames[type] || 'Không xác định';
};

/**
 * Get certification status name and color
 */
export const getCertificationStatusInfo = (status: CertificationStatus): { name: string; color: string; icon: string } => {
  const statusInfo: Record<CertificationStatus, { name: string; color: string; icon: string }> = {
    [CertificationStatus.Pending]: { name: 'Chờ duyệt', color: '#F59E0B', icon: '⏳' },
    [CertificationStatus.Approved]: { name: 'Đã duyệt', color: '#22C55E', icon: '✅' },
    [CertificationStatus.Rejected]: { name: 'Từ chối', color: '#EF4444', icon: '❌' },
    [CertificationStatus.Expired]: { name: 'Hết hạn', color: '#9CA3AF', icon: '⏰' },
  };
  return statusInfo[status] || { name: 'Không xác định', color: '#6B7280', icon: '❓' };
};

/**
 * Get my certifications
 * GET /api/certification/my-certifications
 */
export const getMyCertifications = async (): Promise<Certification[]> => {
  try {
    //console.log('🔄 Fetching my certifications...');
    
    const response = await fetchWithTokenRefresh(`${API_BASE_URL}/my-certifications`, {
      method: 'GET',
    });

    const result: ApiResponse<Certification[]> = await response.json();

    if (!result.isSuccess) {
      throw new Error(result.message || 'Failed to get certifications');
    }

    //console.log('✅ Fetched certifications:', result.data.length);
    return result.data;
  } catch (error) {
    console.error('❌ Error fetching certifications:', error);
    throw error;
  }
};

/**
 * Create new certification
 * POST /api/certification
 * Content-Type: multipart/form-data
 */
export const createCertification = async (request: CreateCertificationRequest): Promise<Certification> => {
  try {
    // console.log('🔄 Creating certification...');
    // console.log('📝 Request data:', {
    //   type: request.type,
    //   name: request.certificationName,
    //   organization: request.issuingOrganization,
    //   issueDate: request.issueDate,
    //   expiryDate: request.expiryDate,
    //   imageUri: request.certificateImage.uri,
    // });
    
    // Create FormData with proper React Native format
    const formData = new FormData();
    formData.append('Type', request.type.toString());
    formData.append('CertificationName', request.certificationName);
    formData.append('IssuingOrganization', request.issuingOrganization);
    formData.append('IssueDate', request.issueDate);
    formData.append('ExpiryDate', request.expiryDate);
    
    // Append image file in React Native format
    const uriParts = request.certificateImage.uri.split('.');
    const fileType = uriParts[uriParts.length - 1];
    
    formData.append('CertificateImage', {
      uri: request.certificateImage.uri,
      name: request.certificateImage.name || `certificate_${Date.now()}.${fileType}`,
      type: `image/${fileType}`,
    } as any);

    //console.log('📤 Sending FormData to:', `${API_BASE_URL}`);

    const response = await fetchWithTokenRefresh(`${API_BASE_URL}`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const result: ApiResponse<Certification> = await response.json();

    if (!result.isSuccess) {
      throw new Error(result.message || 'Failed to create certification');
    }

    //console.log('✅ Certification created:', result.data.id);
    return result.data;
  } catch (error) {
    console.error('❌ Error creating certification:', error);
    throw error;
  }
};

/**
 * Get certification types for dropdown
 */
export const getCertificationTypes = (): Array<{ label: string; value: CertificationType }> => {
  return [
    { label: 'VietGAP', value: CertificationType.VietGAP },
    { label: 'GlobalGAP', value: CertificationType.GlobalGAP },
    { label: 'Organic', value: CertificationType.Organic },
    { label: 'OCOP', value: CertificationType.OCOP },
    { label: 'HACCP', value: CertificationType.HACCP },
    { label: 'ISO 22000', value: CertificationType.ISO22000 },
    { label: 'Safe Food Chain', value: CertificationType.SafeFoodChain },
    { label: 'Mã vùng trồng', value: CertificationType.PlantationCode },
    { label: 'UTZ', value: CertificationType.UTZ },
  ];
};
