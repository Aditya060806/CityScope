import { createContext } from 'react';
import { Location } from '@/types/civic';
import { LocationSource } from '@/constants/location';

export interface LocationContextType {
  userLocation: Location | null;
  locationSource: LocationSource;
  isTracking: boolean;
  isLocationEnabled: boolean;
  isLoading: boolean;
  error: string | null;
  requestLocation: () => void;
  refreshLocation: () => void;
  clearLocation: () => void;
  getLocationFromPincode: (pincode: string) => Promise<{ city: string; state: string; district: string; area: string } | null>;
}

export const LocationContext = createContext<LocationContextType | undefined>(undefined);