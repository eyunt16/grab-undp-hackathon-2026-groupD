"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { GeoPoint, Trip } from "@/lib/trip";

const defaultPickup: GeoPoint = { lat: 10.7864, lng: 106.6908 };
const defaultDestination: GeoPoint = { lat: 10.7579, lng: 106.6594 };

function mix(start: GeoPoint, end: GeoPoint, progress: number): GeoPoint {
  return {
    lat: start.lat + (end.lat - start.lat) * progress,
    lng: start.lng + (end.lng - start.lng) * progress,
  };
}

function getInitialDriverLocation(pickup: GeoPoint): GeoPoint {
  return {
    lat: pickup.lat + 0.008,
    lng: pickup.lng - 0.006,
  };
}

function getVehicleLocation(
  trip: Trip,
  pickup: GeoPoint,
  destination: GeoPoint,
) {
  const progress = Math.max(0, Math.min(1, trip.liveProgress ?? 0));
  const driverStart = getInitialDriverLocation(pickup);

  if (trip.status === "completed") return destination;
  if (trip.status === "driver_arrived") return pickup;
  if (trip.driverLocation) return trip.driverLocation;
  if (trip.status === "matching") return driverStart;
  if (trip.status === "driver_assigned") {
    return mix(driverStart, pickup, progress);
  }
  if (trip.status === "in_progress") {
    return mix(pickup, destination, progress);
  }
  return progress > 0 ? mix(pickup, destination, progress) : pickup;
}

async function fetchRoute(
  pickup: GeoPoint,
  destination: GeoPoint,
): Promise<[number, number][]> {
  const fallback: [number, number][] = [
    [pickup.lat, pickup.lng],
    [destination.lat, destination.lng],
  ];
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${pickup.lng},${pickup.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return fallback;
    const data = await res.json();
    const coords = data?.routes?.[0]?.geometry?.coordinates;
    if (Array.isArray(coords) && coords.length > 1) {
      return coords.map((c: number[]) => [c[1], c[0]] as [number, number]);
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function LiveTripMap({
  trip,
  compact = false,
}: {
  trip: Trip;
  compact?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const vehicleMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);

  const pickup = trip.pickupLocation ?? defaultPickup;
  const destination = trip.destinationLocation ?? defaultDestination;
  const vehicle = getVehicleLocation(trip, pickup, destination);
  const vehicleRef = useRef(vehicle);
  vehicleRef.current = vehicle;

  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;

    const init = async () => {
      const L = (await import("leaflet")).default;
      if (disposed || !containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [
          (pickup.lat + destination.lat) / 2,
          (pickup.lng + destination.lng) / 2,
        ],
        zoom: 14,
        zoomControl: false,
        attributionControl: false,
      });
      mapRef.current = map;

      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      L.control.zoom({ position: "topright" }).addTo(map);
      L.control.attribution({ position: "bottomright", prefix: false }).addTo(map);

      const pickupIcon = L.divIcon({
        html: '<div style="width:18px;height:18px;border-radius:50%;background:#0047AB;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
        className: "",
      });
      const destIcon = L.divIcon({
        html: '<div style="width:20px;height:20px;border-radius:50%;background:#ef9d3d;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3)"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10],
        className: "",
      });
      const vehicleIcon = L.divIcon({
        html: '<div style="font-size:28px;line-height:1;filter:drop-shadow(0 2px 3px rgba(0,0,0,.4))">🚗</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 14],
        className: "",
      });

      L.marker([pickup.lat, pickup.lng], { icon: pickupIcon }).addTo(map);
      L.marker([destination.lat, destination.lng], { icon: destIcon }).addTo(map);

      const cur = vehicleRef.current;
      vehicleMarkerRef.current = L.marker([cur.lat, cur.lng], {
        icon: vehicleIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      const routeCoords = await fetchRoute(pickup, destination);
      if (disposed) return;

      routeLayerRef.current = L.polyline(routeCoords, {
        color: "#0047AB",
        weight: 5,
        opacity: 0.9,
      }).addTo(map);

      const bounds = L.latLngBounds([
        [pickup.lat, pickup.lng],
        [destination.lat, destination.lng],
        [cur.lat, cur.lng],
      ]);
      if (routeLayerRef.current) {
        bounds.extend(routeLayerRef.current.getBounds());
      }
      map.fitBounds(bounds, { padding: [compact ? 30 : 50, compact ? 30 : 50] });
    };

    void init();

    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      vehicleMarkerRef.current = null;
      routeLayerRef.current = null;
    };
  }, [compact, destination.lat, destination.lng, pickup.lat, pickup.lng]);

  useEffect(() => {
    if (!vehicleMarkerRef.current || !mapRef.current) return;
    vehicleMarkerRef.current.setLatLng([vehicle.lat, vehicle.lng]);
    if (trip.status === "in_progress" || trip.status === "driver_assigned") {
      mapRef.current.panTo([vehicle.lat, vehicle.lng], { animate: true, duration: 0.8 });
    }
  }, [trip.status, vehicle.lat, vehicle.lng]);

  return (
    <section
      className={`relative overflow-hidden bg-muted ${compact ? "h-72 rounded-t-[1.35rem]" : "h-[390px] sm:h-[480px]"}`}
      aria-label="Bản đồ hiển thị vị trí trực tiếp"
    >
      <div ref={containerRef} className="absolute inset-0 z-[1]" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-bold text-muted-foreground">
        Đang tải bản đồ...
      </div>
      <div className="pointer-events-none absolute left-4 top-4 z-[1000] flex items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-2 text-sm font-black text-primary shadow-md">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
        ĐANG CẬP NHẬT
      </div>
    </section>
  );
}
