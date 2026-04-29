import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Plus, LogIn, LogOut, AlertCircle, MapPin as MapPinIcon, Loader2, } from "lucide-react";
import { useFriendsRoom, FriendPin } from "../../hooks/useFriendsRoom";
import { useAuth } from "../../context/AuthContext";
import type { WeatherResponse } from "../../types/weather";
import { RoomCodeCard } from "../ui/RoomCodeCard";
import { ROOM_CODE_LENGTH, STORAGE_KEYS } from "../../utils/constants";
import { useDeviceTier } from "../../hooks/useDeviceTier";
const FriendsMap = lazy(() => import("./FriendsMap").then((m) => ({ default: m.FriendsMap })));
function MapSkeleton() {
    return (<div className="relative h-80 md:h-[26rem] rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03] flex items-center justify-center" role="status" aria-label="Loading map">
      <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-sky-400/5 via-transparent to-violet-400/10"/>
      <div className="relative flex items-center gap-2 text-white/60 text-sm">
        <Loader2 className="w-4 h-4 animate-spin"/>
        Loading map…
      </div>
    </div>);
}
interface Props {
    current: WeatherResponse | null;
}
function FriendsRoomSectionInner({ current }: Props) {
    const tier = useDeviceTier();
    const isMobile = tier.isMobile || tier.isLowEnd || tier.saveData;
    const { user } = useAuth();
    const { code, pins, connected, lastError, createRoom, joinRoom, leaveRoom, updatePin, clearError, } = useFriendsRoom();
    const [name, setName] = useState<string>(() => {
        if (user?.email)
            return user.email.split("@")[0];
        return localStorage.getItem(STORAGE_KEYS.friendName) || "";
    });
    const [joinCode, setJoinCode] = useState("");
    const [busy, setBusy] = useState<"create" | "join" | null>(null);
    useEffect(() => {
        if (name)
            localStorage.setItem(STORAGE_KEYS.friendName, name);
    }, [name]);
    useEffect(() => {
        if (!code || !current)
            return;
        updatePin(buildPinFromWeather(name, current));
    }, [code, current, name, updatePin]);
    const canInteract = useMemo(() => Boolean(current && name.trim()), [current, name]);
    const handleCreate = useCallback(async () => {
        if (!current) {
            clearError();
            return;
        }
        if (!name.trim()) {
            clearError();
            return;
        }
        setBusy("create");
        try {
            await createRoom(buildPinFromWeather(name, current));
        }
        catch {
        }
        finally {
            setBusy(null);
        }
    }, [createRoom, current, name, clearError]);
    const handleJoin = useCallback(async () => {
        if (!current) {
            clearError();
            return;
        }
        if (!name.trim() || !joinCode.trim()) {
            clearError();
            return;
        }
        setBusy("join");
        try {
            await joinRoom(joinCode, buildPinFromWeather(name, current));
            setJoinCode("");
        }
        catch {
        }
        finally {
            setBusy(null);
        }
    }, [current, joinCode, joinRoom, name, clearError]);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const roomParam = params.get("room");
        if (roomParam)
            setJoinCode(roomParam.toUpperCase());
    }, []);
    const selfId = pins.find((p) => p.name === name)?.id ?? null;
    return (<div className="max-w-5xl mx-auto glass rounded-3xl p-4 sm:p-5 md:p-6 relative overflow-hidden">
      <div aria-hidden className="absolute -top-16 -left-16 w-72 h-72 rounded-full pointer-events-none" style={{
            background: "radial-gradient(circle, rgba(139,92,246,0.25), transparent 65%)",
            filter: "blur(50px)",
        }}/>

      <div className="relative flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-violet-500/15 border border-violet-300/25 flex items-center justify-center">
            <Users className="w-5 h-5 text-violet-200"/>
          </span>
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-[var(--text-muted)]">
              Weather together
            </div>
            <h4 className="text-display text-xl md:text-2xl font-light tracking-wide mt-0.5 text-[var(--text-heading)]">
              Friends on the map
            </h4>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${connected
            ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-200"
            : "border-white/10 bg-white/5 text-white/50"}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connected ? "bg-emerald-400 animate-pulse" : "bg-white/40"}`}/>
            {connected ? "Live" : "Connecting…"}
          </span>
          {code && (<span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-white/10 bg-white/5 text-white/70">
              <Users className="w-3 h-3"/>
              {pins.length} {pins.length === 1 ? "person" : "people"}
            </span>)}
        </div>
      </div>

      <AnimatePresence>
        {lastError && (<motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="relative mt-3 flex items-start gap-2 text-xs text-rose-100 bg-rose-500/10 border border-rose-400/25 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5"/>
            <span className="flex-1">{lastError}</span>
            <button onClick={clearError} className="text-rose-200/70 hover:text-rose-100">
              ×
            </button>
          </motion.div>)}
      </AnimatePresence>

      <div className="relative mt-5">
        {!code ? (<div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block">
                <span className="text-[11px] uppercase tracking-widest text-[var(--text-muted)]">
                  Your handle
                </span>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="How should we call you?" maxLength={40} className="label-input mt-1.5"/>
              </label>
            </div>

            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-heading)]">
                <Plus className="w-4 h-4 text-emerald-300"/>
                Create a room
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                You'll get a short 4-letter code. Share it with anyone you
                want on the map.
              </p>
              <motion.button whileHover={!isMobile && canInteract ? { scale: 1.02, y: -1 } : undefined} whileTap={!isMobile && canInteract ? { scale: 0.96 } : undefined} onClick={handleCreate} disabled={!canInteract || busy !== null} className="btn-primary w-full mt-3 disabled:opacity-50 disabled:cursor-not-allowed !bg-gradient-to-br !from-emerald-400/80 !to-teal-500/80 hover:!from-emerald-400 hover:!to-teal-500 border-emerald-300/30">
                {busy === "create" ? (<Loader2 className="w-4 h-4 animate-spin"/>) : (<Plus className="w-4 h-4"/>)}
                Create room
              </motion.button>
            </div>

            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--text-heading)]">
                <LogIn className="w-4 h-4 text-sky-300"/>
                Join with a code
              </div>
              <div className="flex gap-2 mt-3">
                <input type="text" value={joinCode} onChange={(e) => setJoinCode(e.target.value.toUpperCase())} placeholder="ABCD" maxLength={ROOM_CODE_LENGTH} className="label-input !w-28 text-center tracking-[0.4em] font-mono text-lg uppercase"/>
                <motion.button whileHover={!isMobile && canInteract ? { scale: 1.02, y: -1 } : undefined} whileTap={!isMobile && canInteract ? { scale: 0.96 } : undefined} onClick={handleJoin} disabled={!canInteract ||
                busy !== null ||
                joinCode.trim().length < ROOM_CODE_LENGTH} className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed !bg-gradient-to-br !from-sky-400/80 !to-indigo-500/80 hover:!from-sky-400 hover:!to-indigo-500 border-sky-300/30">
                  {busy === "join" ? (<Loader2 className="w-4 h-4 animate-spin"/>) : (<LogIn className="w-4 h-4"/>)}
                  Join
                </motion.button>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Got a link from a friend? Paste their code above.
              </p>
            </div>

            {!current && (<div className="md:col-span-2 text-xs text-white/50 bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5"/>
                Search a city first so your friends can see where you are.
              </div>)}
          </div>) : (<div className="space-y-5">
            <div className="flex justify-end">
              <motion.button whileHover={!isMobile ? { scale: 1.03, y: -1 } : undefined} whileTap={!isMobile ? { scale: 0.96 } : undefined} onClick={leaveRoom} className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-400/25 text-rose-100 transition-colors">
                <LogOut className="w-4 h-4"/>
                Leave room
              </motion.button>
            </div>

            <RoomCodeCard code={code} members={pins.length}/>

            <Suspense fallback={<MapSkeleton />}>
              <FriendsMap pins={pins} selfId={selfId}/>
            </Suspense>

            
            <div className="flex flex-wrap gap-2">
              {pins.map((p) => {
                const isMe = p.id === selfId;
                return (<div key={p.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs min-w-0 max-w-full ${isMe
                        ? "bg-blue-500/15 border-blue-400/30 text-blue-100"
                        : "bg-white/5 border-white/10 text-white/75"}`}>
                    <MapPinIcon className="w-3 h-3"/>
                    <span className="font-medium truncate">
                      {p.name}
                      {isMe && <span className="text-blue-300/80"> (you)</span>}
                    </span>
                    <span className="text-white/50 truncate">· {p.city}</span>
                    {p.temp !== null && (<span className="font-semibold">
                        {Math.round(p.temp)}°
                      </span>)}
                  </div>);
            })}
            </div>
          </div>)}
      </div>
    </div>);
}
export const FriendsRoomSection = memo(FriendsRoomSectionInner);
function buildPinFromWeather(name: string, w: WeatherResponse): Omit<FriendPin, "id" | "updatedAt"> {
    return {
        name: name.trim() || "Guest",
        city: w.name,
        country: w.sys?.country ?? null,
        lat: w.coord.lat,
        lon: w.coord.lon,
        temp: w.main.temp,
        condition: w.weather[0]?.main ?? null,
        icon: w.weather[0]?.icon ?? null,
    };
}
