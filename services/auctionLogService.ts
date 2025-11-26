import { fetchWithTokenRefresh } from './authService';

interface AuctionLogEntity {
  id: string;
  auctionPostId: string;
  publishDate: string;
  endDate: string;
  farmerId: string;
  sessionCode: string;
  startingPrice: number;
  note: string;
  expectedHarvestDate: string;
  expectedTotalQuantity: number;
  status: number;
  type: number;
  createdAt: string;
  updatedAt?: string;
  minBidIncrement: number;
  enableBuyNow: boolean;
  enableAntiSniping: boolean;
  enableReserveProxy: boolean;
}

export interface AuctionLog {
  id: string;
  auctionPostId: string;
  userId: string;
  type: 'Create' | 'StatusChange' | 'Publish' | 'Update' | string;
  dateTimeUpdate: string;
  oldEntity: AuctionLogEntity | null;
  newEntity: AuctionLogEntity | null;
  createdAt: string;
  updatedAt?: string | null;
}

interface AuctionLogResponse {
  isSuccess: boolean;
  statusCode: number;
  message: string;
  errors: any;
  data: AuctionLog[];
}

export const getAuctionLogs = async (auctionId: string): Promise<AuctionLog[]> => {
  try {
    const response = await fetchWithTokenRefresh(
      `https://gateway.a-379.store/api/auction-service/auctionlog/auction/${auctionId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const result: AuctionLogResponse = await response.json();

    if (result.isSuccess && Array.isArray(result.data)) {
      // Parse string entities to JSON objects
      return result.data.map(log => ({
        ...log,
        oldEntity: log.oldEntity ? 
          (typeof log.oldEntity === 'string' ? JSON.parse(log.oldEntity) : log.oldEntity) 
          : null,
        newEntity: log.newEntity ? 
          (typeof log.newEntity === 'string' ? JSON.parse(log.newEntity) : log.newEntity) 
          : null,
      }));
    }

    return [];
  } catch (error) {
    console.error(`Error fetching auction logs for ${auctionId}:`, error);
    throw error;
  }
};

// Get log type label in Vietnamese
export const getLogTypeLabel = (type: string): string => {
  const typeLabels: { [key: string]: string } = {
    'Create': 'Tạo mới',
    'StatusChange': 'Thay đổi trạng thái',
    'Publish': 'Công bố',
    'Update': 'Cập nhật',
  };
  return typeLabels[type] || type;
};

// Get log type color
export const getLogTypeColor = (type: string): string => {
  const typeColors: { [key: string]: string } = {
    'Create': '#10B981',
    'StatusChange': '#3B82F6',
    'Publish': '#F59E0B',
    'Update': '#8B5CF6',
  };
  return typeColors[type] || '#6B7280';
};

// Get status label from status number
export const getAuctionStatusLabel = (status: number): string => {
  const statusLabels: { [key: number]: string } = {
    1: 'Nháp',
    2: 'Chờ duyệt',
    3: 'Đã duyệt',
    4: 'Đang diễn ra',
    5: 'Hoàn thành',
    6: 'Không có người thắng',
    7: 'Đã hủy',
  };
  return statusLabels[status] || 'Không xác định';
};
