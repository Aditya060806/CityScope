import { supabase } from '@/lib/supabase';
import {
  ARMarker, ARIssueMarker, ARPRADMarker, CATEGORY_AR_COLORS,
  bearingBetween, haversineMeters,
} from '@/types/civic-ar';

// ============================================================================
// CivicARService — Fetches nearby issues/anomalies and projects them to screen
// ============================================================================

class CivicARService {
  private readonly MAX_DISTANCE_M = 500;
  private readonly FOV_H = 60; // assume ~60° horizontal camera FOV

  /**
   * Load nearby issues + PRAD anomalies, compute bearing & distance relative to user
   */
  async loadNearbyMarkers(
    userLat: number,
    userLon: number
  ): Promise<ARMarker[]> {
    const markers: ARMarker[] = [];

    // Load issues
    const issues = await this.fetchNearbyIssues(userLat, userLon);
    for (const issue of issues) {
      const dist = haversineMeters(userLat, userLon, issue.latitude, issue.longitude);
      if (dist > this.MAX_DISTANCE_M) continue;
      const bearing = bearingBetween(userLat, userLon, issue.latitude, issue.longitude);
      markers.push({
        kind: 'issue',
        id: `issue-${issue.id}`,
        issueId: issue.id,
        title: issue.title,
        category: issue.category || 'other',
        severity: this.mapSeverity(issue.priority),
        status: issue.status,
        location: { latitude: issue.latitude, longitude: issue.longitude },
        distanceM: Math.round(dist),
        bearingDeg: bearing,
        screenX: 0,
        screenY: 0,
        upvotes: issue.upvotes || 0,
        createdAt: new Date(issue.created_at),
      });
    }

    // Load PRAD anomalies
    const anomalies = await this.fetchNearbyPRAD(userLat, userLon);
    for (const a of anomalies) {
      const dist = haversineMeters(userLat, userLon, a.latitude, a.longitude);
      if (dist > this.MAX_DISTANCE_M) continue;
      const bearing = bearingBetween(userLat, userLon, a.latitude, a.longitude);
      markers.push({
        kind: 'prad',
        id: `prad-${a.id}`,
        type: a.anomaly_type || 'rough_patch',
        severity: a.severity || 5,
        location: { latitude: a.latitude, longitude: a.longitude },
        distanceM: Math.round(dist),
        bearingDeg: bearing,
        screenX: 0,
        screenY: 0,
        detectedAt: new Date(a.detected_at || a.created_at),
      });
    }

    return markers.sort((a, b) => a.distanceM - b.distanceM);
  }

  /**
   * Project markers to screen-space based on compass heading and screen size
   */
  projectToScreen(
    markers: ARMarker[],
    heading: number,
    screenW: number,
    screenH: number,
    fovH: number = this.FOV_H
  ): ARMarker[] {
    return markers.map((m) => {
      // Angular difference between compass heading and marker bearing
      let angleDiff = m.bearingDeg - heading;
      // Normalize to [-180, 180]
      if (angleDiff > 180) angleDiff -= 360;
      if (angleDiff < -180) angleDiff += 360;

      // Map angle to screen X (center = middle of screen)
      const screenX = (angleDiff / fovH) * screenW + screenW / 2;

      // Y position: closer markers lower on screen, farther markers higher
      const maxDist = this.MAX_DISTANCE_M;
      const normalizedDist = Math.min(m.distanceM / maxDist, 1);
      const screenY = screenH * 0.3 + normalizedDist * screenH * 0.5;

      return { ...m, screenX, screenY };
    });
  }

  // ========================================================================
  // Data Fetching
  // ========================================================================

  private async fetchNearbyIssues(lat: number, lon: number): Promise<Record<string, any>[]> {
    if (!supabase) return [];
    try {
      const delta = 0.005; // ~500m
      const { data } = await supabase
        .from('issues')
        .select('id, title, category, priority, status, latitude, longitude, upvotes, created_at')
        .gte('latitude', lat - delta)
        .lte('latitude', lat + delta)
        .gte('longitude', lon - delta)
        .lte('longitude', lon + delta)
        .in('status', ['pending', 'in_progress'])
        .limit(30);
      return data || [];
    } catch {
      return [];
    }
  }

  private async fetchNearbyPRAD(lat: number, lon: number): Promise<Record<string, any>[]> {
    if (!supabase) return [];
    try {
      const delta = 0.005;
      const { data } = await supabase
        .from('road_anomalies')
        .select('id, anomaly_type, severity, latitude, longitude, detected_at, created_at')
        .gte('latitude', lat - delta)
        .lte('latitude', lat + delta)
        .gte('longitude', lon - delta)
        .lte('longitude', lon + delta)
        .limit(30);
      return data || [];
    } catch {
      return [];
    }
  }

  private mapSeverity(priority?: string): ARIssueMarker['severity'] {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'critical';
      case 'high': return 'high';
      case 'medium': return 'medium';
      default: return 'low';
    }
  }

  getMarkerColor(marker: ARMarker): string {
    if (marker.kind === 'prad') return '#f97316'; // orange for road anomalies
    return CATEGORY_AR_COLORS[marker.category] || '#6b7280';
  }
}

export const civicARService = new CivicARService();
