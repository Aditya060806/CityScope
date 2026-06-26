import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate Supabase URL format
const isValidSupabaseUrl = (url: string) => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('supabase.co') || urlObj.hostname.includes('localhost');
  } catch {
    return false;
  }
};

const REALTIME_DISABLE_KEY = 'cityscope:realtime-disabled-until';
const REALTIME_DISABLE_MS = 2 * 60 * 1000;
const realtimeEnabledByEnv = import.meta.env.VITE_ENABLE_REALTIME !== 'false';

let realtimeDisabledUntil = 0;
let realtimeWarningShown = false;
let realtimeDisconnect: (() => void) | null = null;

const readRealtimeDisabledUntil = (): number => {
  if (typeof window === 'undefined') return 0;

  try {
    const raw = window.localStorage.getItem(REALTIME_DISABLE_KEY);
    if (!raw) return 0;

    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > Date.now() ? parsed : 0;
  } catch {
    return 0;
  }
};

const writeRealtimeDisabledUntil = (value: number) => {
  if (typeof window === 'undefined') return;

  try {
    if (value > Date.now()) {
      window.localStorage.setItem(REALTIME_DISABLE_KEY, String(value));
    } else {
      window.localStorage.removeItem(REALTIME_DISABLE_KEY);
    }
  } catch {
    // Ignore storage errors in private mode or restricted environments.
  }
};

const resetRealtimeCooldown = () => {
  realtimeDisabledUntil = 0;
  realtimeWarningShown = false;
  writeRealtimeDisabledUntil(0);
};

const disableRealtimeTemporarily = (reason: string) => {
  const until = Date.now() + REALTIME_DISABLE_MS;
  realtimeDisabledUntil = Math.max(realtimeDisabledUntil, until);
  writeRealtimeDisabledUntil(realtimeDisabledUntil);

  try {
    realtimeDisconnect?.();
  } catch {
    // Ignore disconnect errors and keep fallback active.
  }

  if (!realtimeWarningShown) {
    console.warn(`Supabase realtime temporarily disabled: ${reason}`);
    realtimeWarningShown = true;
  }
};

const canUseRealtime = (): boolean => {
  if (!realtimeEnabledByEnv) return false;

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return false;
  }

  if (realtimeDisabledUntil > 0 && Date.now() >= realtimeDisabledUntil) {
    resetRealtimeCooldown();
  }

  return realtimeDisabledUntil === 0;
};

const createNoopRealtimeChannel = (topic: string) => {
  const noopChannel: any = {
    __cityscopeNoopRealtime: true,
    topic,
  };

  noopChannel.on = () => noopChannel;
  noopChannel.subscribe = (callback?: (status: string) => void) => {
    if (typeof callback === 'function') {
      callback('CLOSED');
    }
    return noopChannel;
  };
  noopChannel.unsubscribe = async () => 'ok';
  noopChannel.send = async () => ({ status: 'ok', response: {} });
  noopChannel.track = async () => ({ status: 'ok', response: {} });
  noopChannel.untrack = async () => ({ status: 'ok', response: {} });

  return noopChannel;
};

const wrapRealtimeClient = <T extends object>(client: T): T => {
  const mutableClient = client as T & {
    __cityscopeRealtimeWrapped?: boolean;
    channel: (topic: string, params?: unknown) => any;
    removeChannel: (channel: any) => Promise<unknown>;
  };

  if (mutableClient.__cityscopeRealtimeWrapped) return client;
  mutableClient.__cityscopeRealtimeWrapped = true;

  const originalChannel = mutableClient.channel.bind(mutableClient);
  const originalRemoveChannel = mutableClient.removeChannel.bind(mutableClient);

  mutableClient.channel = (topic: string, params?: unknown) => {
    if (!canUseRealtime()) {
      return createNoopRealtimeChannel(topic);
    }

    const channel = originalChannel(topic, params);

    if (channel && typeof channel.subscribe === 'function') {
      const originalSubscribe = channel.subscribe.bind(channel);
      channel.subscribe = (callback?: (status: string, err?: unknown) => void, timeout?: number) => {
        const wrappedCallback = (status: string, err?: unknown) => {
          if (status === 'TIMED_OUT' || status === 'CHANNEL_ERROR') {
            disableRealtimeTemporarily(`channel \"${topic}\" entered ${status}`);
          }

          if (typeof callback === 'function') {
            callback(status, err);
          }
        };

        return originalSubscribe(wrappedCallback, timeout);
      };
    }

    return channel;
  };

  mutableClient.removeChannel = (channel: any) => {
    if (channel?.__cityscopeNoopRealtime) {
      return Promise.resolve('ok');
    }

    return originalRemoveChannel(channel);
  };

  return client;
};

