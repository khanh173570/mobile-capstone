import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

export interface Harvest {
  id: string;
  harvestDate: string | null;
  startDate: string;
  totalQuantity: number;
  unit: string;
  note: string;
  salePrice: number;
  cropID: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateHarvestData {
  startDate: string;
  note: string;
  cropID: string;
}

export interface UpdateHarvestData {
  harvestDate: string;
  startDate: string;
  totalQuantity: number;
  unit: string;
  note: string;
  salePrice: number;
}

// Get all harvests by crop ID
export const getHarvestsByCropId = async (cropId: string): Promise<Harvest[]> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      //console.log('No access token found');
      throw new Error('No authentication token found');
    }

    //console.log('Fetching harvests for crop:', cropId);
    const response = await fetch(`${API_URL}/farm-service/crop/${cropId}/harvest`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const text = await response.text();
    let data;
    
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      // console.error('JSON parse error:', e);
      // console.error('Response text:', text);
      throw new Error('Invalid response format from server');
    }

    //console.log('Response status:', response.status);
    //console.log('Response data:', data);

    if (!response.ok) {
      console.error('API Error:', data.message || response.statusText);
      throw new Error(data.message || `Failed to fetch harvests (Status: ${response.status})`);
    }

    //console.log('Harvests fetched successfully:', data.data?.length || 0);
    return data.data || [];
  } catch (error) {
    console.error('Error fetching harvests:', error);
    throw error;
  }
};

// Get harvest by ID
export const getHarvestById = async (harvestId: string): Promise<Harvest> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/farm-service/harvest/${harvestId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const text = await response.text();
    let data;
    
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('JSON parse error:', e);
      throw new Error('Invalid response format from server');
    }

    if (!response.ok) {
      throw new Error(data.message || 'Failed to fetch harvest');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching harvest:', error);
    throw error;
  }
};

// Create new harvest
export const createHarvest = async (harvestData: CreateHarvestData): Promise<Harvest> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    //console.log('[harvestService] Creating harvest with data:', harvestData);
    
    // Validate required fields
    if (!harvestData.cropID || !harvestData.cropID.trim()) {
      throw new Error('cropID is required');
    }
    if (!harvestData.startDate) {
      throw new Error('startDate is required');
    }
    if (!harvestData.note) {
      throw new Error('note is required');
    }

    // Prepare request body
    const requestBody = {
      startDate: harvestData.startDate,
      note: harvestData.note || 'Không có',
      cropID: harvestData.cropID,
    };

    //console.log('[harvestService] Request body:', requestBody);

    const response = await fetch(`${API_URL}/farm-service/harvest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    //console.log('[harvestService] Response status:', response.status);
    
    const text = await response.text();
    let data;
    
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('[harvestService] JSON parse error:', e);
      console.error('[harvestService] Response text:', text);
      throw new Error('Invalid response format from server');
    }

    //console.log('[harvestService] Response data:', data);

    if (!response.ok) {
      const errorMessage = data.message || data.error || 'Failed to create harvest';
      console.error('[harvestService] API Error:', errorMessage);
      throw new Error(errorMessage);
    }

    return data.data;
  } catch (error) {
    console.error('[harvestService] Error creating harvest:', error);
    throw error;
  }
};

// Update harvest
export const updateHarvest = async (harvestId: string, harvestData: UpdateHarvestData): Promise<Harvest> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/farm-service/harvest/${harvestId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(harvestData),
    });

    const text = await response.text();
    let data;
    
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('JSON parse error:', e);
      throw new Error('Invalid response format from server');
    }

    if (!response.ok) {
      throw new Error(data.message || 'Failed to update harvest');
    }

    return data.data;
  } catch (error) {
    console.error('Error updating harvest:', error);
    throw error;
  }
};

// Delete harvest
export const deleteHarvest = async (harvestId: string): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/farm-service/harvest/${harvestId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const text = await response.text();
    let data;
    
    try {
      data = text ? JSON.parse(text) : {};
    } catch (e) {
      console.error('JSON parse error:', e);
      throw new Error('Invalid response format from server');
    }

    if (!response.ok) {
      throw new Error(data.message || 'Failed to delete harvest');
    }

    //console.log('Harvest deleted successfully');
  } catch (error) {
    console.error('Error deleting harvest:', error);
    throw error;
  }
};
