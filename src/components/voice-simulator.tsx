"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Mic, Home, MapPin, Check, X, Volume2, Car, Heart, Plus, ShoppingBag, ArrowRight, Settings, Eye, EyeOff } from "lucide-react";

interface VoiceSimulatorProps {
  channel: BroadcastChannel | null;
}

export default function VoiceSimulator({ channel }: VoiceSimulatorProps) {
  const [step, setStep] = useState<number>(0); 
  // 0: Idle, 1: Greeting, 2: Listening, 3: Processing, 4: Confirming, 5: Matching, 6: Assigned, 7: Arrived
  const [destination, setDestination] = useState<string>("Bệnh viện Chợ Rẫy");
  const [transcribedText, setTranscribedText] = useState<string>("");
  const [price, setPrice] = useState<number>(35000);
  const [provider, setProvider] = useState<string>("Xanh SM");
  const [eta, setEta] = useState<number>(4);
  const [driver, setDriver] = useState({ name: "Nguyễn Văn Minh", plate: "51A-123.45", vehicle: "VF8 Xanh SM" });
  const [countdown, setCountdown] = useState<number>(3);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [useVoice, setUseVoice] = useState<boolean>(true);
  const [isRecognitionActive, setIsRecognitionActive] = useState<boolean>(false);
  
  // NLU & cloud AI state
  const [geminiApiKey, setGeminiApiKey] = useState<string>("");
  const [intent, setIntent] = useState<string>("BOOK_RIDE"); // BOOK_RIDE, ORDER_FOOD, BUY_ITEMS
  const [items, setItems] = useState<string>("");
  const [showConfig, setShowConfig] = useState<boolean>(false);
  const [isLoadingGemini, setIsLoadingGemini] = useState<boolean>(false);

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const handleSpeechInputRef = useRef<(text: string) => void>(() => {});

  // Helper function to speak (Vietnamese Speech Synthesis)
  const speak = (text: string) => {
    if (!useVoice) return;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "vi-VN";
      
      const voices = window.speechSynthesis.getVoices();
      const viVoice = voices.find(v => v.lang.includes("vi-VN") || v.lang.includes("vi"));
      if (viVoice) utterance.voice = viVoice;
      
      utterance.rate = 0.92; // Slightly slower for elderly
      window.speechSynthesis.speak(utterance);
    }
  };

  // Initialize Speech Recognition on client
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.lang = "vi-VN";
        rec.continuous = false;
        rec.interimResults = false;
        rec.maxAlternatives = 1;

        rec.onstart = () => {
          setIsRecognitionActive(true);
        };

        rec.onresult = (event: any) => {
          const resultText = event.results[0][0].transcript;
          handleSpeechInputRef.current(resultText);
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          if (event.error === "not-allowed") {
            setErrorMsg("Chưa cấp quyền mic. Hãy dùng phím giả lập bên dưới.");
          } else {
            setErrorMsg("Không nghe rõ. Vui lòng bấm và nói lại.");
          }
          setStep(0);
        };

        rec.onend = () => {
          setIsRecognitionActive(false);
        };

        recognitionRef.current = rec;
      }
    }

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [useVoice, geminiApiKey]);

  // Synchronize with external remote booking calls from the Guardian
  useEffect(() => {
    if (!channel) return;

    const handleMessage = (e: MessageEvent) => {
      const { type, payload } = e.data;
      if (type === "REMOTE_BOOKING") {
        setIntent("BOOK_RIDE");
        setItems("");
        setDestination(payload.destination);
        setPrice(payload.price || 42000);
        setProvider(payload.provider || "Xanh SM");
        setEta(payload.eta || 4);
        setStep(5); // Go straight to matching
        speak(`Có một chuyến xe ${payload.provider || "Xanh SM"} được đặt cho ông bà. Điểm đến là ${payload.destination}. Tài xế đang được tìm kiếm.`);
        
        setTimeout(() => {
          setStep(6);
          speak(`Đã tìm thấy tài xế ${payload.provider || "Xanh SM"} tên là Minh. Biển số xe 51A-123.45. Xe sẽ đến đón sau 4 phút.`);
          if (channel) {
            channel.postMessage({
              type: "DRIVER_ASSIGNED",
              payload: { driverName: "Nguyễn Văn Minh", plate: "51A-123.45", eta: 4, provider: payload.provider || "Xanh SM" }
            });
          }
        }, 4000);
      } else if (type === "CANCEL_TRIP") {
        setStep(0);
        speak("Chuyến đi đã được hủy bỏ.");
      }
    };

    channel.addEventListener("message", handleMessage);
    return () => channel.removeEventListener("message", handleMessage);
  }, [channel, useVoice]);

  // Parse Voice Inputs (Integrates custom Cloud Gemini LLM API with Local Fallback)
  const handleSpeechInput = async (text: string) => {
    setTranscribedText(text);
    setStep(3); // Processing
    setIsLoadingGemini(true);

    try {
      const response = await fetch("/api/parse-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: text, customApiKey: geminiApiKey })
      });

      if (response.ok) {
        const data = await response.json();
        setIsLoadingGemini(false);

        // Feed extracted variables
        const parsedIntent = data.intent || "BOOK_RIDE";
        setIntent(parsedIntent);
        setDestination(data.destination || "Bệnh viện Chợ Rẫy");
        setItems(data.items || "");
        
        const randomPrice = parsedIntent === "BOOK_RIDE" 
          ? Math.floor(Math.random() * 3 + 3) * 10000 + 5000 
          : Math.floor(Math.random() * 3 + 2) * 10000 + 15000; // Food: 35k-55k

        setPrice(randomPrice);
        setProvider(Math.random() > 0.5 ? "Xanh SM" : "Grab");
        setEta(Math.floor(Math.random() * 5) + 3);
        setStep(4); // Confirmation state
        speak(data.vietnamesePrompt || `Đang xử lý yêu cầu đặt dịch vụ của ông bà.`);
        return;
      } else {
        const errData = await response.json();
        console.warn("Gemini API call failed, falling back to local regex NLU:", errData.error);
      }
    } catch (err) {
      console.warn("Gemini Server Route failed, falling back to local regex NLU:", err);
    }

    setIsLoadingGemini(false);
    
    // ==========================================
    // LOCAL REGEX FALLBACK PARSER (Offline / No API Key)
    // ==========================================
    const lowercaseText = text.toLowerCase();
    setTimeout(() => {
      let dest = "";
      let parsedIntent = "BOOK_RIDE";
      let parsedItems = "";
      let promptText = "";

      if (lowercaseText.includes("cơm") || lowercaseText.includes("phở") || lowercaseText.includes("ăn") || lowercaseText.includes("bánh")) {
        parsedIntent = "ORDER_FOOD";
        parsedItems = lowercaseText.includes("cơm") ? "Cơm tấm sườn chả" : lowercaseText.includes("phở") ? "Tô Phở bò tái" : "Món ăn ngon";
        dest = "Bệnh viện Chợ Rẫy (Điểm nhận)";
        promptText = `Dạ, đặt mua ${parsedItems} giao tới ${dest} đúng không ạ?`;
      } else if (lowercaseText.includes("sữa") || lowercaseText.includes("mua") || lowercaseText.includes("đồ")) {
        parsedIntent = "BUY_ITEMS";
        parsedItems = lowercaseText.includes("sữa") ? "Lốc sữa TH True Milk" : "Nước ngọt & trái cây";
        dest = "Nhà (123 Lê Lợi, Q1)";
        promptText = `Dạ, đặt mua hộ ${parsedItems} mang về ${dest} đúng không ạ?`;
      } else {
        if (lowercaseText.includes("chợ rẫy") || lowercaseText.includes("bệnh viện")) {
          dest = "Bệnh viện Chợ Rẫy";
        } else if (lowercaseText.includes("nhà") || lowercaseText.includes("về nhà")) {
          dest = "Nhà (123 Lê Lợi, Q1)";
        } else if (lowercaseText.includes("chợ") || lowercaseText.includes("bến thành")) {
          dest = "Chợ Bến Thành";
        } else {
          dest = text;
        }
        promptText = `Đặt xe đi ${dest}. Giá khoảng 35.000 đồng. Đúng không ạ?`;
      }

      setIntent(parsedIntent);
      setDestination(dest);
      setItems(parsedItems);
      const randomPrice = parsedIntent === "BOOK_RIDE" ? 35000 : 45000;
      setPrice(randomPrice);
      setProvider("Xanh SM");
      setEta(4);
      setStep(4);
      speak(promptText);
    }, 1500);
  };

  // Start Voice Booking Sequence
  const startVoiceBooking = () => {
    setErrorMsg("");
    setStep(1); // Greeting
    speak("EasyMove xin nghe! Ông bà muốn đi đâu hoặc muốn mua gì ạ?");
    
    setTimeout(() => {
      setStep(2); // Listening
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.error("Failed to start speech recognition", e);
        }
      } else {
        setErrorMsg("Thiết bị không hỗ trợ micro. Hãy bấm chọn các gợi ý bên dưới.");
      }
    }, 2800);
  };

  // Simulate speaking specific phrase via clicking buttons
  const simulateCommand = (cmd: string) => {
    setErrorMsg("");
    setTranscribedText(cmd);
    setStep(1);
    speak(`Khởi động lệnh: ${cmd}`);
    setTimeout(() => {
      handleSpeechInput(cmd);
    }, 1200);
  };

  // Confirm booking
  const confirmBooking = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setStep(5); // Matching
    
    const actionText = intent === "BOOK_RIDE" 
      ? "Đang tìm xe..." 
      : intent === "ORDER_FOOD" 
        ? "Đang đặt món ăn..." 
        : "Đang liên hệ shipper...";
        
    speak(actionText + " Vui lòng đợi trong giây lát.");
    
    if (channel) {
      channel.postMessage({
        type: "BOOKING_STARTED",
        payload: { destination, price, provider: intent === "BOOK_RIDE" ? provider : "EasyMove Shipper" }
      });
    }

    // Simulate driver matching after 4.5s
    setTimeout(() => {
      setStep(6); // Assigned
      const matchSpeakText = intent === "BOOK_RIDE"
        ? `Đã tìm thấy tài xế xe ${provider}. Tài xế Nguyễn Văn Minh, biển số 51A-123.45. Tài xế sẽ đến trong 4 phút nữa.`
        : `Đã tìm thấy shipper. Shipper Nguyễn Văn Minh lái xe máy đang đi mua ${items || "đồ"} cho ông bà. Sẽ giao đến trong 10 phút.`;
        
      speak(matchSpeakText);
      
      if (channel) {
        channel.postMessage({
          type: "DRIVER_ASSIGNED",
          payload: { 
            driverName: "Nguyễn Văn Minh", 
            plate: "51A-123.45", 
            eta: intent === "BOOK_RIDE" ? 4 : 10, 
            provider: intent === "BOOK_RIDE" ? provider : "EasyMove Shipper" 
          }
        });
      }

      // Simulate arrival after 8s
      setTimeout(() => {
        setStep(7); // Arrived
        const arrivedSpeakText = intent === "BOOK_RIDE"
          ? `Tài xế đã tới điểm đón! Xe màu xanh lá biển số 51A-123.45 đang đợi ông bà ở trước cửa.`
          : `Shipper đã mua hàng xong và đang đứng trước cửa nhà! Ông bà ra lấy ${items || "đồ"} nhé.`;
          
        speak(arrivedSpeakText);
        
        if (channel) {
          channel.postMessage({
            type: "DRIVER_ARRIVED",
            payload: { driverName: "Nguyễn Văn Minh", plate: "51A-123.45", provider }
          });
        }
      }, 8000);

    }, 4500);
  };

  // Keep handleSpeechInputRef in sync with latest handleSpeechInput
  useEffect(() => {
    handleSpeechInputRef.current = handleSpeechInput;
  });

  // Auto confirmation timer
  useEffect(() => {
    if (step === 4) {
      setCountdown(8);
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            confirmBooking();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
      }
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [step, destination, price, provider, intent, items]);

  const cancelBooking = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setStep(0);
    speak("Đã hủy bỏ dịch vụ.");
    if (channel) {
      channel.postMessage({ type: "TRIP_COMPLETED" });
    }
  };

  return (
    <div className="flex flex-col items-center p-6 w-full max-w-[360px] mx-auto bg-[#0d1225] text-white rounded-[40px] border-[6px] border-[#161d35] shadow-2xl shadow-black/40 relative overflow-hidden min-h-[635px]" role="region" aria-label="Mô phỏng điện thoại người già">
      
      {/* Phone status bar */}
      <div className="w-full flex justify-between px-6 py-2 text-xs text-slate-500 font-medium select-none mb-3">
        <span>9:41</span>
        <div className="flex items-center gap-1.5 font-semibold text-teal-400/70">
          <div className="w-3.5 h-2 bg-teal-500/40 rounded-sm"></div>
          <span>EasyMove</span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 w-full flex flex-col justify-between items-center py-2">
        
        {/* Step 0: Welcome Screen */}
        {step === 0 && (
          <div className="flex-1 w-full flex flex-col justify-between items-center text-center">
            <div className="mt-1">
              <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-teal-400 to-cyan-300 bg-clip-text text-transparent mb-1">EasyMove</h2>
              <p className="text-slate-400 text-[13px] leading-relaxed px-1">Ông bà chỉ cần nhấn nút rồi <strong className="text-slate-200">nói tự do</strong> những gì mình muốn để đặt xe/đặt đồ ăn.</p>
            </div>

            {/* Micro button */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="absolute w-40 h-40 bg-teal-500/10 rounded-full animate-ping pointer-events-none"></div>
              <div className="absolute w-32 h-32 bg-teal-500/15 rounded-full animate-pulse pointer-events-none"></div>
              <button
                onClick={startVoiceBooking}
                aria-label="Bấm để gọi xe bằng giọng nói"
                className="relative z-10 w-26 h-26 bg-teal-500 hover:bg-teal-400 active:scale-95 transition-all text-white rounded-full flex flex-col items-center justify-center shadow-lg shadow-teal-500/25 border-4 border-[#0d1225] group"
              >
                <Mic className="w-10 h-10 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold mt-1 text-teal-100">Bấm để nói</span>
              </button>
            </div>

            {/* Quick Suggestions & Scalability Triggers */}
            <div className="w-full flex flex-col gap-2 mt-1.5">
              
              <div className="flex justify-between items-center text-left text-xs font-semibold text-slate-400 px-1">
                <span>Chọn nhanh để nói (Mô phỏng):</span>
              </div>
              
              {/* Ride hailing suggestions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => simulateCommand("Đưa tôi đi Bệnh viện Chợ Rẫy")}
                  className="flex items-center gap-2 p-2 bg-slate-800 hover:bg-slate-700/80 rounded-xl transition text-left border border-slate-750"
                >
                  <Heart className="w-4 h-4 text-red-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-200 text-[11px]">Đi Chợ Rẫy</p>
                    <p className="text-[9px] text-slate-400 truncate">Gọi xe taxi</p>
                  </div>
                </button>
                <button
                  onClick={() => simulateCommand("Tôi muốn đi về nhà")}
                  className="flex items-center gap-2 p-2 bg-slate-800 hover:bg-slate-700/80 rounded-xl transition text-left border border-slate-750"
                >
                  <Home className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-200 text-[11px]">Về nhà</p>
                    <p className="text-[9px] text-slate-400 truncate">123 Lê Lợi, Q1</p>
                  </div>
                </button>
              </div>

              {/* Scalable Features Suggestions (Food & Items) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => simulateCommand("Mua giùm tôi một hộp cơm tấm sườn chả")}
                  className="flex items-center gap-2 p-2 bg-slate-850 hover:bg-slate-805 rounded-xl transition text-left border border-slate-800"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-500 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-200 text-[11px]">Đặt Cơm tấm</p>
                    <p className="text-[9px] text-slate-400 truncate">Mua đồ ăn hộ</p>
                  </div>
                </button>
                <button
                  onClick={() => simulateCommand("Mua lốc sữa TH True Milk mang về nhà")}
                  className="flex items-center gap-2 p-2 bg-slate-850 hover:bg-slate-805 rounded-xl transition text-left border border-slate-800"
                >
                  <ShoppingBag className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-200 text-[11px]">Mua sữa tươi</p>
                    <p className="text-[9px] text-slate-400 truncate">Đặt hàng hộ</p>
                  </div>
                </button>
              </div>

            </div>
          </div>
        )}

        {/* Step 1: Greeting */}
        {step === 1 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-5">
            <div className="w-18 h-18 bg-emerald-600/20 rounded-full flex items-center justify-center border border-emerald-500/30">
              <Volume2 className="w-8 h-8 text-emerald-400 animate-bounce" />
            </div>
            <div>
              <p className="text-teal-400 font-semibold mb-1.5 text-xs">EasyMove đang lắng nghe</p>
              <h3 className="text-2xl font-bold px-2 leading-snug">"Chào ông bà, ông bà muốn đi đâu hoặc cần mua gì ạ?"</h3>
            </div>
          </div>
        )}

        {/* Step 2: Listening */}
        {step === 2 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-5 w-full">
            <div className="relative">
              <div className="w-20 h-20 bg-red-650 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-xl z-10 relative">
                <Mic className="w-10 h-10 text-white animate-pulse" />
              </div>
              <div className="absolute top-0 left-0 w-20 h-20 bg-red-500/20 rounded-full scale-150 animate-ping pointer-events-none"></div>
            </div>
            
            <div>
              <p className="text-red-400 font-bold uppercase tracking-wider text-xs mb-1 animate-pulse">Đang nghe giọng nói...</p>
              <p className="text-slate-450 text-[11px]">Vui lòng nói điểm đi hoặc món hàng cần mua</p>
            </div>

            {/* Speech Waveform Simulation */}
            <div className="flex gap-1 items-center justify-center h-8 my-1">
              {[18, 26, 12, 24, 14, 22].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-red-500 rounded-full animate-pulse"
                  style={{
                    height: `${h}px`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${0.4 + i * 0.08}s`
                  }}
                ></div>
              ))}
            </div>

            {/* Fallback Selector buttons */}
            <div className="w-full bg-slate-800/80 p-3 rounded-xl border border-slate-750 text-xs mt-1">
              <p className="font-semibold text-slate-350 mb-2 text-center text-[10px] uppercase">Bấm nút để mô phỏng nói Tiếng Việt:</p>
              <div className="flex flex-col gap-1.5">
                <button onClick={() => simulateCommand("Đi Bệnh viện Chợ Rẫy")} className="py-2 bg-slate-700 hover:bg-slate-650 rounded-lg font-bold text-slate-100 text-[11px]">"Đi Bệnh viện Chợ Rẫy"</button>
                <button onClick={() => simulateCommand("Mua một tô phở bò tái")} className="py-2 bg-slate-700 hover:bg-slate-650 rounded-lg font-bold text-slate-100 text-[11px]">"Mua một tô phở bò tái"</button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Processing (Cloud AI NLU Loading) */}
        {step === 3 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
            <div className="w-14 h-14 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <p className="text-slate-400 text-xs mb-2">
                {isLoadingGemini ? "Gemini AI đang phân tích ngữ nghĩa..." : "EasyMove đang giải mã câu nói..."}
              </p>
              {transcribedText && (
                <p className="text-emerald-400 font-bold italic text-lg">"{transcribedText}"</p>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Confirming */}
        {step === 4 && (
          <div className="flex-1 w-full flex flex-col justify-between items-center text-center">
            <div>
              <p className="text-slate-450 text-[10px] font-bold uppercase tracking-wider mb-2.5">
                {intent === "BOOK_RIDE" ? "ĐANG CHUẨN BỊ ĐẶT XE" : "ĐANG CHUẨN BỊ MUA HỘ"}
              </p>
              <h3 className="text-2xl font-black text-emerald-400 leading-tight mb-3">
                {intent === "BOOK_RIDE" ? destination : items}
              </h3>
            </div>

            {/* Price and Provider Box */}
            <div className="w-full bg-slate-800 rounded-2xl p-4 border border-slate-750 flex flex-col gap-2.5 my-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-450 font-semibold">{intent === "BOOK_RIDE" ? "Giá cước dự tính" : "Giá hàng & phí ship"}</span>
                <span className="text-xl font-bold text-white">{(price).toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="h-px bg-slate-700"></div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-450 font-semibold">{intent === "BOOK_RIDE" ? "Hãng xe đón" : "Dịch vụ"}</span>
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 font-bold rounded-lg border border-emerald-500/20">
                  {intent === "BOOK_RIDE" ? provider : "EasyMove Ship"}
                </span>
              </div>
              {intent !== "BOOK_RIDE" && (
                <>
                  <div className="h-px bg-slate-700"></div>
                  <div className="flex justify-between items-center text-xs text-left">
                    <span className="text-slate-455 font-semibold">Giao tới</span>
                    <span className="text-slate-200 font-bold text-right truncate max-w-[150px]">{destination}</span>
                  </div>
                </>
              )}
            </div>

            {/* Speak TTS Box visualization */}
            <div className="w-full bg-emerald-950/40 border border-emerald-800/30 p-2.5 rounded-xl flex items-start gap-2.5 my-2 text-left">
              <Volume2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {intent === "BOOK_RIDE" 
                  ? `"Đặt xe đi ${destination}, hãng ${provider}, giá khoảng ${price.toLocaleString("vi-VN")}đ. Không nói gì xe sẽ tự đặt sau 3 giây nữa."`
                  : `"Dạ, đặt mua ${items} mang tới ${destination} giá cước ${price.toLocaleString("vi-VN")}đ. Đúng không ạ?"`
                }
              </p>
            </div>

            {/* Countdown / Confirmation choices */}
            <div className="w-full flex flex-col gap-2.5">
              <button
                onClick={confirmBooking}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 font-bold text-base rounded-xl flex items-center justify-center gap-2 shadow-lg border border-emerald-500/30 transition active:scale-98"
              >
                <Check className="w-5 h-5" />
                Đúng vậy (Tự đặt sau {countdown}s)
              </button>
              
              <div className="flex gap-2">
                <button
                  onClick={confirmBooking}
                  className="flex-1 py-2 bg-slate-850 hover:bg-slate-800 text-xs font-semibold rounded-lg border border-slate-700 transition text-slate-200"
                >
                  Bấm để đặt ngay
                </button>
                <button
                  onClick={cancelBooking}
                  className="flex-1 py-2 bg-red-950/30 hover:bg-red-950/50 text-red-400 text-xs font-semibold rounded-lg border border-red-900/40 transition"
                >
                  <X className="w-3.5 h-3.5 inline mr-1" />
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Matching */}
        {step === 5 && (
          <div className="flex-1 w-full flex flex-col justify-between items-center text-center">
            <div>
              <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 font-semibold border border-yellow-500/20 rounded-full text-xs animate-pulse">
                {intent === "BOOK_RIDE" ? "Đang tìm tài xế..." : "Đang tìm shipper..."}
              </span>
              <h3 className="text-xl font-bold mt-4">
                {intent === "BOOK_RIDE" ? "Tìm kiếm tài xế giá tốt nhất" : `Đang kết nối shipper gần ${destination}`}
              </h3>
            </div>

            {/* Multi provider aggregation visualizer */}
            <div className="w-full flex flex-col gap-2 my-4">
              {intent === "BOOK_RIDE" ? (
                <>
                  <div className="flex justify-between items-center p-3 bg-slate-800/40 rounded-xl border border-slate-750 text-slate-400 text-xs">
                    <span>GrabCar (3.2km)</span>
                    <span>46.000đ - Đang hỏi...</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-emerald-950/20 rounded-xl border border-emerald-800/30 text-emerald-400 text-xs font-semibold animate-pulse">
                    <span>{provider} (Xe gần nhất)</span>
                    <span>{price.toLocaleString("vi-VN")}đ - Có tài xế!</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-800/40 rounded-xl border border-slate-750 text-slate-400 text-xs">
                    <span>BeCar (4.0km)</span>
                    <span>39.000đ - Hủy phản hồi</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex justify-between items-center p-3 bg-emerald-950/20 rounded-xl border border-emerald-800/30 text-emerald-400 text-xs font-semibold animate-pulse">
                    <span>EasyMove Shipper (1.2km)</span>
                    <span>{price.toLocaleString("vi-VN")}đ - Nhận đơn!</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-slate-800/40 rounded-xl border border-slate-750 text-slate-400 text-xs">
                    <span>GrabFood Shipper</span>
                    <span>52.000đ - Không kết nối</span>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={cancelBooking}
              className="w-full py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-350 font-bold rounded-xl border border-slate-700 transition"
            >
              Hủy bỏ đặt dịch vụ
            </button>
          </div>
        )}

        {/* Step 6: Assigned */}
        {step === 6 && (
          <div className="flex-1 w-full flex flex-col justify-between items-center">
            <div className="text-center w-full">
              <span className="px-3 py-1 bg-emerald-500/15 text-emerald-400 font-semibold border border-emerald-500/20 rounded-full text-xs">
                {intent === "BOOK_RIDE" ? "Xe đang đến đón" : "Shipper đang đi mua hàng"}
              </span>
              <h3 className="text-sm text-slate-450 font-medium mt-3">
                {intent === "BOOK_RIDE" ? "Thời gian xe đến" : "Thời gian nhận món"}
              </h3>
              <p className="text-4xl font-extrabold text-white mt-1">~{eta} phút</p>
            </div>

            {/* Driver details card */}
            <div className="w-full bg-slate-850 rounded-2xl p-4 border border-slate-750 my-2 flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 bg-emerald-700 rounded-full flex items-center justify-center font-bold text-white text-base">
                  Minh
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-100 text-sm">{driver.name}</h4>
                  <p className="text-[11px] text-slate-400">
                    {intent === "BOOK_RIDE" ? `${driver.vehicle} · ⭐ 4.9` : "Tài xế giao hàng · ⭐ 4.9"}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-2">
                <div className="flex-1 bg-slate-800/60 p-2 rounded-xl border border-slate-750 text-center">
                  <span className="text-[9px] text-slate-500 uppercase block font-bold">Biển số xe</span>
                  <span className="text-sm font-bold text-emerald-400 tracking-wider block mt-0.5">{driver.plate}</span>
                </div>
                <div className="flex-1 bg-slate-800/60 p-2 rounded-xl border border-slate-750 text-center flex flex-col justify-center items-center">
                  <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider block">Người thân</span>
                  <span className="text-[10px] text-slate-350 mt-0.5">Đã báo SMS</span>
                </div>
              </div>
            </div>

            <div className="w-full bg-emerald-950/40 border border-emerald-800/30 p-2.5 rounded-xl flex items-start gap-2 text-left mb-3">
              <Volume2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {intent === "BOOK_RIDE"
                  ? `"Tài xế Nguyễn Văn Minh đi xe ${provider} biển số ${driver.plate} đang tới đón. Khoảng 4 phút nữa xe đến."`
                  : `"Shipper Minh đang đi lấy món ${items} để giao tới ${destination} cho ông bà. Khoảng 10 phút nữa giao tới ạ."`
                }
              </p>
            </div>

            <button
              onClick={cancelBooking}
              className="w-full py-3 bg-red-950/30 hover:bg-red-950/50 text-red-400 text-xs font-bold rounded-xl border border-red-900/40 transition"
            >
              Hủy bỏ dịch vụ
            </button>
          </div>
        )}

        {/* Step 7: Arrived */}
        {step === 7 && (
          <div className="flex-1 w-full flex flex-col justify-between items-center text-center">
            <div className="my-auto flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center border-4 border-slate-900 shadow-2xl relative">
                <Car className="w-10 h-10 text-white" />
                <div className="absolute top-0 left-0 w-20 h-20 bg-emerald-500/20 rounded-full scale-125 animate-ping pointer-events-none"></div>
              </div>
              <div>
                <h3 className="text-2xl font-black text-emerald-400 mb-1">
                  {intent === "BOOK_RIDE" ? "Tài xế đã đến!" : "Hàng đã giao tới!"}
                </h3>
                <p className="text-slate-300 px-4 text-xs leading-relaxed">
                  {intent === "BOOK_RIDE" 
                    ? `Tài xế Nguyễn Văn Minh đã đến điểm hẹn trên xe ${driver.vehicle} (${driver.plate})`
                    : `Shipper Nguyễn Văn Minh đã mang ${items} đến trước cửa nhà ${destination}!`
                  }
                </p>
              </div>

              <div className="w-full bg-emerald-950/40 border border-emerald-800/30 p-3 rounded-xl flex items-start gap-2 text-left text-xs font-semibold text-slate-300">
                <Volume2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>
                  {intent === "BOOK_RIDE"
                    ? `"Tài xế đã đến. Xe màu xanh biển số 51A-123.45 đang chờ trước cửa ạ."`
                    : `"Shipper đã mua đồ xong và đang ở trước cửa nhà ông bà ạ!"`
                  }
                </span>
              </div>
            </div>

            <button
              onClick={() => {
                setStep(0);
                if (channel) channel.postMessage({ type: "TRIP_COMPLETED" });
              }}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 font-bold rounded-xl shadow-lg transition text-sm"
            >
              Tôi đã nhận hàng / Lên xe (Xong)
            </button>
          </div>
        )}

      </div>

      {/* Error message toast */}
      {errorMsg && (
        <div className="absolute bottom-6 left-6 right-6 p-3 bg-red-650 border border-red-500 text-white rounded-xl text-center text-xs font-bold shadow-lg animate-bounce z-50">
          {errorMsg}
        </div>
      )}

      {/* Mode settings & Settings Toggle */}
      <div className="w-full border-t border-slate-800 pt-3 flex flex-col gap-2 px-1">
        <div className="flex justify-between items-center text-[10px] text-slate-500 select-none">
          <label className="flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={useVoice}
              onChange={(e) => setUseVoice(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-emerald-600 w-3 h-3"
            />
            <span>Đọc to phát âm (TTS)</span>
          </label>
          <button 
            onClick={() => setShowConfig(!showConfig)}
            className="flex items-center gap-1 text-slate-400 hover:text-emerald-400 font-bold transition-all focus:outline-none"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Cấu hình AI</span>
          </button>
        </div>

        {/* Gemini API Key input block */}
        {showConfig && (
          <div className="w-full bg-slate-850 p-3 rounded-xl border border-slate-750 text-xs flex flex-col gap-2 animate-in fade-in duration-200 text-left">
            <div className="flex justify-between items-center">
              <p className="font-bold text-slate-300 text-[10px] uppercase tracking-wider">Đồng bộ Gemini Cloud</p>
              <span className="text-[9px] px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-emerald-400 rounded">Active</span>
            </div>
            <p className="text-slate-400 text-[9.5px] leading-relaxed">
              Dùng Gemini AI để giải nghĩa tiếng nói Tiếng Việt tự do (VD: đặt cơm tấm, mua lốc sữa, đi bệnh viện,...). Dán API key của bạn để kích hoạt xử lý đám mây:
            </p>
            <div className="relative">
              <input
                type="password"
                placeholder="Dán Gemini API Key của bạn..."
                value={geminiApiKey}
                onChange={(e) => setGeminiApiKey(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 pr-8 text-[11px] text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <p className="text-[8.5px] text-slate-500 italic">
              * Nếu không nhập key, hệ thống sẽ sử dụng **NLU cục bộ dự phòng** để nhận diện từ khóa cơ bản.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
