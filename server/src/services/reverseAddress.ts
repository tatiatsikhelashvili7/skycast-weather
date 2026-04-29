type NominatimReverseResponse = {
    display_name?: string;
    address?: Record<string, string | undefined>;
};
export type ReverseAddressResult = {
    displayName: string;
    short: string;
};
const TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, {
    at: number;
    value: ReverseAddressResult;
}>();
function pickShort(address: Record<string, string | undefined> | undefined): string {
    if (!address)
        return "";
    const road = address.road || address.pedestrian || address.footway;
    const house = address.house_number;
    const suburb = address.suburb || address.neighbourhood;
    const city = address.city || address.town || address.village || address.municipality;
    const state = address.state || address.region;
    const line1 = [road, house ? `#${house}` : ""].filter(Boolean).join(" ");
    const line2 = [suburb, city, state].filter(Boolean).join(", ");
    return [line1, line2].filter(Boolean).join(" · ");
}
export async function reverseAddress(lat: number, lon: number, precision: number): Promise<ReverseAddressResult | null> {
    if (!Number.isFinite(lat) || !Number.isFinite(lon))
        return null;
    const key = `${lat.toFixed(precision)},${lon.toFixed(precision)}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS)
        return hit.value;
    const url = "https://nominatim.openstreetmap.org/reverse" +
        `?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}` +
        "&zoom=18&addressdetails=1";
    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "SkyCast/1.0 (demo)",
                "Accept-Language": "en",
            },
        });
        if (!res.ok)
            return null;
        const data = (await res.json()) as NominatimReverseResponse;
        const displayName = data.display_name || "";
        if (!displayName)
            return null;
        const out: ReverseAddressResult = {
            displayName,
            short: pickShort(data.address),
        };
        cache.set(key, { at: Date.now(), value: out });
        return out;
    }
    catch {
        return null;
    }
}
