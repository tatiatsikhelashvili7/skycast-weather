/**
 * Weather API service layer.
 *
 * Public entry point for every HTTP call that touches the SkyCast backend.
 * Consumers (hooks, components) should prefer importing from here instead
 * of reaching directly into the low-level `lib/api` module. The indirection
 * lets us swap implementations (e.g. add SWR/TanStack Query, move to GraphQL,
 * inject a mock in tests) without a sweeping refactor.
 */

export {
  api,
  geocodeCity,
  reverseGeocode,
  primaryCondition,
} from "../lib/api";

export type {
  WeatherResponse,
  WeatherCondition,
  ForecastResponse,
  Favorite,
  LocatedPlace,
} from "../lib/api";