if (typeof window !== 'undefined') {
  realtimeDisabledUntil = readRealtimeDisabledUntil();
  window.addEventListener('online', () => {
    resetRealtimeCooldown();
  });
}

// Custom fetch with timeout to handle bad internet hanging indefinitely
const fetchWithTimeout = async (url: RequestInfo | URL, options?: RequestInit) => {
  const timeoutMs = 15000; // 15s timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Create Supabase client with proper error handling
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey || 
      supabaseUrl === 'your-supabase-url' ||
      !isValidSupabaseUrl(supabaseUrl)) {
    console.warn('⚠️ Supabase not configured or using invalid URL - running in offline mode');
    return null;
  }
  
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        fetch: fetchWithTimeout,
        headers: {
          'X-Client-Info': 'cityscope-web'
        }
      }
    });
    realtimeDisconnect = () => {
      try {
        // Stop active websocket retries until cooldown expires.
        (client as any).realtime?.disconnect?.();
      } catch {
        // Ignore internal realtime disconnect errors.
      }
    };
    return wrapRealtimeClient(client);
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return null;
  }
};

export const supabase = createSupabaseClient();

// Connection status check
export const checkSupabaseConnection = async (): Promise<boolean> => {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('users').select('count').limit(1);
    return !error;
  } catch {
    return false;
  }
};

