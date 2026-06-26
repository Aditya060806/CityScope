// ============================================================================
// CivicAR — Augmented Reality Types
// ============================================================================

export interface ARIssueMarker {
  id: string;
  issueId: string;
  title: string;
  category: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: string;
  location: { latitude: number; longitude: number };
  distanceM: number;
  bearingDeg: number;
  /** Screen-space coords computed from GPS + compass */
  screenX: number;
  screenY: number;
  upvotes: number;
  createdAt: Date;
}

export interface ARPRADMarker {
  id: string;
  type: 'pothole' | 'speed_bump' | 'rough_patch';
  severity: number; // 0-10
  location: { latitude: number; longitude: number };
  distanceM: number;
  bearingDeg: number;
  screenX: number;
  screenY: number;
  detectedAt: Date;
}

export type ARMarker = 
  | ({ kind: 'issue' } & ARIssueMarker)
  | ({ kind: 'prad' } & ARPRADMarker);

export interface ARState {
  hasCamera: boolean;
  hasOrientation: boolean;
  hasLocation: boolean;
  heading: number; // compass heading in degrees
  pitch: number;
  fovH: number; // horizontal field of view in degrees
  markers: ARMarker[];
  selectedMarker: ARMarker | null;
}

export const CATEGORY_AR_COLORS: Record<string, string> = {
  pothole: '#ef4444',
  road: '#f97316',
  water: '#3b82f6',
  garbage: '#84cc16',
  streetlight: '#eab308',
  sewage: '#8b5cf6',
  noise: '#ec4899',
  safety: '#14b8a6',
  other: '#6b7280',
};

export const SEVERITY_SIZES: Record<string, number> = {
  low: 32,
  medium: 40,
  high: 48,
  critical: 56,
};

export function bearingBetween(
  lat1: number, lon1: number, lat2: number, lon2: number
): number {
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const lat1R = (lat1 * Math.PI) / 180;
  const lat2R = (lat2 * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2R);
  const x = Math.cos(lat1R) * Math.sin(lat2R) - Math.sin(lat1R) * Math.cos(lat2R) * Math.cos(dLon);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function haversineMeters(
  lat1: number, lon1: number, lat2: number, lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
