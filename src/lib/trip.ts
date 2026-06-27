export type TripStatus =
  | "matching"
  | "driver_assigned"
  | "driver_arrived"
  | "in_progress"
  | "completed"
  | "cancelled";

export type Trip = {
  id: string;
  riderName: string;
  pickup: string;
  destination: string;
  provider: string;
  price: number;
  eta: number;
  status: TripStatus;
  driverName?: string;
  plate?: string;
  vehicle?: string;
  pickupLocation?: GeoPoint;
  destinationLocation?: GeoPoint;
  liveProgress?: number;
  createdAt: string;
};

export type GeoPoint = {
  lat: number;
  lng: number;
};

export const TRIP_STORAGE_KEY = "easymove.current-trip.v2";
export const TRIP_CHANNEL = "easymove-trip-sync-v2";

export const statusCopy: Record<TripStatus, string> = {
  matching: "Đang tìm tài xế",
  driver_assigned: "Tài xế đang đến",
  driver_arrived: "Tài xế đã đến điểm đón",
  in_progress: "Đang di chuyển",
  completed: "Đã đến nơi an toàn",
  cancelled: "Chuyến xe đã hủy",
};
