import { supabase } from '@/lib/supabase';
import { TreeRecord, TreeHealthReport, GreenZone, DeforestationAlert, getHealthScore } from '@/types/green-scope';

// ============================================================================
// GreenScopeService — Urban Green Cover Monitoring
// ============================================================================

class GreenScopeService {
  // ========================================================================
  // Tree Registry
  // ========================================================================

  async registerTree(
    species: string,
    estimatedAge: string,
    location: { latitude: number; longitude: number },
    userId: string,
    photo?: File
  ): Promise<TreeRecord | null> {
    if (!supabase) return null;
    try {
      let photoUrl: string | null = null;
      if (photo) {
        const fileName = `trees/${Date.now()}_${photo.name.replace(/\s+/g, '_')}`;
        const { error: upErr } = await supabase.storage.from('green-scope').upload(fileName, photo);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('green-scope').getPublicUrl(fileName);
          photoUrl = urlData?.publicUrl || null;
        }
      }

      // AI species identification if photo provided
      let aiSpecies = species;
      if (photo && !species) {
        aiSpecies = await this.identifyTreeSpecies(photoUrl) || 'Unknown';
      }

      const { data, error } = await supabase
        .from('tree_registry')
        .insert({
          species: aiSpecies,
          estimated_age: estimatedAge,
          health_status: 'healthy',
          latitude: location.latitude,
          longitude: location.longitude,
          photo_url: photoUrl,
          created_by: userId,
          canopy_diameter_m: this.estimateCanopy(estimatedAge),
        })
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') { console.warn('⚠️ GreenScope: table not found'); return null; }
        throw error;
      }
      return this.convertTree(data);
    } catch (err) {
      console.error('❌ GreenScope: Failed to register tree:', err);
      return null;
    }
  }

  async getNearbyTrees(location: { latitude: number; longitude: number }, radiusKm = 2): Promise<TreeRecord[]> {
    if (!supabase) return [];
    try {
      const delta = radiusKm / 111;
      const { data } = await supabase
        .from('tree_registry')
        .select('*')
        .gte('latitude', location.latitude - delta)
        .lte('latitude', location.latitude + delta)
        .gte('longitude', location.longitude - delta)
        .lte('longitude', location.longitude + delta)
        .order('created_at', { ascending: false })
        .limit(100);
      return (data || []).map(this.convertTree);
    } catch { return []; }
  }

  async adoptTree(treeId: string, userId: string, userName: string): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('tree_registry')
        .update({ adopted_by: userId, adopted_by_name: userName })
        .eq('id', treeId)
        .is('adopted_by', null);
      return !error;
    } catch { return false; }
  }

  // ========================================================================
  // Health Reports
  // ========================================================================

  async submitHealthReport(
    treeId: string,
    userId: string,
    healthStatus: TreeRecord['healthStatus'],
    photo: File | null,
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    if (!supabase) return { success: false, message: 'Database unavailable' };
    try {
      let photoUrl: string | null = null;
      if (photo) {
        const fileName = `tree-reports/${treeId}/${Date.now()}_${photo.name.replace(/\s+/g, '_')}`;
        const { error: upErr } = await supabase.storage.from('green-scope').upload(fileName, photo);
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('green-scope').getPublicUrl(fileName);
          photoUrl = urlData?.publicUrl || null;
        }
      }

      const aiAnalysis = photoUrl ? await this.analyzeTreeHealth(photoUrl) : null;

      await supabase.from('tree_health_reports').insert({
        tree_id: treeId,
        reported_by: userId,
        photo_url: photoUrl,
        health_status: healthStatus,
        ai_analysis: aiAnalysis,
      });

      // Update tree's health status
      await supabase.from('tree_registry').update({
        health_status: healthStatus,
        last_inspected: new Date().toISOString(),
      }).eq('id', treeId);

      return { success: true, message: 'Health report submitted' };
    } catch (err) {
      console.error('❌ GreenScope: Health report failed:', err);
      return { success: false, message: 'Failed to submit report' };
    }
  }

  // ========================================================================
  // Green Zone Stats
  // ========================================================================

  async getGreenZoneStats(location: { latitude: number; longitude: number }): Promise<GreenZone | null> {
    if (!supabase) return null;
    try {
      const trees = await this.getNearbyTrees(location, 1);
      if (trees.length === 0) return null;

      const totalHealth = trees.reduce((sum, t) => sum + getHealthScore(t.healthStatus), 0);
      const totalCanopy = trees.reduce((sum, t) => sum + Math.PI * (t.canopyDiameterM / 2) ** 2, 0);
      const areaSqM = Math.PI * (1000 ** 2); // 1km radius

      return {
        id: 'local-zone',
        name: 'Your Neighborhood',
        bounds: {
          north: location.latitude + 0.009,
          south: location.latitude - 0.009,
          east: location.longitude + 0.009,
          west: location.longitude - 0.009,
        },
        treeCount: trees.length,
        avgHealth: Math.round(totalHealth / trees.length),
        ndviScore: 0.3 + (trees.length / 200) * 0.4, // estimated from tree density
        canopyCoverPercent: Math.min(100, Math.round((totalCanopy / areaSqM) * 100)),
        lastUpdated: new Date(),
      };
    } catch { return null; }
  }

  // ========================================================================
  // AI Analysis
  // ========================================================================

  private async identifyTreeSpecies(photoUrl: string | null): Promise<string | null> {
    if (!photoUrl) return null;
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) return null;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: 'Identify this tree species. Return ONLY the common name and scientific name in format: "Common Name (Scientific name)". If unsure, return "Unknown tree species".' },
                { inline_data: { mime_type: 'image/jpeg', data: await this.urlToBase64(photoUrl) } },
              ],
            }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 100 },
          }),
        }
      );
      if (!response.ok) return null;
      const result = await response.json();
      return result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
    } catch { return null; }
  }

  private async analyzeTreeHealth(photoUrl: string): Promise<TreeHealthReport['aiAnalysis']> {
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) return null;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: 'Analyze this tree health. Return JSON: {"health": "healthy|stressed|diseased|dead", "species": "species name", "estimatedCo2Kg": number (annual CO2 absorption estimate), "issuesDetected": ["list of visible issues"], "recommendation": "care recommendation"}' },
                { inline_data: { mime_type: 'image/jpeg', data: await this.urlToBase64(photoUrl) } },
              ],
            }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 500 },
          }),
        }
      );
      if (!response.ok) return null;
      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = text.match(/\{[\s\S]*\}/);
      return match ? JSON.parse(match[0]) : null;
    } catch { return null; }
  }

  private async urlToBase64(url: string): Promise<string> {
    try {
      const resp = await fetch(url);
      const blob = await resp.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve((reader.result as string).split(',')[1] || '');
        reader.readAsDataURL(blob);
      });
    } catch { return ''; }
  }

  private estimateCanopy(age: string): number {
    switch (age) {
      case 'sapling': return 1;
      case 'young': return 3;
      case 'mature': return 8;
      case 'old-growth': return 15;
      default: return 4;
    }
  }

  private convertTree(row: Record<string, any>): TreeRecord {
    return {
      id: row.id,
      species: row.species || 'Unknown',
      estimatedAge: row.estimated_age || 'young',
      healthStatus: row.health_status || 'healthy',
      location: { latitude: row.latitude, longitude: row.longitude },
      photoUrl: row.photo_url,
      adoptedBy: row.adopted_by,
      adoptedByName: row.adopted_by_name,
      createdBy: row.created_by,
      createdAt: new Date(row.created_at),
      lastInspected: row.last_inspected ? new Date(row.last_inspected) : null,
      canopyDiameterM: row.canopy_diameter_m || 4,
      notes: row.notes || '',
    };
  }
}

export const greenScopeService = new GreenScopeService();
