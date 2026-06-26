// ============================================================================
// CivicSOS — Emergency Broadcast & Geo-Shield Types
// ============================================================================

export type EmergencyType =
  | 'flood' | 'fire' | 'earthquake' | 'accident' | 'medical'
  | 'crime' | 'gas_leak' | 'building_collapse' | 'protest' | 'other';

export interface SOSAlert {
  id: string;
  type: EmergencyType;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: { latitude: number; longitude: number };
  radiusM: number;
  createdBy: string;
  createdByName: string;
  photoUrl: string | null;
  confirmedCount: number;
  status: 'active' | 'resolved' | 'false_alarm';
  createdAt: Date;
  expiresAt: Date;
}

export interface GeoShield {
  id: string;
  name: string;
  centerLat: number;
  centerLon: number;
  radiusM: number;
  alertTypes: EmergencyType[];
  createdBy: string;
  isActive: boolean;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

export const EMERGENCY_EMOJI: Record<EmergencyType, string> = {
  flood: '🌊',
  fire: '🔥',
  earthquake: '🫨',
  accident: '🚗',
  medical: '🏥',
  crime: '🚨',
  gas_leak: '⚠️',
  building_collapse: '🏚️',
  protest: '📢',
  other: '🆘',
};

export const EMERGENCY_LABELS: Record<EmergencyType, string> = {
  flood: 'Flood',
  fire: 'Fire',
  earthquake: 'Earthquake',
  accident: 'Road Accident',
  medical: 'Medical Emergency',
  crime: 'Crime/Danger',
  gas_leak: 'Gas Leak',
  building_collapse: 'Building Collapse',
  protest: 'Protest/Unrest',
  other: 'Other Emergency',
};

export const SEVERITY_COLORS: Record<SOSAlert['severity'], string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
};

export const SEVERITY_BG: Record<SOSAlert['severity'], string> = {
  low: 'bg-green-500/20 border-green-500/40',
  medium: 'bg-amber-500/20 border-amber-500/40',
  high: 'bg-orange-500/20 border-orange-500/40',
  critical: 'bg-red-500/20 border-red-500/40',
};