// Export database types for better TypeScript support
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Database types - Updated to match actual schema
export interface Database {
  public: {
    Tables: {
      issues: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: string;
          status: string;
          priority: string;
          location: Record<string, unknown>; // JSONB field
          images: string[];
          reporter_id: string;
          reporter_name: string;
          is_anonymous: boolean;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
          assigned_to: string | null;
          department_id: string | null; // Fixed: was department, should be department_id
          upvotes: number;
          flag_count: number;
          is_hidden: boolean;
          timeline: Record<string, unknown>[]; // JSONB field
          voice_recording_id: string | null;
          estimated_resolution_date: string | null;
          actual_resolution_date: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: string;
          status?: string;
          priority?: string;
          location: Record<string, unknown>; // JSONB field
          images?: string[];
          reporter_id: string;
          reporter_name: string;
          is_anonymous?: boolean;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
          assigned_to?: string | null;
          department_id?: string | null; // Fixed: was department, should be department_id
          upvotes?: number;
          flag_count?: number;
          is_hidden?: boolean;
          timeline?: Record<string, unknown>[]; // JSONB field
          voice_recording_id?: string | null;
          estimated_resolution_date?: string | null;
          actual_resolution_date?: string | null;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: string;
          status?: string;
          priority?: string;
          location?: Record<string, unknown>; // JSONB field
          images?: string[];
          reporter_id?: string;
          reporter_name?: string;
          is_anonymous?: boolean;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
          assigned_to?: string | null;
          department_id?: string | null; // Fixed: was department, should be department_id
          upvotes?: number;
          flag_count?: number;
          is_hidden?: boolean;
          timeline?: Record<string, unknown>[]; // JSONB field
          voice_recording_id?: string | null;
          estimated_resolution_date?: string | null;
          actual_resolution_date?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar_url: string | null;
          role: string;
          department: string | null;
          created_at: string;
          updated_at: string;
          reports_count: number;
          verified_percentage: number;
          badges: string[];
          is_active: boolean;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          avatar_url?: string | null;
          role?: string;
          department?: string | null;
          created_at?: string;
          updated_at?: string;
          reports_count?: number;
          verified_percentage?: number;
          badges?: string[];
          is_active?: boolean;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          avatar_url?: string | null;
          role?: string;
          department?: string | null;
          created_at?: string;
          updated_at?: string;
          reports_count?: number;
          verified_percentage?: number;
          badges?: string[];
          is_active?: boolean;
        };
      };
      departments: {
        Row: {
          id: string;
          name: string;
          description: string;
          head_id: string | null;
          contact_email: string;
          contact_phone: string;
          service_areas: string[];
          created_at: string;
          updated_at: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          head_id?: string | null;
          contact_email: string;
          contact_phone: string;
          service_areas?: string[];
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          head_id?: string | null;
          contact_email?: string;
          contact_phone?: string;
          service_areas?: string[];
          created_at?: string;
          updated_at?: string;
          is_active?: boolean;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data: Record<string, unknown>;
          is_read: boolean;
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          data?: Record<string, unknown>;
          is_read?: boolean;
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          data?: Record<string, unknown>;
          is_read?: boolean;
          created_at?: string;
          expires_at?: string | null;
        };
      };
      chat_messages: {
        Row: {
          id: string;
          issue_id: string;
          sender_id: string;
          sender_name: string;
          message: string;
          message_type: string;
          attachments: string[];
          created_at: string;
          is_read: boolean;
        };
        Insert: {
          id?: string;
          issue_id: string;
          sender_id: string;
          sender_name: string;
          message: string;
          message_type?: string;
          attachments?: string[];
          created_at?: string;
          is_read?: boolean;
        };
        Update: {
          id?: string;
          issue_id?: string;
          sender_id?: string;
          sender_name?: string;
          message?: string;
          message_type?: string;
          attachments?: string[];
          created_at?: string;
          is_read?: boolean;
        };
      };
      voice_recordings: {
        Row: {
          id: string;
          issue_id: string;
          user_id: string;
          audio_url: string;
          duration: number;
          transcription: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          user_id: string;
          audio_url: string;
          duration: number;
          transcription?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          user_id?: string;
          audio_url?: string;
          duration?: number;
          transcription?: string | null;
          created_at?: string;
        };
      };
      // ====== PRAD Tables ======
      trips: {
        Row: {
          id: string;
          user_id: string;
          start_time: string;
          end_time: string | null;
          status: string;
          route: Record<string, unknown>[];
          anomaly_count: number;
          distance_km: number;
          transport_mode: string;
          avg_speed: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          start_time?: string;
          end_time?: string | null;
          status?: string;
          route?: Record<string, unknown>[];
          anomaly_count?: number;
          distance_km?: number;
          transport_mode?: string;
          avg_speed?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          start_time?: string;
          end_time?: string | null;
          status?: string;
          route?: Record<string, unknown>[];
          anomaly_count?: number;
          distance_km?: number;
          transport_mode?: string;
          avg_speed?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      road_anomalies: {
        Row: {
          id: string;
          trip_id: string;
          reporter_id: string;
          anomaly_type: string;
          severity: string;
          confidence: number;
          location: Record<string, unknown>;
          features: Record<string, unknown>;
          sensor_snapshot: Record<string, unknown>[];
          status: string;
          verified_count: number;
          cluster_id: string | null;
          device_info: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          trip_id: string;
          reporter_id: string;
          anomaly_type?: string;
          severity?: string;
          confidence?: number;
          location: Record<string, unknown>;
          features?: Record<string, unknown>;
          sensor_snapshot?: Record<string, unknown>[];
          status?: string;
          verified_count?: number;
          cluster_id?: string | null;
          device_info?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          trip_id?: string;
          reporter_id?: string;
          anomaly_type?: string;
          severity?: string;
          confidence?: number;
          location?: Record<string, unknown>;
          features?: Record<string, unknown>;
          sensor_snapshot?: Record<string, unknown>[];
          status?: string;
          verified_count?: number;
          cluster_id?: string | null;
          device_info?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
      anomaly_clusters: {
        Row: {
          id: string;
          centroid_lat: number;
          centroid_lng: number;
          anomaly_type: string;
          severity_score: number;
          detection_count: number;
          detection_radius_m: number;
          unique_reporters: number;
          status: string;
          issue_id: string | null;
          first_detected: string;
          last_detected: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          centroid_lat: number;
          centroid_lng: number;
          anomaly_type?: string;
          severity_score?: number;
          detection_count?: number;
          detection_radius_m?: number;
          unique_reporters?: number;
          status?: string;
          issue_id?: string | null;
          first_detected?: string;
          last_detected?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          centroid_lat?: number;
          centroid_lng?: number;
          anomaly_type?: string;
          severity_score?: number;
          detection_count?: number;
          detection_radius_m?: number;
          unique_reporters?: number;
          status?: string;
          issue_id?: string | null;
          first_detected?: string;
          last_detected?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      road_health_segments: {
        Row: {
          id: string;
          start_location: Record<string, unknown>;
          end_location: Record<string, unknown>;
          health_score: number;
          anomaly_density: number;
          segment_length_m: number;
          last_updated: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          start_location: Record<string, unknown>;
          end_location: Record<string, unknown>;
          health_score?: number;
          anomaly_density?: number;
          segment_length_m?: number;
          last_updated?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          start_location?: Record<string, unknown>;
          end_location?: Record<string, unknown>;
          health_score?: number;
          anomaly_density?: number;
          segment_length_m?: number;
          last_updated?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Helper functions with null checks
export const getCurrentUser = async () => {
  if (!supabase) return null;
  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.warn('Supabase auth warning:', sessionError.message);
      return null;
    }

    if (!session?.user) {
      // Logged-out state is valid; do not treat as warning.
      return null;
    }

    const { data: { user }, error } = await supabase.auth.getUser();
    
    // Auto-heal corrupted refresh token loops
    if (error) {
      if (error.message.toLowerCase().includes('auth session missing')) {
        return null;
      }

      console.warn('Supabase auth warning:', error.message);
      if (error.message.includes('Refresh Token') || error.message.includes('refresh_token_not_found')) {
        await supabase.auth.signOut(); // Explicitly nuke broken cache
      }
      return null;
    }
    
    return user;
  } catch (error) {
    console.warn('Failed to get current user:', error);
    return null;
  }
};

export const signInWithEmail = async (email: string, password: string) => {
  if (!supabase) throw new Error('Supabase not configured - running in offline mode');
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  } catch (error) {
    console.error('Sign in failed:', error);
    throw new Error('Authentication service unavailable');
  }
};

export const signUpWithEmail = async (email: string, password: string, name: string) => {
  if (!supabase) throw new Error('Supabase not configured - running in offline mode');
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    });
    if (error) {
      // Propagate detailed error for UI
      const errMsg = error.message || 'Sign up failed';
      const status = error.status || 500;
      const code = error.code || 'SIGNUP_ERROR';
      const fullMsg = status >= 500
        ? `Server error (${status}): ${errMsg}`
        : errMsg;
      const err = new Error(fullMsg);
      // @ts-ignore
      err.status = status;
      // @ts-ignore
      err.code = code;
      throw err;
    }
    return { data, error: null };
  } catch (error) {
    console.error('Sign up failed:', error);
    throw error instanceof Error ? error : new Error('Authentication service unavailable');
  }
};

export const signOut = async () => {
  if (!supabase) return { error: null };
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (error) {
    console.warn('Sign out failed:', error);
    return { error: null }; // Allow local sign out
  }
};

// Real-time subscriptions
export const subscribeToIssues = (callback: (payload: unknown) => void) => {
  if (!supabase) return null;
  try {
    return supabase
      .channel('issues')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'issues' }, callback)
      .subscribe();
  } catch (error) {
    console.warn('Failed to subscribe to issues:', error);
    return null;
  }
};

export const subscribeToNotifications = (userId: string, callback: (payload: unknown) => void) => {
  if (!supabase) return null;
  try {
    return supabase
      .channel('notifications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, callback)
      .subscribe();
  } catch (error) {
    console.warn('Failed to subscribe to notifications:', error);
    return null;
  }
};
