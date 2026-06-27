import { supabase } from '@/lib/supabase';
import { VerificationQuest, Verification, TrustScore, getTrustLevel } from '@/types/swarm-verify';

// ============================================================================
// SwarmVerifyService — Crowd-sourced issue verification with crypto hashing
//
// When a citizen reports an issue, a VerificationQuest is auto-created.
// Nearby citizens can verify by visiting the location, taking a photo,
// and submitting proof. Each verification is SHA-256 hashed via Web Crypto API.
// When 3+ independent verifications are collected, the issue auto-escalates.
// ============================================================================

class SwarmVerifyService {
  /** Set to true after first PGRST205 to stop hammering missing tables */
  private tablesUnavailable = false;

  // ========================================================================
  // Quest CRUD
  // ========================================================================

  /** Create a verification quest when a new issue is reported */
  async createQuest(
    issueId: string,
    issueTitle: string,
    issueCategory: string,
    location: { latitude: number; longitude: number },
    createdBy: string
  ): Promise<VerificationQuest | null> {
    if (!supabase || this.tablesUnavailable) return null;
    try {
      const quest = {
        issue_id: issueId,
        issue_title: issueTitle,
        issue_category: issueCategory,
        latitude: location.latitude,
        longitude: location.longitude,
        radius_m: 500,
        required_verifications: 3,
        current_verifications: 0,
        status: 'pending',
        created_by: createdBy,
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48h
        reward_points: 15,
      };

      const { data, error } = await supabase
        .from('verification_quests')
        .insert(quest)
        .select()
        .single();

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist')) {
          this.tablesUnavailable = true;
          console.warn('⚠️ SwarmVerify: tables not found — run migration-new-features.sql in Supabase');
          return null;
        }
        throw error;
      }
      console.log(`🔍 SwarmVerify: Quest created for issue ${issueId}`);
      return this.convertQuest(data);
    } catch (err) {
      console.error('❌ SwarmVerify: Failed to create quest:', err);
      return null;
    }
  }

  /** Get active quests near a location */
  async getActiveQuests(
    location: { latitude: number; longitude: number },
    radiusKm = 2
  ): Promise<VerificationQuest[]> {
    if (!supabase || this.tablesUnavailable) return [];
    try {
      const delta = radiusKm / 111; // approximate degree delta
      const { data, error } = await supabase
        .from('verification_quests')
        .select('*')
        .eq('status', 'pending')
        .gte('expires_at', new Date().toISOString())
        .gte('latitude', location.latitude - delta)
        .lte('latitude', location.latitude + delta)
        .gte('longitude', location.longitude - delta)
        .lte('longitude', location.longitude + delta)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist')) {
          this.tablesUnavailable = true;
          console.warn('⚠️ SwarmVerify: tables not found — run migration-new-features.sql in Supabase');
          return [];
        }
      }
      if (!data) return [];
      return data.map(this.convertQuest);
    } catch {
      return [];
    }
  }

  // ========================================================================
  // Verification Submission
  // ========================================================================

  /** Submit a verification for a quest */
  async submitVerification(
    questId: string,
    verifierId: string,
    verifierName: string,
    photo: File | null,
    location: { latitude: number; longitude: number },
    notes: string
  ): Promise<{ success: boolean; message: string }> {
    if (!supabase) return { success: false, message: 'Database unavailable' };
    if (this.tablesUnavailable) return { success: false, message: 'Verification tables not set up — run migration-new-features.sql in Supabase SQL editor' };

    try {
      // 1. Fetch quest
      const { data: quest, error: qErr } = await supabase
        .from('verification_quests')
        .select('*')
        .eq('id', questId)
        .single();

      if (qErr || !quest) return { success: false, message: 'Quest not found' };

      // 2. Anti-gaming: can't verify your own issue
      if (quest.created_by === verifierId) {
        return { success: false, message: 'You cannot verify your own reported issue' };
      }

      // 3. Check GPS is within radius
      const distance = this.haversineMeters(
        location.latitude, location.longitude,
        quest.latitude, quest.longitude
      );
      if (distance > quest.radius_m * 1.2) { // 20% tolerance
        return { success: false, message: `Too far from issue location (${Math.round(distance)}m away, max ${quest.radius_m}m)` };
      }

      // 4. Check user hasn't already verified this quest
      const { data: existing } = await supabase
        .from('verifications')
        .select('id')
        .eq('quest_id', questId)
        .eq('verifier_id', verifierId)
        .limit(1);

      if (existing && existing.length > 0) {
        return { success: false, message: 'You have already verified this issue' };
      }

      // 5. Upload photo if provided
      let photoUrl: string | null = null;
      if (photo) {
        const fileName = `verifications/${questId}/${verifierId}_${Date.now()}.${photo.name.split('.').pop()}`;
        const { error: uploadErr } = await supabase.storage
          .from('verification-photos')
          .upload(fileName, photo);
        if (!uploadErr) {
          const { data: urlData } = supabase.storage
            .from('verification-photos')
            .getPublicUrl(fileName);
          photoUrl = urlData?.publicUrl || null;
        }
      }

      // 6. Generate evidence hash (SHA-256)
      const evidenceHash = await this.hashEvidence(questId, verifierId, location, Date.now());

      // 7. Insert verification
      const { error: insertErr } = await supabase
        .from('verifications')
        .insert({
          quest_id: questId,
          verifier_id: verifierId,
          verifier_name: verifierName,
          photo_url: photoUrl,
          latitude: location.latitude,
          longitude: location.longitude,
          distance_from_issue: Math.round(distance),
          evidence_hash: evidenceHash,
          is_valid: true,
          notes,
        });

      if (insertErr) throw insertErr;

      // 8. Increment quest counter
      const newCount = (quest.current_verifications || 0) + 1;
      const newStatus = newCount >= quest.required_verifications ? 'verified' : 'pending';
      await supabase
        .from('verification_quests')
        .update({ current_verifications: newCount, status: newStatus })
        .eq('id', questId);

      // 9. Award points to verifier
      await this.awardPoints(verifierId, quest.reward_points || 15);

      // 10. If fully verified, escalate the issue
      if (newStatus === 'verified') {
        await this.escalateIssue(quest.issue_id, newCount);
      }

      console.log(`✅ SwarmVerify: Verification ${newCount}/${quest.required_verifications} for quest ${questId}`);
      return {
        success: true,
        message: newStatus === 'verified'
          ? `Issue verified! ${newCount} citizens confirmed this issue — auto-escalated to authorities.`
          : `Verification submitted! ${newCount}/${quest.required_verifications} verifications collected.`,
      };
    } catch (err) {
      console.error('❌ SwarmVerify: Verification failed:', err);
      return { success: false, message: 'Verification failed. Please try again.' };
    }
  }

  // ========================================================================
  // Trust Score
  // ========================================================================

  /** Get user's trust score */
  async getUserTrustScore(userId: string): Promise<TrustScore | null> {
    if (!supabase || this.tablesUnavailable) return null;
    try {
      const { data, error } = await supabase
        .from('verifications')
        .select('is_valid')
        .eq('verifier_id', userId);

      if (error) {
        if (error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('does not exist')) {
          this.tablesUnavailable = true;
          console.warn('⚠️ SwarmVerify: tables not found — run migration-new-features.sql in Supabase');
          return null;
        }
        return null;
      }
      if (!data) return null;

      const total = data.length;
      const accurate = data.filter((v) => v.is_valid).length;
      const score = total > 0 ? Math.round((accurate / total) * 100) : 50;

      return {
        userId,
        score,
        totalVerifications: total,
        accurateVerifications: accurate,
        rank: 0, // computed separately
        level: getTrustLevel(score),
      };
    } catch {
      return null;
    }
  }

  /** Get top verifiers leaderboard */
  async getTopVerifiers(limit = 20): Promise<TrustScore[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('verifications')
        .select('verifier_id, verifier_name, is_valid');

      if (error || !data) return [];

      // Aggregate by user
      const map = new Map<string, { total: number; accurate: number }>();
      for (const v of data) {
        const entry = map.get(v.verifier_id) || { total: 0, accurate: 0 };
        entry.total++;
        if (v.is_valid) entry.accurate++;
        map.set(v.verifier_id, entry);
      }

      return Array.from(map.entries())
        .map(([userId, { total, accurate }], idx) => {
          const score = total > 0 ? Math.round((accurate / total) * 100) : 50;
          return {
            userId,
            score,
            totalVerifications: total,
            accurateVerifications: accurate,
            rank: idx + 1,
            level: getTrustLevel(score),
          };
        })
        .sort((a, b) => b.totalVerifications - a.totalVerifications || b.score - a.score)
        .slice(0, limit)
        .map((s, idx) => ({ ...s, rank: idx + 1 }));
    } catch {
      return [];
    }
  }

  // ========================================================================
  // Helpers
  // ========================================================================

  private async hashEvidence(
    questId: string,
    verifierId: string,
    location: { latitude: number; longitude: number },
    timestamp: number
  ): Promise<string> {
    const payload = `${questId}|${verifierId}|${location.latitude}|${location.longitude}|${timestamp}`;
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(payload);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback for environments without Web Crypto
      return btoa(payload).replace(/[^a-z0-9]/gi, '').slice(0, 64);
    }
  }

  private haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private async awardPoints(userId: string, points: number): Promise<void> {
    if (!supabase) return;
    try {
      await supabase.rpc('increment_user_points', { p_user_id: userId, p_points: points });
    } catch {
      // Fallback: direct update
      try {
        const { data: user } = await supabase
          .from('users')
          .select('total_points')
          .eq('id', userId)
          .single();
        if (user) {
          await supabase.from('users').update({ total_points: (user.total_points || 0) + points }).eq('id', userId);
        }
      } catch { /* silent */ }
    }
  }

  private async escalateIssue(issueId: string, verificationCount: number): Promise<void> {
    if (!supabase) return;
    try {
      await supabase.from('issues').update({
        priority: 'high',
        verification_count: verificationCount,
        verified_at: new Date().toISOString(),
      }).eq('id', issueId);
      console.log(`🚀 SwarmVerify: Issue ${issueId} auto-escalated with ${verificationCount} verifications`);
    } catch (err) {
      console.warn('⚠️ SwarmVerify: Failed to escalate issue:', err);
    }
  }

  private convertQuest(row: Record<string, unknown>): VerificationQuest {
    return {
      id: row.id as string,
      issueId: row.issue_id as string,
      issueTitle: row.issue_title as string,
      issueCategory: row.issue_category as string,
      location: { latitude: row.latitude as number, longitude: row.longitude as number },
      radiusM: row.radius_m as number,
      requiredVerifications: row.required_verifications as number,
      currentVerifications: row.current_verifications as number,
      status: row.status as VerificationQuest['status'],
      createdBy: row.created_by as string,
      createdAt: new Date(row.created_at as string),
      expiresAt: new Date(row.expires_at as string),
      rewardPoints: row.reward_points as number,
    };
  }
}

export const swarmVerifyService = new SwarmVerifyService();
