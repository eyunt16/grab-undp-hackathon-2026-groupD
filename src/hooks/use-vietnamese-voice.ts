"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type VoiceMode = "idle" | "listening" | "processing" | "unsupported" | "error";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult:
    | ((event: { results: { 0: { 0: { transcript: string } } } }) => void)
    | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function useVietnameseVoice(onCommand: (transcript: string) => void) {
  const [mode, setMode] = useState<VoiceMode>("idle");
  const [transcript, setTranscript] = useState("");
  const [message, setMessage] = useState("Nhấn nút và nói nơi bạn muốn đến");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onCommandRef = useRef(onCommand);
  const startListeningRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  useEffect(() => {
    const Recognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) setMode("unsupported");
    return () => {
      recognitionRef.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);

  const speak = useCallback((text: string, listenAfter = false) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "vi-VN";
    utterance.rate = 0.88;
    utterance.pitch = 1;
    const vietnameseVoice = window.speechSynthesis
      .getVoices()
      .find((voice) => voice.lang.toLowerCase().startsWith("vi"));
    if (vietnameseVoice) utterance.voice = vietnameseVoice;
    utterance.onend = () => {
      if (listenAfter)
        window.setTimeout(() => startListeningRef.current(), 250);
    };
    utterance.onerror = () => {
      if (listenAfter)
        window.setTimeout(() => startListeningRef.current(), 250);
    };
    window.speechSynthesis.speak(utterance);
  }, []);

  const startListening = useCallback(() => {
    const Recognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    if (!Recognition) {
      setMode("unsupported");
      setMessage(
        "Thiết bị này chưa hỗ trợ nghe giọng nói. Hãy chọn nút bên dưới.",
      );
      return;
    }

    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
    const recognition = new Recognition();
    recognition.lang = "vi-VN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const heard = event.results[0][0].transcript.trim();
      setTranscript(heard);
      setMessage(`Đã nghe: “${heard}”`);
      setMode("processing");
      navigator.vibrate?.(70);
      onCommandRef.current(heard);
    };
    recognition.onerror = (event) => {
      setMode("error");
      setMessage(
        event.error === "not-allowed"
          ? "Hãy cho phép dùng micro, hoặc chọn nút bên dưới."
          : "Tôi chưa nghe rõ. Bạn thử nói lại nhé.",
      );
    };
    recognition.onend = () => {
      setMode((current) => (current === "listening" ? "idle" : current));
    };

    setTranscript("");
    setMode("listening");
    setMessage("Tôi đang nghe…");
    navigator.vibrate?.(40);
    try {
      recognition.start();
    } catch {
      setMode("error");
      setMessage("Micro đang bận. Bạn chờ một chút rồi thử lại nhé.");
    }
  }, []);

  useEffect(() => {
    startListeningRef.current = startListening;
  }, [startListening]);

  const resetVoice = useCallback(() => {
    recognitionRef.current?.abort();
    window.speechSynthesis?.cancel();
    const Recognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;
    setMode(Recognition ? "idle" : "unsupported");
    setTranscript("");
    setMessage(
      Recognition
        ? "Nhấn nút và nói nơi bạn muốn đến"
        : "Thiết bị này chưa hỗ trợ nghe giọng nói. Hãy chọn nút bên dưới.",
    );
  }, []);

  return { mode, transcript, message, startListening, speak, resetVoice };
}
