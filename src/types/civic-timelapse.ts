// ============================================================================
// CivicTimeLapse — Infrastructure Decay Tracking Types
// ============================================================================

export interface MonitoringPoint {
  id: string;
  title: string;
  description: string;
  category: 'road' | 'bridge' | 'building' | 'footpath' | 'drainage' | 'wall' | 'other';
  location: { latitude: number; longitude: number };
  createdBy: string;
  createdAt: Date;
  captureCount: number;
  decayScore: number; // 0-100, 0=pristine, 100=critical decay
  lastCapturedAt: Date | null;
}

export interface TimelapseCapture {
  id: string;
  monitoringPointId: string;
  capturedBy: string;
  photoUrl: string;
  thumbnailUrl: string;
  /** AI-generated analysis of infrastructure condition */
  aiAnalysis: {
    conditionScore: number; // 0-100
    issuesDetected: string[];
    decayRate: 'stable' | 'slow' | 'moderate' | 'rapid' | 'critical';
    recommendation: string;
  } | null;
  /** Visual diff score vs previous capture (0-1, 0=identical, 1=completely different) */
  diffScore: number | null;
  capturedAt: Date;
  weatherCondition?: string;
  notes?: string;
}

export interface DecayTimeline {
  monitoringPointId: string;
  captures: TimelapseCapture[];
  decayTrend: { date: Date; score: number }[];
  overallDecayRate: 'stable' | 'slow' | 'moderate' | 'rapid' | 'critical';
}

export const CATEGORY_LABELS: Record<MonitoringPoint['category'], string> = {
  road: '🛣️ Road Surface',
  bridge: '🌉 Bridge',
  building: '🏢 Building',
  footpath: '🚶 Footpath',
  drainage: '🚰 Drainage',
  wall: '🧱 Wall/Barrier',
  other: '📋 Other',
};

export const DECAY_COLORS: Record<string, string> = {
  stable: '#22c55e',
  slow: '#84cc16',
  moderate: '#eab308',
  rapid: '#f97316',
  critical: '#ef4444',
};

export function getDecayLabel(score: number): string {
  if (score <= 15) return 'Excellent';
  if (score <= 35) return 'Good';
  if (score <= 55) return 'Fair';
  if (score <= 75) return 'Poor';
  return 'Critical';
}

export function getDecayColor(score: number): string {
  if (score <= 15) return '#22c55e';
  if (score <= 35) return '#84cc16';
  if (score <= 55) return '#eab308';
  if (score <= 75) return '#f97316';
  return '#ef4444';
}
