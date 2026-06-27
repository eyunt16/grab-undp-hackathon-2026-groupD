# EasyMove — Elderly Mobility Solution

> Vietnamese Voice AI assistant connecting multi-provider rides & family guardians for tech-excluded elderly.

**Grab-UNDP Hackathon 2026 · Group D**

## Problem

Vietnam has approximately **4 million elderly people** living alone, most of whom cannot use smartphones or modern ride-hailing apps. They depend on family members or miss essential mobility needs (hospital visits, markets, temples).

## Solution

**EasyMove** is a voice-first ride-hailing and errand-running app designed for elderly users:

- 🎤 **One-button interface** — Press the button and speak freely in Vietnamese
- 🛡️ **Family guardian dashboard** — Children receive SMS, track trips, and pay on behalf in real-time
- 🚗 **Multi-provider aggregation** — Compares fares across Grab, Be, Xanh SM to find the fastest, cheapest ride
- 🧠 **Context-aware AI** — Gemini AI parses natural Vietnamese speech (with local NLU fallback when offline)
- 🚨 **SOS alerts** — Route deviation detection alerts family guardians

## Demo

Open the app and **use 2 tabs side by side** to experience:
- Left: Elderly phone simulator (press mic or tap suggestions)
- Right: Family guardian dashboard (receives real-time notifications)

## Getting Started

```bash
# Install dependencies
npm install

# Create env file (optional — runs without Gemini key)
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

## Tech Stack

| Layer | Stack |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TailwindCSS 4 + shadcn/ui |
| Typography | Inter + JetBrains Mono |
| Voice I/O | Web Speech API (STT + TTS vi-VN) |
| NLU | Gemini 2.0 Flash (server route) + Local regex fallback |
| Cross-tab sync | BroadcastChannel API |
| Linting | Biome |

## Project Structure

```
src/
├── app/
│   ├── api/parse-voice/     # Gemini NLU server route
│   ├── layout.tsx           # Root layout (vi-VN, Inter font)
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

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | No | API key for Gemini AI NLU. Falls back to local regex parser if not set. |

## Team

**Group D** — Grab-UNDP Hackathon 2026
