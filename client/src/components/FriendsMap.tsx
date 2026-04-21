import { memo, useEffect, useMemo, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { FriendPin } from "../hooks/useFriendsRoom";

interface Props {
  pins: FriendPin[];
  selfId?: string | null;
}

/* ─────────── Neon marker colour palette ───────────
   These are deliberately vivid — they need to pop against the dark
   CartoDB tiles while still matching the app's indigo/cyan/violet
   accent hierarchy. Self = cyan (drawing your own eye), friends =
   magenta so multiple people are instantly distinguishable. */
const COLORS = {
  selfCore: "#22d3ee", // cyan-400
  selfGlow: "rgba(34, 211, 238, 0.55)",
  friendCore: "#e879f9", // fuchsia-400
  friendGlow: "rgba(232, 121, 249, 0.55)",
};

/**
 * Inject the keyframes for the neon marker pulse + drop animations once
 * per page. Leaflet's `divIcon` only accepts raw HTML so we can't use
 * Framer Motion inside a marker — regular CSS keyframes are the cleanest
 * way to get a real-time feel when a pin appears or updates.
 */
function ensureMarkerStyles(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById("skycast-neon-marker-styles")) return;

  const style = document.createElement("style");
  style.id = "skycast-neon-marker-styles";
  style.textContent = `
    @keyframes skycast-pin-drop {
      0%   { transform: translate(-24px, -68px) scale(0.6); opacity: 0; }
      60%  { transform: translate(-24px, -44px) scale(1.05); opacity: 1; }
      100% { transform: translate(-24px, -48px) scale(1); opacity: 1; }
    }
    @keyframes skycast-pin-pulse {
      0%, 100% { opacity: 0.35; transform: scale(1); }
      50%      { opacity: 0.75; transform: scale(1.25); }
    }
    @keyframes skycast-pin-halo {
      0%   { transform: scale(0.6); opacity: 0.55; }
      100% { transform: scale(1.9); opacity: 0; }
    }
    .skycast-pin-outer {
      position: relative;
      width: 48px;
      height: 56px;
      transform: translate(-24px, -48px);
      animation: skycast-pin-drop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    }
    .skycast-pin-halo {
      position: absolute;
      left: 50%;
      bottom: -6px;
      width: 28px;
      height: 28px;
      margin-left: -14px;
      border-radius: 9999px;
      border: 2px solid currentColor;
      opacity: 0;
      pointer-events: none;
      animation: skycast-pin-halo 2.6s ease-out infinite;
    }
    .skycast-pin-halo.delayed {
      animation-delay: 1.3s;
    }
    .skycast-pin-aura {
      position: absolute;
      inset: -4px;
      border-radius: 24px;
      filter: blur(10px);
      opacity: 0.8;
      animation: skycast-pin-pulse 2.4s ease-in-out infinite;
      pointer-events: none;
    }
    .skycast-pin-label {
      position: absolute;
      left: 0; right: 0;
      top: 2px;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 8px;
      font-family: 'Inter', system-ui, sans-serif;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.01em;
      color: #ffffff;
    }
    /* Leaflet popup overrides — match the glass aesthetic */
    .leaflet-popup-content-wrapper.skycast-popup {
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 14px;
      box-shadow: 0 20px 50px -20px rgba(0, 0, 0, 0.6);
      color: rgba(255, 255, 255, 0.92);
    }
    .leaflet-popup-tip.skycast-popup-tip {
      background: rgba(15, 23, 42, 0.92);
      border: 1px solid rgba(255, 255, 255, 0.12);
    }
    .leaflet-container a.leaflet-popup-close-button { display: none; }
  `;
  document.head.appendChild(style);
}

/**
 * Render a neon-style SVG pin as a Leaflet DivIcon. The pin drops in with
 * a bouncy spring, is outlined by a soft blurred aura for the "glowing"
 * feel, and emits two phase-offset halo rings so real-time presence
 * feels *alive*.
 */
