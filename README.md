# 🌤️ SkyCast: Immersive Weather Experience

> A full-stack, real-time weather platform engineered around **immersive UX** and **social connectivity** — not just another "5-day forecast" grid. SkyCast treats the weather as a living canvas: the entire UI morphs with the sky, friends can scrub the same forecast together in real time, and a Time Machine slider lets you preview any hour of the day with butter-smooth gradient transitions.

<p align="center">
  <a href="#-how-to-run-locally"><strong>⚡ Run Locally</strong></a> &nbsp;·&nbsp;
  <a href="#-key-features"><strong>✨ Features</strong></a> &nbsp;·&nbsp;
  <a href="#-tech-stack-deep-dive"><strong>🛠 Tech Stack</strong></a> &nbsp;·&nbsp;
  <a href="#-architecture--engineering-challenges"><strong>🏗 Architecture</strong></a>
</p>

---

## ✨ Key Features

### 🎨 Dynamic Ambient Engine

The entire page wraps itself in a **weather-aware, time-of-day-aware backdrop**. A hand-tuned palette of 10 sky keyframes (midnight → pre-dawn → sunrise → midday → sunset → dusk → night) is linearly interpolated in RGB space and piped into typed CSS custom properties (`@property <color>`) so the browser interpolates colors **frame-by-frame** — no jumpy transitions, no canvas cost. On top of that base, theme-coloured glow blobs crossfade via `AnimatePresence` keyed on the condition, a warm horizon wash fades in at golden hour, and 110 randomised stars ease in as `nightiness` climbs. **Switching from one "Clear" city to another does not re-animate** — layers are keyed on the condition, so only meaningful changes trigger a transition.

### 🌐 Weather Together (Real-Time Social Rooms via Socket.io)

Create a 6-character room code and share it with a friend — you'll both see each other's **location, current conditions, and city name pinned on a live Leaflet map**. Presence, typing-style heartbeats, and live city-weather updates are broadcast over Socket.io channels. Joining a room auto-sends the latest snapshot; leaving it cleans up via server-side disconnect handlers. Great for "should we go for a walk?" decisions across time zones.

### ⏳ Time Machine Slider

A 24-hour horizontal slider lives in the **"Sky" section**. As you scrub, the hero temperature, description, and icon update live — and the entire page backdrop morphs through the matching palette (daylight → sunset orange → dusk purple → deep-night with stars fading in). Forecast samples are densified into 30-minute steps via linear interpolation so every frame between raw API samples looks natural. A live "sky strip" preview bar above the slider shows exactly what the next scrub position will look like.

### 📊 Pro-Grade Forecast Analytics

Every metric gets its own purpose-built visualisation rather than a generic stat row:

- **Custom SVG gauge rings** for humidity and cloud cover
- **Wind compass** with animated directional needle
- **Sun cycle card** with a day-arc showing sunrise, solar noon, and sunset
- **Stats grid** covering feels-like, pressure, visibility, wind speed
- **Day-by-day forecast tabs** with per-day hero icons and high/low ranges

### 🛡️ Resilient Multi-Source Data

SkyCast never depends on a single upstream. The backend transparently falls back across providers:

1. **amindi.ge** (scraped every 3 min) for authoritative Georgian city data
2. **Open-Meteo** (worldwide, refreshed every 10 min, no API key required)
3. **OpenWeatherMap** (optional; only engaged when a key is present)

Each response carries a `source` and `updatedAt` stamp that's rendered in a "Live Source" chip in the UI — so users always know where the data came from and how fresh it is.

### 🔐 Authenticated Favorites

Full JWT + bcrypt auth flow with a glassmorphic modal. Saved cities persist in SQLite and are restored across sessions. A one-click star on the hero card toggles favorite status; the favorites drawer slides in from the right with individual remove buttons.

---

## 🛠 Tech Stack Deep Dive

