# GọiĐi — Giải Pháp Di Chuyển Cho Người Cao Tuổi

> Trợ lý giọng nói Tiếng Việt (Voice AI) kết nối đa nhà xe & người bảo hộ cho người mù công nghệ.

**Grab-UNDP Hackathon 2026 · Group D**

## Vấn đề

Việt Nam có khoảng **4 triệu người cao tuổi** sống cô đơn, đa số không sử dụng được smartphone hay ứng dụng gọi xe hiện đại. Họ phải phụ thuộc vào người thân hoặc bỏ lỡ nhu cầu di chuyển thiết yếu (khám bệnh, chợ, chùa).

## Giải pháp

**GọiĐi** là một ứng dụng đặt xe/mua hộ bằng giọng nói Tiếng Việt, thiết kế tối giản cho người lớn tuổi:

- 🎤 **Giao diện 1 nút** — Chỉ cần bấm nút và nói tự do bằng Tiếng Việt
- 🛡️ **Bảng theo dõi người thân** — Con cháu nhận SMS, theo dõi hành trình, và thanh toán hộ theo thời gian thực
- 🚗 **Kết nối đa nhà xe** — Tổng hợp giá từ Grab, Be, Xanh SM để tìm xe nhanh & rẻ nhất
- 🧠 **AI hiểu ngữ cảnh** — Gemini AI phân tích câu nói Tiếng Việt tự do (fallback local NLU khi offline)
- 🚨 **Cảnh báo SOS** — Phát hiện xe đi chệch lộ trình, cảnh báo người thân

## Demo

Truy cập ứng dụng và mở **2 tab cùng lúc** để trải nghiệm song song:
- Tab trái: Điện thoại người già (bấm mic hoặc chọn gợi ý)
- Tab phải: Bảng theo dõi người thân (nhận thông báo real-time)

## Cài đặt & Chạy

```bash
# Cài dependencies
npm install

# Tạo file env (tùy chọn — chạy được không cần Gemini key)
cp .env.example .env.local

# Khởi chạy development server
npm run dev
```

Mở [http://localhost:3000](http://localhost:3000) để xem kết quả.

## Công nghệ

| Layer | Stack |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TailwindCSS 4 + shadcn/ui |
| Voice I/O | Web Speech API (STT + TTS vi-VN) |
| NLU | Gemini 2.0 Flash (server route) + Local regex fallback |
| Cross-tab sync | BroadcastChannel API |
| Linting | Biome |

## Cấu trúc dự án

```
src/
├── app/
│   ├── api/parse-voice/     # Gemini NLU server route
│   ├── layout.tsx           # Root layout (vi-VN)
│   ├── page.tsx             # Main page with tab navigation
│   └── globals.css          # Design tokens & themes
├── components/
│   ├── voice-simulator.tsx  # Phone simulator (elderly UI)
│   ├── guardian-dashboard.tsx # Guardian tracking dashboard
│   └── budget-calculator.tsx # Business model calculator
└── lib/
    ├── messages.ts          # Typed BroadcastChannel protocol
    └── utils.ts             # Tailwind merge utility
```

## Biến môi trường

| Biến | Bắt buộc | Mô tả |
|---|---|---|
| `GEMINI_API_KEY` | Không | API key cho Gemini AI NLU. Nếu không có, hệ thống dùng local regex parser. |

## Nhóm

**Group D** — Grab-UNDP Hackathon 2026
