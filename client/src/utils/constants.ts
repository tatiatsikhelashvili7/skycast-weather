/**
 * Centralized runtime constants for the SkyCast client.
 *
 * Any value that could otherwise live as a "magic number" scattered across
 * components lives here. Keeping them in one file makes the app's tuning
 * surface easy to reason about, and means non-code reviewers (e.g. a
 * product manager) can see every tuneable in one place.
 *
 * NOTE: values imported into render paths should be primitives (not
 * objects) so React's referential equality stays stable across renders.
 */

/** How long a transient toast alert stays on screen before auto-dismissing. */
export const ALERT_AUTO_DISMISS_MS = 15_000;

/** Number of characters in a "Weather together" room code. */
export const ROOM_CODE_LENGTH = 4;

/** Characters allowed in a room code (uppercase, no confusing 0/O/1/I/L). */
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** LocalStorage keys — centralised so we never duplicate strings. */
export const STORAGE_KEYS = {
  locationAsked: "skycast_location_asked",
  friendName: "skycast_friend_name",
  preferredUnit: "skycast_unit",
} as const;

/** Max number of hourly samples the TimeSlider scrubs over. */
export const TIME_MACHINE_MAX_HOURS = 48;

/** Crossfade duration between background scenes (ms). */
export const BACKGROUND_CROSSFADE_MS = 900;

/** Default map center (lat/lon) when the friends room has zero pins. */
export const FRIENDS_MAP_FALLBACK_CENTER = { lat: 20, lon: 10 } as const;

/** Debounce for rapid city-search typing so we don't hammer the backend. */
export const SEARCH_DEBOUNCE_MS = 350;

/** Minimum reported wind speed (m/s) before we show a "calm" label. */
export const CALM_WIND_MS = 1.5;
