// ============================================================================
// GreenScope — Urban Green Cover Monitor Types
// ============================================================================

export interface TreeRecord {
  id: string;
  species: string;
  estimatedAge: string; // 'sapling' | 'young' | 'mature' | 'old-growth'
  healthStatus: 'healthy' | 'stressed' | 'diseased' | 'dead';
  location: { latitude: number; longitude: number };
  photoUrl: string | null;
  adoptedBy: string | null;
  adoptedByName: string | null;
  createdBy: string;
  createdAt: Date;
  lastInspected: Date | null;
  canopyDiameterM: number;
  notes: string;
}

export interface TreeHealthReport {
  id: string;
  treeId: string;
  reportedBy: string;
  photoUrl: string | null;
  healthStatus: TreeRecord['healthStatus'];
  aiAnalysis: {
    health: string;
    species: string;
    estimatedCo2Kg: number;
    issuesDetected: string[];
    recommendation: string;
  } | null;
  reportedAt: Date;
}

export interface GreenZone {
  id: string;
  name: string;
  bounds: { north: number; south: number; east: number; west: number };
  treeCount: number;
  avgHealth: number; // 0-100
  ndviScore: number; // -1 to 1 (Normalized Difference Vegetation Index)
  canopyCoverPercent: number;
  lastUpdated: Date;
}

export interface DeforestationAlert {
  id: string;
  zoneId: string;
  zoneName: string;
  treesLost: number;
  detectedAt: Date;
  ndviBefore: number;
  ndviAfter: number;
  severity: 'minor' | 'moderate' | 'severe';
  photoUrl: string | null;
}

export const HEALTH_COLORS: Record<TreeRecord['healthStatus'], string> = {
  healthy: '#22c55e',
  stressed: '#eab308',
  diseased: '#f97316',
  dead: '#ef4444',
};

export const HEALTH_EMOJI: Record<TreeRecord['healthStatus'], string> = {
  healthy: '🌳',
  stressed: '🌿',
  diseased: '🍂',
  dead: '🪵',
};

export const AGE_LABELS: Record<string, string> = {
  sapling: '🌱 Sapling (0-3 yrs)',
  young: '🌿 Young (3-15 yrs)',
  mature: '🌳 Mature (15-50 yrs)',
  'old-growth': '🌲 Old Growth (50+ yrs)',
};

export function getHealthScore(status: TreeRecord['healthStatus']): number {
  switch (status) {
    case 'healthy': return 100;
    case 'stressed': return 60;
    case 'diseased': return 30;
    case 'dead': return 0;
  }
}

export function getNDVILabel(ndvi: number): string {
  if (ndvi >= 0.6) return 'Dense Vegetation';
  if (ndvi >= 0.3) return 'Moderate Vegetation';
  if (ndvi >= 0.1) return 'Sparse Vegetation';
  if (ndvi >= 0) return 'Bare Soil';
  return 'Water/Non-vegetation';
}

export function getNDVIColor(ndvi: number): string {
  if (ndvi >= 0.6) return '#15803d';
  if (ndvi >= 0.3) return '#22c55e';
  if (ndvi >= 0.1) return '#84cc16';
  if (ndvi >= 0) return '#d4a574';
  return '#3b82f6';
}
