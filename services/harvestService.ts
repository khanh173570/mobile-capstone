import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'https://farm.a-379.store/api';

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
      console.log('No access token found');
      throw new Error('No authentication token found');
    }

    console.log('Fetching harvests for crop:', cropId);
    const response = await fetch(`${API_BASE_URL}/crop/${cropId}/harvest`, {
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
      throw new Error(data.message || 'Failed to fetch harvests');
    }

    console.log('Harvests fetched successfully:', data.data?.length || 0);
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

    const response = await fetch(`${API_BASE_URL}/harvest/${harvestId}`, {
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

    const response = await fetch(`${API_BASE_URL}/harvest`, {
      method: 'POST',
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
      throw new Error(data.message || 'Failed to create harvest');
    }

    return data.data;
  } catch (error) {
    console.error('Error creating harvest:', error);
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

    const response = await fetch(`${API_BASE_URL}/harvest/${harvestId}`, {
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
