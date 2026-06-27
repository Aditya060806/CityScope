import { useState, useEffect, useCallback, useRef } from 'react';
import { swarmVerifyService } from '@/services/SwarmVerifyService';
import { VerificationQuest, TrustScore } from '@/types/swarm-verify';

interface SwarmVerifyState {
  nearbyQuests: VerificationQuest[];
  trustScore: TrustScore | null;
  loading: boolean;
  submitting: boolean;
}

export function useSwarmVerify(userId: string | undefined) {
  const [state, setState] = useState<SwarmVerifyState>({
    nearbyQuests: [],
    trustScore: null,
    loading: true,
    submitting: false,
  });
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get GPS position
  useEffect(() => {
    if (!navigator.geolocation) return;
    const watchId = navigator.geolocation.watchPosition(
      (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => console.warn('SwarmVerify: GPS unavailable'),
      { enableHighAccuracy: true, maximumAge: 30000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // Fetch nearby quests
  const fetchQuests = useCallback(async () => {
    if (!location) return;
    const quests = await swarmVerifyService.getActiveQuests(location, 2);
    setState((s) => ({ ...s, nearbyQuests: quests, loading: false }));
  }, [location]);

  // Fetch trust score
  const fetchTrustScore = useCallback(async () => {
    if (!userId) return;
    const score = await swarmVerifyService.getUserTrustScore(userId);
    setState((s) => ({ ...s, trustScore: score }));
  }, [userId]);

  // Poll every 60 seconds
  useEffect(() => {
    fetchQuests();
    fetchTrustScore();
    intervalRef.current = setInterval(() => {
      fetchQuests();
    }, 60_000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchQuests, fetchTrustScore]);

  // Submit verification
  const submitVerification = useCallback(
    async (
      questId: string,
      verifierName: string,
      photo: File | null,
      notes: string
    ): Promise<{ success: boolean; message: string }> => {
      if (!userId || !location) {
        return { success: false, message: 'GPS location required' };
      }
      setState((s) => ({ ...s, submitting: true }));
      try {
        const result = await swarmVerifyService.submitVerification(
          questId, userId, verifierName, photo, location, notes
        );
        if (result.success) {
          await fetchQuests();
          await fetchTrustScore();
        }
        return result;
      } finally {
        setState((s) => ({ ...s, submitting: false }));
      }
    },
    [userId, location, fetchQuests, fetchTrustScore]
  );

  return {
    ...state,
    location,
    submitVerification,
    refresh: fetchQuests,
  };
}
