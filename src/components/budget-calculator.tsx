"use client";

import React, { useState } from "react";
import {
  DollarSign,
  Users,
  Award,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  TrendingDown,
  HelpCircle,
} from "lucide-react";

export default function BudgetCalculator() {
  // Inputs
  const [totalElderly, setTotalElderly] = useState<number>(4000000); // 4M lonely elderly in Vietnam
  const [conversionRate, setConversionRate] = useState<number>(1.5); // 1.5% active users
  const [tripsPerMonth, setTripsPerMonth] = useState<number>(4); // 4 trips per month (weekly checkup/pagoda)
  const [convenienceFee, setConvenienceFee] = useState<number>(3000); // 3,000 VND platform fee per ride
  const [subscriptionFee, setSubscriptionFee] = useState<number>(49000); // 49,000 VND/month child subscription
  const [subAdoptionRate, setSubAdoptionRate] = useState<number>(25); // 25% of active users have premium guardians

  // Expenses
  const [marketingCost, setMarketingCost] = useState<number>(20000000); // 20M VND/month ward/hospital outreach
  const [staffSalary, setStaffSalary] = useState<number>(40000000); // 40M VND/month core operations
  const initialInvestment = 150000000; // 150M VND (development, fine-tuning voice, launch)

  // Calculations
  const activeUsers = Math.round(totalElderly * (conversionRate / 100));
  const premiumSubscribers = Math.round(activeUsers * (subAdoptionRate / 100));
  const monthlyBookings = activeUsers * tripsPerMonth;

  // Costs per booking
  const apiCostPerBooking = 200 + 100 + 400; // 200đ STT + 100đ TTS + 400đ SMS notification = 700đ
  const monthlyAPIExpenses = monthlyBookings * apiCostPerBooking;

  // Revenues
  const transactionRevenue = monthlyBookings * convenienceFee;
  const subscriptionRevenue = premiumSubscribers * subscriptionFee;

  const totalRevenue = transactionRevenue + subscriptionRevenue;
  const totalOperatingCosts = monthlyAPIExpenses + marketingCost + staffSalary;
  const netProfit = totalRevenue - totalOperatingCosts;

  const paybackPeriod =
    netProfit > 0
      ? (initialInvestment / netProfit).toFixed(1)
      : "Không thể hoàn vốn";

  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl">
      <div className="border-b border-slate-800 pb-4 mb-5">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-400" />
          Phân tích Tài chính & Mô hình Doanh thu
        </h2>
        <p className="text-xs text-slate-400">
          Mô hình hóa thị trường 4 triệu người lớn tuổi để chứng minh khả năng
          sinh lời và hoàn vốn.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Sliders */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
            Thông số giả lập đầu vào
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Market size slider */}
            <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400 font-semibold">
                  Quy mô thị trường (Người già)
                </span>
                <span className="text-sm font-bold text-slate-100">
                  {(totalElderly / 1000000).toFixed(1)}M người
                </span>
              </div>
              <input
                type="range"
                min="100000"
                max="4000000"
                step="100000"
                value={totalElderly}
                onChange={(e) => setTotalElderly(Number(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Mentor đề cập: Thống kê ~4 triệu người già cô đơn.
              </span>
            </div>

            {/* Conversion rate slider */}
            <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400 font-semibold">
                  Tỷ lệ sử dụng hàng tháng (MAU)
                </span>
                <span className="text-sm font-bold text-emerald-400">
                  {conversionRate}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={conversionRate}
                onChange={(e) => setConversionRate(Number(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Số người dùng thật sự:{" "}
                <strong className="text-slate-350">
                  {activeUsers.toLocaleString()} người
                </strong>
              </span>
            </div>

            {/* Trips per month */}
            <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400 font-semibold">
                  Số chuyến xe / Người già / Tháng
                </span>
                <span className="text-sm font-bold text-slate-100">
                  {tripsPerMonth} chuyến
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={tripsPerMonth}
                onChange={(e) => setTripsPerMonth(Number(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Tổng bookings:{" "}
                <strong className="text-slate-350">
                  {monthlyBookings.toLocaleString()} chuyến/tháng
                </strong>
              </span>
            </div>

            {/* Convenience fee */}
            <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400 font-semibold">
                  Phí kết nối / Chuyến (Inflow)
                </span>
                <span className="text-sm font-bold text-emerald-400">
                  {convenienceFee.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <input
                type="range"
                min="1000"
                max="10000"
                step="500"
                value={convenienceFee}
                onChange={(e) => setConvenienceFee(Number(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Cộng vào cước taxi gốc từ API (Grab/Be/GSM).
              </span>
            </div>

            {/* Subscription fee */}
            <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400 font-semibold">
                  Cước Đăng Ký Người Thân / Tháng
                </span>
                <span className="text-sm font-bold text-slate-100">
                  {subscriptionFee.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <input
                type="range"
                min="10000"
                max="100000"
                step="5000"
                value={subscriptionFee}
                onChange={(e) => setSubscriptionFee(Number(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Gói an tâm cho con cháu (SMS, Map, Cảnh báo lệch tuyến).
              </span>
            </div>

            {/* Subscription adoption rate */}
            <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400 font-semibold">
                  Tỷ lệ Người thân mua Gói An Tâm
                </span>
                <span className="text-sm font-bold text-emerald-400">
                  {subAdoptionRate}%
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                step="5"
                value={subAdoptionRate}
                onChange={(e) => setSubAdoptionRate(Number(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                Số con cháu đăng ký:{" "}
                <strong className="text-slate-350">
                  {premiumSubscribers.toLocaleString()} người dùng
                </strong>
              </span>
            </div>
          </div>

          {/* Operational Expenses (Fixed Costs) */}
          <div className="bg-slate-850 p-4 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Chi phí vận hành cố định hàng tháng
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-slate-450 block font-semibold mb-1">
                  Chi phí Marketing & Cộng đồng (VND)
                </label>
                <input
                  type="number"
                  value={marketingCost}
                  onChange={(e) => setMarketingCost(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-450 block font-semibold mb-1">
                  Lương nhân sự ops & kỹ thuật (VND)
                </label>
                <input
                  type="number"
                  value={staffSalary}
                  onChange={(e) => setStaffSalary(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs focus:outline-none focus:border-emerald-500 font-medium"
                />
              </div>
            </div>
            <p className="text-[9px] text-slate-500 mt-2">
              API costs (Voice STT/TTS + SMS) được tính động:{" "}
              <strong>700đ/chuyến xe</strong> (x{" "}
              {monthlyBookings.toLocaleString()} chuyến ={" "}
              {monthlyAPIExpenses.toLocaleString("vi-VN")}đ/tháng).
            </p>
          </div>
        </div>

        {/* Right column: Results */}
        <div className="bg-slate-850 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-4 text-center">
              BÁO CÁO TÀI CHÍNH THÁNG
            </h3>

            {/* Total Active user count */}
            <div className="text-center mb-6">
              <span className="text-[10px] text-slate-450 uppercase block font-bold">
                Số lượng người già phục vụ
              </span>
              <p className="text-3xl font-extrabold text-white mt-1">
                {activeUsers.toLocaleString()}{" "}
                <span className="text-xs text-slate-400">MAU</span>
              </p>
            </div>

            {/* Income Statement */}
            <div className="flex flex-col gap-3 text-xs mb-6">
              <div className="flex justify-between items-center text-slate-300">
                <span>Thu phí kết nối đặt xe:</span>
                <span className="font-bold">
                  {transactionRevenue.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span>Thu gói Đăng ký Người thân:</span>
                <span className="font-bold">
                  {subscriptionRevenue.toLocaleString("vi-VN")}đ
                </span>
              </div>
              <div className="h-px bg-slate-800"></div>
              <div className="flex justify-between items-center text-emerald-400 font-bold text-sm">
                <span>TỔNG DOANH THU:</span>
                <span>{totalRevenue.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Chi phí API (TTS/STT/SMS):</span>
                <span>-{monthlyAPIExpenses.toLocaleString("vi-VN")}đ</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Chi phí Cố định (Mkt+Lương):</span>
                <span>
                  -{(marketingCost + staffSalary).toLocaleString("vi-VN")}đ
                </span>
              </div>
              <div className="h-px bg-slate-800"></div>
              <div className="flex justify-between items-center font-bold text-sm">
                <span>CHI PHÍ VẬN HÀNH:</span>
                <span className="text-slate-300">
                  {totalOperatingCosts.toLocaleString("vi-VN")}đ
                </span>
              </div>
            </div>

            {/* Net profit visualization */}
            <div className="p-4 rounded-xl border border-slate-750 text-center mb-4 bg-slate-900">
              <span className="text-[10px] text-slate-450 uppercase block font-bold">
                Lợi nhuận ròng hàng tháng
              </span>
              <p
                className={`text-2xl font-black mt-1 ${netProfit > 0 ? "text-emerald-400" : "text-red-500"}`}
              >
                {netProfit > 0 ? "+" : ""}
                {netProfit.toLocaleString("vi-VN")}đ
              </p>
            </div>
          </div>

          <div>
            {/* Payback period and business rating */}
            {netProfit > 0 ? (
              <div className="flex flex-col gap-3">
                <div className="bg-emerald-950/20 border border-emerald-900/40 p-3 rounded-xl flex items-start gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-400">
                      Mô hình Khả thi (Sinh lời)
                    </h4>
                    <p className="text-[10px] text-slate-350 leading-relaxed mt-0.5">
                      Thời gian hoàn vốn đầu tư ban đầu (150 triệu VND) dự kiến
                      là{" "}
                      <strong className="text-white">
                        {paybackPeriod} tháng
                      </strong>
                      .
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-[10px] text-slate-450 leading-normal">
                  💡 <strong>Chứng minh dòng tiền:</strong> Dù người già (user
                  trực tiếp) ngại thanh toán thẻ/công nghệ, AloXe giải quyết
                  thông qua việc{" "}
                  <strong>thu phí định kỳ từ con cháu (người bảo hộ)</strong>{" "}
                  thông qua ví liên kết để đổi lấy sự an tâm.
                </div>
              </div>
            ) : (
              <div className="bg-red-950/20 border border-red-900/40 p-3 rounded-xl flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-red-400">
                    Đang bù lỗ (Cần tối ưu)
                  </h4>
                  <p className="text-[10px] text-slate-350 leading-relaxed mt-0.5">
                    Tổng chi phí vận hành đang lớn hơn doanh thu. Hãy thử tăng
                    tỷ lệ chuyển đổi sử dụng (conversion) hoặc nâng cước đăng
                    ký/phí dịch vụ kết nối để cân bằng.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
