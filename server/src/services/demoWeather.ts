/**
 * Mock weather generator used when OPENWEATHER_API_KEY is not set.
 * Produces believable "current" and "forecast" payloads in the exact shape
 * the frontend expects. Deterministic per city, so re-fetches look stable.
 */

const CONDITIONS = [
  { id: 800, main: "Clear", description: "clear sky", icon: "01d" },
  { id: 801, main: "Clouds", description: "few clouds", icon: "02d" },
  { id: 803, main: "Clouds", description: "broken clouds", icon: "04d" },
  { id: 500, main: "Rain", description: "light rain", icon: "10d" },
  { id: 501, main: "Rain", description: "moderate rain", icon: "10d" },
  { id: 200, main: "Thunderstorm", description: "thunderstorm", icon: "11d" },
  { id: 600, main: "Snow", description: "light snow", icon: "13d" },
  { id: 701, main: "Mist", description: "mist", icon: "50d" },
];

// Well-known cities with realistic coords. Unknown cities get pseudo-random ones.
const KNOWN: Record<string, { lat: number; lon: number; country: string; baseTemp: number }> = {
  tbilisi: { lat: 41.72, lon: 44.78, country: "GE", baseTemp: 18 },
  tokyo: { lat: 35.68, lon: 139.69, country: "JP", baseTemp: 16 },
  london: { lat: 51.51, lon: -0.13, country: "GB", baseTemp: 12 },
  "new york": { lat: 40.71, lon: -74.01, country: "US", baseTemp: 15 },
  paris: { lat: 48.85, lon: 2.35, country: "FR", baseTemp: 14 },
  berlin: { lat: 52.52, lon: 13.4, country: "DE", baseTemp: 12 },
  dubai: { lat: 25.2, lon: 55.27, country: "AE", baseTemp: 32 },
  moscow: { lat: 55.75, lon: 37.62, country: "RU", baseTemp: 8 },
  sydney: { lat: -33.87, lon: 151.21, country: "AU", baseTemp: 22 },
  "los angeles": { lat: 34.05, lon: -118.24, country: "US", baseTemp: 23 },
  istanbul: { lat: 41.01, lon: 28.98, country: "TR", baseTemp: 17 },
  madrid: { lat: 40.42, lon: -3.7, country: "ES", baseTemp: 19 },
  rome: { lat: 41.9, lon: 12.5, country: "IT", baseTemp: 20 },
  mumbai: { lat: 19.08, lon: 72.88, country: "IN", baseTemp: 30 },
  "são paulo": { lat: -23.55, lon: -46.63, country: "BR", baseTemp: 22 },
  cairo: { lat: 30.04, lon: 31.24, country: "EG", baseTemp: 28 },
};

// Deterministic PRNG from string → 0..1
function seedFrom(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return (h % 100000) / 100000;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[Math.floor(seed * arr.length) % arr.length];
}

function titleCase(s: string): string {
  return s
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

export function isDemoMode(apiKey: string): boolean {
  return !apiKey || apiKey.trim().length === 0;
}

export function mockCurrent(cityQuery: string): any {
  const key = cityQuery.toLowerCase().trim();
  const meta =
    KNOWN[key] ??
    {
      lat: (seedFrom(key) * 180 - 90).toFixed(2),
      lon: (seedFrom(key + "_lon") * 360 - 180).toFixed(2),
      country: "XX",
      baseTemp: 10 + Math.round(seedFrom(key) * 20),
    };

  const seed = seedFrom(key);
  const hourSeed = (Date.now() / 3_600_000) % 1;
  const cond = pick(CONDITIONS, (seed + hourSeed * 0.3) % 1);

  // Time-of-day adjustment for icon day/night
  const hour = new Date().getHours();
  const isNight = hour < 6 || hour >= 20;
  const icon = isNight ? cond.icon.replace("d", "n") : cond.icon;

  const baseTemp = Number(meta.baseTemp);
  const temp = baseTemp + (seed - 0.5) * 6 + (isNight ? -3 : 2);
  const feelsLike = temp - 1 + seed * 2;

  const now = Math.floor(Date.now() / 1000);

  return {
    coord: { lat: Number(meta.lat), lon: Number(meta.lon) },
    weather: [{ ...cond, icon }],
    main: {
      temp: Number(temp.toFixed(1)),
      feels_like: Number(feelsLike.toFixed(1)),
      temp_min: Number((temp - 3).toFixed(1)),
      temp_max: Number((temp + 3).toFixed(1)),
      pressure: 1005 + Math.round(seed * 25),
      humidity: 40 + Math.round(seed * 50),
    },
    visibility: cond.main === "Mist" ? 3000 : 10000,
    wind: {
      speed: Number((2 + seed * 8).toFixed(1)),
      deg: Math.round(seed * 360),
    },
    clouds: { all: cond.main === "Clear" ? 5 : 30 + Math.round(seed * 60) },
    dt: now,
    sys: {
      country: meta.country,
      sunrise: now - 3600 * 3,
      sunset: now + 3600 * 6,
    },
    id: Math.floor(seed * 1_000_000),
    name: titleCase(cityQuery),
    demo: true,
  };
}

export function mockForecast(cityQuery: string): any {
  const key = cityQuery.toLowerCase().trim();
  const meta = KNOWN[key] ?? { country: "XX", baseTemp: 15 };
  const seed = seedFrom(key);
  const baseTemp = Number(meta.baseTemp);

  const now = Math.floor(Date.now() / 1000);
  const list = Array.from({ length: 40 }).map((_, i) => {
    const ts = now + i * 3 * 3600;
    const hour = new Date(ts * 1000).getHours();
    const diurnal = Math.sin(((hour - 6) / 24) * Math.PI * 2) * 4;
    const noise = Math.sin(i * 0.7 + seed * 10) * 2;
    const temp = baseTemp + diurnal + noise;
    const cond = pick(CONDITIONS, (seed + i * 0.11) % 1);
    const isNight = hour < 6 || hour >= 20;
    const icon = isNight ? cond.icon.replace("d", "n") : cond.icon;
    const d = new Date(ts * 1000);
    const dtTxt = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(
      2,
      "0"
    )}-${String(d.getUTCDate()).padStart(2, "0")} ${String(
      d.getUTCHours()
    ).padStart(2, "0")}:00:00`;

    return {
      dt: ts,
      main: {
        temp: Number(temp.toFixed(1)),
        feels_like: Number((temp - 1).toFixed(1)),
        temp_min: Number((temp - 2).toFixed(1)),
        temp_max: Number((temp + 2).toFixed(1)),
        humidity: 50 + Math.round(Math.sin(i) * 20 + 10),
        pressure: 1010,
      },
      weather: [{ ...cond, icon }],
      wind: { speed: Number((3 + seed * 4).toFixed(1)), deg: 180 },
      clouds: { all: cond.main === "Clear" ? 5 : 40 },
      dt_txt: dtTxt,
    };
  });

  return {
    cod: "200",
    message: 0,
    cnt: list.length,
    list,
    city: {
      id: Math.floor(seed * 1_000_000),
      name: titleCase(cityQuery),
      country: meta.country,
      sunrise: now - 3600 * 3,
      sunset: now + 3600 * 6,
    },
    demo: true,
  };
}

export function mockCoords(lat: number, lon: number): any {
  const cityName = `Lat ${lat.toFixed(1)}, Lon ${lon.toFixed(1)}`;
  const base = mockCurrent(cityName);
  return { ...base, coord: { lat, lon }, name: cityName };
}