| Layer                  | Stack                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------ |
| **Frontend**           | React 18, TypeScript, Vite 5, Framer Motion 11, Tailwind CSS 3, Lucide-React, React-Leaflet      |
| **Real-time UI**       | Socket.io-client, `@property` CSS custom properties, `AnimatePresence` keyed crossfades         |
| **Backend**            | Node.js, Express 4, TypeScript, Socket.io 4, Zod (validation)                                    |
| **Storage / Auth**     | better-sqlite3 (file-based, zero-config), JWT, bcryptjs                                          |
| **Upstream Data**      | Open-Meteo, OpenWeatherMap (optional), amindi.ge (Georgia-specific scraper)                      |
| **Charts (planned)**   | Recharts (dependency installed, reserved for roadmap trend charts)                               |
| **Dev tooling**        | `tsx watch` (backend), Vite HMR (frontend), PostCSS + Autoprefixer                               |

---

## 🏗 Architecture & Engineering Challenges

### Performance Optimisation

- **Server-side caching layer** — every upstream call is wrapped in an in-memory cache keyed on `(lat, lon, unit)` with a configurable TTL (`CACHE_TTL_MINUTES`, default 10). The dashboard auto-refreshes every 60 s, but identical requests within the TTL window are served instantly from memory — in practice this cuts upstream traffic by **~95 %** during a typical session.
- **Bundled payload endpoint** — `/api/weather/bundle?lat=…&lon=…` returns `{ current, forecast }` in a single round-trip, so the initial paint requires one request, not two.
- **Client-side shimmer vs skeleton** — the `useWeather` hook distinguishes *hard load* (skeleton) from *silent refresh* (a `refreshing-cards` class that adds a subtle shimmer), so background refetches never wipe the UI.
- **Typed CSS color animations** — using `@property <color>` offloads gradient interpolation to the browser's compositor instead of running per-frame React re-renders. Scrubbing the Time Machine stays at 60 fps even on mid-range hardware.
- **Memoised heavy components** — `TimeSlider`, particle layers, and stat grids are wrapped in `React.memo` with stable props so scrolling elsewhere on the page never re-layouts them.

### State Management

- **Single-source-of-truth hooks** — `useWeather` owns `{ place, current, forecast, loading, refetching, error }` and is the only component allowed to hit the network. Everything else consumes its output.
- **Context-based cross-cutting concerns** — three small, focused contexts rather than one monolithic store:
  - `AuthContext` — token + user identity
  - `UnitsContext` — metric / imperial toggle
  - `TimeMachineContext` — preview frame broadcast from the slider to the background engine
- **Transition orchestration** — complex UI states (welcome / skeleton / service-down / loaded) are coordinated with a single `AnimatePresence mode="wait"` block in `Dashboard.tsx`, so only one card is ever in-flight at a time and the page never "stacks" stale layouts.
- **Staggered iOS-style reveal** — the `StaggerStack` primitive replays whenever the active city changes, using a `replayKey` prop so each section (stats, sun cycle, forecast, friends room) fades up with a 50 ms delay between siblings.
- **Localised persistence** — the active place and JWT are stored in `localStorage` with strict-shape validation on read, so a corrupted entry never bricks the app.

### Visual System

- **Palette engine** (`client/src/lib/sky.ts`) — a pure function maps any hour ∈ [0, 24) to a `SkyTint` (top / bottom colors + `nightiness` + `sunsetness`). This engine drives the background, the slider's preview strip, star-field opacity, and the horizon glow — guaranteeing that all five visual elements stay perfectly in phase.
- **Layered background** — back-to-front: morphing sky gradient → weather glow blobs (crossfaded on condition change) → sunset glow → night stars → celestial scene (sun/moon/lightning/drifting clouds) → weather particles → readability scrim. Each layer is independently memoisable, and every layer pulls its colors from the same theme + tint source so nothing ever goes visually out of sync.

---

## 📁 Project Structure

