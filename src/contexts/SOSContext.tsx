import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { sosService } from '@/services/SOSService';
import { SOSAlert } from '@/types/civic-sos';

interface SOSContextValue {
  activeAlerts: SOSAlert[];
  newAlert: SOSAlert | null;
  clearNewAlert: () => void;
}

const SOSContext = createContext<SOSContextValue>({
  activeAlerts: [],
  newAlert: null,
  clearNewAlert: () => {},
});

export function SOSProvider({ children }: { children: React.ReactNode }) {
  const [activeAlerts, setActiveAlerts] = useState<SOSAlert[]>([]);
  const [newAlert, setNewAlert] = useState<SOSAlert | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const initialized = useRef(false);

  // Get location
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: false, maximumAge: 60000 }
    );
  }, []);

  // Subscribe to realtime alerts
  useEffect(() => {
    if (!location || initialized.current) return;
    initialized.current = true;

    // Load existing alerts
    sosService.getActiveAlerts(location).then(setActiveAlerts);

    // Subscribe to new alerts
    sosService.subscribeToAlerts(location, (alert) => {
      setActiveAlerts((prev) => [alert, ...prev]);
      setNewAlert(alert);

      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`🆘 ${alert.title}`, {
          body: `${alert.type.toUpperCase()} — ${alert.description}`,
          icon: '/icons/icon-192x192.png',
          tag: `sos-${alert.id}`,
        });
      }

      // Vibrate on mobile
      if (navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 200]);
      }
    });

    return () => sosService.unsubscribeFromAlerts();
  }, [location]);

  const clearNewAlert = useCallback(() => setNewAlert(null), []);

  return (
    <SOSContext.Provider value={{ activeAlerts, newAlert, clearNewAlert }}>
      {children}
    </SOSContext.Provider>
  );
}

export function useSOS() {
  return useContext(SOSContext);
}
