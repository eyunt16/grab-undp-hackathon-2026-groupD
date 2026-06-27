"use client";

import {
  ArrowRight,
  Check,
  ChevronLeft,
  Clock3,
  HeartHandshake,
  Home,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Search,
  ShieldCheck,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { useTripSync } from "@/hooks/use-trip-sync";
import { statusCopy, type Trip, type TripStatus } from "@/lib/trip";

const destinations = [
  {
    name: "Family clinic",
    address: "12 Nguyễn Thị Minh Khai",
    icon: HeartHandshake,
  },
  { name: "Bến Thành Market", address: "Lê Lợi, District 1", icon: Star },
  { name: "Lan’s home", address: "88 Võ Văn Tần", icon: Home },
];

const providers = [
  {
    id: "EasyCar",
    name: "EasyCar",
    note: "Recommended",
    eta: 4,
    price: 68000,
    color: "bg-[#157347]",
  },
  {
    id: "Comfort Taxi",
    name: "Comfort Taxi",
    note: "More spacious",
    eta: 7,
    price: 82000,
    color: "bg-[#315a76]",
  },
  {
    id: "City Cab",
    name: "City Cab",
    note: "Lowest fare",
    eta: 9,
    price: 61000,
    color: "bg-[#d8872f]",
  },
];

const nextStatus: Partial<Record<TripStatus, TripStatus>> = {
  driver_assigned: "driver_arrived",
  driver_arrived: "in_progress",
  in_progress: "completed",
};

const nextAction: Partial<Record<TripStatus, string>> = {
  driver_assigned: "Driver has arrived",
  driver_arrived: "I’m in the car",
  in_progress: "I’ve arrived",
};

export function RiderApp() {
  const { trip, ready, setTrip, updateTrip } = useTripSync();
  const [step, setStep] = useState<"destination" | "options">("destination");
  const [destination, setDestination] = useState("");
  const [selectedProvider, setSelectedProvider] = useState(providers[0].id);

  const provider = useMemo(
    () =>
      providers.find((item) => item.id === selectedProvider) ?? providers[0],
    [selectedProvider],
  );

  useEffect(() => {
    if (trip?.status !== "matching") return;
    const timer = window.setTimeout(() => {
      updateTrip({
        status: "driver_assigned",
        driverName: "Minh Quân",
        plate: "51H-482.16",
        vehicle: "Silver Toyota Vios",
      });
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [trip?.status, updateTrip]);

  const startBooking = () => {
    if (!destination.trim()) return;
    setStep("options");
  };

  const confirmBooking = () => {
    const newTrip: Trip = {
      id: `EM-${Date.now().toString().slice(-6)}`,
      riderName: "Mai Lan",
      pickup: "Home · 24 Nguyễn Đình Chiểu",
      destination: destination.trim(),
      provider: provider.name,
      price: provider.price,
      eta: provider.eta,
      status: "matching",
      createdAt: new Date().toISOString(),
    };
    setTrip(newTrip);
  };

  const resetBooking = () => {
    setTrip(null);
    setDestination("");
    setStep("destination");
  };

  if (!ready) return <div className="min-h-screen bg-[#f7f8f5]" />;

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#17231d]">
      <AppHeader
        rightSlot={
          <Link
            href="/guardian"
            className="flex items-center gap-2 rounded-full bg-[#eef6f1] px-4 py-2 text-sm font-bold text-[#157347] hover:bg-[#e1f0e7]"
          >
            <ShieldCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Guardian view</span>
          </Link>
        }
      />

      {trip ? (
        <ActiveRide
          trip={trip}
          updateTrip={updateTrip}
          resetBooking={resetBooking}
        />
      ) : (
        <section className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:py-12">
          <div className="mx-auto w-full max-w-2xl lg:mx-0">
            <div className="mb-8 flex items-center gap-3">
              {step === "options" && (
                <button
                  type="button"
                  onClick={() => setStep("destination")}
                  className="grid h-10 w-10 place-items-center rounded-full border border-[#dce3de] bg-white hover:border-[#157347]"
                  aria-label="Back"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#157347]">
                  Book a ride
                </p>
                <h1 className="mt-1 text-4xl font-black tracking-[-0.045em] sm:text-5xl">
                  {step === "destination"
                    ? "Where are you going?"
                    : "Choose your ride"}
                </h1>
              </div>
            </div>

            {step === "destination" ? (
              <div>
                <div className="rounded-[1.75rem] border border-[#dce4df] bg-white p-3 shadow-[0_16px_50px_rgba(29,48,38,0.07)]">
                  <div className="flex items-center gap-3 border-b border-[#edf0ee] px-3 py-4 text-[#65746c]">
                    <span className="h-3 w-3 rounded-full border-[3px] border-[#157347]" />
                    <span className="text-sm font-semibold">
                      Home · 24 Nguyễn Đình Chiểu
                    </span>
                  </div>
                  <label className="flex items-center gap-3 px-3 py-3">
                    <MapPin
                      className="h-5 w-5 shrink-0 text-[#e58b31]"
                      fill="currentColor"
                    />
                    <input
                      value={destination}
                      onChange={(event) => setDestination(event.target.value)}
                      onKeyDown={(event) =>
                        event.key === "Enter" && startBooking()
                      }
                      placeholder="Search for a place"
                      className="h-12 min-w-0 flex-1 bg-transparent text-lg font-semibold outline-none placeholder:text-[#9ba7a0]"
                      aria-label="Destination"
                    />
                    <Search className="h-5 w-5 text-[#8a978f]" />
                  </label>
                </div>

                <div className="mt-8">
                  <p className="mb-3 text-sm font-bold text-[#65746c]">
                    Saved places
                  </p>
                  <div className="space-y-3">
                    {destinations.map((place) => {
                      const Icon = place.icon;
                      return (
                        <button
                          type="button"
                          key={place.name}
                          onClick={() => setDestination(place.name)}
                          className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${destination === place.name ? "border-[#157347] bg-[#edf7f1]" : "border-[#e2e7e3] bg-white hover:border-[#b5cdbf]"}`}
                        >
                          <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f1f4f2] text-[#4e6257]">
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block font-bold">
                              {place.name}
                            </span>
                            <span className="mt-0.5 block truncate text-sm text-[#748179]">
                              {place.address}
                            </span>
                          </span>
                          <ArrowRight className="h-5 w-5 text-[#9aa59f]" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={!destination.trim()}
                  onClick={startBooking}
                  className="mt-8 flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-[#157347] text-lg font-bold text-white shadow-[0_14px_30px_rgba(21,115,71,0.2)] transition hover:bg-[#11623c] disabled:cursor-not-allowed disabled:bg-[#bdc8c1] disabled:shadow-none"
                >
                  Find a ride <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-5 flex items-start gap-3 rounded-2xl border border-[#e0e6e2] bg-white p-4">
                  <MapPin
                    className="mt-0.5 h-5 w-5 shrink-0 text-[#e58b31]"
                    fill="currentColor"
                  />
                  <div>
                    <p className="text-sm text-[#748179]">Going to</p>
                    <p className="font-bold">{destination}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  {providers.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => setSelectedProvider(item.id)}
                      className={`flex w-full items-center gap-4 rounded-[1.4rem] border-2 bg-white p-4 text-left transition ${selectedProvider === item.id ? "border-[#157347] shadow-[0_10px_30px_rgba(21,115,71,0.09)]" : "border-transparent hover:border-[#d9e3dc]"}`}
                    >
                      <span
                        className={`grid h-14 w-14 place-items-center rounded-2xl ${item.color} text-lg font-black text-white`}
                      >
                        {item.name.slice(0, 1)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="font-bold">{item.name}</span>
                          {item.note === "Recommended" && (
                            <span className="rounded-full bg-[#e8f5ed] px-2 py-0.5 text-[11px] font-bold text-[#157347]">
                              Recommended
                            </span>
                          )}
                        </span>
                        <span className="mt-1 block text-sm text-[#748179]">
                          {item.note} · {item.eta} min away
                        </span>
                      </span>
                      <span className="text-right">
                        <span className="block font-black">
                          ₫{item.price.toLocaleString("vi-VN")}
                        </span>
                        {selectedProvider === item.id && (
                          <span className="mt-2 ml-auto grid h-5 w-5 place-items-center rounded-full bg-[#157347] text-white">
                            <Check className="h-3 w-3" />
                          </span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex items-center justify-between rounded-2xl bg-[#eef4f0] p-4 text-sm">
                  <span className="flex items-center gap-2 font-semibold">
                    <ShieldCheck className="h-5 w-5 text-[#157347]" />
                    Trip shared with Linh
                  </span>
                  <span className="text-[#65746c]">Guardian</span>
                </div>
                <button
                  type="button"
                  onClick={confirmBooking}
                  className="mt-6 flex h-16 w-full items-center justify-center gap-2 rounded-2xl bg-[#157347] text-lg font-bold text-white shadow-[0_14px_30px_rgba(21,115,71,0.2)] hover:bg-[#11623c]"
                >
                  Book {provider.name} · ₫
                  {provider.price.toLocaleString("vi-VN")}{" "}
                  <ArrowRight className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>

          <aside className="hidden self-start rounded-[2rem] bg-[#21382d] p-7 text-white shadow-[0_20px_55px_rgba(27,55,41,0.16)] lg:block">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
              <ShieldCheck className="h-6 w-6 text-[#83e3ad]" />
            </div>
            <h2 className="mt-7 text-2xl font-bold tracking-tight">
              Linh is looking out for you
            </h2>
            <p className="mt-3 leading-7 text-white/65">
              Your guardian will see the driver, vehicle and trip progress as
              soon as you book.
            </p>
            <div className="mt-8 flex items-center gap-3 border-t border-white/10 pt-5">
              <div className="grid h-11 w-11 place-items-center rounded-full bg-[#f4a340] font-black text-[#21382d]">
                LT
              </div>
              <div>
                <p className="font-bold">Linh Trần</p>
                <p className="text-sm text-white/55">Daughter · Guardian</p>
              </div>
            </div>
          </aside>
        </section>
      )}
    </main>
  );
}

function ActiveRide({
  trip,
  updateTrip,
  resetBooking,
}: {
  trip: Trip;
  updateTrip: (updates: Partial<Trip>) => void;
  resetBooking: () => void;
}) {
  const isFinished = trip.status === "completed" || trip.status === "cancelled";
  const next = nextStatus[trip.status];

  return (
    <section className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[minmax(0,1.1fr)_420px] lg:py-10">
      <div className="relative min-h-[430px] overflow-hidden rounded-[2rem] bg-[#dce8dc] lg:min-h-[650px]">
        <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(28deg,transparent_46%,#a9bcae_47%,#a9bcae_50%,transparent_51%),linear-gradient(105deg,transparent_48%,#bac9bd_49%,#bac9bd_52%,transparent_53%)] [background-size:120px_96px,150px_118px]" />
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 720 620"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M108 500C180 440 160 328 298 350C418 370 436 196 612 128"
            stroke="white"
            strokeWidth="12"
            strokeLinecap="round"
          />
          <path
            d="M108 500C180 440 160 328 298 350C418 370 436 196 612 128"
            stroke="#157347"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="11 12"
          />
        </svg>
        <div className="absolute bottom-[17%] left-[12%] grid h-12 w-12 place-items-center rounded-full border-4 border-white bg-[#157347] text-white shadow-xl">
          <Home className="h-5 w-5" />
        </div>
        <div className="absolute right-[10%] top-[14%] grid h-12 w-12 place-items-center rounded-full border-4 border-white bg-[#f2a243] text-[#20372c] shadow-xl">
          <MapPin className="h-6 w-6" fill="currentColor" />
        </div>
        {trip.status !== "matching" && (
          <div className="absolute left-[42%] top-[45%] grid h-14 w-14 place-items-center rounded-2xl bg-[#20372c] text-white shadow-2xl">
            <Navigation className="h-6 w-6 rotate-45" fill="currentColor" />
          </div>
        )}
        <div className="absolute left-5 top-5 rounded-2xl bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
          <p className="text-xs font-bold uppercase tracking-wider text-[#748179]">
            Destination
          </p>
          <p className="mt-1 font-bold">{trip.destination}</p>
        </div>
      </div>

      <div className="self-start rounded-[2rem] border border-[#dde4df] bg-white p-6 shadow-[0_18px_55px_rgba(29,48,38,0.09)] sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.13em] text-[#157347]">
              {statusCopy[trip.status]}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">
              {trip.status === "matching"
                ? "One moment…"
                : trip.status === "completed"
                  ? "You’re here!"
                  : trip.status === "cancelled"
                    ? "Ride cancelled"
                    : trip.status === "in_progress"
                      ? "On the way"
                      : `${trip.eta} min away`}
            </h1>
          </div>
          <span
            className={`mt-2 h-3 w-3 rounded-full ${isFinished ? "bg-[#9ca8a1]" : "animate-pulse bg-[#42bc78] shadow-[0_0_0_7px_rgba(66,188,120,0.13)]"}`}
          />
        </div>

        {trip.status === "matching" ? (
          <div className="my-10 flex items-center justify-center">
            <span className="h-16 w-16 animate-spin rounded-full border-4 border-[#dcebe2] border-t-[#157347]" />
          </div>
        ) : (
          trip.driverName && (
            <div className="my-7 flex items-center gap-4 rounded-2xl bg-[#f2f6f3] p-4">
              <div className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#20372c] text-lg font-black text-white">
                MQ
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold">{trip.driverName}</p>
                  <span className="flex items-center text-sm font-bold">
                    <Star className="mr-1 h-3.5 w-3.5 fill-[#e99b3d] text-[#e99b3d]" />
                    4.9
                  </span>
                </div>
                <p className="mt-1 truncate text-sm text-[#6e7d75]">
                  {trip.vehicle} · <strong>{trip.plate}</strong>
                </p>
              </div>
            </div>
          )
        )}

        <div className="space-y-3 border-y border-[#e8ece9] py-5 text-sm">
          <div className="flex items-center gap-3">
            <Clock3 className="h-5 w-5 text-[#718078]" />
            <span className="flex-1 text-[#718078]">Estimated arrival</span>
            <strong>{trip.eta} min</strong>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#157347]" />
            <span className="flex-1 text-[#718078]">Guardian</span>
            <strong>Sharing with Linh</strong>
          </div>
        </div>

        {!isFinished && trip.status !== "matching" && (
          <div className="mt-5 grid grid-cols-2 gap-3">
            <a
              href="tel:+84901234567"
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#edf4f0] font-bold text-[#264638]"
            >
              <Phone className="h-4 w-4" />
              Call
            </a>
            <a
              href="sms:+84901234567"
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-[#edf4f0] font-bold text-[#264638]"
            >
              <MessageCircle className="h-4 w-4" />
              Message
            </a>
          </div>
        )}
        {next && (
          <button
            type="button"
            onClick={() => updateTrip({ status: next })}
            className="mt-5 h-14 w-full rounded-2xl bg-[#157347] text-base font-bold text-white hover:bg-[#11623c]"
          >
            {nextAction[trip.status]}
          </button>
        )}
        {!isFinished && (
          <button
            type="button"
            onClick={() => updateTrip({ status: "cancelled" })}
            className="mt-3 h-11 w-full text-sm font-bold text-[#b44b43] hover:text-[#8e302a]"
          >
            Cancel ride
          </button>
        )}
        {isFinished && (
          <button
            type="button"
            onClick={resetBooking}
            className="mt-6 h-14 w-full rounded-2xl bg-[#157347] text-base font-bold text-white hover:bg-[#11623c]"
          >
            Book another ride
          </button>
        )}
      </div>
    </section>
  );
}
