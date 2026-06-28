"use client";

import {
  Check,
  GraduationCap,
  HeartHandshake,
  Home,
  MapPin,
  MessageSquareText,
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
import { AppHeader } from "@/components/app-header";
import { LiveTripMap } from "@/components/live-trip-map";
import {
  type AiVoiceIntent,
  type RiderVoiceStage,
  type VoiceConversationEntry,
  useAiVoiceCommand,
} from "@/hooks/use-ai-voice-command";
import { useTripSync } from "@/hooks/use-trip-sync";
import type { Trip, TripStatus } from "@/lib/trip";

type PendingIntent =
  | { type: "ride"; destination: string }
  | { type: "call" }
  | { type: "cancel" }
  | null;

type HistoryMessage = {
  id: string;
  sender: "user" | "bot";
  text: string;
};

function createHistoryMessage(
  sender: HistoryMessage["sender"],
  text: string,
): HistoryMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    sender,
    text,
  };
}

const savedPlaces = [
  {
    label: "Về nhà",
    destination: "Nhà · 24 Nguyễn Đình Chiểu",
    detail: "Địa chỉ nhà đã lưu",
    prompt: "Toi muon ve nha",
    icon: Home,
    color:
      "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400",
  },
  {
    label: "Đi bệnh viện",
    destination: "Bệnh viện Chợ Rẫy",
    detail: "Cổng chính đường Nguyễn Chí Thanh",
    prompt: "Toi muon di benh vien",
    icon: Stethoscope,
    color: "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400",
  },
  {
    label: "Đi học",
    destination: "Đại học quốc gia TP.HCM",
    detail: "Khu đô thị Đại học Quốc gia",
    prompt: "Toi muon di hoc",
    icon: GraduationCap,
    color:
      "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-400",
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
  "Đại học quốc gia TP.HCM": { lat: 10.8702, lng: 106.8038 },
  "Nhà Linh · 88 Võ Văn Tần": { lat: 10.7752, lng: 106.6891 },
};

function toKnownDestination(destination: string | undefined) {
  if (!destination) return undefined;
  const voiceDestinationMap: Record<string, string> = {
    "Nha - 24 Nguyen Dinh Chieu": "Nha - 24 Nguyen Dinh Chieu",
    "Benh vien Cho Ray": "Bệnh viện Chợ Rẫy",
    "Đại học quốc gia TP.HCM": "Đại học quốc gia TP.HCM",
    "Nha Linh - 88 Vo Van Tan": "Nhà Linh · 88 Võ Văn Tần",
  };
  return voiceDestinationMap[destination] ?? destination;
}

function getRiderVoiceStage(
  pendingIntent: PendingIntent,
  trip: Trip | null,
): RiderVoiceStage {
  if (pendingIntent?.type === "cancel") return "confirm_cancel";
  if (pendingIntent) return "confirm_booking";
  if (trip && !["completed", "cancelled"].includes(trip.status)) {
    return "active_trip";
  }
  return "start_booking";
}

export function RiderApp() {
  const { trip, ready, setTrip, updateTrip } = useTripSync();
  const [pendingIntent, setPendingIntent] = useState<PendingIntent>(null);
  const [notice, setNotice] = useState("");
  const previousStatus = useRef<TripStatus | null>(null);
  const voiceInitiatedRef = useRef(false);

  const sosTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = () => {
    if (sosTimeoutRef.current) return;
    sosTimeoutRef.current = setTimeout(() => {
      navigator.vibrate?.([100, 50, 100, 50, 500]);
      void speak("Đã kích hoạt cuộc gọi khẩn cấp SOS tới người thân.");
      window.location.href = "tel:+84909876543"; // Call Linh
    }, 3000);
  };

  const handleTouchEnd = () => {
    if (sosTimeoutRef.current) {
      clearTimeout(sosTimeoutRef.current);
      sosTimeoutRef.current = null;
    }
  };

  const confirmIntentRef = useRef<() => void>(() => undefined);
  const rejectIntentRef = useRef<() => void>(() => undefined);

  // Conversation history log state
  const [history, setHistory] = useState<HistoryMessage[]>([
    createHistoryMessage("bot", "Chào bà Lan, bạn cần tôi giúp gì?"),
  ]);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const handleVoiceIntent = useCallback((intent: AiVoiceIntent) => {
    voiceInitiatedRef.current = true;
    setNotice("");

    if (intent.type === "confirm") {
      confirmIntentRef.current();
      return;
    }
    if (intent.type === "reject") {
      rejectIntentRef.current();
      return;
    }
    if (intent.type === "call") {
      setPendingIntent({ type: "call" });
      return;
    }
    if (intent.type === "cancel") {
      setPendingIntent({ type: "cancel" });
      return;
    }
    if (intent.type === "ride") {
      const destination = toKnownDestination(intent.destination);
      if (destination) setPendingIntent({ type: "ride", destination });
      return;
    }

    voiceInitiatedRef.current = false;
    setNotice("Toi chua hieu. Ban co the noi ve nha hoac di benh vien.");
  }, []);

  const {
    mode,
    message,
    conversation,
    processTextCommand,
    speak,
    startListening,
    resetVoice,
  } = useAiVoiceCommand({
    getStage: () => getRiderVoiceStage(pendingIntent, trip),
    getContext: () => ({
      pendingIntent,
      tripStatus: trip?.status ?? null,
      history,
    }),
    onIntent: handleVoiceIntent,
    onReply: (text) => {
      setHistory((prev) => {
        if (
          prev.length > 0 &&
          prev[prev.length - 1].sender === "bot" &&
          prev[prev.length - 1].text === text
        ) {
          return prev;
        }
        return [...prev, createHistoryMessage("bot", text)];
      });
    },
  });

  // Wrapper to log bot responses without TTS
  const logBotMessage = useCallback((text: string) => {
    setHistory((prev) => {
      // Avoid duplicate logs of the exact same bot response
      if (
        prev.length > 0 &&
        prev[prev.length - 1].sender === "bot" &&
        prev[prev.length - 1].text === text
      ) {
        return prev;
      }
      return [...prev, createHistoryMessage("bot", text)];
    });
  }, []);

  const speakBotMessage = useCallback(
    (text: string) => {
      logBotMessage(text);
      if (voiceInitiatedRef.current) {
        voiceInitiatedRef.current = false;
        return;
      }
      void speak(text);
    },
    [logBotMessage, speak],
  );

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
      speakBotMessage(
        `Bạn muốn đặt xe đi ${pendingIntent.destination}. Đúng không?`,
      );
    } else if (pendingIntent.type === "call") {
      speakBotMessage("Bạn muốn gọi cho con gái Linh. Đúng không?");
    } else {
      speakBotMessage("Bạn muốn hủy chuyến xe này. Đúng không?");
    }
  }, [pendingIntent, speakBotMessage]);

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
      speakBotMessage("Đã đặt xe. AloXe đang tìm tài xế gần bạn.");
    },
    [resetVoice, setTrip, speakBotMessage],
  );

  const confirmIntent = useCallback(() => {
    if (!pendingIntent) return;
    if (pendingIntent.type === "ride") {
      createTrip(pendingIntent.destination);
    } else if (pendingIntent.type === "call") {
      setPendingIntent(null);
      speakBotMessage("Đang mở cuộc gọi cho Linh.");
      window.location.href = "tel:+84901234567";
    } else {
      updateTrip({ status: "cancelled" });
      setPendingIntent(null);
      resetVoice();
      speakBotMessage("Chuyến xe đã được hủy.");
    }
  }, [createTrip, pendingIntent, resetVoice, speakBotMessage, updateTrip]);

  const rejectIntent = useCallback(() => {
    setPendingIntent(null);
    resetVoice();
    setNotice("Đã quay lại. Bạn chọn nơi muốn đến nhé.");
    speakBotMessage("Được rồi. Bạn chọn lại nhé.");
  }, [resetVoice, speakBotMessage]);

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
        speakBotMessage(
          "Đã có tài xế Minh Quân. Xe màu bạc, biển số 51 H 482 16. Tài xế đến trong 4 phút.",
        );
      } else if (trip.status === "driver_arrived") {
        speakBotMessage(
          "Tài xế đã đến. Bạn kiểm tra đúng biển số 51 H 482 16 trước khi lên xe nhé.",
        );
      } else if (trip.status === "completed") {
        speakBotMessage(
          "Bạn đã đến nơi an toàn. Linh cũng đã nhận được thông báo.",
        );
      }
    }
    previousStatus.current = trip.status;
  }, [speakBotMessage, trip]);

  // Click handler wrappers to log button actions to conversation log
  const handleConfirmClick = useCallback(() => {
    setHistory((prev) => [...prev, createHistoryMessage("user", "ĐÚNG")]);
    confirmIntent();
  }, [confirmIntent]);

  const handleRejectClick = useCallback(() => {
    setHistory((prev) => [...prev, createHistoryMessage("user", "KHÔNG")]);
    rejectIntent();
  }, [rejectIntent]);

  if (!ready) return <div className="min-h-screen bg-background" />;

  return (
    <main
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleTouchStart}
      onMouseUp={handleTouchEnd}
      className="min-h-screen bg-background text-foreground transition-colors duration-200"
    >
      <AppHeader
        rightSlot={
          <div className="flex items-center gap-3">
            <Link
              href="/guardian"
              target="_blank"
              className="rounded-full border-2 border-primary/20 bg-card px-4 py-2 text-sm font-bold text-primary transition hover:bg-primary/10 hover:border-primary"
            >
              Người thân giám sát
            </Link>
            <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-bold text-primary">
              <ShieldCheck className="h-4 w-4" />
              Linh đang theo dõi
            </div>
          </div>
        }
        mobileDrawerSlot={
          <div className="space-y-3">
            {/* Linh watching status */}
            <div className="flex items-center gap-3 rounded-2xl bg-primary/10 border border-primary/20 px-4 py-3.5">
              <ShieldCheck className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-black text-primary">
                  Linh đang theo dõi
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Người thân đang giám sát chuyến đi
                </p>
              </div>
            </div>
            {/* Guardian link */}
            <Link
              href="/guardian"
              target="_blank"
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-muted/50 px-4 py-3.5 text-base font-bold text-foreground transition-all hover:bg-muted active:scale-[0.98]"
            >
              <Phone className="h-5 w-5 text-muted-foreground" />
              Người thân giám sát
            </Link>
            {/* Emergency call */}
            <a
              href="tel:+84909876543"
              className="flex w-full items-center gap-3 rounded-2xl bg-red-500/10 border border-red-500/20 px-4 py-3.5 text-base font-bold text-red-600 dark:text-red-400 transition-all hover:bg-red-500/20 active:scale-[0.98]"
            >
              <Siren className="h-5 w-5" />
              Gọi khẩn cấp cho Linh
            </a>
          </div>
        }
      />

      {/* Persistent Conversation Log */}
      <div className="mx-auto w-full max-w-3xl px-5 pt-6">
        <div className="bg-card rounded-3xl border border-border p-5 shadow-[0_12px_36px_rgba(0,0,0,0.03)] flex flex-col gap-3 max-h-56 overflow-y-auto scroll-smooth">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1 select-none border-b border-border pb-1.5">
            Lịch sử đối thoại với trợ lý
          </span>
          {history.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col max-w-[85%] rounded-2xl px-4 py-3 text-lg font-bold leading-relaxed shadow-sm transition ${
                msg.sender === "user"
                  ? "self-end bg-primary text-primary-foreground rounded-br-none"
                  : "self-start bg-muted text-foreground rounded-bl-none border border-border"
              }`}
            >
              <span className="text-[10px] opacity-75 mb-0.5 font-bold uppercase tracking-wider">
                {msg.sender === "user" ? "Bà Lan" : "Trợ lý AloXe"}
              </span>
              <p>{msg.text}</p>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {pendingIntent ? (
        <ConfirmationScreen
          intent={pendingIntent}
          voiceMode={mode}
          voiceMessage={message}
          onListen={startListening}
          onConfirm={handleConfirmClick}
          onReject={handleRejectClick}
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
          onCancel={() => {
            setHistory((prev) => [
              ...prev,
              createHistoryMessage("user", "Yêu cầu hủy chuyến"),
            ]);
            askForConfirmation({ type: "cancel" });
          }}
          onReset={() => {
            setTrip(null);
            resetVoice();
            // Reset conversation history but keep welcome message
            setHistory([
              createHistoryMessage("bot", "Chào bà Lan, bạn cần tôi giúp gì?"),
            ]);
          }}
        />
      ) : (
        <RiderHome
          voiceMode={mode}
          voiceMessage={notice || message}
          onListen={startListening}
          onChoose={(prompt) => {
            setHistory((prev) => [
              ...prev,
              createHistoryMessage("user", prompt),
            ]);
            processTextCommand(prompt);
          }}
        />
      )}

      <ConversationStreamPanel conversation={conversation} />
    </main>
  );
}

function ConversationStreamPanel({
  conversation,
}: {
  conversation: VoiceConversationEntry[];
}) {
  return (
    <section className="mx-auto mt-2 w-full max-w-4xl px-5 pb-10 sm:px-8">
      <div className="rounded-[2rem] border border-border bg-card p-5 shadow-[0_10px_30px_rgba(0,0,0,0.03)] sm:p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
            <MessageSquareText className="h-6 w-6" />
          </span>
          <div>
            <p className="text-xl font-black">Streaming conversation</p>
            <p className="text-sm text-muted-foreground">
              Lịch sử hội thoại đang stream giữa người dùng và AloXe.
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {conversation.length === 0 ? (
            <div className="rounded-2xl bg-muted px-4 py-5 text-sm font-medium text-muted-foreground">
              Chưa có hội thoại. Nhấn micro để bắt đầu.
            </div>
          ) : (
            conversation.map((entry) => (
              <div
                key={entry.id}
                className={`rounded-2xl px-4 py-3 ${entry.role === "assistant" ? "bg-primary/5 text-foreground" : entry.role === "user" ? "bg-muted text-foreground" : "bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300"}`}
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-xs font-black uppercase tracking-[0.12em]">
                    {entry.role === "assistant"
                      ? "AloXe"
                      : entry.role === "user"
                        ? "Người dùng"
                        : "Hệ thống"}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${entry.status === "streaming" ? "bg-primary/10 text-primary" : entry.status === "error" ? "bg-error/10 text-error" : "bg-muted text-muted-foreground"}`}
                  >
                    {entry.status === "streaming"
                      ? "stream"
                      : entry.status === "error"
                        ? "error"
                        : "done"}
                  </span>
                </div>
                <p className="mt-2 text-base leading-7">
                  {entry.text || "Đang phản hồi..."}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function RiderHome({
  voiceMode,
  voiceMessage,
  onListen,
  onChoose,
}: {
  voiceMode: string;
  voiceMessage: string;
  onListen: () => void;
  onChoose: (prompt: string) => void;
}) {
  const listening = voiceMode === "listening";
  return (
    <section className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
      <div className="text-center">
        <p className="text-xl font-bold text-muted-foreground">Chào bà Lan</p>
        <h1 className="mt-2 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
          Bạn cần tôi giúp gì?
        </h1>
        <p className="mt-4 text-xl leading-8 text-muted-foreground">
          Nhấn nút micro rồi nói, ví dụ: “Đi bệnh viện”
        </p>
      </div>

      <div className="mt-8 flex flex-col items-center">
        <button
          type="button"
          onClick={onListen}
          className={`relative grid h-44 w-44 place-items-center rounded-full border-10 text-white shadow-[0_22px_55px_rgba(0,71,171,0.25)] transition active:scale-95 sm:h-52 sm:w-52 ${listening ? "border-red-200 dark:border-red-950 bg-red-600 dark:bg-red-700" : "border-primary/30 bg-primary"}`}
          aria-label={listening ? "Đang nghe" : "Nhấn để nói"}
        >
          {listening && (
            <span className="absolute -inset-4.5 animate-ping rounded-full border-4 border-red-600/30 dark:border-red-500/30" />
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
          className="mt-6 flex min-h-14 items-center gap-3 rounded-2xl bg-card border border-border px-5 py-3 text-center text-lg font-bold text-foreground shadow-sm"
          aria-live="polite"
        >
          <Volume2 className="h-6 w-6 shrink-0 text-primary" />
          {voiceMessage}
        </output>
      </div>

      <div className="my-8 flex items-center gap-4 text-base font-bold text-muted-foreground">
        <span className="h-0.5 flex-1 bg-border" />
        HOẶC CHỌN NÚT
        <span className="h-0.5 flex-1 bg-border" />
      </div>

      <div className="space-y-4">
        {savedPlaces.map((place) => {
          const Icon = place.icon;
          return (
            <button
              key={place.label}
              type="button"
              onClick={() => onChoose(place.prompt)}
              className="flex min-h-24 w-full items-center gap-5 rounded-3xl border-2 border-border bg-card p-5 text-left shadow-[0_8px_24px_rgba(0,0,0,0.03)] hover:border-primary active:scale-[0.99] transition-all"
            >
              <span
                className={`grid h-16 w-16 shrink-0 place-items-center rounded-2xl ${place.color}`}
              >
                <Icon className="h-8 w-8" strokeWidth={2.4} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-2xl font-black">{place.label}</span>
                <span className="mt-1 block text-lg text-muted-foreground">
                  {place.detail}
                </span>
              </span>
              <span className="text-3xl font-black text-muted-foreground">
                ›
              </span>
            </button>
          );
        })}
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
      <div className="rounded-[2.5rem] border-2 border-border bg-card p-6 text-center shadow-[0_24px_70px_rgba(0,0,0,0.05)] sm:p-10">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-primary/10 text-primary">
          {isRide ? (
            <MapPin className="h-10 w-10" />
          ) : intent.type === "call" ? (
            <Phone className="h-10 w-10" />
          ) : (
            <X className="h-10 w-10" />
          )}
        </div>
        <p className="mt-6 text-xl font-bold text-muted-foreground">
          Xin bà xác nhận
        </p>
        <h1 className="mt-3 text-4xl font-black leading-tight tracking-[-0.04em] sm:text-5xl">
          {isRide ? (
            <>
              Đặt xe đi
              <br />
              <span className="text-primary">{intent.destination}</span>?
            </>
          ) : intent.type === "call" ? (
            "Gọi cho Linh?"
          ) : (
            "Hủy chuyến xe?"
          )}
        </h1>
        {isRide && (
          <div className="mx-auto mt-7 grid max-w-lg grid-cols-2 gap-3 rounded-2xl bg-muted border border-border p-4 text-lg">
            <span className="text-muted-foreground">Xe đến sau</span>
            <strong>Khoảng 4 phút</strong>
            <span className="text-muted-foreground">Giá dự kiến</span>
            <strong>
              {intent.destination.includes("Bệnh viện") ? "68.000đ" : "52.000đ"}
            </strong>
          </div>
        )}

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={onConfirm}
            className="flex min-h-20 items-center justify-center gap-3 rounded-2xl bg-success px-5 text-2xl font-black text-success-foreground shadow-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Check className="h-8 w-8" />
            ĐÚNG
          </button>
          <button
            type="button"
            onClick={onReject}
            className="flex min-h-20 items-center justify-center gap-3 rounded-2xl bg-error px-5 text-2xl font-black text-error-foreground shadow-lg hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
          >
            <X className="h-8 w-8" />
            KHÔNG
          </button>
        </div>

        <button
          type="button"
          onClick={onListen}
          className={`mt-6 inline-flex min-h-14 items-center gap-3 rounded-full px-5 text-lg font-bold ${voiceMode === "listening" ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400" : "bg-primary/10 text-primary"}`}
        >
          <Mic className="h-6 w-6" />
          {voiceMode === "listening"
            ? "Tôi đang nghe…"
            : "Hoặc nói “đúng” / “không”"}
        </button>
        <p className="mt-3 text-base text-muted-foreground" aria-live="polite">
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
        className={`rounded-[2.2rem] p-6 text-center text-white shadow-[0_22px_55px_rgba(0,0,0,0.05)] sm:p-9 ${trip.status === "cancelled" ? "bg-neutral-600 dark:bg-neutral-800" : "bg-primary"}`}
      >
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white/12">
          {trip.status === "completed" ? (
            <Check className="h-9 w-9 text-emerald-300" />
          ) : (
            <Navigation className="h-8 w-8 text-sky-300" />
          )}
        </div>
        <p
          className={`mt-5 text-lg font-black tracking-[0.12em] ${trip.status === "cancelled" ? "text-neutral-300" : "text-sky-200 dark:text-sky-300"}`}
        >
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
        <div className="mt-5 overflow-hidden rounded-3xl border border-border bg-card shadow-[0_10px_32px_rgba(0,0,0,0.03)]">
          <LiveTripMap trip={trip} compact />
          <div className="flex items-center justify-between gap-4 p-4 text-lg">
            <span className="font-bold text-muted-foreground">Đang đến</span>
            <strong className="text-right">{trip.destination}</strong>
          </div>
        </div>
      )}

      {!finished && trip.driverName && (
        <div className="mt-5 rounded-3xl border border-border bg-card p-5 shadow-[0_10px_32px_rgba(0,0,0,0.03)] sm:p-6">
          <div className="flex items-center gap-5">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-primary/10 text-2xl font-black text-primary">
              MQ
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-lg text-muted-foreground">Tài xế của bà</p>
              <h2 className="text-3xl font-black">{trip.driverName}</h2>
              <p className="mt-1 text-xl font-bold text-muted-foreground">
                {trip.vehicle}
              </p>
            </div>
          </div>
          <div className="mt-5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/50 p-4 text-center">
            <p className="text-base font-bold text-amber-800 dark:text-amber-300">
              BIỂN SỐ XE
            </p>
            <p className="mt-1 text-4xl font-black tracking-[0.08em] text-amber-950 dark:text-amber-100">
              {trip.plate}
            </p>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-500/10 p-4 text-left text-lg font-bold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-500" />
            <span>
              Tài xế đã nhận thông báo: Đón tại cửa & Hỗ trợ cụ bà lên xe.
            </span>
          </div>
        </div>
      )}

      {!finished && (
        <div className="mt-5 grid grid-cols-2 gap-4">
          <a
            href="tel:+84901234567"
            className="flex min-h-20 items-center justify-center gap-3 rounded-2xl border border-border bg-card text-xl font-black text-foreground hover:bg-muted transition-all"
          >
            <Phone className="h-7 w-7" />
            Gọi tài xế
          </a>
          <a
            href="tel:+84909876543"
            className="flex min-h-20 items-center justify-center gap-3 rounded-2xl border border-border bg-card text-xl font-black text-foreground hover:bg-muted transition-all"
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
          className="mt-5 min-h-20 w-full rounded-2xl bg-primary px-5 text-2xl font-black text-primary-foreground shadow-[0_12px_30px_rgba(0,71,171,0.18)] hover:opacity-90 transition-all"
        >
          {nextAction[trip.status]}
        </button>
      )}

      {!finished && (
        <div className="mt-5 grid grid-cols-[1fr_auto] gap-4">
          <button
            type="button"
            onClick={onListen}
            className={`flex min-h-16 items-center justify-center gap-3 rounded-2xl px-4 text-lg font-black ${voiceMode === "listening" ? "bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400" : "bg-primary/10 text-primary"}`}
          >
            <Mic className="h-7 w-7" />
            {voiceMode === "listening" ? "Đang nghe…" : "Nói yêu cầu"}
          </button>
          <a
            href="tel:112"
            className="flex min-h-16 items-center justify-center gap-2 rounded-2xl bg-red-600 px-5 text-xl font-black text-white hover:bg-red-700 transition-all"
          >
            <Siren className="h-7 w-7" />
            SOS
          </a>
        </div>
      )}
      {!finished && (
        <p
          className="mt-3 text-center text-base text-muted-foreground"
          aria-live="polite"
        >
          {voiceMessage}
        </p>
      )}
      {!finished && (
        <button
          type="button"
          onClick={onCancel}
          className="mt-3 min-h-14 w-full rounded-2xl border-2 border-error/20 bg-card text-lg font-bold text-error hover:bg-error/10 hover:border-error transition-all cursor-pointer"
        >
          Hủy chuyến xe
        </button>
      )}

      {finished && (
        <button
          type="button"
          onClick={onReset}
          className="mt-6 min-h-20 w-full rounded-2xl bg-primary text-2xl font-black text-primary-foreground hover:opacity-90 transition-all"
        >
          Đặt chuyến mới
        </button>
      )}

      {!finished && (
        <div className="mt-6 flex items-center justify-center gap-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/30 p-4 text-lg font-bold text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="h-6 w-6" />
          Linh đang thấy toàn bộ chuyến đi của bà
        </div>
      )}
    </section>
  );
}
