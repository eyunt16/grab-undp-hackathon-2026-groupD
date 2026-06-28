"use client";

import { useEffect, useMemo, useRef } from "react";
import type { GeoPoint, Trip } from "@/lib/trip";

const defaultPickup: GeoPoint = { lat: 10.7864, lng: 106.6908 };
const defaultDestination: GeoPoint = { lat: 10.7579, lng: 106.6594 };
function getMapStyle() {
  return {
    version: 8 as const,
    sources: {
      basemap: {
        type: "raster" as const,
        tiles: [
          "https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
          "https://b.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
          "https://c.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png",
        ],
        tileSize: 256,
        maxzoom: 20,
        attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      },
    },
    layers: [
      {
        id: "basemap-tiles",
        type: "raster" as const,
        source: "basemap",
      },
    ],
  };
}

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

function buildRoute(pickup: GeoPoint, destination: GeoPoint) {
  const first = mix(pickup, destination, 0.28);
  const second = mix(pickup, destination, 0.58);
  const third = mix(pickup, destination, 0.8);
  return [
    [pickup.lng, pickup.lat],
    [first.lng + 0.002, first.lat - 0.001],
    [second.lng - 0.0015, second.lat + 0.001],
    [third.lng + 0.001, third.lat],
    [destination.lng, destination.lat],
  ];
}

export function LiveTripMap({
  trip,
  compact = false,
}: {
  trip: Trip;
  compact?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const vehicleMarkerRef = useRef<import("maplibre-gl").Marker | null>(null);
  const routeCoordinatesRef = useRef<number[][]>([]);

  const pickup = trip.pickupLocation ?? defaultPickup;
  const destination = trip.destinationLocation ?? defaultDestination;
  const vehicle = getVehicleLocation(trip, pickup, destination);
  const livePositionRef = useRef(vehicle);
  livePositionRef.current = vehicle;
  const routeCoordinates = useMemo(
    () => buildRoute(pickup, destination),
    [pickup, destination],
  );
  routeCoordinatesRef.current = routeCoordinates;

  useEffect(() => {
    if (!containerRef.current) return;
    let disposed = false;

    const initializeMap = async () => {
      const { default: maplibregl } = await import("maplibre-gl");
      if (disposed || !containerRef.current) return;

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: getMapStyle() as maplibregl.StyleSpecification,
        center: [
          (pickup.lng + destination.lng) / 2,
          (pickup.lat + destination.lat) / 2,
        ],
        zoom: 13.5,
        attributionControl: false,
        cooperativeGestures: false,
      });
      mapRef.current = map;
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        "top-right",
      );
      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
        "bottom-right",
      );

      new maplibregl.Marker({
        color: "#0047AB",
        scale: 1.1,
      })
        .setLngLat([pickup.lng, pickup.lat])
        .addTo(map);
      new maplibregl.Marker({
        color: "#ef9d3d",
        scale: 1.2,
      })
        .setLngLat([destination.lng, destination.lat])
        .addTo(map);

      const vehicleElement = document.createElement("div");
      vehicleElement.className = "aloxe-live-vehicle";
      const vehicleIcon = document.createElement("span");
      vehicleIcon.textContent = "🚗";
      const vehicleLabel = document.createElement("strong");
      vehicleLabel.textContent = "VỊ TRÍ TRỰC TIẾP";
      vehicleElement.append(vehicleIcon, vehicleLabel);
      const currentVehicle = livePositionRef.current;
      vehicleMarkerRef.current = new maplibregl.Marker({
        element: vehicleElement,
        anchor: "center",
      })
        .setLngLat([currentVehicle.lng, currentVehicle.lat])
        .addTo(map);

      map.on("load", () => {
        if (disposed) return;
        map.addSource("trip-route", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: routeCoordinatesRef.current,
            },
          },
        });
        map.addLayer({
          id: "trip-route-outline",
          type: "line",
          source: "trip-route",
          paint: {
            "line-color": "#ffffff",
            "line-width": 10,
            "line-opacity": 0.9,
          },
        });
        map.addLayer({
          id: "trip-route",
          type: "line",
          source: "trip-route",
          paint: {
            "line-color": "#0047AB",
            "line-width": 5,
            "line-opacity": 0.95,
          },
        });
        const bounds = new maplibregl.LngLatBounds();
        for (const coordinate of routeCoordinatesRef.current) {
          bounds.extend(coordinate as [number, number]);
        }
        bounds.extend([currentVehicle.lng, currentVehicle.lat]);
        map.fitBounds(bounds, {
          padding: compact ? 42 : 70,
          duration: 0,
          maxZoom: 15,
        });
      });

      map.on("error", () => {
        containerRef.current?.setAttribute("data-map-status", "loading-error");
      });

      return () => {
        vehicleMarkerRef.current?.remove();
        map.remove();
      };
    };

    let cleanup: (() => void) | undefined;
    void initializeMap().then((removeMap) => {
      if (disposed) {
        removeMap?.();
        return;
      }
      cleanup = removeMap;
    });
    return () => {
      disposed = true;
      cleanup?.();
      mapRef.current = null;
      vehicleMarkerRef.current = null;
    };
  }, [compact, destination.lat, destination.lng, pickup.lat, pickup.lng]);

  useEffect(() => {
    vehicleMarkerRef.current?.setLngLat([vehicle.lng, vehicle.lat]);
    if (trip.status === "in_progress") {
      mapRef.current?.easeTo({
        center: [vehicle.lng, vehicle.lat],
        duration: 900,
      });
      return;
    }
    if (trip.driverLocation && trip.status === "driver_assigned") {
      mapRef.current?.easeTo({
        center: [vehicle.lng, vehicle.lat],
        duration: 700,
      });
    }
  }, [trip.driverLocation, trip.status, vehicle.lat, vehicle.lng]);

  return (
    <section
      className={`relative overflow-hidden bg-muted ${compact ? "h-72 rounded-t-[1.35rem]" : "h-[390px] sm:h-[480px]"}`}
      aria-label="Bản đồ MapLibre hiển thị vị trí trực tiếp"
    >
      <div ref={containerRef} className="absolute inset-0 z-[1]" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-bold text-muted-foreground -z-0">
        Đang tải bản đồ...
      </div>
      <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-border bg-card/95 px-3 py-2 text-sm font-black text-primary shadow-md">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500" />
        ĐANG CẬP NHẬT
      </div>
    </section>
  );
}

