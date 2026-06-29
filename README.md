# CityScope

<div align="center">

<img src="public/CityScope.png" alt="CityScope" width="120" />

**A next-generation civic intelligence platform — report issues, detect road anomalies, monitor noise, crowd-verify problems, track environmental decay, and broadcast emergencies in real time.**

[![Live Demo](https://img.shields.io/badge/Live-city--scope--swart.vercel.app-0070f3?style=for-the-badge&logo=vercel)](https://city-scope-swart.vercel.app)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?flat-square&logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?flat-square&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?flat-square&logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

## Table of Contents

- [Overview](#overview)
- [Feature Modules](#feature-modules)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Database Setup](#database-setup)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Overview

CityScope empowers citizens to make their city better. From reporting a pothole with AI photo analysis that responds in seconds, to crowd-verifying issues across neighborhoods, to broadcasting an SOS alert to nearby residents — CityScope is a full-stack civic intelligence system built for the real world.

Built as a **Progressive Web App (PWA)** — installable on any phone, works offline for core features, and uses the device's sensors (accelerometer, microphone, GPS, camera, compass) to power its advanced detection modules.

**GitHub Repo:** [Aditya060806/CityScope](https://github.com/Aditya060806/CityScope)
**Live:** [city-scope-swart.vercel.app](https://city-scope-swart.vercel.app)

---

## Feature Modules

### Core Platform

| Feature | Description |
|---|---|
| **Issue Reporting** | Report civic issues (potholes, garbage, flooding, encroachments, etc.) with photos, GPS tagging, and category selection |
| **AI Photo Analysis** | Gemini Vision automatically classifies issue severity, category, and suggests priority from uploaded photos |
| **Live Issue Map** | Leaflet map with clustered markers, heatmap layers, and real-time status overlays |
| **Rewards System** | Earn points for reports and verifications; redeem them in the in-app marketplace |
| **Leaderboard** | City-wide and neighborhood hero rankings |
| **AI Chatbot** | Groq LLaMA 3.3-70B chatbot that queries the live database and auto-reports issues from conversation |
| **Analytics Dashboard** | Charts for issue categories, resolution trends, hotspot analysis, and civic score by zone |
| **Citizen Messaging** | Real-time direct messages between citizens using Supabase Realtime |
| **Admin Panel** | Moderate reports, manage users, escalate issues to authorities |
| **Dark / Light Mode** | Full theme support via `next-themes` |
| **PWA + Offline** | Service worker caching, offline fallback, installable on Android and iOS |

---

### PRAD — Pothole & Road Anomaly Detection

Uses the phone's accelerometer to passively detect road anomalies while driving or commuting.

- **Sensor fusion** — combines Z-axis acceleration spikes with GPS coordinates to detect potholes, speed bumps, and rough patches
- **Background detection** — runs silently; auto-stops when stationary for 30+ seconds
- **Anomaly map layer** — all detected anomalies plotted in real-time on the map with severity heatmap
- **Road Health Index** — computed score per road segment based on aggregated community data
- **Trip recorder** — manual start/stop mode with full trip replay
- **AI confirmation** — anomaly signals cross-checked against ML thresholds before submission

---

### SoundScope

Passive urban noise intelligence using the device microphone.

- **Real-time dB meter** — live decibel reading from Web Audio API with FFT spectral analysis
- **Noise classification** — rule-based engine classifies sound as Traffic, Construction, Siren, Horn, Music, Ambient, or Silence
- **CPCB limit checking** — compares against India's Central Pollution Control Board limits per zone type (residential, commercial, industrial, silence)
- **Auto batch submission** — samples are batched and geo-tagged every 30 seconds in background
- **Noise heatmap** — aggregated city-wide noise level overlay on the map
- **Privacy-safe** — only spectral features and dB levels are processed; raw audio is never stored or transmitted

---

### SwarmVerify

Crowd-sourced ground-truth verification for civic issues.

- **Verification quests** — when an issue is reported, a quest is auto-created for nearby citizens to physically verify
- **GPS radius enforcement** — citizens must be within 500 m of the issue to submit (haversine check)
- **SHA-256 evidence hashing** — each verification is signed with a tamper-proof hash via the Web Crypto API
- **Anti-gaming** — reporters cannot verify their own issues; duplicate submissions are rejected
- **Auto-escalation** — when 3 independent verifications are collected, the issue is automatically upgraded to high priority
- **Trust Score** — per-user accuracy score based on verification history; 5 tiers from Newcomer to Elite Verifier

---

### CivicAR

Augmented reality overlay that visualizes nearby civic data through the camera.

- **Live camera feed** — uses `getUserMedia` to display the device camera as a backdrop
- **Compass-driven projection** — reads `DeviceOrientationEvent` (heading, pitch, tilt) to project GPS-located issues into screen space
- **Dual data sources** — renders both reported issues and PRAD road anomalies as AR pins
- **Distance labels** — each marker shows distance in meters and issue title
- **Field-of-view culling** — only markers within the device's current FOV (~60°) are rendered

---

### CivicTimeLapse

Track infrastructure decay over time with AI-analyzed photo sequences.

- **Monitoring points** — citizens create named observation points and attach them to a GPS location
- **Photo sequences** — multiple captures at the same point over days/weeks build a visual timeline
- **Gemini Vision analysis** — each new photo is analyzed to produce a decay score (0–100) and condition notes
- **Decay timeline chart** — interactive line chart showing how a site's condition has evolved
- **Before/after comparison** — side-by-side view of oldest and most recent captures

---

### GreenScope

Urban green cover monitoring and tree registry.

- **Tree registry** — citizens register trees with GPS, species (AI-identified from photo), height, and canopy spread
- **AI species identification** — Gemini Vision identifies tree species from uploaded photos
- **Tree adoption** — citizens can adopt individual trees to track their health over time
- **Health reports** — log stress, disease, or damage events per tree with photos and AI diagnosis
- **Zone statistics** — NDVI estimate, canopy cover percentage, and tree density per neighborhood

---

### CivicSOS

Emergency broadcast system with geo-shielded real-time alerts.

- **One-tap SOS broadcast** — single large button triggers a broadcast with GPS, severity, and emergency type
- **10 emergency types** — Accident, Fire, Medical, Flood, Crime, Gas Leak, Building Collapse, Riot, Missing Person, Other
- **4 severity levels** — Low (500 m radius, 6 h TTL) → Critical (5 km radius, 48 h TTL)
- **Supabase Realtime** — new alerts are pushed instantly to all nearby clients via Postgres `INSERT` subscription
- **Browser notifications** — permission-gated push notifications for incoming critical alerts
- **Vibration feedback** — mobile haptic pattern on incoming critical alerts
- **Confirmation system** — other citizens near the scene can confirm an alert, increasing its credibility score

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend framework** | React 18.3 + TypeScript 5.5 |
| **Build tool** | Vite 5.4 + SWC compiler |
| **Styling** | Tailwind CSS 3.4 + shadcn/ui |
| **Animations** | Framer Motion 12 |
| **Routing** | React Router v6 |
| **State / data fetching** | TanStack Query v5 |
| **Forms** | React Hook Form + Zod |
| **Maps** | Leaflet + leaflet.markercluster + leaflet.heat |
| **Charts** | Recharts |
| **Backend / DB** | Supabase (PostgreSQL + Auth + Storage + Realtime) |
| **Primary AI** | Google Gemini 2.0 Flash (vision + text) |
| **Secondary AI** | Groq LLaMA 3.3-70B (chatbot) |
| **Sensor APIs** | Web Audio API, DeviceOrientationEvent, DeviceMotionEvent, Web Crypto API |
| **PWA** | Vite PWA + service worker |
| **Deployment** | Vercel |

---

## Project Structure

```
src/
├── components/
│   ├── auth/           # ProtectedRoute, UserMenu, AuthCallback
│   ├── civic/          # Issue cards, maps, leaderboard, rewards UI
│   ├── common/         # ErrorBoundary, LoadingSpinner, EmptyState
│   ├── features/       # Dashboard widgets, report modal, filter drawer
│   ├── layout/         # AppLayout, top nav, sidebar, mobile bottom nav
│   ├── prad/           # TripRecorder, AnomalyMapLayer, RoadHealthIndex
│   └── ui/             # shadcn/ui primitives (button, card, dialog, ...)
│
├── contexts/
│   ├── AuthContextProvider.tsx       # Supabase auth session
│   ├── LocationContextProvider.tsx   # GPS position with permission flow
│   ├── PRADAutoDetectionContext.tsx  # Background accelerometer detection
│   ├── SoundScopeContext.tsx         # Passive noise monitoring
│   └── SOSContext.tsx                # Realtime SOS alert subscription
│
├── hooks/
│   ├── useAuth.ts                  # Auth context consumer
│   ├── useLocation.ts              # Location context consumer
│   ├── useCivicIssues.ts           # Issue CRUD with TanStack Query
│   ├── useRoadAnomalyDetection.ts  # PRAD sensor logic
│   └── useSwarmVerify.ts           # Quest polling + verification submit
│
├── pages/
│   ├── Dashboard.tsx         # Issue feed, stats, quick report
│   ├── Map.tsx               # Full-screen issue + anomaly map
│   ├── Report.tsx            # Detailed issue report form
│   ├── RoadAnomalies.tsx     # PRAD trip recorder + map
│   ├── SoundScope.tsx        # Noise monitoring dashboard
│   ├── SwarmVerify.tsx       # Verification quests + trust score
│   ├── CivicAR.tsx           # AR camera overlay
│   ├── CivicTimeLapse.tsx    # Decay tracking timeline
│   ├── GreenScope.tsx        # Tree registry + zone stats
│   ├── CivicSOS.tsx          # Emergency broadcast
│   ├── EnhancedRewards.tsx   # Rewards marketplace
│   ├── Leaderboard.tsx       # City heroes ranking
│   ├── Messages.tsx          # Real-time citizen messaging
│   ├── EnhancedAnalytics.tsx # Civic data analytics
│   ├── Profile.tsx           # User profile + stats
│   ├── Settings.tsx          # App preferences
│   └── Admin.tsx             # Moderation panel
│
├── services/
│   ├── IssueService.ts              # Issue CRUD
│   ├── EnhancedIssueService.ts      # AI-enhanced issue operations
│   ├── SOSService.ts                # SOS broadcast + realtime
│   ├── SwarmVerifyService.ts        # Quest + verification CRUD
│   ├── SoundScopeService.ts         # Noise sample CRUD
│   ├── CivicARService.ts            # AR marker data loading
│   ├── CivicTimelapseService.ts     # Monitoring point + capture CRUD
│   ├── GreenScopeService.ts         # Tree registry CRUD
│   ├── AudioCaptureService.ts       # Web Audio API wrapper
│   ├── NoiseClassificationEngine.ts # Sound source classifier
│   ├── GeminiAIService.ts           # Gemini text + vision calls
│   ├── RoadAnomalyService.ts        # Anomaly storage + retrieval
│   └── RewardsService.ts            # Points + marketplace
│
└── types/
    ├── civic.ts            # Issue, User, Category types
    ├── sound-scope.ts      # NoiseReading, NoiseSample, CPCB limits
    ├── swarm-verify.ts     # VerificationQuest, TrustScore
    ├── civic-ar.ts         # ARMarker, projection helpers
    ├── civic-timelapse.ts  # MonitoringPoint, DecayTimeline
    ├── green-scope.ts      # TreeRecord, GreenZone, NDVI helpers
    └── civic-sos.ts        # SOSAlert, EmergencyType, GeoShield
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)
- A [Google AI Studio](https://aistudio.google.com) API key (free)
- A [Groq](https://console.groq.com) API key (free tier)

### Installation

```bash
# Clone the repo
git clone https://github.com/Aditya060806/CityScope.git
cd CityScope

# Install dependencies
npm install

# Copy environment template
cp env.example .env.local
# Fill in your own keys (see Environment Variables below)

# Start the dev server
npm run dev
```

The app runs at `http://localhost:5188`.

---

## Environment Variables

Create `.env.local` in the project root:

```env
# Supabase (required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key

# Google Gemini AI — vision + text (required for AI features)
VITE_GEMINI_API_KEY=your_gemini_key
VITE_GOOGLE_AI_API_KEY=your_gemini_key

# Groq — chatbot (required for AI chatbot)
VITE_GROQ_API_KEY=your_groq_key

# Web Push — optional, for push notifications
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
VITE_VAPID_PRIVATE_KEY=your_vapid_private_key

# EmailJS — optional, for email notifications
VITE_EMAILJS_SERVICE_ID=your_service_id
VITE_EMAILJS_TEMPLATE_ID=your_template_id
VITE_EMAILJS_PUBLIC_KEY=your_public_key
```

---

## Database Setup

Run these files in your **Supabase SQL Editor** in order:

| File | Purpose |
|---|---|
| `supabase-schema.sql` | Core tables: `users`, `issues`, `comments`, `messages`, rewards |
| `migration-new-features.sql` | Feature tables: `sos_alerts`, `verification_quests`, `verifications`, `noise_samples`, `monitoring_points`, `timelapse_captures`, `tree_registry`, `tree_health_reports` + storage buckets + Realtime |

> Running `migration-new-features.sql` eliminates all PGRST205 / 404 errors from the new feature modules.

---

## Deployment

Pre-configured for **Vercel** via `vercel.json`:

```bash
npm i -g vercel
vercel --prod
```

Add all environment variables in the Vercel dashboard under **Settings → Environment Variables**.

Static assets are served with 1-year immutable cache headers. All routes fall back to `index.html` for client-side routing.

---

## Available Scripts

```bash
npm run dev           # Start dev server (port 5188)
npm run build         # Production build → dist/
npm run preview       # Preview production build locally
npm run type-check    # TypeScript check without emitting
npm run lint          # ESLint
npm run lint:fix      # ESLint with auto-fix
npm run optimize-images   # Compress images before build
npm run build:optimized   # Optimize images + build
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make changes — ensure `npm run type-check` passes with zero errors
4. Commit: `git commit -m "feat: describe your change"`
5. Push and open a Pull Request

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

## Exact Architecture Reference (Current)

This section is additive and reflects the current implementation wiring in source files.

### 1) Runtime Composition

Application bootstrap and composition order:

1. `src/main.tsx` mounts React root and wraps `App` in `ErrorBoundary`.
2. `src/App.tsx` composes global providers in this order:
    - `ThemeProvider`
    - `QueryClientProvider`
    - `BrowserRouter`
    - `AuthProvider`
    - `LocationProvider`
    - `PRADAutoDetectionProvider`
    - `SoundScopeProvider`
    - `SOSProvider`
3. Protected routes render inside `ProtectedRoute -> AppLayout -> Outlet`.
4. Global UI overlays mounted at app shell level:
    - `Toaster`
    - lazy-loaded `EnhancedChatbot`
    - `PRADLiveIndicator` (inside layout)

### 2) Exact Route Topology

From `src/App.tsx`:

Public routes:

- `/auth` -> `pages/Auth.tsx`
- `/auth/callback` -> `components/auth/AuthCallback.tsx`

Protected routes (inside `AppLayout`):

- `/` -> `pages/Dashboard.tsx`
- `/report` -> `pages/Report.tsx`
- `/map` -> `pages/Map.tsx`
- `/leaderboard` -> `pages/Leaderboard.tsx`
- `/rewards` -> `pages/EnhancedRewards.tsx` (via `RewardsWrapper`)
- `/analytics` -> `pages/EnhancedAnalytics.tsx`
- `/ai-analytics` -> `pages/AIAnalytics.tsx`
- `/heroes` -> `pages/EnhancedHeroes.tsx`
- `/profile` -> `pages/Profile.tsx`
- `/settings` -> `pages/Settings.tsx`
- `/admin` -> `pages/Admin.tsx`
- `/messages` -> `pages/Messages.tsx`
- `/road-anomalies` -> `pages/RoadAnomalies.tsx`
- `/sound-scope` -> `pages/SoundScope.tsx`
- `/swarm-verify` -> `pages/SwarmVerify.tsx`
- `/civic-ar` -> `pages/CivicAR.tsx`
- `/timelapse` -> `pages/CivicTimeLapse.tsx`
- `/green-scope` -> `pages/GreenScope.tsx`
- `/sos` -> `pages/CivicSOS.tsx`

Fallback route:

- `*` -> `pages/NotFound.tsx`

### 3) Source Layer Architecture (Exact Folders)

```
src/
├── assets/
├── components/
│   ├── auth/
│   ├── chatbot/
│   ├── civic/
│   ├── common/
│   ├── features/
│   ├── feedback/
│   ├── layout/
│   ├── notifications/
│   ├── onboarding/
│   ├── prad/
│   ├── profile/
│   └── ui/
├── contexts/
├── data/
├── hooks/
├── lib/
├── pages/
├── services/
├── styles/
├── types/
└── utils/
```

Layer responsibilities:

- `pages/`: route-level orchestration and page composition.
- `components/`: reusable UI and feature widgets.
- `hooks/`: reusable stateful logic and side-effect orchestration.
- `contexts/`: app-wide runtime state providers.
- `services/`: domain/data operations (Supabase, AI, sensors, notifications, payments, etc.).
- `types/`: TypeScript contracts for domain entities.
- `lib/`: framework utilities, variants, shared helpers.
- `data/`: static/tutorial/config data structures.
- `styles/`: global and animation stylesheets.

### 4) Request/Data Flow

Standard flow for core civic modules:

1. User action at `pages/*` or `components/*`.
2. Business/data logic in `hooks/*`.
3. Domain operations in `services/*`.
4. Persistence + realtime through Supabase (`src/lib/supabase.ts` + service methods).
5. UI updates via React state, context updates, and TanStack Query cache invalidation/refetch.

### 5) Deployment Runtime Notes

- Vite SPA build and static hosting configuration via `vercel.json`.
- Production service worker registration from `src/main.tsx`.
- Development mode explicitly unregisters service workers to avoid HMR/fetch interference.
