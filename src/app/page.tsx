"use client";

import React, { useState, useEffect } from "react";
import VoiceSimulator from "@/components/voice-simulator";
import GuardianDashboard from "@/components/guardian-dashboard";
import BudgetCalculator from "@/components/budget-calculator";
import { Sparkles, HelpCircle, Share2, Layers, ChevronRight, Mic, Shield, ShoppingBag } from "lucide-react";

export default function Home() {
  const [channel, setChannel] = useState<BroadcastChannel | null>(null);
  const [activeTab, setActiveTab] = useState<"demo" | "business">("demo");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const chan = new BroadcastChannel("easymove-sync");
      setChannel(chan);
      return () => {
        chan.close();
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-300">
      
      {/* Header */}
      <header className="relative overflow-hidden border-b border-white/[0.06] bg-[#0d1225]/80 backdrop-blur-xl px-6 py-5">
        {/* Ambient gradients */}
        <div className="absolute -top-20 right-10 w-[400px] h-[400px] bg-teal-500/[0.04] rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute -bottom-10 left-20 w-[300px] h-[300px] bg-indigo-500/[0.04] rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 bg-teal-500/10 text-teal-400 text-[10px] font-semibold rounded-full border border-teal-500/20 tracking-wide">
                UNDP HACKATHON 2026
              </span>
              <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-semibold rounded-full border border-indigo-500/20 tracking-wide">
                GROUP D
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight flex items-center gap-3">
              <span className="bg-gradient-to-r from-teal-400 via-cyan-300 to-indigo-400 bg-clip-text text-transparent">EasyMove</span>
              <span className="text-white/40 font-light">—</span>
              <span className="text-white/80 text-lg md:text-xl font-medium">Elderly Mobility Solution</span>
            </h1>
            <p className="text-slate-400 text-xs md:text-sm mt-1.5 max-w-xl">
              Vietnamese Voice AI assistant connecting multi-provider rides & family guardians for tech-excluded elderly.
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-1.5 bg-white/[0.04] p-1 rounded-2xl border border-white/[0.06]">
            <button
              onClick={() => setActiveTab("demo")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
                activeTab === "demo"
                  ? "bg-teal-500 text-white shadow-lg shadow-teal-500/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Live Demo
            </button>
            <button
              onClick={() => setActiveTab("business")}
              className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-all duration-200 ${
                activeTab === "business"
                  ? "bg-teal-500 text-white shadow-lg shadow-teal-500/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
              }`}
            >
              <Layers className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Business Case
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 flex flex-col gap-6">
        
        {activeTab === "demo" && (
          <div className="flex flex-col gap-6">
            
            {/* Guide box */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-teal-500/10 rounded-xl text-teal-400 shrink-0 mt-0.5">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-slate-200">Demo Guide</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Experience <strong className="text-slate-300">side-by-side</strong> below, or <strong className="text-slate-300">open 2 browser tabs</strong> with the same link.
                    Press the mic button on the phone simulator — trip info syncs to the Guardian Dashboard in real-time via BroadcastChannel.
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  if (typeof window !== "undefined") {
                    window.open(window.location.href, "_blank");
                  }
                }}
                className="px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold rounded-xl border border-white/[0.08] shrink-0 flex items-center gap-2 self-end md:self-auto transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
                Open second tab
              </button>
            </div>

            {/* Simulated workspaces */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Voice simulator */}
              <div className="lg:col-span-5 flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">A. Elderly Phone Simulator</span>
                  <span className="text-[10px] text-teal-400 font-medium bg-teal-500/8 px-2.5 py-1 rounded-full border border-teal-500/15">Voice UI</span>
                </div>
                <VoiceSimulator channel={channel} />
              </div>

              {/* Guardian dashboard */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">B. Family Guardian Dashboard</span>
                  <span className="text-[10px] text-indigo-400 font-medium bg-indigo-500/8 px-2.5 py-1 rounded-full border border-indigo-500/15">Guardian Center</span>
                </div>
                <GuardianDashboard channel={channel} />
              </div>

            </div>

            {/* Feature cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="group bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl hover:bg-white/[0.04] transition-all duration-300">
                <div className="w-9 h-9 bg-teal-500/10 rounded-xl flex items-center justify-center mb-3">
                  <Mic className="w-4.5 h-4.5 text-teal-400" />
                </div>
                <h4 className="font-semibold text-sm text-slate-200 mb-1.5">One-Button Interface</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Single large button with 100% audio interaction. No map, no typing, no screen navigation needed.
                </p>
              </div>
              <div className="group bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl hover:bg-white/[0.04] transition-all duration-300">
                <div className="w-9 h-9 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-3">
                  <Shield className="w-4.5 h-4.5 text-indigo-400" />
                </div>
                <h4 className="font-semibold text-sm text-slate-200 mb-1.5">Family Safety Lock</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Real-time SMS alerts, proxy payment via linked wallet, and route deviation detection for fraud prevention.
                </p>
              </div>
              <div className="group bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl hover:bg-white/[0.04] transition-all duration-300">
                <div className="w-9 h-9 bg-amber-500/10 rounded-xl flex items-center justify-center mb-3">
                  <ShoppingBag className="w-4.5 h-4.5 text-amber-400" />
                </div>
                <h4 className="font-semibold text-sm text-slate-200 mb-1.5">Multi-Provider Aggregation</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Compares fares across Grab, Be, Xanh SM and traditional taxis to find the fastest, cheapest ride.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Business tab */}
        {activeTab === "business" && (
          <div className="animate-in fade-in duration-200">
            <div className="mb-5 bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl text-xs leading-relaxed text-slate-400">
              <div className="flex items-start gap-3">
                <span className="text-lg">📌</span>
                <div>
                  <strong className="text-slate-200">Revenue model explained:</strong>{" "}
                  Vietnam has ~4M lonely elderly, many with low income and no bank cards. EasyMove targets their <strong className="text-teal-400">children/guardians as the paying customer</strong> through a monthly "Peace of Mind" subscription (49k VND/month).
                  Additionally, a <strong className="text-teal-400">3,000 VND convenience fee per ride</strong> covers API costs for voice recognition & automated SMS.
                </div>
              </div>
            </div>
            <BudgetCalculator />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-6 px-6 text-slate-500 text-xs text-center flex flex-col sm:flex-row justify-between items-center gap-3 max-w-7xl w-full mx-auto">
        <p>© 2026 EasyMove · Grab-UNDP Hackathon 2026</p>
        <p className="text-slate-600">
          Next.js · TailwindCSS · Web Speech API · BroadcastChannel
        </p>
      </footer>
      
    </div>
  );
}
