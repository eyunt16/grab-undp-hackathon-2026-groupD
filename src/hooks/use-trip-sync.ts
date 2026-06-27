"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { TRIP_CHANNEL, TRIP_STORAGE_KEY, type Trip } from "@/lib/trip";

type TripMessage = { type: "TRIP_UPDATED"; trip: Trip | null };

export function useTripSync() {
  const [trip, setTripState] = useState<Trip | null>(null);
  const [ready, setReady] = useState(false);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(TRIP_STORAGE_KEY);
    if (stored) {
      try {
        setTripState(JSON.parse(stored) as Trip);
      } catch {
        window.localStorage.removeItem(TRIP_STORAGE_KEY);
      }
    }

    const channel = new BroadcastChannel(TRIP_CHANNEL);
    channelRef.current = channel;
    const handleMessage = (event: MessageEvent<TripMessage>) => {
      if (event.data?.type === "TRIP_UPDATED") setTripState(event.data.trip);
    };
    channel.addEventListener("message", handleMessage);
    setReady(true);
    return () => {
      channel.removeEventListener("message", handleMessage);
      channel.close();
      channelRef.current = null;
    };
  }, []);

  const setTrip = useCallback((nextTrip: Trip | null) => {
    setTripState(nextTrip);
    if (nextTrip)
      window.localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(nextTrip));
    else window.localStorage.removeItem(TRIP_STORAGE_KEY);
    channelRef.current?.postMessage({
      type: "TRIP_UPDATED",
      trip: nextTrip,
    } satisfies TripMessage);
  }, []);

  const updateTrip = useCallback((updates: Partial<Trip>) => {
    setTripState((current) => {
      if (!current) return current;
      const next = { ...current, ...updates };
      window.localStorage.setItem(TRIP_STORAGE_KEY, JSON.stringify(next));
      channelRef.current?.postMessage({
        type: "TRIP_UPDATED",
        trip: next,
      } satisfies TripMessage);
      return next;
    });
  }, []);

  return { trip, ready, setTrip, updateTrip };
}
