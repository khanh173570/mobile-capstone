import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://gateway.a-379.store/api/auction-service/report';

interface CreateReportRequest {
  auctionId: string;
  reporterId: string;
  note: string;
  reportType: 'Fraud' | 'FalseInformation' | 'TechnicalIssue' | 'PolicyViolated' | 'Other';
}

interface Report {
  id: string;
  auctionId: string;
  reporterId: string;
  note: string;
  reportType: string;
  reportStatus: string;
  createdAt: string;
  updatedAt: string | null;
}

interface ApiResponse<T> {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: T;
}

const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  };
};

export const createReport = async (reportData: CreateReportRequest): Promise<Report> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(reportData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const textData = await response.text();
    if (!textData) {
      throw new Error('Empty response from server');
    }

    const result: ApiResponse<Report> = JSON.parse(textData);
    
    if (!result.isSuccess) {
      throw new Error(result.message || 'Failed to create report');
    }

    return result.data;
  } catch (error) {
    console.error('Error creating report:', error);
    throw error;
  }
};

export const getMyReports = async (): Promise<Report[]> => {
  try {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/my-reports`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const textData = await response.text();
    if (!textData) {
      throw new Error('Empty response from server');
    }

    const result: ApiResponse<{ items: Report[] }> = JSON.parse(textData);
    
    if (!result.isSuccess) {
      throw new Error(result.message || 'Failed to fetch reports');
    }

    return result.data.items || [];
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

export const getReportsByAuction = async (auctionId: string): Promise<Report[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/auction/${auctionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const textData = await response.text();
    if (!textData) {
      throw new Error('Empty response from server');
    }

    const result: ApiResponse<{ items: Report[] }> = JSON.parse(textData);
    
    if (!result.isSuccess) {
      throw new Error(result.message || 'Failed to fetch reports');
    }

    return result.data.items || [];
  } catch (error) {
    console.error('Error fetching auction reports:', error);
    throw error;
  }
};

export const getReportTypes = () => {
  return [
    { value: 'Fraud', label: 'Gian lận' },
    { value: 'FalseInformation', label: 'Thông tin sai lệch' },
    { value: 'TechnicalIssue', label: 'Vấn đề kỹ thuật' },
    { value: 'PolicyViolated', label: 'Vi phạm chính sách' },
    { value: 'Other', label: 'Khác' },
  ];
};
