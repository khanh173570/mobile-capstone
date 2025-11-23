const API_BASE_URL = 'https://gateway.a-379.store/api/auction-service';

// Get auth token from storage
const getAuthToken = async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const token = await AsyncStorage.getItem('accessToken');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Get list of custard apple types
export const getCustardAppleTypes = async () => {
  try {
    const token = await getAuthToken();
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(
      'https://gateway.a-379.store/api/farm-service/custardappletype',
      {
        method: 'GET',
        headers,
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    console.log('Raw response:', text);
    
    if (!text) {
      throw new Error('Empty response');
    }
    
    const data = JSON.parse(text);
    return data.data || [];
  } catch (error) {
    console.error('Error fetching custard apple types:', error);
    throw error;
  }
};

// Create a new buy request
export const createBuyRequest = async (buyRequestData: {
  title: string;
  productTypeId: string;
  requiredQuantity: number;
  desiredPrice: number;
  requiredDate: string;
  location: string;
  notes: string;
}) => {
  try {
    const token = await getAuthToken();
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(
      `${API_BASE_URL}/buyrequest`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(buyRequestData),
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    if (!text) {
      throw new Error('Empty response');
    }
    
    const data = JSON.parse(text);
    return data.data;
  } catch (error) {
    console.error('Error creating buy request:', error);
    throw error;
  }
};

// Get my buy requests list
export const getMyBuyRequests = async (pageNumber: number = 1, pageSize: number = 10) => {
  try {
    const token = await getAuthToken();
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(
      `${API_BASE_URL}/buyrequest/my?pageNumber=${pageNumber}&pageSize=${pageSize}`,
      {
        method: 'GET',
        headers,
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    if (!text) {
      throw new Error('Empty response');
    }
    
    const data = JSON.parse(text);
    return data.data || { items: [], pageNumber, pageSize };
  } catch (error) {
    console.error('Error fetching buy requests:', error);
    throw error;
  }
};

// Get buy request detail by ID
export const getBuyRequestDetail = async (buyRequestId: string) => {
  try {
    const token = await getAuthToken();
    const headers: any = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(
      `${API_BASE_URL}/buyrequest/${buyRequestId}`,
      {
        method: 'GET',
        headers,
      }
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    if (!text) {
      throw new Error('Empty response');
    }
    
    const data = JSON.parse(text);
    return data.data;
  } catch (error) {
    console.error('Error fetching buy request detail:', error);
    throw error;
  }
};
