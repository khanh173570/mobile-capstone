// Crop status utilities - Synchronized with CropStatusEnum from cropService.ts
export interface CropStatusInfo {
  id: number;
  name: string;
  color: string;
  backgroundColor: string;
  description: string;
}

export const CROP_STATUSES: CropStatusInfo[] = [
  {
    id: 0,
    name: 'Chưa bắt đầu mùa vụ',
    color: '#6B7280', // Gray - Not editable
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    description: 'Vừa tạo vườn, chưa bắt đầu canh tác'
  },
  {
    id: 1,
    name: 'Đang phát triển',
    color: '#F59E0B', // Amber - Fully editable
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    description: 'Cây đang trong quá trình phát triển, có thể tạo đấu giá'
  },
  {
    id: 2,
    name: 'Đang trên sàn đấu giá',
    color: '#3B82F6', // Blue - Not editable
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    description: 'Vườn đang có đấu giá trong sàn'
  },
  {
    id: 3,
    name: 'Đang thu hoạch',
    color: '#EC4899', // Pink - Partially editable (harvest only)
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    description: 'Cây đang trong quá trình thu hoạch'
  },
  {
    id: 4,
    name: 'Đã thu hoạch',
    color: '#22C55E', // Green - Read-only
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    description: 'Đã hoàn thành thu hoạch'
  },
  {
    id: 5,
    name: 'Ngừng canh tác',
    color: '#EF4444', // Red - Not editable
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    description: 'Ngừng canh tác vườn này'
  }
];

/**
 * Get status information by status ID
 */
export const getCropStatusInfo = (statusId: number): CropStatusInfo => {
  const status = CROP_STATUSES.find(s => s.id === statusId);
  return status || CROP_STATUSES[0]; // Default to first status if not found
};

/**
 * Get status name by status ID
 */
export const getCropStatusName = (statusId: number): string => {
  return getCropStatusInfo(statusId).name;
};

/**
 * Get status color by status ID
 */
export const getCropStatusColor = (statusId: number): string => {
  return getCropStatusInfo(statusId).color;
};

/**
 * Get status background color by status ID
 */
export const getCropStatusBackgroundColor = (statusId: number): string => {
  return getCropStatusInfo(statusId).backgroundColor;
};