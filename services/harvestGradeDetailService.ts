import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

export interface HarvestGradeDetail {
  id: string;
  grade: 1 | 2 | 3;
  quantity: number;
  unit: string;
  harvestID: string;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateHarvestGradeDetailData {
  grade: 1 | 2 | 3;
  quantity: number;
  unit: string;
  harvestID: string;
}

export interface UpdateHarvestGradeDetailData {
  grade: 1 | 2 | 3;
  quantity: number;
  unit: string;
  harvestID: string;
}

export const GRADE_LABELS: Record<1 | 2 | 3, string> = {
  1: 'Quả loại to',
  2: 'Quả loại vừa',
  3: 'Quả loại nhỏ',
};

// Get all grade details for a harvest
export const getHarvestGradeDetails = async (harvestId: string): Promise<HarvestGradeDetail[]> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      console.log('No access token found');
      throw new Error('No authentication token found');
    }

    console.log('Fetching grade details for harvest:', harvestId);
    const response = await fetch(`${API_URL}/farm-service/harvest/${harvestId}/gradedetail`, {
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
      throw new Error(data.message || 'Failed to fetch grade details');
    }

    console.log('Grade details fetched successfully:', data.data?.length || 0);
    return data.data || [];
  } catch (error) {
    console.error('Error fetching grade details:', error);
    throw error;
  }
};

// Create new harvest grade detail
export const createHarvestGradeDetail = async (gradeData: CreateHarvestGradeDetailData): Promise<HarvestGradeDetail> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Creating grade detail:', gradeData);
    const response = await fetch(`${API_URL}/farm-service/harvestgradedetail`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gradeData),
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
      throw new Error(data.message || 'Failed to create grade detail');
    }

    console.log('Grade detail created successfully');
    return data.data;
  } catch (error) {
    console.error('Error creating grade detail:', error);
    throw error;
  }
};

// Get grade detail by ID
export const getHarvestGradeDetailById = async (gradeDetailId: string): Promise<HarvestGradeDetail> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_URL}/farm-service/harvestgradedetail/${gradeDetailId}`, {
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
      throw new Error(data.message || 'Failed to fetch grade detail');
    }

    return data.data;
  } catch (error) {
    console.error('Error fetching grade detail:', error);
    throw error;
  }
};

// Update harvest grade detail
export const updateHarvestGradeDetail = async (gradeDetailId: string, gradeData: UpdateHarvestGradeDetailData): Promise<HarvestGradeDetail> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Updating grade detail:', gradeDetailId, gradeData);
    const response = await fetch(`${API_URL}/farm-service/harvestgradedetail/${gradeDetailId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(gradeData),
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
      throw new Error(data.message || 'Failed to update grade detail');
    }

    console.log('Grade detail updated successfully');
    return data.data;
  } catch (error) {
    console.error('Error updating grade detail:', error);
    throw error;
  }
};

// Delete harvest grade detail
export const deleteHarvestGradeDetail = async (gradeDetailId: string): Promise<void> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Deleting grade detail:', gradeDetailId);
    const response = await fetch(`${API_URL}/farm-service/harvestgradedetail/${gradeDetailId}`, {
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
      throw new Error(data.message || 'Failed to delete grade detail');
    }

    console.log('Grade detail deleted successfully');
  } catch (error) {
    console.error('Error deleting grade detail:', error);
    throw error;
  }
};
