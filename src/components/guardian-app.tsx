"use client";

import {
  Bell,
  Check,
  ChevronRight,
  Clock3,
  HeartHandshake,
  Home,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  Star,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { useTripSync } from "@/hooks/use-trip-sync";
import { statusCopy, type Trip, type TripStatus } from "@/lib/trip";

const timeline: { status: TripStatus; label: string }[] = [
  { status: "driver_assigned", label: "Driver confirmed" },
  { status: "driver_arrived", label: "Driver at pickup" },
  { status: "in_progress", label: "Trip started" },
  { status: "completed", label: "Arrived safely" },
];

const statusOrder: Record<TripStatus, number> = {
  matching: 0,
  driver_assigned: 1,
  driver_arrived: 2,
  in_progress: 3,
  completed: 4,
  cancelled: -1,
};

export function GuardianApp() {
  const { trip, ready, updateTrip } = useTripSync();

  return (
    <main className="min-h-screen bg-[#f4f6f4] text-[#17231d]">
      <AppHeader
        rightSlot={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full border border-[#dce3de] bg-white text-[#52635a] hover:border-[#157347]"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-[#21382d] text-sm font-black text-white">
              LT
            </div>
          </div>
        }
      />

      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#157347]">
              Guardian dashboard
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.045em]">
              Good morning, Linh
            </h1>
            <p className="mt-2 text-[#6a7971]">
              Here’s Mai Lan’s latest trip update.
            </p>
          </div>
          <Link
            href="/ride"
            className="flex h-11 items-center justify-center gap-2 rounded-full border border-[#cad7cf] bg-white px-5 text-sm font-bold text-[#315344] hover:border-[#157347]"
          >
            Open rider app <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {!ready ? (
          <div className="h-72 animate-pulse rounded-[2rem] bg-white" />
        ) : trip ? (
          <ActiveGuardianTrip trip={trip} updateTrip={updateTrip} />
        ) : (
          <EmptyGuardian />
        )}
      </div>
    </main>
  );
}

function EmptyGuardian() {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <section className="flex min-h-[440px] flex-col items-center justify-center rounded-[2rem] border border-[#e0e6e2] bg-white p-8 text-center shadow-[0_16px_48px_rgba(29,48,38,0.05)]">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-[#eaf5ef] text-[#157347]">
          <HeartHandshake className="h-9 w-9" />
        </div>
        <h2 className="mt-6 text-3xl font-black tracking-tight">
          No active trip
        </h2>
        <p className="mt-3 max-w-md leading-7 text-[#6f7e76]">
          When Mai Lan books a ride, the driver details and live progress will
          appear here automatically.
        </p>
        <Link
          href="/ride"
          className="mt-7 flex h-12 items-center gap-2 rounded-xl bg-[#157347] px-6 font-bold text-white hover:bg-[#11623c]"
        >
          Book a ride for Mai Lan <ChevronRight className="h-4 w-4" />
        </Link>
      </section>
      <PersonCard />
    </div>
  );
}

function ActiveGuardianTrip({
  trip,
  updateTrip,
}: {
  trip: Trip;
  updateTrip: (updates: Partial<Trip>) => void;
}) {
  const isActive = !["completed", "cancelled"].includes(trip.status);
  const currentOrder = statusOrder[trip.status];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_380px]">
      <section className="overflow-hidden rounded-[2rem] border border-[#dde4df] bg-white shadow-[0_18px_55px_rgba(29,48,38,0.07)]">
        <div className="flex flex-col justify-between gap-4 border-b border-[#e7ebe8] p-6 sm:flex-row sm:items-center sm:p-7">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 place-items-center rounded-full bg-[#f4a340] text-lg font-black text-[#20372c]">
              ML
            </div>
            <div>
              <p className="text-sm text-[#75827b]">Mai Lan’s trip</p>
              <h2 className="mt-0.5 text-2xl font-black tracking-tight">
                {statusCopy[trip.status]}
              </h2>
            </div>
          </div>
          <div
            className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${isActive ? "bg-[#e9f6ee] text-[#157347]" : "bg-[#eef1ef] text-[#69766f]"}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${isActive ? "animate-pulse bg-[#27a963]" : "bg-[#89958e]"}`}
            />
            {isActive ? "Live" : "Updated"}
          </div>
        </div>

        <div className="relative h-[390px] overflow-hidden bg-[#dce8dc] sm:h-[480px]">
          <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(28deg,transparent_46%,#a9bcae_47%,#a9bcae_50%,transparent_51%),linear-gradient(105deg,transparent_48%,#bac9bd_49%,#bac9bd_52%,transparent_53%)] [background-size:120px_96px,150px_118px]" />
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 720 480"
            fill="none"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M90 404C174 370 166 250 286 274C408 298 428 150 628 82"
              stroke="white"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M90 404C174 370 166 250 286 274C408 298 428 150 628 82"
              stroke="#157347"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray="11 12"
            />
          </svg>
          <div className="absolute bottom-[11%] left-[8%] grid h-12 w-12 place-items-center rounded-full border-4 border-white bg-[#157347] text-white shadow-xl">
            <Home className="h-5 w-5" />
          </div>
          <div className="absolute right-[7%] top-[10%] grid h-12 w-12 place-items-center rounded-full border-4 border-white bg-[#f2a243] text-[#20372c] shadow-xl">
            <MapPin className="h-6 w-6" fill="currentColor" />
          </div>
          {trip.status !== "matching" && (
            <div className="absolute left-[43%] top-[48%] grid h-14 w-14 place-items-center rounded-2xl bg-[#20372c] text-white shadow-2xl">
              <Navigation className="h-6 w-6 rotate-45" fill="currentColor" />
            </div>
          )}
          <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-4 rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur sm:left-7 sm:right-auto sm:min-w-[350px]">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#748179]">
                Heading to
              </p>
              <p className="mt-1 font-bold">{trip.destination}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-[#748179]">ETA</p>
              <p className="font-black">{trip.eta} min</p>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-6">
        <PersonCard />

        <section className="rounded-[1.75rem] border border-[#dde4df] bg-white p-6 shadow-[0_14px_42px_rgba(29,48,38,0.05)]">
          <h3 className="font-black">Trip details</h3>
          <div className="mt-5 space-y-4">
            {trip.driverName ? (
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-[#21382d] font-black text-white">
                  MQ
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{trip.driverName}</p>
                    <span className="flex items-center text-xs font-bold">
                      <Star className="mr-1 h-3 w-3 fill-[#e99b3d] text-[#e99b3d]" />
                      4.9
                    </span>
                  </div>
                  <p className="truncate text-sm text-[#748179]">
                    {trip.vehicle} · {trip.plate}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-[#6f7e76]">
                <span className="h-11 w-11 animate-pulse rounded-full bg-[#e6ece8]" />
                <span className="font-semibold">Finding a nearby driver…</span>
              </div>
            )}
            <div className="flex items-center gap-3 border-t border-[#e9edea] pt-4">
              <Clock3 className="h-5 w-5 text-[#157347]" />
              <span className="flex-1 text-sm text-[#6f7e76]">Booked ride</span>
              <strong className="text-sm">
                ₫{trip.price.toLocaleString("vi-VN")}
              </strong>
            </div>
          </div>
          {isActive && trip.driverName && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <a
                href="tel:+84901234567"
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#edf4f0] text-sm font-bold text-[#264638]"
              >
                <Phone className="h-4 w-4" />
                Call driver
              </a>
              <a
                href="sms:+84901234567"
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-[#edf4f0] text-sm font-bold text-[#264638]"
              >
                <MessageCircle className="h-4 w-4" />
                Message
              </a>
            </div>
          )}
        </section>

        <section className="rounded-[1.75rem] border border-[#dde4df] bg-white p-6 shadow-[0_14px_42px_rgba(29,48,38,0.05)]">
          <h3 className="font-black">Trip progress</h3>
          <div className="mt-5 space-y-0">
            {timeline.map((item, index) => {
              const complete = currentOrder >= statusOrder[item.status];
              return (
                <div
                  key={item.status}
                  className="relative flex gap-3 pb-5 last:pb-0"
                >
                  {index < timeline.length - 1 && (
                    <span
                      className={`absolute left-[11px] top-6 h-full w-0.5 ${complete ? "bg-[#7dcca0]" : "bg-[#e0e6e2]"}`}
                    />
                  )}
                  <span
                    className={`relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full ${complete ? "bg-[#157347] text-white" : "border-2 border-[#dce3de] bg-white"}`}
                  >
                    {complete && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span
                    className={`text-sm font-semibold ${complete ? "text-[#274739]" : "text-[#9aa59f]"}`}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
          {isActive && (
            <button
              type="button"
              onClick={() => updateTrip({ status: "cancelled" })}
              className="mt-6 h-11 w-full rounded-xl border border-[#eccdca] text-sm font-bold text-[#ad4b43] hover:bg-[#fff5f4]"
            >
              Cancel this ride
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

function PersonCard() {
  return (
    <section className="rounded-[1.75rem] bg-[#21382d] p-6 text-white shadow-[0_18px_46px_rgba(27,55,41,0.15)]">
      <div className="flex items-start justify-between">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10">
          <UserRound className="h-6 w-6 text-[#83e3ad]" />
        </div>
        <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold text-[#bce8cd]">
          <span className="h-2 w-2 rounded-full bg-[#70d79c]" />
          Connected
        </span>
      </div>
      <p className="mt-6 text-sm text-white/55">You’re looking after</p>
      <h2 className="mt-1 text-2xl font-black">Mai Lan</h2>
      <p className="mt-2 text-sm text-white/65">Mother · +84 90 123 4567</p>
      <a
        href="tel:+84901234567"
        className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-white font-bold text-[#21382d] hover:bg-[#eef5f0]"
      >
        <Phone className="h-4 w-4" />
        Call Mai Lan
      </a>
    </section>
  );
}
