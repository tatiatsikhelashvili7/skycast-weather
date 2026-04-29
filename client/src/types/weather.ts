export interface WeatherCondition {
    id: number;
    main: string;
    description: string;
    descriptionKa?: string;
    icon: string;
}
export interface WeatherResponse {
    name: string;
    weather_code?: number;
    is_day?: 0 | 1;
    sys: {
        country: string;
        sunrise: number;
        sunset: number;
        timezone?: string;
        utc_offset_seconds?: number;
    };
    coord: {
        lat: number;
        lon: number;
    };
    main: {
        temp: number;
        feels_like: number;
        humidity: number;
        pressure: number;
        temp_min: number;
        temp_max: number;
    };
    weather: WeatherCondition[];
    wind: {
        speed: number;
        deg: number;
    };
    visibility: number;
    clouds: {
        all: number;
    };
    dt: number;
    uvIndex?: number;
    cached?: boolean;
    source?: string;
    updatedAt?: string;
}
export interface ForecastPoint {
    dt: number;
    is_day?: 0 | 1;
    main: {
        temp: number;
        humidity: number;
    };
    weather: {
        main: string;
        description: string;
        icon: string;
    }[];
    wind: {
        speed: number;
    };
    dt_txt: string;
}
export interface ForecastResponse {
    list: ForecastPoint[];
    city: {
        name: string;
        country: string;
        sunrise: number;
        sunset: number;
        timezone?: string;
        utc_offset_seconds?: number;
    };
}
export interface Favorite {
    id: number;
    city: string;
    country: string | null;
    lat: number | null;
    lon: number | null;
    created_at: string;
}
export interface GeocodeResult {
    name: string;
    country: string;
    countryCode: string;
    lat: number;
    lon: number;
    timezone?: string;
}
export interface WeatherBundle {
    current_weather: {
        is_day: 0 | 1;
    };
    current: WeatherResponse;
    forecast: ForecastResponse;
}
export interface LocatedPlace {
    label: string;
    country?: string;
    lat: number;
    lon: number;
    source?: "search" | "coords" | "geolocation" | "storage" | "favorite";
}
