import { db } from "../db";
const BASE = "https://amindi.ge/ka/city";
const AMINDI_TTL_MS = 3 * 60 * 1000;
export const CITY_SLUGS: Record<string, string> = {
    თბილისი: "tbilisi",
    ბათუმი: "batumi",
    ქუთაისი: "kutaisi",
    რუსთავი: "rustavi",
    გორი: "gori",
    ზუგდიდი: "zugdidi",
    ფოთი: "poti",
    ახალციხე: "axalcixe",
    ახალქალაქი: "axalkalaki",
    თელავი: "telavi",
    ბაკურიანი: "bakuriani",
    გუდაური: "gudauri",
    ბორჯომი: "borjomi",
    მცხეთა: "mcxeta",
    მესტია: "mestia",
    სიღნაღი: "sighnaghi",
    ქობულეთი: "kobuleti",
    ოზურგეთი: "ozurgeti",
    ამბროლაური: "ambrolauri",
    ონი: "oni",
    ჭიათურა: "chiatura",
    საჩხერე: "sachxere",
    სამტრედია: "samtredia",
    სენაკი: "senaki",
    ხაშური: "xashuri",
    ხობი: "xobi",
    ლაგოდეხი: "lagodexi",
    ლანჩხუთი: "lanchxuti",
    მარნეული: "marneuli",
    ბოლნისი: "bolnisi",
    გურჯაანი: "gurjaani",
    საგარეჯო: "sagarejo",
    ზესტაფონი: "zestafoni",
    სოხუმი: "soxumi",
    ცხინვალი: "cxinvali",
    სურამი: "surami",
    შოვი: "shovi",
    შატილი: "shatili",
    ომალო: "omalo",
    უშგული: "ushguli",
    წინანდალი: "cinandali",
    წყნეთი: "cqneti",
    თიანეთი: "tianeti",
    აბასთუმანი: "abastumani",
    ურეკი: "ureki",
    გონიო: "gonio",
    ჩოხატაური: "choxatauri",
    ხარაგაული: "xaragauli",
    მანგლისი: "manglisi",
    სიონი: "sioni",
    შეკვეთილი: "shekvetili",
    "დავით-გარეჯი": "davitgareji",
    tbilisi: "tbilisi",
    batumi: "batumi",
    kutaisi: "kutaisi",
    rustavi: "rustavi",
    gori: "gori",
    zugdidi: "zugdidi",
    poti: "poti",
    telavi: "telavi",
    bakuriani: "bakuriani",
    gudauri: "gudauri",
    borjomi: "borjomi",
    mtskheta: "mcxeta",
    mcxeta: "mcxeta",
    mestia: "mestia",
    sighnaghi: "sighnaghi",
    kobuleti: "kobuleti",
    ozurgeti: "ozurgeti",
    sokhumi: "soxumi",
    sukhumi: "soxumi",
    tskhinvali: "cxinvali",
    akhaltsikhe: "axalcixe",
    khashuri: "xashuri",
};
export function resolveSlug(city: string): string | null {
    const k = city.trim();
    if (!k)
        return null;
    return CITY_SLUGS[k] ?? CITY_SLUGS[k.toLowerCase()] ?? null;
}
export function isGeorgianCity(city: string): boolean {
    return resolveSlug(city) !== null;
}
type CacheRow = {
    payload: string;
    fetched_at: number;
};
function getCached(key: string): any | null {
    const row = db
        .prepare("SELECT payload, fetched_at FROM weather_cache WHERE cache_key = ?")
        .get(key) as CacheRow | undefined;
    if (!row)
        return null;
    if (Date.now() - row.fetched_at > AMINDI_TTL_MS)
        return null;
    try {
        return JSON.parse(row.payload);
    }
    catch {
        return null;
    }
}
function setCached(key: string, payload: unknown): void {
    db.prepare(`INSERT INTO weather_cache (cache_key, payload, fetched_at)
     VALUES (?, ?, ?)
     ON CONFLICT(cache_key) DO UPDATE SET payload = excluded.payload, fetched_at = excluded.fetched_at`).run(key, JSON.stringify(payload), Date.now());
}
async function fetchHtml(slug: string): Promise<string> {
    const res = await fetch(`${BASE}/${slug}`, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 SkyCastBot/1.0",
            "Accept-Language": "ka,en;q=0.8",
        },
    });
    if (!res.ok)
        throw new Error(`amindi.ge ${res.status} for ${slug}`);
    return res.text();
}
function pick(re: RegExp, html: string, group = 1): string | null {
    const m = re.exec(html);
    return m ? m[group] : null;
}
function pickAll(re: RegExp, html: string): RegExpExecArray[] {
    const out: RegExpExecArray[] = [];
    let m: RegExpExecArray | null;
    const r = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    while ((m = r.exec(html)) !== null)
        out.push(m);
    return out;
}
function toNum(s: string | null | undefined): number {
    if (!s)
        return 0;
    const n = Number(String(s).replace(/[^\d.\-]/g, ""));
    return Number.isFinite(n) ? n : 0;
}
const ICON_MAP: Record<string, {
    main: string;
    description: string;
    icon: string;
    id: number;
}> = {
    "01": { main: "Clear", description: "clear sky", icon: "01d", id: 800 },
    "02": { main: "Clear", description: "mostly clear", icon: "01n", id: 800 },
    "03": { main: "Clouds", description: "few clouds", icon: "02d", id: 801 },
    "04": { main: "Clouds", description: "partly cloudy", icon: "03d", id: 802 },
    "05": { main: "Clouds", description: "cloudy", icon: "04d", id: 803 },
    "06": { main: "Clouds", description: "overcast", icon: "04d", id: 804 },
    "07": { main: "Clouds", description: "overcast", icon: "04n", id: 804 },
    "08": { main: "Mist", description: "mist", icon: "50d", id: 701 },
    "09": { main: "Mist", description: "fog", icon: "50d", id: 741 },
    "10": { main: "Rain", description: "light rain", icon: "10d", id: 500 },
    "11": { main: "Rain", description: "rain", icon: "10d", id: 501 },
    "12": { main: "Rain", description: "moderate rain", icon: "10d", id: 501 },
    "13": { main: "Rain", description: "showers", icon: "09d", id: 521 },
    "14": { main: "Thunderstorm", description: "thunderstorm", icon: "11d", id: 200 },
    "15": { main: "Thunderstorm", description: "thunderstorm with rain", icon: "11d", id: 201 },
    "16": { main: "Snow", description: "light snow", icon: "13d", id: 600 },
    "17": { main: "Snow", description: "snow", icon: "13d", id: 601 },
    "18": { main: "Snow", description: "heavy snow", icon: "13d", id: 602 },
    "19": { main: "Snow", description: "snow", icon: "13n", id: 601 },
    "20": { main: "Snow", description: "snow showers", icon: "13d", id: 620 },
};
function iconFromAmindi(imgPath: string | null): {
    main: string;
    description: string;
    icon: string;
    id: number;
} {
    if (!imgPath)
        return { main: "Clear", description: "clear sky", icon: "01d", id: 800 };
    const m = /weather(?:_small)?_(\d{2})\.png/i.exec(imgPath) || /\/(\d{2})\.png/.exec(imgPath);
    const code = m ? m[1] : "01";
    return (ICON_MAP[code] ?? { main: "Clouds", description: "cloudy", icon: "03d", id: 802 });
}
const PHRASE_HINTS: Record<string, string> = {
    მზიანი: "clear sky",
    მოღრუბლული: "cloudy",
    ნაწილობრივ: "partly cloudy",
    წვიმა: "rain",
    თოვლი: "snow",
    ჭექა: "thunderstorm",
    ნისლი: "mist",
    ნალექი: "precipitation",
};
function translatePhrase(ka: string): string {
    for (const key of Object.keys(PHRASE_HINTS)) {
        if (ka.includes(key))
            return PHRASE_HINTS[key];
    }
    return ka;
}
interface ParsedAmindi {
    cityKa: string;
    temp: number;
    phraseKa: string;
    icon: ReturnType<typeof iconFromAmindi>;
    windKph: number;
    windDir: string;
    pressure: number;
    feelsLike: number;
    humidity: number;
    visibilityKm: number;
    hours: {
        hour: string;
        temp: number;
        icon: ReturnType<typeof iconFromAmindi>;
    }[];
    days: {
        weekday: string;
        date: string;
        tempMin: number;
        tempMax: number;
        icon: ReturnType<typeof iconFromAmindi>;
    }[];
}
function parseAmindiHtml(html: string): ParsedAmindi {
    const cityKa = pick(/<div class="weather-current[^"]*">\s*<h1>([^<]+)<\/h1>/, html) ?? "";
    const phraseKa = pick(/<div class="current-phrase">([^<]+)<\/div>/, html)?.trim() ?? "";
    const tempMatch = /<div class="degrees">\s*<img src="([^"]+)"[^>]*\/>\s*<span><span[^>]*>([-\d.]+)<\/span>/.exec(html);
    const iconSrc = tempMatch ? tempMatch[1] : null;
    const temp = toNum(tempMatch ? tempMatch[2] : null);
    const icon = iconFromAmindi(iconSrc);
    const windBlock = pick(/<div class="wind">[\s\S]*?<div class="wind-text">([\s\S]*?)<\/div>\s*<\/div>/, html);
    let windKph = 0;
    let windDir = "";
    let pressure = 0;
    if (windBlock) {
        const wm = /([\d.]+)\s*kph(?:,\s*([A-Z]+))?/i.exec(windBlock);
        if (wm) {
            windKph = toNum(wm[1]);
            windDir = wm[2] ?? "";
        }
        pressure = toNum(pick(/([\d.]+)\s*kpa/i, windBlock));
    }
    const rightBlock = pick(/<div class="more-info-right">([\s\S]*?)<\/div>\s*<\/div>/, html);
    let feelsLike = temp;
    let humidity = 0;
    let visibilityKm = 10;
    if (rightBlock) {
        const pVals: string[] = pickAll(/<p>([\s\S]*?)<\/p>/g, rightBlock).map((m) => m[1].replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim());
        if (pVals[0])
            feelsLike = toNum(pVals[0]);
        for (const v of pVals) {
            if (v.includes("%"))
                humidity = toNum(v);
            else if (/\bkm\b/.test(v) && !/kph/i.test(v))
                visibilityKm = toNum(v);
        }
    }
    const hoursBlock = pick(/<div class="weather-hours[^"]*">([\s\S]*?)<a href="\/ka\/hourly\//, html);
    const hours: ParsedAmindi["hours"] = [];
    if (hoursBlock) {
        const re = /(\d{1,2})\s*საათი[\s\S]*?<img src="([^"]+)"[\s\S]*?<span[^>]*>([-\d.]+)<\/span>\s*°/g;
        let m: RegExpExecArray | null;
        while ((m = re.exec(hoursBlock)) !== null) {
            hours.push({
                hour: m[1],
                icon: iconFromAmindi(m[2]),
                temp: toNum(m[3]),
            });
        }
    }
    const daysBlock = pick(/<div class="weather-days">[\s\S]*?<div class="weather-days-right">([\s\S]*?)<\/div>\s*<\/div>/, html);
    const days: ParsedAmindi["days"] = [];
    if (daysBlock) {
        const cardRe = /<div class="card">[\s\S]*?<div class="weekDay">([^<]+)<\/div>\s*<p class="day">([^<]+)<\/p>[\s\S]*?<img\s+src="([^"]+)"[\s\S]*?<span[^>]*>([-\d.]+)<\/span>[\s°]*&nbsp;\s*<span[^>]*>([-\d.]+)<\/span>/g;
        let m: RegExpExecArray | null;
        while ((m = cardRe.exec(daysBlock)) !== null) {
            days.push({
                weekday: m[1].trim(),
                date: m[2].trim(),
                icon: iconFromAmindi(m[3]),
                tempMin: toNum(m[4]),
                tempMax: toNum(m[5]),
            });
        }
    }
    return {
        cityKa,
        temp,
        phraseKa,
        icon,
        windKph,
        windDir,
        pressure,
        feelsLike,
        humidity,
        visibilityKm,
        hours,
        days,
    };
}
function toOWMCurrent(cityInput: string, p: ParsedAmindi): any {
    const descriptionKa = p.phraseKa || "";
    const description = p.icon.description;
    const now = Math.floor(Date.now() / 1000);
    return {
        coord: { lat: 41.72, lon: 44.78 },
        weather: [
            {
                id: p.icon.id,
                main: p.icon.main,
                description,
                descriptionKa: descriptionKa || undefined,
                icon: p.icon.icon,
            },
        ],
        main: {
            temp: p.temp,
            feels_like: p.feelsLike || p.temp,
            temp_min: p.temp - 2,
            temp_max: p.temp + 2,
            pressure: Math.round((p.pressure || 101.3) * 10),
            humidity: p.humidity,
        },
        visibility: Math.round((p.visibilityKm || 10) * 1000),
        wind: {
            speed: Math.round((p.windKph / 3.6) * 10) / 10,
            deg: windDegFromCompass(p.windDir),
        },
        clouds: { all: p.icon.main === "Clouds" ? 70 : p.icon.main === "Clear" ? 5 : 30 },
        dt: now,
        sys: { country: "GE", sunrise: now - 3 * 3600, sunset: now + 6 * 3600 },
        name: p.cityKa || cityInput,
        source: "amindi.ge",
        updatedAt: new Date().toISOString(),
    };
}
function toOWMForecast(cityInput: string, p: ParsedAmindi): any {
    const now = Math.floor(Date.now() / 1000);
    const hourlyList = p.hours.slice(0, 16).map((h, i) => {
        const dt = now + i * 3600;
        const d = new Date(dt * 1000);
        const dtTxt = `${d.toISOString().slice(0, 10)} ${String(d.getUTCHours()).padStart(2, "0")}:00:00`;
        return {
            dt,
            main: {
                temp: h.temp,
                feels_like: h.temp - 1,
                temp_min: h.temp - 1,
                temp_max: h.temp + 1,
                humidity: p.humidity || 55,
                pressure: Math.round((p.pressure || 101.3) * 10),
            },
            weather: [
                {
                    id: h.icon.id,
                    main: h.icon.main,
                    description: h.icon.description,
                    icon: h.icon.icon,
                },
            ],
            wind: { speed: p.windKph / 3.6, deg: windDegFromCompass(p.windDir) },
            clouds: { all: h.icon.main === "Clouds" ? 70 : 10 },
            dt_txt: dtTxt,
        };
    });
    const startOfToday = new Date();
    startOfToday.setUTCHours(12, 0, 0, 0);
    const dailyList = p.days.slice(0, 7).map((d, i) => {
        const dObj = new Date(startOfToday.getTime() + i * 86400 * 1000);
        const dt = Math.floor(dObj.getTime() / 1000);
        const temp = (d.tempMin + d.tempMax) / 2;
        return {
            dt,
            main: {
                temp,
                feels_like: temp,
                temp_min: d.tempMin,
                temp_max: d.tempMax,
                humidity: 55,
                pressure: 1013,
            },
            weather: [
                {
                    id: d.icon.id,
                    main: d.icon.main,
                    description: d.icon.description,
                    icon: d.icon.icon,
                },
            ],
            wind: { speed: 3, deg: 0 },
            clouds: { all: 30 },
            dt_txt: `${dObj.toISOString().slice(0, 10)} 12:00:00`,
        };
    });
    const hourlyDayKeys = new Set(hourlyList.map((h) => h.dt_txt.slice(0, 10)));
    const supplementalDaily = dailyList.filter((d) => !hourlyDayKeys.has(d.dt_txt.slice(0, 10)));
    const list = [...hourlyList, ...supplementalDaily];
    return {
        cod: "200",
        message: 0,
        cnt: list.length,
        list,
        city: {
            id: 611717,
            name: p.cityKa || cityInput,
            country: "GE",
            sunrise: now - 3 * 3600,
            sunset: now + 6 * 3600,
        },
        source: "amindi.ge",
        updatedAt: new Date().toISOString(),
    };
}
function windDegFromCompass(dir: string): number {
    const map: Record<string, number> = {
        N: 0,
        NNE: 22,
        NE: 45,
        ENE: 67,
        E: 90,
        ESE: 112,
        SE: 135,
        SSE: 157,
        S: 180,
        SSW: 202,
        SW: 225,
        WSW: 247,
        W: 270,
        WNW: 292,
        NW: 315,
        NNW: 337,
    };
    return map[(dir || "").toUpperCase()] ?? 0;
}
export async function amindiGetCurrent(city: string): Promise<any | null> {
    const slug = resolveSlug(city);
    if (!slug)
        return null;
    const key = `amindi:current:v2:${slug}`;
    const cached = getCached(key);
    if (cached)
        return { ...cached, cached: true };
    try {
        const html = await fetchHtml(slug);
        const parsed = parseAmindiHtml(html);
        const out = toOWMCurrent(city, parsed);
        setCached(key, out);
        setCached(`amindi:forecast:v2:${slug}`, toOWMForecast(city, parsed));
        return { ...out, cached: false };
    }
    catch (err) {
        return null;
    }
}
export async function amindiGetForecast(city: string): Promise<any | null> {
    const slug = resolveSlug(city);
    if (!slug)
        return null;
    const key = `amindi:forecast:v2:${slug}`;
    const cached = getCached(key);
    if (cached)
        return { ...cached, cached: true };
    try {
        const html = await fetchHtml(slug);
        const parsed = parseAmindiHtml(html);
        const out = toOWMForecast(city, parsed);
        setCached(key, out);
        setCached(`amindi:current:v2:${slug}`, toOWMCurrent(city, parsed));
        return { ...out, cached: false };
    }
    catch (err) {
        return null;
    }
}
export function amindiSupportedCities(): string[] {
    return Object.keys(CITY_SLUGS).filter((k) => /[\u10A0-\u10FF]/.test(k));
}
