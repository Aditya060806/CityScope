import { Location } from '@/types/civic';

export type LocationSource = 'live' | 'last-known' | 'default';

export const DEFAULT_LOCATION: Location = {
  latitude: 28.6139,
  longitude: 77.2090,
  address: 'Delhi, India',
  city: 'Delhi',
  state: 'Delhi',
  district: 'New Delhi',
  area: 'Central Delhi',
  pincode: '',
  country: 'India',
};

export const LAST_KNOWN_LOCATION_STORAGE_KEY = 'cityscope:last-known-location';

const isFiniteNumber = (value: unknown): value is number => (
  typeof value === 'number' && Number.isFinite(value)
);

export const isValidCoordinate = (latitude: unknown, longitude: unknown): boolean => (
  isFiniteNumber(latitude) &&
  isFiniteNumber(longitude) &&
  latitude >= -90 &&
  latitude <= 90 &&
  longitude >= -180 &&
  longitude <= 180
);

export const getDefaultMapCenter = (): [number, number] => [
  DEFAULT_LOCATION.latitude,
  DEFAULT_LOCATION.longitude,
];

export const toMapCenter = (
  location?: { latitude: number; longitude: number } | null
): [number, number] => {
  if (location && isValidCoordinate(location.latitude, location.longitude)) {
    return [location.latitude, location.longitude];
  }
  return getDefaultMapCenter();
};

export const loadLastKnownLocation = (): Location | null => {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(LAST_KNOWN_LOCATION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<Location>;
    if (!isValidCoordinate(parsed.latitude, parsed.longitude)) {
      return null;
    }

    return {
      ...DEFAULT_LOCATION,
      ...parsed,
      latitude: parsed.latitude,
      longitude: parsed.longitude,
      timestamp: parsed.timestamp ?? Date.now(),
    };
  } catch {
    return null;
  }
};

export const saveLastKnownLocation = (location: Location): void => {
  if (typeof window === 'undefined') return;
  if (!isValidCoordinate(location.latitude, location.longitude)) return;

  const payload: Location = {
    ...DEFAULT_LOCATION,
    ...location,
    timestamp: Date.now(),
  };

  window.localStorage.setItem(LAST_KNOWN_LOCATION_STORAGE_KEY, JSON.stringify(payload));
};

export const clearLastKnownLocation = (): void => {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(LAST_KNOWN_LOCATION_STORAGE_KEY);
};