```
Weather/
├── client/                      # React + Vite frontend
│   └── src/
│       ├── components/          # Glassmorphic UI pieces (30+ components)
│       ├── context/             # Auth, Units, TimeMachine contexts
│       ├── hooks/               # useWeather, useSocket, useGeolocation, useFriendsRoom
│       ├── lib/                 # api client, sky palette, weather helpers
│       ├── pages/               # Dashboard, Login, Register
│       └── App.tsx
└── server/                      # Express + TypeScript backend
    └── src/
        ├── db/                  # SQLite init + schema
        ├── middleware/          # JWT auth guard
        ├── routes/              # auth · weather · favorites · cities
        ├── services/            # open-meteo · openweather · amindi scraper · demo fallback
        ├── sockets/             # alerts broadcaster · friends rooms
        └── index.ts
```

---

## ⚡ How to Run Locally

### Prerequisites

- **Node.js 18+** and **npm 9+**
- (Optional) An [OpenWeatherMap API key](https://openweathermap.org/api) — SkyCast works fully without one thanks to Open-Meteo, but a key unlocks the OpenWeatherMap fallback path.

### 1. Clone & install

```bash
git clone https://github.com/tatiatsikhelashvili7/skycast-weather.git
cd skycast-weather

# Backend deps
cd server && npm install

# Frontend deps
cd ../client && npm install
```

### 2. Configure the server

```bash
cd ../server
cp .env.example .env
```

Open `.env` and fill in (API key is optional):

```env
PORT=5000
JWT_SECRET=replace-with-a-long-random-string
OPENWEATHER_API_KEY=paste-your-key-here   # optional
CACHE_TTL_MINUTES=10
CLIENT_ORIGIN=http://localhost:5173
```

### 3. Run both services

In two terminals:

```bash
# Terminal 1 — backend (http://localhost:5000)
cd server
npm run dev

# Terminal 2 — frontend (http://localhost:5173)
cd client
npm run dev
```

Open **http://localhost:5173** and you're done.

### 4. Production build

```bash
# Backend
cd server && npm run build && npm start

# Frontend
cd client && npm run build && npm run preview
```

---

## 🗺 Future Roadmap

SkyCast is designed to keep growing. Next in the pipeline:

- **📈 Recharts-powered trend charts** — 7-day temperature / precipitation / UV lines with hover tooltips, replacing the current static forecast tabs. Dependency is already installed and ready to wire.
- **🤖 Smart AI Advisor (clothing & activity recommendations)** — a rules engine (later OpenAI-powered) that turns the current conditions + next 6 hours into personalised advice: _"Light jacket + umbrella after 16:00"_, _"Perfect evening for a run"_, etc.
- **🌡️ Global Heatmaps** — an interactive world map overlay (temperature, precipitation, wind) driven by Open-Meteo's tile API.
- **⌚ Apple Watch / Wear OS companion** — a lightweight glanceable complication showing current conditions + the next Time Machine hour.
- **🔔 Real Push Notifications** — upgrade the current Socket.io alert broadcaster to VAPID-signed Web Push so alerts survive the browser being closed.
- **📱 PWA + Offline mode** — Service Worker for instant loads and cached last-known forecast when offline.
- **🎨 Theme builder** — let users pick between "classic glass" (current), "paper light", and "retro terminal" aesthetics.

---

## 📜 License

MIT — free to fork, learn from, and build on. Attribution appreciated but not required.

---

## 🙏 Acknowledgements

- **[Open-Meteo](https://open-meteo.com/)** — generous, free, no-key weather API that powers the worldwide data path.
- **[amindi.ge](https://www.amindi.ge/)** — the beloved Georgian weather service whose forecasts anchor the country-specific data path.
- **[Framer Motion](https://www.framer.com/motion/)** — for making the "Sandro-style" liquid transitions a joy to implement.
- **[Lucide](https://lucide.dev/)** — for the clean, consistent icon set.

---

<p align="center">
  <sub>Built with care. Designed to feel alive.</sub>
</p>
