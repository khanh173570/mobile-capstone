import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.apiUrl;

export interface CurrentHarvest {
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
  harvestGradeDetailDTOs: Array<{
    id: string;
    grade: 1 | 2 | 3;
    quantity: number;
    unit: string;
    harvestID: string;
    createdAt: string;
    updatedAt: string | null;
  }>;
}

export interface CreateAuctionData {
  publishDate: string;
  endDate: string;
  farmerId: string;
  startingPrice: number;
  minBidIncrement: number;
  enableBuyNow: boolean;
  buyNowPrice: number | null;
  enableAntiSniping: boolean;
  antiSnipingExtensionSeconds: number | null;
  enableReserveProxy: boolean;
  note: string;
  expectedHarvestDate: string;
  expectedTotalQuantity: number;
}

export interface AuctionSession {
  id: string;
  publishDate: string;
  endDate: string;
  farmerId: string;
  sessionCode: string;
  startingPrice: number;
  currentPrice: number | null;
  winningPrice: number | null;
  minBidIncrement: number;
  enableBuyNow: boolean;
  buyNowPrice: number | null;
  enableAntiSniping: boolean;
  antiSnipingExtensionSeconds: number | null;
  status: number;
  winnerId: string | null;
  note: string;
  expectedHarvestDate: string;
  expectedTotalQuantity: number;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateAuctionHarvestData {
  auctionSessionId: string;
  harvestId: string;
}

export interface AuctionHarvest {
  auctionSessionId: string;
  harvestId: string;
}

// Get current harvest by crop ID
export const getCurrentHarvest = async (cropId: string): Promise<CurrentHarvest> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Fetching current harvest for crop:', cropId);
    const response = await fetch(`${API_URL}/farm-service/crop/${cropId}/currentharvest`, {
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
      throw new Error(data.message || 'Failed to fetch current harvest');
    }

    console.log('Current harvest fetched successfully:', data.data?.id);
    return data.data;
  } catch (error) {
    console.error('Error fetching current harvest:', error);
    throw error;
  }
};

// Create auction session
export const createAuctionSession = async (auctionData: CreateAuctionData): Promise<AuctionSession> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Creating auction session:', auctionData);
    const response = await fetch(`${API_URL}/auction-service/englishauction`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(auctionData),
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
      throw new Error(data.message || 'Failed to create auction session');
    }

    console.log('Auction session created successfully:', data.data?.id);
    return data.data;
  } catch (error) {
    console.error('Error creating auction session:', error);
    throw error;
  }
};

// Create auction harvest
export const createAuctionHarvest = async (auctionHarvestData: CreateAuctionHarvestData): Promise<AuctionHarvest> => {
  try {
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('No authentication token found');
    }

    console.log('Creating auction harvest:', auctionHarvestData);
    const response = await fetch(`${API_URL}/auction-service/auctionharvest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(auctionHarvestData),
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
      throw new Error(data.message || 'Failed to create auction harvest');
    }

    console.log('Auction harvest created successfully');
    return data.data;
  } catch (error) {
    console.error('Error creating auction harvest:', error);
    throw error;
  }
};

// Calculate total quantity from harvest grades
export const calculateTotalQuantity = (harvestGradeDetails: CurrentHarvest['harvestGradeDetailDTOs']): number => {
  return harvestGradeDetails.reduce((total, grade) => total + grade.quantity, 0);
};
