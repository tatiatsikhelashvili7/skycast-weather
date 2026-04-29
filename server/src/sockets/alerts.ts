import { Server } from "socket.io";
import { randomUUID } from "crypto";
const STORM_CONDITIONS = ["Thunderstorm", "Tornado", "Squall"];
const HEAVY_CONDITIONS = ["Rain", "Snow", "Drizzle"];
const sampleAlerts = [
    { level: "warning" as const, title: "Thunderstorm Watch", message: "Lightning activity detected nearby." },
    { level: "info" as const, title: "Wind Advisory", message: "Gusts up to 55 km/h expected this evening." },
    { level: "danger" as const, title: "Severe Storm", message: "Heavy rain + hail reported in your area." },
    { level: "info" as const, title: "UV Alert", message: "UV Index is very high — protect your skin." },
    { level: "warning" as const, title: "Flood Watch", message: "Rising water levels near rivers." },
];
const liveFacts = [
    { title: "🌡️ Hottest right now", message: "Ahvaz, Iran is currently the hottest major city on Earth." },
    { title: "❄️ Coldest right now", message: "Vostok Station, Antarctica — often below −70 °C." },
    { title: "🌪️ Storm tracker", message: "Three active tropical systems are being tracked worldwide." },
    { title: "🌅 Sunrise somewhere", message: "Tokyo is watching a sunrise over the Pacific right now." },
    { title: "🌙 Moonlit cities", message: "Reykjavík and Buenos Aires are both under moonlight." },
    { title: "💧 Rainiest place", message: "Mawsynram, India gets over 11,000 mm of rain per year." },
    { title: "☀️ Sunniest place", message: "Yuma, Arizona averages 4,015 hours of sunshine annually." },
    { title: "🌬️ Windiest spot", message: "Commonwealth Bay, Antarctica — winds can top 240 km/h." },
    { title: "🌊 Ocean temps", message: "Surface of the Caribbean is above 27 °C today." },
    { title: "🏔️ Snow report", message: "The Alps received fresh powder overnight." },
    { title: "⚡ Did you know?", message: "Lightning strikes Earth about 100 times every second." },
    { title: "🌈 Rainbow alert", message: "Rainbows are always circles — you just don't see the bottom half." },
    { title: "☁️ Cloud trivia", message: "A single cumulus cloud can weigh over 500 tonnes." },
    { title: "🧊 Hailstones", message: "The largest recorded hailstone was 20 cm across." },
    { title: "🔥 Heat record", message: "Death Valley, USA, hit 56.7 °C — Earth's hottest reliable reading." },
];
export function attachAlertStream(io: Server): void {
    io.on("connection", (socket) => {
        socket.emit("alerts:hello", { ok: true, ts: Date.now() });
        const welcome = liveFacts[Math.floor(Math.random() * liveFacts.length)];
        socket.emit("alerts:fact", {
            id: randomUUID(),
            ts: Date.now(),
            level: "info",
            ...welcome,
        });
        socket.on("alerts:subscribe", (payload: {
            city?: string;
            condition?: string;
        } = {}) => {
            socket.data.city = payload.city || "Earth";
            socket.data.condition = payload.condition || "Clear";
            socket.emit("alerts:subscribed", { city: socket.data.city });
        });
    });
    const scheduleAlert = () => {
        const delay = 60000 + Math.random() * 60000;
        setTimeout(() => {
            const alert = {
                id: randomUUID(),
                ts: Date.now(),
                ...sampleAlerts[Math.floor(Math.random() * sampleAlerts.length)],
            };
            io.emit("alerts:new", alert);
            scheduleAlert();
        }, delay);
    };
    scheduleAlert();
    const scheduleFact = () => {
        const delay = 45000 + Math.random() * 30000;
        setTimeout(() => {
            const fact = liveFacts[Math.floor(Math.random() * liveFacts.length)];
            io.emit("alerts:fact", {
                id: randomUUID(),
                ts: Date.now(),
                level: "info",
                ...fact,
            });
            scheduleFact();
        }, delay);
    };
    scheduleFact();
}
export function maybeBroadcastFromWeather(io: Server, city: string, condition: string): void {
    if (STORM_CONDITIONS.includes(condition)) {
        io.emit("alerts:new", {
            id: randomUUID(),
            ts: Date.now(),
            level: "danger",
            title: `Storm detected in ${city}`,
            message: `Current conditions: ${condition}. Take shelter if outdoors.`,
        });
    }
    else if (HEAVY_CONDITIONS.includes(condition)) {
        io.emit("alerts:new", {
            id: randomUUID(),
            ts: Date.now(),
            level: "warning",
            title: `Heavy ${condition.toLowerCase()} in ${city}`,
            message: `Plan for wet conditions.`,
        });
    }
}
