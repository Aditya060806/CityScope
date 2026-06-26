import { useEffect, useState, FC, ReactNode, useCallback, useRef } from 'react';
import { Location } from '@/types/civic';
import { apiService } from '@/services/ComprehensiveAPIService';
import { LocationContext, LocationContextType } from './LocationContext';
import {
  LocationSource,
  clearLastKnownLocation,
  loadLastKnownLocation,
  saveLastKnownLocation,
} from '@/constants/location';

interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: FC<LocationProviderProps> = ({ children }) => {
  const initialLocationRef = useRef<Location | null>(loadLastKnownLocation());
  const [userLocation, setUserLocation] = useState<Location | null>(() => initialLocationRef.current);
  const [locationSource, setLocationSource] = useState<LocationSource>(() => (
    initialLocationRef.current ? 'last-known' : 'default'
  ));
  const [isTracking, setIsTracking] = useState(false);
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const hasAutoRequestedRef = useRef(false);
  const latestAddressRef = useRef<string | undefined>(initialLocationRef.current?.address);

  const stopLocationTracking = useCallback(() => {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    setIsTracking(false);
  }, []);

  const buildLocation = useCallback(async (latitude: number, longitude: number): Promise<Location> => {
    // Keep coordinates usable even if geocoding provider fails.
    const fallbackAddress = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;

    try {
      const addressString = await apiService.reverseGeocode(latitude, longitude);
      return {
        latitude,
        longitude,
        address: addressString || fallbackAddress,
        city: 'Unknown',
        state: 'Unknown',
        district: 'Unknown',
        area: 'Unknown',
        pincode: '',
        country: 'India',
        timestamp: Date.now(),
      };
    } catch (geocodeError) {
      console.warn('⚠️ Reverse geocoding failed, falling back to coordinates:', geocodeError);
      return {
        latitude,
        longitude,
        address: fallbackAddress,
        city: 'Unknown',
        state: 'Unknown',
        district: 'Unknown',
        area: 'Unknown',
        pincode: '',
        country: 'India',
        timestamp: Date.now(),
      };
    }
  }, []);

  const applyLiveLocation = useCallback((location: Location) => {
    setUserLocation(location);
    setLocationSource('live');
    setError(null);
    latestAddressRef.current = location.address;
    saveLastKnownLocation(location);
  }, []);

  const startLocationTracking = useCallback(() => {
    if (!('geolocation' in navigator) || watchIdRef.current !== null) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const fallbackAddress = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          const location: Location = {
            latitude,
            longitude,
            address: latestAddressRef.current || fallbackAddress,
            city: 'Unknown',
            state: 'Unknown',
            district: 'Unknown',
            area: 'Unknown',
            pincode: '',
            country: 'India',
            timestamp: Date.now(),
          };
          applyLiveLocation(location);
          setIsTracking(true);
        } catch (err) {
          console.warn('⚠️ Failed to process live location update:', err);
        }
      },
      (err) => {
        console.warn('⚠️ Live location watch error:', err);
        setIsTracking(false);

        if (err.code === err.PERMISSION_DENIED) {
          setError('Live location updates were blocked. Please enable location permissions.');
          stopLocationTracking();
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );

    setIsTracking(true);
  }, [applyLiveLocation, stopLocationTracking]);

  // Check if geolocation is supported
  useEffect(() => {
    if ('geolocation' in navigator) {
      setIsLocationEnabled(true);
    }
  }, []);

  // Auto-request location on mount (when user logs in/visits app)
  // This will trigger the browser's native location permission prompt
  const requestLocation = useCallback(() => {
    // Check geolocation support directly instead of relying on state
    if (!('geolocation' in navigator)) {
      setError('Geolocation is not supported by this browser');
      return;
    }

    setIsLoading(true);
    setError(null);

    // This will trigger the browser's native location permission prompt
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const location = await buildLocation(latitude, longitude);
          applyLiveLocation(location);
          startLocationTracking();
        } catch (err) {
          console.error('❌ Error getting address from coordinates:', err);
          setError('Unable to process your location right now. Please try again.');
        } finally {
          setIsLoading(false);
        }
      },
      (err) => {
        console.error('❌ Geolocation error:', err);
        let errorMessage = 'Failed to get location. Please check your location permissions.';
        let fallbackUsed = false;
        switch (err.code) {
          case err.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions in your browser.';
            break;
          case err.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable. Please check your GPS settings.';
            break;
          case err.TIMEOUT:
            // On timeout, fallback to last-known or default location
            const lastKnown = loadLastKnownLocation();
            if (lastKnown) {
              setUserLocation(lastKnown);
              setLocationSource('last-known');
              errorMessage = 'Location request timed out. Using your last known location.';
              fallbackUsed = true;
            } else {
              setUserLocation(null);
              setLocationSource('default');
              errorMessage = 'Location request timed out. Using default location.';
              fallbackUsed = true;
            }
            break;
        }
        setError(errorMessage);
        setIsLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 20000,
      }
    );
  }, [applyLiveLocation, buildLocation, startLocationTracking]);

  useEffect(() => {
    if (hasAutoRequestedRef.current || !('geolocation' in navigator)) return;

    hasAutoRequestedRef.current = true;
    const timer = setTimeout(() => {
      requestLocation();
    }, 450);

    return () => clearTimeout(timer);
  }, [requestLocation]);

  useEffect(() => {
    return () => {
      stopLocationTracking();
    };
  }, [stopLocationTracking]);

  const refreshLocation = useCallback(() => {
    requestLocation();
  }, [requestLocation]);

  const clearLocation = useCallback(() => {
    stopLocationTracking();
    clearLastKnownLocation();
    setUserLocation(null);
    setLocationSource('default');
    setError(null);
  }, [stopLocationTracking]);

  const getLocationFromPincode = async (pincode: string): Promise<{ city: string; state: string; district: string; area: string } | null> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const locationData = await apiService.getLocationFromPincode(pincode);
      
      if (locationData) {
        return {
          city: locationData.city || '',
          state: locationData.state || '',
          district: locationData.district || '',
          area: locationData.area || '',
        };
      }
      
      return null;
    } catch (err) {
      console.error('Error getting location from pincode:', err);
      setError('Failed to get location from pincode');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const value: LocationContextType = {
    userLocation,
    locationSource,
    isTracking,
    isLocationEnabled,
    isLoading,
    error,
    requestLocation,
    refreshLocation,
    clearLocation,
    getLocationFromPincode,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
