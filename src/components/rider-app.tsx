"use client";

import {
  Check,
  HeartHandshake,
  Home,
  MapPin,
  Mic,
  MicOff,
  Navigation,
  Phone,
  ShieldCheck,
  Siren,
  Stethoscope,
  Volume2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LiveTripMap } from "@/components/live-trip-map";
import { useTripSync } from "@/hooks/use-trip-sync";
import { useVietnameseVoice } from "@/hooks/use-vietnamese-voice";
import type { Trip, TripStatus } from "@/lib/trip";

type PendingIntent =
  | { type: "ride"; destination: string }
  | { type: "call" }
  | { type: "cancel" }
  | null;

const savedPlaces = [
  {
    label: "Về nhà",
    destination: "Nhà · 24 Nguyễn Đình Chiểu",
    detail: "Địa chỉ nhà đã lưu",
    icon: Home,
    color: "bg-[#e9f5ee] text-[#11683f]",
  },
  {
    label: "Đi bệnh viện",
    destination: "Bệnh viện Chợ Rẫy",
    detail: "Cổng chính đường Nguyễn Chí Thanh",
    icon: Stethoscope,
    color: "bg-[#e9f1f8] text-[#315f7c]",
  },
];

const nextStatus: Partial<Record<TripStatus, TripStatus>> = {
  driver_assigned: "driver_arrived",
  driver_arrived: "in_progress",
  in_progress: "completed",
};

const nextAction: Partial<Record<TripStatus, string>> = {
  driver_assigned: "Tài xế đã đến",
  driver_arrived: "Tôi đã lên xe",
  in_progress: "Tôi đã đến nơi",
};

const destinationLocations: Record<string, { lat: number; lng: number }> = {
  "Nhà · 24 Nguyễn Đình Chiểu": { lat: 10.7812, lng: 106.6953 },
  "Bệnh viện Chợ Rẫy": { lat: 10.7579, lng: 106.6594 },
  "Chợ Bến Thành": { lat: 10.7724, lng: 106.698 },
  "Nhà Linh · 88 Võ Văn Tần": { lat: 10.7752, lng: 106.6891 },
};

function normalizeVietnamese(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .toLowerCase();
}

