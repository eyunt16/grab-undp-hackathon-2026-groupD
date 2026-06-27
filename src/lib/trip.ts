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
  matching: "Finding a driver",
  driver_assigned: "Driver is on the way",
  driver_arrived: "Driver has arrived",
  in_progress: "Trip in progress",
  completed: "Arrived safely",
  cancelled: "Trip cancelled",
};
