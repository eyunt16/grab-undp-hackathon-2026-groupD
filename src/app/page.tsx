"use client";

import React, { useState, useEffect } from "react";
import VoiceSimulator from "@/components/voice-simulator";
import GuardianDashboard from "@/components/guardian-dashboard";
import BudgetCalculator from "@/components/budget-calculator";
import { Mic, Shield, Phone, Sparkles, HelpCircle, FileText, ArrowRight, Share2, Layers } from "lucide-react";

export default function Home() {
  const [channel, setChannel] = useState<BroadcastChannel | null>(null);
  const [activeTab, setActiveTab] = useState<"demo" | "business">("demo");

  // Create BroadcastChannel for cross-tab or side-by-side communication on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const chan = new BroadcastChannel("goidi-sync");
      setChannel(chan);
      return () => {
        chan.close();
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-400">
      
      {/* Premium Header Banner */}
      <header className="relative overflow-hidden border-b border-slate-900 bg-slate-900/40 backdrop-blur-md px-6 py-5">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-60 h-60 bg-blue-500/5 rounded-full blur-[80px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded border border-emerald-500/20">
                UNDP Hackathon 2026
              </span>
              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-bold rounded border border-blue-500/20">
                Group D
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-emerald-400 bg-clip-text text-transparent flex items-center gap-2.5">
              GọiĐi — Giải Pháp Di Chuyển Cho Người Cao Tuổi
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              Trợ lý giọng nói Tiếng Việt (Voice AI) kết nối đa nhà xe & người bảo hộ cho người mù công nghệ.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("demo")}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                activeTab === "demo"
                  ? "bg-emerald-600 border-emerald-500/30 text-white shadow-lg"
                  : "bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
              Mô Phỏng Trải Nghiệm
            </button>
            <button
              onClick={() => setActiveTab("business")}
              className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
                activeTab === "business"
                  ? "bg-emerald-600 border-emerald-500/30 text-white shadow-lg"
                  : "bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-300"
              }`}
            >
              <Layers className="w-3.5 h-3.5 inline mr-1.5" />
              Bài Toán Kinh Doanh
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {/* Tab 1: Experience Simulator Demo */}
        {activeTab === "demo" && (
          <div className="flex flex-col gap-6">
            
            {/* Guide box */}
            <div className="bg-slate-900/60 border border-slate-850 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400 shrink-0 mt-0.5">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-200">Hướng dẫn Trình diễn / Mentor đánh giá:</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Bạn có thể trải nghiệm **side-by-side** ngay dưới đây, hoặc **mở 2 tab trình duyệt riêng biệt** với cùng link này. 
                    Khi bấm nút microphone Tiếng Việt ở Simulator điện thoại, thông tin định vị hành trình sẽ lập tức được đẩy sang Dashboard người thân theo thời gian thực nhờ trình duyệt Local BroadcastChannel.
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.open(window.location.href, "_blank");
                  }
                }}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-bold rounded-lg border border-slate-700 shrink-0 flex items-center gap-1.5 self-end md:self-auto transition"
              >
                <Share2 className="w-3.5 h-3.5" />
                Mở thêm 1 tab nữa
              </button>
            </div>

            {/* Simulated workspaces */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Voice simulator (Senior UI) */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <div className="flex justify-between items-center px-2">
                  <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">A. Điện thoại Người già (Simulator)</span>
                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">Voice UI</span>
                </div>
                <VoiceSimulator channel={channel} />
              </div>

              {/* Guardian Tracking dashboard */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                <div className="flex justify-between items-center px-2">
                  <span className="text-xs font-bold text-slate-450 uppercase tracking-wider">B. Bảng theo dõi của Người thân</span>
                  <span className="text-[10px] text-blue-400 font-semibold bg-blue-500/5 px-2 py-0.5 rounded border border-blue-500/10">Guardian Center</span>
                </div>
                <GuardianDashboard channel={channel} />
              </div>

            </div>

            {/* Quick explanation of Social Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl">
                <h4 className="font-bold text-xs text-emerald-400 uppercase mb-1">Giao diện Siêu Tinh Gọn</h4>
                <p className="text-xs text-slate-400 leading-normal">
                  Chỉ gồm 1 nút lớn, giao tiếp 100% bằng âm thanh. Người già mù công nghệ không cần chạm màn hình, không cần chọn điểm xuất phát/đích hay bản đồ rối rắm.
                </p>
              </div>
              <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl">
                <h4 className="font-bold text-xs text-blue-400 uppercase mb-1">Khóa An Toàn Gia Đình</h4>
                <p className="text-xs text-slate-400 leading-normal">
                  Người thân nhận tin nhắn SMS/Zalo lập tức, thanh toán cước hộ qua tài khoản liên kết, phát hiện chệch đường đi để phòng tránh lừa đảo hoặc đi lạc đường.
                </p>
              </div>
              <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-xl">
                <h4 className="font-bold text-xs text-amber-400 uppercase mb-1">Không Bị Khóa Nhà Cung Cấp</h4>
                <p className="text-xs text-slate-400 leading-normal">
                  GọiĐi tổng hợp cước từ Grab, Be, Xanh SM và Taxi truyền thống để tìm xe nhanh nhất và rẻ nhất, giải quyết vấn đề xã hội thay vì tăng doanh số riêng cho một hãng.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Financial Sizing & Business Model Tab */}
        {activeTab === "business" && (
          <div className="animate-in fade-in duration-200">
            <div className="mb-4 bg-slate-900/40 border border-slate-850 p-4 rounded-xl text-xs leading-relaxed text-slate-350">
              📌 <strong>Giải thích mô hình tạo doanh thu:</strong> Đối với 4 triệu người lớn tuổi cô đơn, bản thân họ có thể có thu nhập thấp hoặc không dùng thẻ ngân hàng. Do đó, GọiĐi hướng tới đối tượng **trực tiếp trả tiền là con cái/người bảo hộ** thông qua việc mua gói đăng ký **"An tâm cho cha mẹ" (49k/tháng)**. 
              Ngoài ra, nền tảng thu thêm **phí tiện ích 3.000đ/chuyến** từ việc tích hợp API đa nhà xe, đảm bảo bù đắp chi phí API nhận dạng giọng nói & SMS tự động.
            </div>
            <BudgetCalculator />
          </div>
        )}

      </main>

      {/* Social-impact styled Footer */}
      <footer className="border-t border-slate-900 py-6 px-6 bg-slate-950 text-slate-500 text-xs text-center flex flex-col sm:flex-row justify-between items-center gap-3 max-w-7xl w-full mx-auto">
        <p>© 2026 GọiĐi. Phát triển tại Grab-UNDP Hackathon 2026.</p>
        <p className="flex items-center gap-1.5">
          <span>Công nghệ: Next.js + Tailwind + Web Speech API + BroadcastChannel</span>
        </p>
      </footer>
      
    </div>
  );
}