export function RiderApp() {
  const { trip, ready, setTrip, updateTrip } = useTripSync();
  const [pendingIntent, setPendingIntent] = useState<PendingIntent>(null);
  const [notice, setNotice] = useState("");
  const previousStatus = useRef<TripStatus | null>(null);
  const voiceInitiatedRef = useRef(false);

  const confirmIntentRef = useRef<() => void>(() => undefined);
  const rejectIntentRef = useRef<() => void>(() => undefined);

  const handleVoiceCommand = useCallback((rawTranscript: string) => {
    voiceInitiatedRef.current = true;
    const command = normalizeVietnamese(rawTranscript);
    const isYes = /\b(dung|dong y|xac nhan|dat xe|co)\b/.test(command);
    const isNo = /\b(khong|quay lai|thoi)\b/.test(command);

    if (isYes) {
      confirmIntentRef.current();
      return;
    }
    if (isNo) {
      rejectIntentRef.current();
      return;
    }
    if (/goi.*(linh|con|nguoi than)/.test(command)) {
      setPendingIntent({ type: "call" });
      return;
    }
    if (/\b(huy|huy chuyen)\b/.test(command)) {
      setPendingIntent({ type: "cancel" });
      return;
    }
    if (/ve nha|di nha/.test(command)) {
      setPendingIntent({
        type: "ride",
        destination: "Nhà · 24 Nguyễn Đình Chiểu",
      });
      return;
    }
    if (/benh vien|di kham|kham benh/.test(command)) {
      setPendingIntent({ type: "ride", destination: "Bệnh viện Chợ Rẫy" });
      return;
    }
    if (/cho|ben thanh/.test(command)) {
      setPendingIntent({ type: "ride", destination: "Chợ Bến Thành" });
      return;
    }
    if (/nha linh|nha con/.test(command)) {
      setPendingIntent({
        type: "ride",
        destination: "Nhà Linh · 88 Võ Văn Tần",
      });
      return;
    }

    setNotice("Tôi chưa hiểu. Bạn có thể nói “về nhà” hoặc “đi bệnh viện”.");
  }, []);

  const { mode, message, startListening, speak, resetVoice } =
    useVietnameseVoice(handleVoiceCommand);

  const askForConfirmation = useCallback(
    (intent: Exclude<PendingIntent, null>) => {
      setPendingIntent(intent);
      setNotice("");
      voiceInitiatedRef.current = false;
    },
    [],
  );

  useEffect(() => {
    if (!pendingIntent) return;
    navigator.vibrate?.([60, 40, 60]);
    if (pendingIntent.type === "ride") {
      speak(
        `Bạn muốn đặt xe đi ${pendingIntent.destination}. Đúng không?`,
        voiceInitiatedRef.current,
      );
    } else if (pendingIntent.type === "call") {
      speak(
        "Bạn muốn gọi cho con gái Linh. Đúng không?",
        voiceInitiatedRef.current,
      );
    } else {
      speak(
        "Bạn muốn hủy chuyến xe này. Đúng không?",
        voiceInitiatedRef.current,
      );
    }
  }, [pendingIntent, speak]);

  const createTrip = useCallback(
    (destination: string) => {
      const newTrip: Trip = {
        id: `EM-${Date.now().toString().slice(-6)}`,
        riderName: "Mai Lan",
        pickup: "Điểm đón hiện tại · 42 Võ Thị Sáu",
        destination,
        provider: "EasyCar",
        price: destination.includes("Bệnh viện") ? 68000 : 52000,
        eta: 4,
        status: "matching",
        pickupLocation: { lat: 10.7864, lng: 106.6908 },
        destinationLocation:
          destinationLocations[destination] ??
          destinationLocations["Bệnh viện Chợ Rẫy"],
        liveProgress: 0,
        createdAt: new Date().toISOString(),
      };
      setTrip(newTrip);
      setPendingIntent(null);
      resetVoice();
      speak("Đã đặt xe. EasyMove đang tìm tài xế gần bạn.");
    },
    [resetVoice, setTrip, speak],
  );

  const confirmIntent = useCallback(() => {
    if (!pendingIntent) return;
    if (pendingIntent.type === "ride") {
      createTrip(pendingIntent.destination);
    } else if (pendingIntent.type === "call") {
      setPendingIntent(null);
      speak("Đang mở cuộc gọi cho Linh.");
      window.location.href = "tel:+84901234567";
    } else {
      updateTrip({ status: "cancelled" });
      setPendingIntent(null);
      resetVoice();
      speak("Chuyến xe đã được hủy.");
    }
  }, [createTrip, pendingIntent, resetVoice, speak, updateTrip]);

  const rejectIntent = useCallback(() => {
    setPendingIntent(null);
    resetVoice();
    setNotice("Đã quay lại. Bạn chọn nơi muốn đến nhé.");
    speak("Được rồi. Bạn chọn lại nhé.");
  }, [resetVoice, speak]);

  useEffect(() => {
    confirmIntentRef.current = confirmIntent;
    rejectIntentRef.current = rejectIntent;
  }, [confirmIntent, rejectIntent]);

  useEffect(() => {
    if (trip?.status !== "matching") return;
    const timer = window.setTimeout(() => {
      updateTrip({
        status: "driver_assigned",
        driverName: "Minh Quân",
        plate: "51H-482.16",
        vehicle: "Toyota Vios màu bạc",
      });
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [trip?.status, updateTrip]);

  useEffect(() => {
    if (!trip || !["driver_assigned", "in_progress"].includes(trip.status))
      return;
    const limit = trip.status === "driver_assigned" ? 0.92 : 0.95;
    const current = trip.liveProgress ?? 0;
    if (current >= limit) return;
    const timer = window.setTimeout(() => {
      updateTrip({ liveProgress: Math.min(limit, current + 0.08) });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, [trip, updateTrip]);

  useEffect(() => {
    if (!trip) {
      previousStatus.current = null;
      return;
    }
    if (previousStatus.current && previousStatus.current !== trip.status) {
      if (trip.status === "driver_assigned") {
        speak(
          "Đã có tài xế Minh Quân. Xe màu bạc, biển số 51 H 482 16. Tài xế đến trong 4 phút.",
        );
      } else if (trip.status === "driver_arrived") {
        speak(
          "Tài xế đã đến. Bạn kiểm tra đúng biển số 51 H 482 16 trước khi lên xe nhé.",
        );
      } else if (trip.status === "completed") {
        speak("Bạn đã đến nơi an toàn. Linh cũng đã nhận được thông báo.");
      }
    }
    previousStatus.current = trip.status;
  }, [speak, trip]);

  if (!ready) return <div className="min-h-screen bg-[#f7f8f5]" />;

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#14261d]">
      <header className="border-b-2 border-[#dfe7e2] bg-white">
        <div className="mx-auto flex h-20 max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="flex min-h-12 items-center gap-3 text-xl font-black"
            aria-label="Về trang chính"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#11683f] text-white">
              <MapPin className="h-6 w-6" />
            </span>
            EasyMove
          </Link>
          <div className="flex items-center gap-2 rounded-full bg-[#e8f5ed] px-4 py-2.5 text-base font-bold text-[#11683f]">
            <ShieldCheck className="h-5 w-5" />
            Linh đang theo dõi
          </div>
        </div>
      </header>

      {pendingIntent ? (
        <ConfirmationScreen
          intent={pendingIntent}
          voiceMode={mode}
          voiceMessage={message}
          onListen={startListening}
          onConfirm={confirmIntent}
          onReject={rejectIntent}
        />
      ) : trip ? (
        <ActiveElderRide
          trip={trip}
          voiceMode={mode}
          voiceMessage={message}
          onListen={startListening}
          onAdvance={(status) =>
            updateTrip({
              status,
              liveProgress:
                status === "driver_arrived" || status === "completed"
                  ? 1
                  : 0.05,
            })
          }
          onCancel={() => askForConfirmation({ type: "cancel" })}
          onReset={() => {
            setTrip(null);
            resetVoice();
          }}
        />
      ) : (
        <ElderHome
          voiceMode={mode}
          voiceMessage={notice || message}
          onListen={startListening}
          onChoose={(destination) =>
            askForConfirmation({ type: "ride", destination })
          }
          onCall={() => askForConfirmation({ type: "call" })}
        />
      )}
    </main>
  );
}

function ElderHome({
  voiceMode,
  voiceMessage,
  onListen,
  onChoose,
  onCall,
}: {
  voiceMode: string;
  voiceMessage: string;
  onListen: () => void;
  onChoose: (destination: string) => void;
  onCall: () => void;
}) {
  const listening = voiceMode === "listening";
  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="text-center">
        <p className="text-xl font-bold text-[#4d6156]">Chào bà Lan</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
          Bà muốn đi đâu?
        </h1>
        <p className="mt-4 text-xl leading-8 text-[#52655a]">
          Nhấn nút micro rồi nói, ví dụ: “Đi bệnh viện”
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <button
          type="button"
          onClick={onListen}
          className={`relative grid h-44 w-44 place-items-center rounded-full border-[10px] text-white shadow-[0_22px_55px_rgba(17,104,63,0.25)] transition active:scale-95 sm:h-52 sm:w-52 ${listening ? "border-[#b8efd0] bg-[#d7473f]" : "border-[#d8efe2] bg-[#11683f]"}`}
          aria-label={listening ? "Đang nghe" : "Nhấn để nói"}
        >
          {listening && (
            <span className="absolute inset-[-18px] animate-ping rounded-full border-4 border-[#d7473f]/30" />
          )}
          <span className="relative flex flex-col items-center gap-2">
            {voiceMode === "unsupported" ? (
              <MicOff className="h-14 w-14" />
            ) : (
              <Mic className="h-16 w-16" strokeWidth={2.4} />
            )}
            <span className="text-xl font-black">
              {listening ? "ĐANG NGHE" : "NHẤN ĐỂ NÓI"}
            </span>
          </span>
        </button>
        <output
          className="mt-6 flex min-h-14 items-center gap-3 rounded-2xl bg-white px-5 py-3 text-center text-lg font-bold text-[#31483c] shadow-sm"
          aria-live="polite"
        >
          <Volume2 className="h-6 w-6 shrink-0 text-[#11683f]" />
          {voiceMessage}
        </output>
      </div>

      <div className="my-8 flex items-center gap-4 text-base font-bold text-[#66786e]">
        <span className="h-0.5 flex-1 bg-[#dce4df]" />
        HOẶC CHỌN NÚT
        <span className="h-0.5 flex-1 bg-[#dce4df]" />
      </div>

      <div className="space-y-4">
        {savedPlaces.map((place) => {
          const Icon = place.icon;
          return (
            <button
              key={place.label}
              type="button"
              onClick={() => onChoose(place.destination)}
              className="flex min-h-24 w-full items-center gap-5 rounded-3xl border-2 border-[#d8e2dc] bg-white p-5 text-left shadow-[0_8px_24px_rgba(31,57,43,0.06)] hover:border-[#11683f] active:scale-[0.99]"
            >
              <span
                className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl ${place.color}`}
              >
                <Icon className="h-8 w-8" strokeWidth={2.4} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-2xl font-black">{place.label}</span>
                <span className="mt-1 block text-lg text-[#5d7065]">
                  {place.detail}
                </span>
              </span>
              <span className="text-3xl font-black text-[#839188]">›</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={onCall}
          className="flex min-h-24 w-full items-center gap-5 rounded-3xl border-2 border-[#ead8c3] bg-[#fffaf3] p-5 text-left shadow-[0_8px_24px_rgba(31,57,43,0.04)] hover:border-[#c57b2f] active:scale-[0.99]"
        >
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-[#fff0db] text-[#a75d1d]">
            <Phone className="h-8 w-8" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-2xl font-black">Gọi cho Linh</span>
            <span className="mt-1 block text-lg text-[#6c655c]">
              Con gái · Người thân
            </span>
          </span>
          <span className="text-3xl font-black text-[#9b8b79]">›</span>
        </button>
      </div>
    </section>
  );
}

function ConfirmationScreen({
  intent,
  voiceMode,
  voiceMessage,
  onListen,
  onConfirm,
  onReject,
}: {
  intent: Exclude<PendingIntent, null>;
  voiceMode: string;
  voiceMessage: string;
  onListen: () => void;
  onConfirm: () => void;
  onReject: () => void;
}) {
  const isRide = intent.type === "ride";
  return (
    <section className="mx-auto flex min-h-[calc(100vh-82px)] w-full max-w-3xl flex-col justify-center px-5 py-10 sm:px-8">
      <div className="rounded-[2.5rem] border-2 border-[#dbe5df] bg-white p-6 text-center shadow-[0_24px_70px_rgba(29,55,41,0.1)] sm:p-10">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-[#e9f5ee] text-[#11683f]">
          {isRide ? (
            <MapPin className="h-10 w-10" />
          ) : intent.type === "call" ? (
            <Phone className="h-10 w-10" />
          ) : (
            <X className="h-10 w-10" />
          )}
        </div>
        <p className="mt-6 text-xl font-bold text-[#54685d]">Xin bà xác nhận</p>
        <h1 className="mt-3 text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
          {isRide ? (
            <>
              Đặt xe đi
              <br />
              <span className="text-[#11683f]">{intent.destination}</span>?
            </>
          ) : intent.type === "call" ? (
            "Gọi cho Linh?"
          ) : (
            "Hủy chuyến xe?"
          )}
        </h1>
        {isRide && (
          <div className="mx-auto mt-7 grid max-w-lg grid-cols-2 gap-3 rounded-2xl bg-[#f1f5f2] p-4 text-lg">
            <span className="text-[#5c6d63]">Xe đến sau</span>
            <strong>Khoảng 4 phút</strong>
            <span className="text-[#5c6d63]">Giá dự kiến</span>
            <strong>
              {intent.destination.includes("Bệnh viện") ? "68.000đ" : "52.000đ"}
            </strong>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={onConfirm}
            className="flex min-h-20 items-center justify-center gap-3 rounded-2xl bg-[#11683f] px-5 text-2xl font-black text-white shadow-[0_12px_30px_rgba(17,104,63,0.22)] hover:bg-[#0d5935] active:scale-[0.98]"
          >
            <Check className="h-8 w-8" />
            ĐÚNG
          </button>
          <button
            type="button"
            onClick={onReject}
            className="flex min-h-20 items-center justify-center gap-3 rounded-2xl border-2 border-[#cfdad3] bg-white px-5 text-2xl font-black text-[#31483c] hover:border-[#8da396] active:scale-[0.98]"
          >
            <X className="h-8 w-8" />
            KHÔNG
          </button>
        </div>

        <button
          type="button"
          onClick={onListen}
          className={`mt-6 inline-flex min-h-14 items-center gap-3 rounded-full px-5 text-lg font-bold ${voiceMode === "listening" ? "bg-[#fde9e7] text-[#b8342e]" : "bg-[#eaf4ee] text-[#11683f]"}`}
        >
          <Mic className="h-6 w-6" />
          {voiceMode === "listening"
            ? "Tôi đang nghe…"
            : "Hoặc nói “đúng” / “không”"}
        </button>
        <p className="mt-3 text-base text-[#687a70]" aria-live="polite">
          {voiceMessage}
        </p>
      </div>
    </section>
  );
}

function ActiveElderRide({
  trip,
  voiceMode,
  voiceMessage,
  onListen,
  onAdvance,
  onCancel,
  onReset,
}: {
  trip: Trip;
  voiceMode: string;
  voiceMessage: string;
  onListen: () => void;
  onAdvance: (status: TripStatus) => void;
  onCancel: () => void;
  onReset: () => void;
}) {
  const finished = trip.status === "completed" || trip.status === "cancelled";
  const next = nextStatus[trip.status];
  const status =
    trip.status === "matching"
      ? {
          eyebrow: "ĐÃ ĐẶT XE",
          title: "Đang tìm tài xế",
          detail: "Bà chờ một chút nhé",
        }
      : trip.status === "driver_assigned"
        ? {
            eyebrow: "TÀI XẾ ĐANG ĐẾN",
            title: "Còn khoảng 4 phút",
            detail: "Bà chờ ở cửa nhà",
          }
        : trip.status === "driver_arrived"
          ? {
              eyebrow: "XE ĐÃ ĐẾN",
              title: "Kiểm tra đúng biển số",
              detail: trip.plate ?? "51H-482.16",
            }
          : trip.status === "in_progress"
            ? {
                eyebrow: "ĐANG ĐI",
                title: `Đang đến ${trip.destination}`,
                detail: "Linh đang theo dõi chuyến đi",
              }
            : trip.status === "completed"
              ? {
                  eyebrow: "ĐÃ ĐẾN NƠI",
                  title: "Bà đã đến an toàn",
                  detail: "Linh đã nhận được thông báo",
                }
              : {
                  eyebrow: "ĐÃ HỦY",
                  title: "Chuyến xe đã hủy",
                  detail: "Bà có thể đặt lại bất cứ lúc nào",
                };

  return (
    <section className="mx-auto w-full max-w-4xl px-5 py-7 sm:px-8 sm:py-10">
      <div
        className={`rounded-[2.2rem] p-6 text-center text-white shadow-[0_22px_55px_rgba(20,54,37,0.18)] sm:p-9 ${trip.status === "cancelled" ? "bg-[#5c6660]" : "bg-[#183d2c]"}`}
      >
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/12">
          {trip.status === "completed" ? (
            <Check className="h-9 w-9 text-[#8ce0b0]" />
          ) : (
            <Navigation className="h-8 w-8 text-[#8ce0b0]" />
          )}
        </div>
        <p className="mt-5 text-lg font-black tracking-[0.12em] text-[#9fe2bb]">
          {status.eyebrow}
        </p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
          {status.title}
        </h1>
        <p className="mt-3 text-xl font-semibold text-white/75">
          {status.detail}
        </p>
      </div>

      {!finished && (
        <div className="mt-5 overflow-hidden rounded-3xl border-2 border-[#d7e2dc] bg-white shadow-[0_10px_32px_rgba(29,55,41,0.07)]">
          <LiveTripMap trip={trip} compact />
          <div className="flex items-center justify-between gap-4 p-4 text-lg">
            <span className="font-bold text-[#52665b]">Đang đến</span>
            <strong className="text-right">{trip.destination}</strong>
          </div>
        </div>
      )}

      {!finished && trip.driverName && (
        <div className="mt-5 rounded-3xl border-2 border-[#dce5df] bg-white p-5 shadow-[0_10px_32px_rgba(29,55,41,0.07)] sm:p-6">
          <div className="flex items-center gap-5">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-[#e7f2eb] text-2xl font-black text-[#11683f]">
              MQ
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg text-[#5b6c62]">Tài xế của bà</p>
              <h2 className="text-3xl font-black">{trip.driverName}</h2>
              <p className="mt-1 text-xl font-bold text-[#40574b]">
                {trip.vehicle}
              </p>
            </div>
          </div>
          <div className="mt-5 rounded-2xl bg-[#fff4df] p-4 text-center">
            <p className="text-base font-bold text-[#6c5b3d]">BIỂN SỐ XE</p>
            <p className="mt-1 text-4xl font-black tracking-[0.08em] text-[#322a1e]">
              {trip.plate}
            </p>
          </div>
        </div>
      )}

      {!finished && (
        <div className="mt-5 grid grid-cols-2 gap-4">
          <a
            href="tel:+84901234567"
            className="flex min-h-20 items-center justify-center gap-3 rounded-2xl border-2 border-[#d9e3dd] bg-white text-xl font-black text-[#234436]"
          >
            <Phone className="h-7 w-7" />
            Gọi tài xế
          </a>
          <a
            href="tel:+84909876543"
            className="flex min-h-20 items-center justify-center gap-3 rounded-2xl border-2 border-[#d9e3dd] bg-white text-xl font-black text-[#234436]"
          >
            <HeartHandshake className="h-7 w-7" />
            Gọi Linh
          </a>
        </div>
      )}

      {next && (
        <button
          type="button"
          onClick={() => onAdvance(next)}
          className="mt-5 min-h-20 w-full rounded-2xl bg-[#11683f] px-5 text-2xl font-black text-white shadow-[0_12px_30px_rgba(17,104,63,0.18)]"
        >
          {nextAction[trip.status]}
        </button>
      )}

      {!finished && (
        <div className="mt-5 grid grid-cols-[1fr_auto] gap-4">
          <button
            type="button"
            onClick={onListen}
            className={`flex min-h-16 items-center justify-center gap-3 rounded-2xl px-4 text-lg font-black ${voiceMode === "listening" ? "bg-[#fde8e6] text-[#b6352f]" : "bg-[#e7f3ec] text-[#11683f]"}`}
          >
            <Mic className="h-7 w-7" />
            {voiceMode === "listening" ? "Đang nghe…" : "Nói yêu cầu"}
          </button>
          <a
            href="tel:112"
            className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-[#cf332e] px-5 text-xl font-black text-white"
          >
            <Siren className="h-7 w-7" />
            SOS
          </a>
        </div>
      )}
      {!finished && (
        <p
          className="mt-3 text-center text-base text-[#63766b]"
          aria-live="polite"
        >
          {voiceMessage}
        </p>
      )}
      {!finished && (
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 min-h-14 w-full text-lg font-bold text-[#a6423c]"
        >
          Hủy chuyến xe
        </button>
      )}

      {finished && (
        <button
          type="button"
          onClick={onReset}
          className="mt-6 min-h-20 w-full rounded-2xl bg-[#11683f] text-2xl font-black text-white"
        >
          Đặt chuyến mới
        </button>
      )}

      {!finished && (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl bg-[#e8f5ed] p-4 text-lg font-bold text-[#11683f]">
          <ShieldCheck className="h-6 w-6" />
          Linh đang thấy toàn bộ chuyến đi của bà
        </div>
      )}
    </section>
  );
}
