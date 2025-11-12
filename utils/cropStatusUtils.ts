// Crop status utilities
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
    name: 'Mới trồng',
    color: '#3B82F6', // Blue
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    description: 'Cây vừa được trồng'
  },
  {
    id: 1,
    name: 'Đang phát triển',
    color: '#F59E0B', // Amber
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    description: 'Cây đang trong quá trình phát triển'
  },
  {
    id: 2,
    name: 'Đang ra hoa',
    color: '#EC4899', // Pink
    backgroundColor: 'rgba(236, 72, 153, 0.1)',
    description: 'Cây đang trong thời kỳ ra hoa'
  },
  {
    id: 3,
    name: 'Đã thu hoạch',
    color: '#22C55E', // Green
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    description: 'Đã thu hoạch quả'
  },
  {
    id: 4,
    name: 'Ngừng canh tác',
    color: '#EF4444', // Red
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    description: 'Ngừng canh tác hoặc cây chết'
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