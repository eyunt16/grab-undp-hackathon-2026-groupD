"use client";

import {
  Bell,
  Check,
  ChevronRight,
  Clock3,
  HeartHandshake,
  MessageCircle,
  Phone,
  ShieldCheck,
  Siren,
  Smartphone,
  Star,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/app-header";
import { LiveTripMap } from "@/components/live-trip-map";
import { useTripSync } from "@/hooks/use-trip-sync";
import { statusCopy, type Trip, type TripStatus } from "@/lib/trip";
import Image from "next/image";

const timeline: { status: TripStatus; label: string }[] = [
  { status: "driver_assigned", label: "Tài xế đã nhận chuyến" },
  { status: "driver_arrived", label: "Tài xế đã đến điểm đón" },
  { status: "in_progress", label: "Bắt đầu chuyến đi" },
  { status: "completed", label: "Đã đến nơi an toàn" },
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
    <main className="min-h-screen bg-background text-foreground transition-colors duration-200">
      <AppHeader
        backHref="/"
        backLabel="Trang chủ"
        rightSlot={
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-card text-muted-foreground hover:border-primary hover:text-primary transition-all duration-200"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </button>
            <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground">
              LT
            </div>
          </div>
        }
        mobileDrawerSlot={
          <div className="space-y-3">
            {/* Profile */}
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 px-4 py-3.5">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-primary text-sm font-black text-primary-foreground shrink-0">
                LT
              </div>
              <div>
                <p className="font-black text-sm">Linh Trần</p>
                <p className="text-xs text-muted-foreground">Người giám sát</p>
              </div>
            </div>

            {/* Notifications placeholder */}
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-3.5 text-base font-bold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
            >
              <Bell className="h-5 w-5 text-muted-foreground" />
              Thông báo
            </button>

            {/* Open rider app */}
            <Link
              href="/ride"
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-3.5 text-base font-bold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
            >
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              Mở ứng dụng đặt xe
            </Link>

            {/* Call Mai Lan */}
            <a
              href="tel:+84901234567"
              className="flex w-full items-center gap-3 rounded-2xl bg-primary/10 border border-primary/20 px-4 py-3.5 text-base font-bold text-primary transition-all hover:bg-primary/20 active:scale-[0.98]"
            >
              <Phone className="h-5 w-5" />
              Gọi cho bà Mai Lan
            </a>
          </div>
        }
      />

      <div className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-8 lg:py-10">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-primary">
              Giám sát người thân
            </p>
            <h1 className="mt-2 text-4xl font-black tracking-[-0.045em]">
              Chào Linh
            </h1>
            <p className="mt-2 text-muted-foreground">
              Dưới đây là thông tin cập nhật chuyến đi mới nhất của bà Mai Lan.
            </p>
          </div>
          <Link
            href="/ride"
            className="flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-bold text-foreground hover:border-primary hover:bg-muted transition-all duration-200"
          >
            Mở ứng dụng đặt xe <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        {!ready ? (
          <div className="h-72 animate-pulse rounded-[2rem] bg-card border border-border" />
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
      <section className="flex min-h-110 flex-col items-center justify-center rounded-[2rem] border border-border bg-card p-8 text-center shadow-[0_16px_48px_rgba(0,0,0,0.02)]">
        <div className="grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary">
          <HeartHandshake className="h-9 w-9" />
        </div>
        <h2 className="mt-6 text-3xl font-black tracking-tight">
          Không có chuyến đi hoạt động
        </h2>
        <p className="mt-3 max-w-md leading-7 text-muted-foreground">
          Khi bà Mai Lan đặt chuyến đi, thông tin tài xế và lộ trình trực tiếp
          sẽ tự động xuất hiện ở đây.
        </p>
        <Link
          href="/ride"
          className="mt-7 flex h-12 items-center gap-2 rounded-xl bg-primary px-6 font-bold text-primary-foreground hover:opacity-90 transition-all"
        >
          Đặt xe hộ bà Mai Lan <ChevronRight className="h-4 w-4" />
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
  const [isOffRoute, setIsOffRoute] = useState(false);
  const [alerts, setAlerts] = useState<string[]>([
    "🛡️ Tài xế Minh Quân đã xác nhận hỗ trợ cụ bà.",
    "📍 Chuyến xe bắt đầu khởi hành.",
  ]);

  const isActive = !["completed", "cancelled"].includes(trip.status);
  const currentOrder = statusOrder[trip.status];

  const speakAlert = useCallback((text: string) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "vi-VN";
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  // Monitor off route state for voice assistant and alerts log
  useEffect(() => {
    if (isOffRoute) {
      speakAlert(
        "Cảnh báo khẩn cấp! Phát hiện xe của bà Mai Lan đang di chuyển lệch lộ trình đăng ký!",
      );
      const timeStr = new Date().toLocaleTimeString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
      });
      setAlerts((prev) => [`⚠️ Cảnh báo lệch lộ trình (${timeStr})`, ...prev]);
    } else {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isOffRoute, speakAlert]);

  // Monitor status changes for alerts log
  useEffect(() => {
    const timeStr = new Date().toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    if (trip.status === "completed") {
      setAlerts((prev) => [
        `✅ Bàn giao thành công tại sảnh chung cư (${timeStr})`,
        ...prev,
      ]);
    } else if (trip.status === "cancelled") {
      setAlerts((prev) => [`❌ Chuyến xe đã hủy (${timeStr})`, ...prev]);
    } else if (trip.status === "driver_arrived") {
      setAlerts((prev) => [`📍 Tài xế đã đến điểm đón (${timeStr})`, ...prev]);
    }
  }, [trip.status]);

  useEffect(() => {
    if (!isActive) {
      setIsOffRoute(false);
    }
  }, [isActive]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_380px]">
      <div className="space-y-6">
        {isOffRoute && (
          <div className="flex items-center justify-between gap-4 rounded-[2rem] border-2 border-error/30 bg-error/10 p-5 text-error animate-pulse shadow-sm dark:bg-error/20">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-error text-white">
                <Siren className="h-6 w-6 animate-bounce" />
              </span>
              <div>
                <p className="font-black text-lg">⚠️ CẢNH BÁO LỆCH LỘ TRÌNH!</p>
                <p className="mt-0.5 text-sm font-bold opacity-80">
                  Xe đã di chuyển lệch quá 250m so với lộ trình về nhà.
                </p>
              </div>
            </div>
            <a
              href="tel:+84901234567"
              className="shrink-0 rounded-xl bg-error px-4 py-2.5 text-sm font-black text-white transition hover:opacity-90"
            >
              Gọi tài xế
            </a>
          </div>
        )}

        <section className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_18px_55px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col justify-between gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:p-7">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-amber-500 text-lg font-black text-white">
                ML
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Chuyến đi của bà Mai Lan
                </p>
                <h2 className="mt-0.5 text-2xl font-black tracking-tight">
                  {statusCopy[trip.status]}
                </h2>
              </div>
            </div>
            <div
              className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-bold ${isActive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-muted text-muted-foreground"}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${isActive ? "animate-pulse bg-emerald-500" : "bg-neutral-400 dark:bg-neutral-500"}`}
              />
              {isActive ? "Trực tiếp" : "Đã cập nhật"}
            </div>
          </div>

          <div className="relative">
            <LiveTripMap trip={trip} />
            {isActive && (
              <button
                type="button"
                onClick={() => setIsOffRoute((prev) => !prev)}
                className={`absolute right-4 top-4 z-10 flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-xs font-black shadow-md transition ${isOffRoute ? "bg-error text-white hover:opacity-90" : "bg-card text-foreground hover:bg-muted border border-border"}`}
              >
                <Siren className="h-4 w-4" />
                {isOffRoute
                  ? "Tắt cảnh báo lệch hướng"
                  : "Giả lập đi lệch hướng"}
              </button>
            )}
            <div className="absolute bottom-5 left-5 right-5 flex items-center justify-between gap-4 rounded-2xl bg-card/95 border border-border p-4 shadow-xl backdrop-blur sm:left-7 sm:right-auto sm:min-w-87.5">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Điểm đến
                </p>
                <p className="mt-1 font-bold">{trip.destination}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Thời gian đón</p>
                <p className="font-black">{trip.eta} phút</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-6">
        <PersonCard />

        <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_14px_42px_rgba(0,0,0,0.02)]">
          <h3 className="font-black text-lg">Thông báo & Cảnh báo</h3>
          <div className="mt-4 max-h-48 overflow-y-auto space-y-2.5 pr-1">
            {alerts.map((alert, idx) => {
              const isWarning =
                alert.includes("⚠️") || alert.includes("Cảnh báo");
              return (
                <div
                  key={idx}
                  className={`p-3.5 rounded-2xl text-sm font-bold leading-normal transition ${isWarning ? "bg-error/10 text-error border border-error/20" : "bg-muted text-muted-foreground"}`}
                >
                  {alert}
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_14px_42px_rgba(0,0,0,0.02)]">
          <h3 className="font-black">Chi tiết chuyến đi</h3>
          <div className="mt-5 space-y-4">
            {trip.driverName ? (
              <div className="space-y-3.5">
                <div className="flex items-center gap-3">
                  <div className="grid h-11 w-11 place-items-center rounded-full bg-primary font-black text-primary-foreground">
                    MQ
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold">{trip.driverName}</p>
                      <span className="flex items-center text-xs font-bold">
                        <Star className="mr-1 h-3 w-3 fill-amber-400 text-amber-400" />
                        4.9
                      </span>
                    </div>
                    <p className="truncate text-sm text-muted-foreground">
                      {trip.vehicle} · {trip.plate}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-500" />
                  <span>Tài xế đã xác nhận hỗ trợ cụ già đi lại khó khăn</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="h-11 w-11 animate-pulse rounded-full bg-muted" />
                <span className="font-semibold">Đang tìm tài xế gần đây…</span>
              </div>
            )}
            <div className="flex items-center gap-3 border-t border-border pt-4">
              <Clock3 className="h-5 w-5 text-primary" />
              <span className="flex-1 text-sm text-muted-foreground">
                Giá cước chuyến xe
              </span>
              <strong className="text-sm">
                ₫{trip.price.toLocaleString("vi-VN")}
              </strong>
            </div>
          </div>
          {isActive && trip.driverName && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <a
                href="tel:+84901234567"
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary/10 text-sm font-bold text-primary hover:bg-primary/20 transition-all"
              >
                <Phone className="h-4 w-4" />
                Gọi tài xế
              </a>
              <a
                href="sms:+84901234567"
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-primary/10 text-sm font-bold text-primary hover:bg-primary/20 transition-all"
              >
                <MessageCircle className="h-4 w-4" />
                Nhắn tin
              </a>
            </div>
          )}
        </section>

        <section className="rounded-[1.75rem] border border-border bg-card p-6 shadow-[0_14px_42px_rgba(0,0,0,0.02)]">
          <h3 className="font-black">Tiến trình chuyến đi</h3>
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
                      className={`absolute left-2.75 top-6 h-full w-0.5 ${complete ? "bg-emerald-500" : "bg-border"}`}
                    />
                  )}
                  <span
                    className={`relative z-10 grid h-6 w-6 shrink-0 place-items-center rounded-full ${complete ? "bg-primary text-primary-foreground" : "border-2 border-border bg-card text-muted-foreground"}`}
                  >
                    {complete && <Check className="h-3.5 w-3.5" />}
                  </span>
                  <span
                    className={`text-sm font-semibold ${complete ? "text-foreground" : "text-muted-foreground"}`}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>
          {trip.status === "completed" && (
            <div className="mt-5 rounded-2xl border border-border bg-muted/40 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Ảnh bàn giao từ tài xế
              </p>
              <div className="mt-2.5 overflow-hidden rounded-xl border border-border">
                <Image
                  src="https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=600"
                  alt="Ảnh bàn giao cụ bà về nhà"
                  className="h-44 w-full object-cover"
                />
              </div>
              <div className="mt-3 flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4 shrink-0 text-emerald-500" />
                <span>Bàn giao thành công tại sảnh chung cư</span>
              </div>
            </div>
          )}
          {isActive && (
            <button
              type="button"
              onClick={() => updateTrip({ status: "cancelled" })}
              className="mt-6 h-11 w-full rounded-xl border border-error/20 bg-card text-sm font-bold text-error hover:bg-error/10 hover:border-error transition-all cursor-pointer"
            >
              Hủy chuyến xe này
            </button>
          )}
        </section>
      </div>
    </div>
  );
}

function PersonCard() {
  return (
    <section className="rounded-[1.75rem] bg-primary p-6 text-primary-foreground shadow-[0_18px_46px_rgba(0,71,171,0.15)]">
      <div className="flex items-start justify-between">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/15">
          <UserRound className="h-6 w-6 text-sky-200 dark:text-sky-300" />
        </div>
        <span className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white">
          <span className="h-2 w-2 rounded-full bg-emerald-400" />
          Đã kết nối
        </span>
      </div>
      <p className="mt-6 text-sm text-primary-foreground/80">
        Thành viên đang bảo hộ
      </p>
      <h2 className="mt-1 text-2xl font-black">Bà Mai Lan</h2>
      <p className="mt-2 text-sm text-primary-foreground/90">
        Mẹ · +84 90 123 4567
      </p>
      <a
        href="tel:+84901234567"
        className="mt-6 flex h-11 items-center justify-center gap-2 rounded-xl bg-primary-foreground font-bold text-primary hover:opacity-95 transition-all"
      >
        <Phone className="h-4 w-4" />
        Gọi cho bà Mai Lan
      </a>
    </section>
  );
}
