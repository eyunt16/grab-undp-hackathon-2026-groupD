"use client";

import React, { useState, useEffect } from "react";
import { Bell, Shield, Phone, MapPin, User, Car, Calendar, CreditCard, Send, AlertTriangle, AlertCircle, RefreshCw, X } from "lucide-react";

interface GuardianDashboardProps {
  channel: BroadcastChannel | null;
}

interface NotificationItem {
  id: string;
  text: string;
  time: string;
  type: "info" | "success" | "warning";
}

export default function GuardianDashboard({ channel }: GuardianDashboardProps) {
  const [tripState, setTripState] = useState<"idle" | "booking" | "assigned" | "arrived" | "completed">("idle");
  const [tripDetails, setTripDetails] = useState({ destination: "", price: 0, provider: "" });
  const [driverDetails, setDriverDetails] = useState({ name: "", plate: "", eta: 0 });
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: "1", text: "Hệ thống bảo vệ GọiĐi hoạt động bình thường.", time: "10 phút trước", type: "info" },
    { id: "2", text: "Bà Nguyễn Thị Lan đã lưu điểm đến mới: Bệnh viện Chợ Rẫy.", time: "1 giờ trước", type: "info" },
    { id: "3", text: "Chuyến đi hôm qua: Về nhà lúc 14:30 (Bằng xe GSM - Hoàn thành an toàn).", time: "Hôm qua", type: "success" }
  ]);
  
  const [parentName] = useState("Bà Nguyễn Thị Lan (72 tuổi)");
  const [remoteDest, setRemoteDest] = useState("Bệnh viện Chợ Rẫy");
  const [remoteProvider, setRemoteProvider] = useState("Xanh SM");
  const [offRouteSim, setOffRouteSim] = useState(false);
  const [showSMSAlert, setShowSMSAlert] = useState(false);
  const [smsContent, setSMSContent] = useState("");

  // Sync state with parent's phone simulator via BroadcastChannel
  useEffect(() => {
    if (!channel) return;

    const handleMessage = (e: MessageEvent) => {
      const { type, payload } = e.data;
      const timeStr = "Vừa xong";

      if (type === "BOOKING_STARTED") {
        setTripState("booking");
        setTripDetails({
          destination: payload.destination,
          price: payload.price,
          provider: payload.provider
        });
        setOffRouteSim(false);

        // Add SMS simulation notification
        const sms = `[GọiĐi SMS] Mẹ của bạn (${parentName}) vừa gọi xe ${payload.provider} đi ${payload.destination}. Giá ước tính: ${payload.price.toLocaleString("vi-VN")}đ. Hệ thống đang tìm tài xế.`;
        setSMSContent(sms);
        setShowSMSAlert(true);

        setNotifications(prev => [
          {
            id: Date.now().toString(),
            text: `Bà Lan đang gọi xe giọng nói đi: ${payload.destination} (${payload.provider})`,
            time: timeStr,
            type: "info"
          },
          ...prev
        ]);
      } else if (type === "DRIVER_ASSIGNED") {
        setTripState("assigned");
        setDriverDetails({
          name: payload.driverName,
          plate: payload.plate,
          eta: payload.eta
        });

        const sms = `[GọiĐi SMS] Xe ${payload.provider} biển số ${payload.plate} (Tài xế: ${payload.driverName}) đã nhận chuyến đi của mẹ bạn (${parentName}). Xe đến đón sau ${payload.eta} phút.`;
        setSMSContent(sms);
        setShowSMSAlert(true);

        setNotifications(prev => [
          {
            id: Date.now().toString(),
            text: `Đã gán tài xế: ${payload.driverName} (${payload.plate}) - Đón sau ${payload.eta} phút`,
            time: timeStr,
            type: "success"
          },
          ...prev
        ]);
      } else if (type === "DRIVER_ARRIVED") {
        setTripState("arrived");

        const sms = `[GọiĐi SMS] Tài xế ${payload.provider} đã đến điểm đón và đang chờ mẹ bạn (${parentName}) lên xe.`;
        setSMSContent(sms);
        setShowSMSAlert(true);

        setNotifications(prev => [
          {
            id: Date.now().toString(),
            text: `Tài xế đã đến điểm đón bà Lan`,
            time: timeStr,
            type: "success"
          },
          ...prev
        ]);
      } else if (type === "TRIP_COMPLETED") {
        setTripState("idle");
        setOffRouteSim(false);
        
        setNotifications(prev => [
          {
            id: Date.now().toString(),
            text: `Chuyến đi hoàn thành an toàn. Cước phí tự động trừ qua ví người bảo hộ.`,
            time: timeStr,
            type: "success"
          },
          ...prev
        ]);
      }
    };

    channel.addEventListener("message", handleMessage);
    return () => channel.removeEventListener("message", handleMessage);
  }, [channel, parentName]);

  // Handle Remote Booking (Book on behalf)
  const triggerRemoteBooking = () => {
    if (!channel) return;
    
    const payload = {
      destination: remoteDest,
      provider: remoteProvider,
      price: remoteProvider === "Xanh SM" ? 42000 : 38000,
      eta: 4
    };

    channel.postMessage({
      type: "REMOTE_BOOKING",
      payload
    });

    setTripState("booking");
    setTripDetails({
      destination: remoteDest,
      price: payload.price,
      provider: remoteProvider
    });

    setNotifications(prev => [
      {
        id: Date.now().toString(),
        text: `Bạn đã chủ động ĐẶT XE HỘ cho bà Lan đi ${remoteDest}`,
        time: "Vừa xong",
        type: "info"
      },
      ...prev
    ]);
  };

  // Remote Cancel
  const triggerRemoteCancel = () => {
    if (!channel) return;
    channel.postMessage({ type: "CANCEL_TRIP" });
    setTripState("idle");
    setOffRouteSim(false);

    setNotifications(prev => [
      {
        id: Date.now().toString(),
        text: `Bạn đã chủ động HỦY CHUYẾN XE cho bà Lan`,
        time: "Vừa xong",
        type: "warning"
      },
      ...prev
    ]);
  };

  // Simulate SOS / Off-Route warning
  const toggleOffRoute = () => {
    if (tripState !== "assigned" && tripState !== "arrived") return;
    const nextVal = !offRouteSim;
    setOffRouteSim(nextVal);

    if (nextVal) {
      setNotifications(prev => [
        {
          id: Date.now().toString(),
          text: `CẢNH BÁO SOS: Xe đi chệch khỏi tuyến đường thông thường hơn 1km!`,
          time: "Vừa xong",
          type: "warning"
        },
        ...prev
      ]);
    }
  };

  return (
    <div className="flex flex-col w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl min-h-[620px]">
      
      {/* Dashboard Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-400" />
            Bảng theo dõi Người thân
          </h2>
          <p className="text-xs text-slate-400">Giám hộ & nhận cập nhật an toàn thời gian thực</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">Đang kết nối</span>
        </div>
      </div>

      {/* Profile and Wallet Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center font-bold text-emerald-400">
            NL
          </div>
          <div>
            <span className="text-[10px] text-slate-450 uppercase block font-semibold">Thành viên theo dõi</span>
            <span className="text-sm font-bold text-slate-100 block">{parentName}</span>
          </div>
        </div>

        <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="text-[10px] text-slate-450 uppercase block font-semibold">Tài khoản trả cước hộ</span>
              <span className="text-sm font-bold text-slate-100 block">Ví Momo · **** 6789</span>
            </div>
          </div>
          <span className="px-2.5 py-0.5 bg-slate-800 border border-slate-750 text-[10px] font-bold text-slate-300 rounded-md">
            Mặc định
          </span>
        </div>
      </div>

      {/* Simulated Live Route Map */}
      <div className="bg-slate-950 rounded-2xl border border-slate-850 p-4 mb-4 relative overflow-hidden flex-1 flex flex-col justify-center min-h-[160px]">
        {tripState === "idle" ? (
          <div className="text-center text-slate-500 text-xs py-10 flex flex-col items-center gap-2 select-none">
            <MapPin className="w-8 h-8 text-slate-700 animate-pulse" />
            <p>Bản đồ sẽ hoạt động khi bà Lan bắt đầu gọi xe</p>
          </div>
        ) : (
          <div className="relative w-full h-full flex-1 flex flex-col justify-between">
            {/* SVG Interactive Map Simulation */}
            <div className="flex justify-between items-center text-xs text-slate-400 px-2 font-semibold">
              <span>Đại lộ Võ Văn Kiệt (HCMC)</span>
              <span className="text-emerald-400 font-bold">
                {tripState === "booking" && "Đang tìm xe..."}
                {tripState === "assigned" && "Tài xế đang chạy đến..."}
                {tripState === "arrived" && "Đã đến nơi!"}
              </span>
            </div>

            <div className="relative h-20 my-auto flex items-center justify-center">
              {/* Road line */}
              <div className="absolute w-full h-1.5 bg-slate-800 rounded-full"></div>
              {/* Active path */}
              <div 
                className="absolute left-0 h-1.5 bg-emerald-500 rounded-full transition-all duration-[6000ms]"
                style={{
                  width: tripState === "booking" ? "10%" : tripState === "assigned" ? "65%" : "100%"
                }}
              ></div>

              {/* Start pin */}
              <div className="absolute left-[5%] flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-slate-300 border-2 border-slate-900 z-10 shadow-lg"></div>
                <span className="text-[9px] text-slate-500 mt-1 font-bold">Điểm đón</span>
              </div>

              {/* Target pin */}
              <div className="absolute right-[5%] flex flex-col items-center">
                <div className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-slate-900 z-10 shadow-lg animate-pulse"></div>
                <span className="text-[9px] text-slate-400 mt-1 font-bold truncate max-w-[120px]">{tripDetails.destination}</span>
              </div>

              {/* Moving Car Icon */}
              <div 
                className="absolute -translate-y-4 -translate-x-3 transition-all duration-[6000ms] flex flex-col items-center"
                style={{
                  left: tripState === "booking" ? "10%" : tripState === "assigned" ? "65%" : "100%"
                }}
              >
                <div className={`p-1.5 rounded-full shadow-xl border border-slate-800 ${offRouteSim ? "bg-red-650 animate-bounce" : "bg-emerald-600"}`}>
                  <Car className="w-4 h-4 text-white" />
                </div>
                <span className="text-[8px] bg-slate-900 px-1 border border-slate-850 rounded text-slate-300 mt-0.5 whitespace-nowrap">
                  {offRouteSim ? "Chệch hướng!" : `${driverDetails.plate || "Tìm xe..."}`}
                </span>
              </div>
            </div>

            {/* Warning Alarm banner */}
            {offRouteSim && (
              <div className="absolute inset-0 bg-red-950/90 border border-red-700/50 rounded-xl p-3 flex flex-col justify-center items-center text-center gap-2 animate-pulse">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <div>
                  <p className="text-red-400 font-bold text-sm">Cảnh báo SOS: Xe đi chệch lộ trình</p>
                  <p className="text-[10px] text-slate-350">Hệ thống phát hiện tài xế đang đi sai đường 1.2km về phía cầu Sài Gòn.</p>
                </div>
                <div className="flex gap-2 w-full max-w-[240px]">
                  <button className="flex-1 py-1.5 bg-red-600 text-white font-bold rounded-lg text-[10px]"><Phone className="w-3 h-3 inline mr-1" /> Gọi tài xế</button>
                  <button className="flex-1 py-1.5 bg-slate-800 text-slate-300 font-bold rounded-lg text-[10px]"><Phone className="w-3 h-3 inline mr-1" /> Gọi bà Lan</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Control panel & Remote Book Room */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        
        {/* Remote booking tool ( wow factor ) */}
        <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2.5">
              Đặt xe hộ từ xa
            </h4>
            <div className="flex flex-col gap-2">
              <div>
                <label className="text-[9px] text-slate-450 block font-semibold mb-1">Điểm đến cho cha mẹ</label>
                <select
                  value={remoteDest}
                  onChange={(e) => setRemoteDest(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 text-xs rounded-lg p-2 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="Bệnh viện Chợ Rẫy">Bệnh viện Chợ Rẫy (Q5)</option>
                  <option value="Chợ Bến Thành">Chợ Bến Thành (Q1)</option>
                  <option value="Chùa Vĩnh Nghiêm">Chùa Vĩnh Nghiêm (Q3)</option>
                  <option value="Siêu thị Co.opmart Cống Quỳnh">Siêu thị Co.opmart Cống Quỳnh</option>
                </select>
              </div>

              <div>
                <label className="text-[9px] text-slate-450 block font-semibold mb-1">Hãng xe muốn đặt</label>
                <select
                  value={remoteProvider}
                  onChange={(e) => setRemoteProvider(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-750 text-xs rounded-lg p-2 focus:outline-none focus:border-emerald-500 font-medium"
                >
                  <option value="Xanh SM">Xanh SM (Xe điện êm ái)</option>
                  <option value="GrabCar">GrabCar (Nhanh chóng)</option>
                  <option value="BeCar">BeCar (Tiết kiệm)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <button
              onClick={triggerRemoteBooking}
              disabled={tripState !== "idle"}
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 disabled:border-slate-750 border border-emerald-500/20 text-xs font-bold rounded-xl transition text-center"
            >
              Đặt xe hộ
            </button>
            {tripState !== "idle" && (
              <button
                onClick={triggerRemoteCancel}
                className="px-3.5 py-2 bg-red-950/30 hover:bg-red-950/50 border border-red-900/40 text-red-400 text-xs font-bold rounded-xl transition"
              >
                Hủy hộ
              </button>
            )}
          </div>
        </div>

        {/* Real-time Notifications */}
        <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Lịch sử thông báo an toàn
            </h4>
            <Bell className="w-3.5 h-3.5 text-slate-400" />
          </div>

          <div className="flex-1 overflow-y-auto max-h-[140px] pr-1 flex flex-col gap-2">
            {notifications.map((n) => (
              <div 
                key={n.id}
                className={`p-2 rounded-xl text-[11px] border leading-relaxed ${
                  n.type === "warning" 
                    ? "bg-red-950/20 border-red-900/40 text-red-300"
                    : n.type === "success"
                      ? "bg-emerald-950/20 border-emerald-900/40 text-emerald-300"
                      : "bg-slate-900 border-slate-800 text-slate-350"
                }`}
              >
                <div className="flex justify-between font-bold text-[9px] text-slate-500 mb-0.5">
                  <span>{n.type === "warning" ? "CẢNH BÁO" : n.type === "success" ? "TIN BÁO" : "HỆ THỐNG"}</span>
                  <span>{n.time}</span>
                </div>
                <p>{n.text}</p>
              </div>
            ))}
          </div>

          {/* Quick Simulation Options */}
          {tripState !== "idle" && (
            <button
              onClick={toggleOffRoute}
              className="mt-2.5 py-1.5 bg-slate-800 hover:bg-slate-750 text-[10px] text-slate-300 font-bold border border-slate-700 rounded-lg flex items-center justify-center gap-1.5 transition"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              Mô phỏng tài xế chệch đường đi
            </button>
          )}
        </div>

      </div>

      {/* Pop-up SMS Alert Notification Simulation */}
      {showSMSAlert && (
        <div className="mt-auto bg-slate-950/95 border-2 border-emerald-500/40 rounded-2xl p-4 shadow-xl relative animate-in fade-in slide-in-from-bottom duration-300">
          <button
            onClick={() => setShowSMSAlert(false)}
            className="absolute top-2.5 right-2.5 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-start gap-3">
            <div className="p-2 bg-emerald-600 rounded-full shrink-0">
              <Send className="w-4 h-4 text-white" />
            </div>
            <div>
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 mb-1">
                Tin nhắn SMS tự động gửi tới người thân (Hệ thống Twilio)
              </h5>
              <p className="text-xs text-slate-200 leading-relaxed font-mono italic">
                "{smsContent}"
              </p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
