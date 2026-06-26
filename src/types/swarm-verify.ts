// ============================================================================
// SwarmVerify — Crowd-Sourced Issue Verification Types
// ============================================================================

export type VerificationStatus = 'pending' | 'verified' | 'disputed' | 'expired';

/** A verification quest — auto-created when an issue is reported */
export interface VerificationQuest {
  id: string;
  issueId: string;
  issueTitle: string;
  issueCategory: string;
  location: { latitude: number; longitude: number };
  radiusM: number;              // verification radius (default 500m)
  requiredVerifications: number; // how many needed (default 3)
  currentVerifications: number;
  status: VerificationStatus;
  createdBy: string;            // original reporter user ID
  createdAt: Date;
  expiresAt: Date;
  rewardPoints: number;         // points per verifier
}

/** A single verification submission by a citizen */
export interface Verification {
  id: string;
  questId: string;
  verifierId: string;
  verifierName: string;
  photoUrl: string | null;
  location: { latitude: number; longitude: number };
  distanceFromIssue: number;    // metres
  timestamp: Date;
  evidenceHash: string;         // SHA-256 hash of photo + location + timestamp
  isValid: boolean;
  notes: string;
}

/** User trust score — computed from verification history */
export interface TrustScore {
  userId: string;
  score: number;                // 0-100
  totalVerifications: number;
  accurateVerifications: number;
  rank: number;                 // position among all users
  level: TrustLevel;
}

export type TrustLevel = 'newcomer' | 'trusted' | 'verified' | 'expert' | 'guardian';

export function getTrustLevel(score: number): TrustLevel {
  if (score >= 90) return 'guardian';
  if (score >= 75) return 'expert';
  if (score >= 50) return 'verified';
  if (score >= 25) return 'trusted';
  return 'newcomer';
}

export function getTrustColor(level: TrustLevel): string {
  switch (level) {
    case 'guardian': return '#8b5cf6';  // purple
    case 'expert': return '#3b82f6';    // blue
    case 'verified': return '#22c55e';  // green
    case 'trusted': return '#eab308';   // yellow
    case 'newcomer': return '#9ca3af';  // gray
  }
}

export function getTrustLabel(level: TrustLevel): string {
  switch (level) {
    case 'guardian': return '🛡️ Guardian';
    case 'expert': return '⭐ Expert';
    case 'verified': return '✅ Verified';
    case 'trusted': return '👍 Trusted';
    case 'newcomer': return '🆕 Newcomer';
  }
}