function makeIcon(pin: FriendPin, isSelf: boolean): L.DivIcon {
  ensureMarkerStyles();

  const core = isSelf ? COLORS.selfCore : COLORS.friendCore;
  const glow = isSelf ? COLORS.selfGlow : COLORS.friendGlow;
  const label =
    pin.temp !== null && !Number.isNaN(pin.temp)
      ? `${Math.round(pin.temp)}°`
      : "·";
  const uid = pin.id.replace(/[^a-z0-9]/gi, "") || "p";

  const html = `
    <div class="skycast-pin-outer" style="color:${core}">
      <div class="skycast-pin-aura" style="background: radial-gradient(circle at 50% 40%, ${glow} 0%, transparent 70%);"></div>
      <svg viewBox="0 0 48 56" width="48" height="56" style="position:relative; overflow:visible;">
        <defs>
          <radialGradient id="fill-${uid}" cx="50%" cy="32%" r="55%">
            <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95" />
            <stop offset="55%" stop-color="${core}" stop-opacity="1" />
            <stop offset="100%" stop-color="${core}" stop-opacity="1" />
          </radialGradient>
          <filter id="glow-${uid}" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path
          d="M24 0 C 37.25 0 46 8.75 46 22 C 46 36 28 54 24 54 C 20 54 2 36 2 22 C 2 8.75 10.75 0 24 0 Z"
          fill="url(#fill-${uid})"
          stroke="${core}"
          stroke-width="1.4"
          filter="url(#glow-${uid})"
          opacity="0.98"
        />
        <circle cx="24" cy="22" r="7" fill="rgba(15, 23, 42, 0.55)" />
      </svg>
      <div class="skycast-pin-label" style="text-shadow: 0 0 8px ${glow};">${label}</div>
      <span class="skycast-pin-halo"></span>
      <span class="skycast-pin-halo delayed"></span>
    </div>
  `;
  return L.divIcon({
    html,
    className: "", // reset Leaflet's default styling so our HTML wins
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

/**
 * Quietly re-fit the map every time the set of pins changes meaningfully.
 * A single pin triggers a `flyTo` (keeps a comfortable zoom level); two or
 * more pins fit to their bounding box. Uses a fingerprint to skip identity
 * re-fits when only temp/condition change.
 */
function FitBounds({ pins }: { pins: FriendPin[] }) {
  const map = useMap();
  const lastSig = useRef<string>("");

  useEffect(() => {
    const sig = pins
      .map((p) => `${p.id}:${p.lat.toFixed(2)},${p.lon.toFixed(2)}`)
      .join("|");
    if (sig === lastSig.current) return;
    lastSig.current = sig;

    if (pins.length === 0) return;
    if (pins.length === 1) {
      map.flyTo([pins[0].lat, pins[0].lon], 6, { duration: 0.8 });
      return;
    }
    const bounds = L.latLngBounds(pins.map((p) => [p.lat, p.lon]));
    map.flyToBounds(bounds, { padding: [60, 60], duration: 0.9, maxZoom: 6 });
  }, [pins, map]);

  return null;
}

function FriendsMapInner({ pins, selfId }: Props) {
  const initialCenter = useMemo<[number, number]>(() => {
    const me = pins.find((p) => p.id === selfId);
    if (me) return [me.lat, me.lon];
    if (pins[0]) return [pins[0].lat, pins[0].lon];
    return [20, 10];
  }, [pins, selfId]);

  return (
    <div className="relative h-80 md:h-[26rem] rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_25px_80px_-40px_rgba(34,211,238,0.35)]">
      <MapContainer
        center={initialCenter}
        zoom={4}
        scrollWheelZoom
        worldCopyJump
        className="w-full h-full"
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <FitBounds pins={pins} />

        {pins.map((p) => {
          const isSelf = p.id === selfId;
          return (
            <Marker
              key={p.id}
              position={[p.lat, p.lon]}
              icon={makeIcon(p, isSelf)}
            >
              <Popup
                closeButton={false}
                className="skycast-popup-shell"
              >
                <div
                  style={{
                    fontFamily: "Inter, sans-serif",
                    minWidth: 180,
                    color: "rgba(255,255,255,0.92)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.25em",
                      color: isSelf ? COLORS.selfCore : COLORS.friendCore,
                    }}
                  >
                    {isSelf ? "Your location" : "Friend"}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#ffffff",
                      marginTop: 2,
                    }}
                  >
                    {p.name}
                  </div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                    {p.city}
                    {p.country ? `, ${p.country}` : ""}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 6,
                      marginTop: 8,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 200,
                        color: "#ffffff",
                      }}
                    >
                      {p.temp !== null ? `${Math.round(p.temp)}°` : "—"}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: "rgba(255,255,255,0.55)",
                        textTransform: "capitalize",
                      }}
                    >
                      {p.condition || ""}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: "rgba(255,255,255,0.4)",
                      marginTop: 6,
                    }}
                  >
                    Updated {new Date(p.updatedAt).toLocaleTimeString()}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Vignette tint so the dark map blends with the app chrome */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(15,23,42,0.15) 0%, transparent 25%, transparent 75%, rgba(15,23,42,0.35) 100%)",
        }}
      />
      {/* Subtle corner glows that match the pin colours */}
      <div
        className="pointer-events-none absolute -top-16 -left-16 w-60 h-60 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(34,211,238,0.18), transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="pointer-events-none absolute -bottom-16 -right-16 w-60 h-60 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(232,121,249,0.16), transparent 70%)",
          filter: "blur(40px)",
        }}
      />
    </div>
  );
}

/**
 * Memoised — Leaflet re-initialisation is expensive, and this component
 * should really only re-render when its pin set genuinely changes.
 */
export const FriendsMap = memo(FriendsMapInner, (prev, next) => {
  if (prev.selfId !== next.selfId) return false;
  if (prev.pins.length !== next.pins.length) return false;
  for (let i = 0; i < prev.pins.length; i++) {
    const a = prev.pins[i];
    const b = next.pins[i];
    if (
      a.id !== b.id ||
      a.lat !== b.lat ||
      a.lon !== b.lon ||
      a.temp !== b.temp ||
      a.condition !== b.condition ||
      a.updatedAt !== b.updatedAt
    ) {
      return false;
    }
  }
  return true;
});
