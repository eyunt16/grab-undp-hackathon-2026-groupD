"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type AiVoiceMode =
  | "idle"
  | "listening"
  | "processing"
  | "speaking"
  | "error"
  | "unsupported";

export type AiVoiceIntent =
  | { type: "ride"; destination?: string }
  | { type: "call" }
  | { type: "cancel" }
  | { type: "confirm" }
  | { type: "reject" }
  | { type: "unknown" };

type VoiceResponse = {
  transcript?: string;
  intent?: AiVoiceIntent;
  replyText?: string;
  audio?: {
    base64: string;
    mediaType: string;
    format?: string;
  };
  error?: string;
};

type UseAiVoiceCommandOptions = {
  getContext: () => unknown;
  onIntent: (intent: AiVoiceIntent) => void;
};

function audioUrl(audio: NonNullable<VoiceResponse["audio"]>) {
  return `data:${audio.mediaType};base64,${audio.base64}`;
}

export function useAiVoiceCommand({
  getContext,
  onIntent,
}: UseAiVoiceCommandOptions) {
  const [mode, setMode] = useState<AiVoiceMode>("idle");
  const [message, setMessage] = useState("Nhấn nút và nói nơi bạn muốn đến");
  const [transcript, setTranscript] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const getContextRef = useRef(getContext);
  const onIntentRef = useRef(onIntent);

  useEffect(() => {
    getContextRef.current = getContext;
    onIntentRef.current = onIntent;
  }, [getContext, onIntent]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("MediaRecorder" in window) || !navigator.mediaDevices) {
      setMode("unsupported");
      setMessage("Thiết bị này chưa hỗ trợ ghi âm. Hãy chọn nút bên dưới.");
    }
  }, []);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      if (mediaRecorderRef.current?.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        for (const track of streamRef.current.getTracks()) {
          track.stop();
        }
      }
    },
    [],
  );

  const playAudio = useCallback(async (audio: VoiceResponse["audio"]) => {
    if (!audio) return;

    audioRef.current?.pause();
    const player = new Audio(audioUrl(audio));
    audioRef.current = player;
    setMode("speaking");

    await new Promise<void>((resolve) => {
      player.onended = () => resolve();
      player.onerror = () => resolve();
      void player.play().catch(() => resolve());
    });

    setMode("idle");
  }, []);

  const handleAudioRecorded = useCallback(
    async (audioBlob: Blob) => {
      setMode("processing");
      setMessage("EasyMove đang nghe và phân tích...");

      const form = new FormData();
      form.append("audio", audioBlob, "rider-command.webm");
      form.append("context", JSON.stringify(getContextRef.current()));

      const response = await fetch("/api/rider-voice", {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as VoiceResponse;

      if (!response.ok) {
        setMode("error");
        setMessage(data.error ?? "Tôi chưa nghe rõ. Bạn thử nói lại nhé.");
        return "";
      }

      setTranscript(data.transcript ?? "");
      setMessage(
        data.transcript
          ? `Đã nghe: "${data.transcript}"`
          : (data.replyText ?? ""),
      );
      navigator.vibrate?.(70);
      if (data.intent) onIntentRef.current(data.intent);
      await playAudio(data.audio);

      return data.transcript ?? "";
    },
    [playAudio],
  );

  const processTextCommand = useCallback(
    async (text: string) => {
      setMode("processing");
      setMessage("EasyMove dang phan tich...");

      const response = await fetch("/api/rider-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          context: getContextRef.current(),
        }),
      });
      const data = (await response.json()) as VoiceResponse;

      if (!response.ok) {
        setMode("error");
        setMessage(data.error ?? "Toi chua hieu. Ban thu lai nhe.");
        return;
      }

      setTranscript(data.transcript ?? text);
      setMessage(data.replyText ?? text);
      if (data.intent) onIntentRef.current(data.intent);
      await playAudio(data.audio);
    },
    [playAudio],
  );

  const startListening = useCallback(async () => {
    if (!("MediaRecorder" in window) || !navigator.mediaDevices) {
      setMode("unsupported");
      return;
    }

    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
      setMode("idle");
      return;
    }

    try {
      audioRef.current?.pause();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      });

      mediaRecorder.addEventListener("stop", () => {
        for (const track of stream.getTracks()) {
          track.stop();
        }
        streamRef.current = null;
        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType || "audio/webm",
        });
        if (audioBlob.size > 0) void handleAudioRecorded(audioBlob);
      });

      mediaRecorder.addEventListener("error", () => {
        setMode("error");
        setMessage("Micro đang bận. Bạn chờ một chút rồi thử lại nhé.");
      });

      setTranscript("");
      setMode("listening");
      setMessage("Tôi đang nghe...");
      navigator.vibrate?.(40);
      mediaRecorder.start();
    } catch {
      setMode("error");
      setMessage("Hãy cho phép dùng micro, hoặc chọn nút bên dưới.");
    }
  }, [handleAudioRecorded]);

  const speak = useCallback(
    async (text: string, listenAfter = false) => {
      setMessage(text);
      setMode("processing");
      const response = await fetch("/api/rider-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speakText: text }),
      });
      const data = (await response.json()) as VoiceResponse;

      if (!response.ok) {
        setMode("error");
        setMessage(data.error ?? text);
        return;
      }

      await playAudio(data.audio);
      if (listenAfter) window.setTimeout(() => void startListening(), 250);
    },
    [playAudio, startListening],
  );

  const resetVoice = useCallback(() => {
    audioRef.current?.pause();
    setTranscript("");
    setMode("idle");
    setMessage("Nhấn nút và nói nơi bạn muốn đến");
  }, []);

  const setRecordingMode = useCallback((recording: boolean) => {
    setMode((current) => {
      if (recording) return "listening";
      return current === "listening" ? "idle" : current;
    });
    if (recording) setMessage("Tôi đang nghe...");
  }, []);

  return {
    mode,
    message,
    transcript,
    handleAudioRecorded,
    processTextCommand,
    setRecordingMode,
    startListening,
    speak,
    resetVoice,
  };
}
