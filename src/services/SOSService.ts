import { supabase } from '@/lib/supabase';
import { SOSAlert, EmergencyType } from '@/types/civic-sos';

// ============================================================================
// SOSService — Emergency broadcast, alert CRUD, Supabase Realtime
// ============================================================================

class SOSService {
  private realtimeChannel: any = null;
  private alertCallbacks: ((alert: SOSAlert) => void)[] = [];
  /** Set to true after a PGRST205/42P01 to stop retrying missing table */
  private tableUnavailable = false;

  // ========================================================================
  // Alert CRUD
  // ========================================================================

  async broadcastSOS(
    type: EmergencyType,
    title: string,
    description: string,
    severity: SOSAlert['severity'],
    location: { latitude: number; longitude: number },
    userId: string,
    userName: string,
    photo?: File
  ): Promise<{ success: boolean; alert?: SOSAlert; message: string }> {
    if (!supabase) return { success: false, message: 'Database unavailable' };
    if (this.tableUnavailable) return { success: false, message: 'SOS table not set up — run migration-new-features.sql in Supabase SQL editor' };
    try {
      let photoUrl: string | null = null;
      if (photo) {
        const fileName = `sos/${Date.now()}_${photo.name.replace(/\s+/g, '_')}`;
        const { error: upErr } = await supabase.storage.from('sos-photos').upload(fileName, photo);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('sos-photos').getPublicUrl(fileName);
          photoUrl = urlData?.publicUrl || null;
        }
      }

      const alertData = {
        type,
        title,
        description,
        severity,
        latitude: location.latitude,
        longitude: location.longitude,
        radius_m: this.getDefaultRadius(severity),
        created_by: userId,
        created_by_name: userName,
        photo_url: photoUrl,
        confirmed_count: 1,
        status: 'active',
        expires_at: new Date(Date.now() + this.getExpiryHours(severity) * 3600000).toISOString(),
      };

      const { data, error } = await supabase
        .from('sos_alerts')
        .insert(alertData)
        .select()
        .single();

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST205') {
          this.tableUnavailable = true;
          return { success: false, message: 'SOS table not set up — run migration-new-features.sql in Supabase SQL editor' };
        }
        throw error;
      }

      console.log(`🆘 CivicSOS: Emergency broadcast — ${type} (${severity})`);
      return { success: true, alert: this.convertAlert(data), message: 'SOS broadcast sent!' };
    } catch (err) {
      console.error('❌ CivicSOS: Broadcast failed:', err);
      return { success: false, message: 'Failed to broadcast SOS' };
    }
  }

  async getActiveAlerts(
    location: { latitude: number; longitude: number },
    radiusKm = 10
  ): Promise<SOSAlert[]> {
    if (!supabase || this.tableUnavailable) return [];
    try {
      const delta = radiusKm / 111;
      const { data, error } = await supabase
        .from('sos_alerts')
        .select('*')
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .gte('latitude', location.latitude - delta)
        .lte('latitude', location.latitude + delta)
        .gte('longitude', location.longitude - delta)
        .lte('longitude', location.longitude + delta)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist') || error.message?.includes('not exist')) {
          this.tableUnavailable = true;
          console.warn('⚠️ CivicSOS: sos_alerts table not found — run migration-new-features.sql in Supabase');
          return [];
        }
      }
      return (data || []).map(this.convertAlert);
    } catch { return []; }
  }

  async confirmAlert(alertId: string): Promise<boolean> {
    if (!supabase || this.tableUnavailable) return false;
    try {
      const { data: alert, error } = await supabase.from('sos_alerts').select('confirmed_count').eq('id', alertId).single();
      if (error?.code === '42P01' || error?.code === 'PGRST205') { this.tableUnavailable = true; return false; }
      if (!alert) return false;
      await supabase.from('sos_alerts').update({ confirmed_count: (alert.confirmed_count || 0) + 1 }).eq('id', alertId);
      return true;
    } catch { return false; }
  }

  async resolveAlert(alertId: string, userId: string): Promise<boolean> {
    if (!supabase || this.tableUnavailable) return false;
    try {
      const { error } = await supabase
        .from('sos_alerts')
        .update({ status: 'resolved' })
        .eq('id', alertId)
        .eq('created_by', userId);
      return !error;
    } catch { return false; }
  }

  // ========================================================================
  // Realtime Subscription
  // ========================================================================

  subscribeToAlerts(
    location: { latitude: number; longitude: number },
    callback: (alert: SOSAlert) => void
  ): void {
    if (!supabase || this.tableUnavailable) return;
    this.alertCallbacks.push(callback);

    if (this.realtimeChannel) return; // already subscribed

    try {
      this.realtimeChannel = supabase
        .channel('sos-alerts-realtime')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'sos_alerts' },
          (payload: any) => {
            const alert = this.convertAlert(payload.new);
            // Check if alert is within reasonable distance (~10km)
            const dist = this.haversineMeters(
              location.latitude, location.longitude,
              alert.location.latitude, alert.location.longitude
            );
            if (dist <= 10000) {
              this.alertCallbacks.forEach((cb) => cb(alert));
            }
          }
        )
        .subscribe();
    } catch (err) {
      console.warn('⚠️ CivicSOS: Realtime subscription failed:', err);
    }
  }

  unsubscribeFromAlerts(): void {
    if (this.realtimeChannel && supabase) {
      supabase.removeChannel(this.realtimeChannel);
      this.realtimeChannel = null;
    }
    this.alertCallbacks = [];
  }

  // ========================================================================
  // Helpers
  // ========================================================================

  private getDefaultRadius(severity: SOSAlert['severity']): number {
    switch (severity) {
      case 'low': return 500;
      case 'medium': return 1000;
      case 'high': return 2000;
      case 'critical': return 5000;
    }
  }

  private getExpiryHours(severity: SOSAlert['severity']): number {
    switch (severity) {
      case 'low': return 6;
      case 'medium': return 12;
      case 'high': return 24;
      case 'critical': return 48;
    }
  }

  private haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private convertAlert(row: Record<string, any>): SOSAlert {
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      description: row.description || '',
      severity: row.severity,
      location: { latitude: row.latitude, longitude: row.longitude },
      radiusM: row.radius_m || 1000,
      createdBy: row.created_by,
      createdByName: row.created_by_name || 'Anonymous',
      photoUrl: row.photo_url,
      confirmedCount: row.confirmed_count || 0,
      status: row.status,
      createdAt: new Date(row.created_at),
      expiresAt: new Date(row.expires_at),
    };
  }
}

export const sosService = new SOSService();
