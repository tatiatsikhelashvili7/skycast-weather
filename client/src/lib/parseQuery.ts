/**
 * Detect whether a free-text search query is a pair of coordinates
 * ("41.74, 44.76" / "41.74 44.76" / "41.74;44.76") or a city name.
 */

export interface CoordQuery {
  kind: "coords";
  lat: number;
  lon: number;
}
export interface CityQuery {
  kind: "city";
  city: string;
}
export type ParsedQuery = CoordQuery | CityQuery;

const COORD_RE =
  /^\s*(-?\d{1,3}(?:\.\d+)?)\s*(?:[,;]\s*|\s+)(-?\d{1,3}(?:\.\d+)?)\s*$/;

export function parseQuery(raw: string): ParsedQuery {
  const q = raw.trim();
  const m = q.match(COORD_RE);
  if (m) {
    const lat = Number(m[1]);
    const lon = Number(m[2]);
    if (
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      lat >= -90 &&
      lat <= 90 &&
      lon >= -180 &&
      lon <= 180
    ) {
      return { kind: "coords", lat, lon };
    }
  }
  return { kind: "city", city: q };
}
