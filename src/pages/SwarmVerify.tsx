import React, { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSwarmVerify } from '@/hooks/useSwarmVerify';
import { getTrustColor, getTrustLabel, VerificationQuest } from '@/types/swarm-verify';
import { PageHeader } from '@/components/ui/page-header';
import {
  Shield, MapPin, Camera, CheckCircle2, Clock, Users, Star, AlertTriangle, ChevronRight, X, Send,
} from 'lucide-react';

export default function SwarmVerify() {
  const { user } = useAuth();
  const { nearbyQuests, trustScore, loading, submitting, location, submitVerification } = useSwarmVerify(user?.id);
  const [selectedQuest, setSelectedQuest] = useState<VerificationQuest | null>(null);
  const [notes, setNotes] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const handleSubmit = async () => {
    if (!selectedQuest) return;
    const r = await submitVerification(selectedQuest.id, user?.name || user?.email || 'Citizen', photo, notes);
    setResult(r);
    if (r.success) {
      setSelectedQuest(null);
      setNotes('');
      setPhoto(null);
    }
  };

  const categoryEmoji: Record<string, string> = {
    pothole: '🕳️', road: '🛣️', water: '💧', garbage: '🗑️', streetlight: '💡',
    sewage: '🚰', noise: '🔊', safety: '🔒', other: '📋',
  };

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto rounded-[2rem] bg-white text-slate-900 pb-20 px-6 pt-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 min-h-[80vh]">
      {/* Header */}
      <PageHeader
        icon={<Shield className="h-5 w-5" />}
        title="Crowd Verification"
        description="Verify issues near you and earn trust-backed rewards."
        className="mb-8 border-indigo-100 bg-indigo-50"
        titleClassName="text-slate-900 font-black tracking-tighter"
        descriptionClassName="text-slate-500 font-medium"
        iconShellClassName="bg-indigo-100 text-indigo-600 rounded-[1rem]"
        actions={<span className="text-[12px] font-black tracking-widest uppercase rounded-xl border border-indigo-200 bg-white shadow-sm px-3 py-1.5 text-indigo-700">SwarmVerify</span>}
      />

      {/* Trust Score Card */}
      {trustScore && (
        <div className="bg-slate-50 rounded-[1.5rem] p-6 border border-slate-100 mb-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)]">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[14px] font-bold tracking-widest uppercase text-slate-500">Your Trust Score</span>
            <span className={`text-[12px] font-black uppercase tracking-widest px-3 py-1 rounded-xl shadow-sm ${getTrustColor(trustScore.level).replace('text-','bg-opacity-10 text-')} bg-white border border-slate-100`}>
              {getTrustLabel(trustScore.level)}
            </span>
          </div>
          <div className="flex items-end gap-3 px-1">
            <span className="text-[48px] font-black tracking-tighter leading-none text-slate-900">{trustScore.score}</span>
            <span className="text-slate-400 font-bold text-[18px] tracking-tight mb-1.5">/ 100</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-3 mt-4 overflow-hidden shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all shadow-[0_0_10px_rgb(99,102,241,0.5)]"
              style={{ width: `${trustScore.score}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-5 text-center px-1">
            <div className="bg-white rounded-[1.25rem] p-4 border border-slate-100 shadow-sm">
              <p className="text-[24px] font-black tracking-tighter text-slate-800 leading-none mb-1">{trustScore.totalVerifications}</p>
              <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Total Verifications</p>
            </div>
            <div className="bg-white rounded-[1.25rem] p-4 border border-slate-100 shadow-sm">
              <p className="text-[24px] font-black tracking-tighter text-indigo-600 leading-none mb-1">{trustScore.accurateVerifications}</p>
              <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400">Accurate</p>
            </div>
          </div>
        </div>
      )}

      {/* Location status */}
      {!location && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-[1.25rem] p-4 mb-6 shadow-sm">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-[13px] font-bold text-amber-700">GPS required to find nearby quests and verify issues</p>
        </div>
      )}

      {/* Nearby Quests */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-[17px] font-black tracking-tight text-slate-900 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-500" />
            Nearby Quests
          </h2>
          <span className="text-[13px] font-bold text-slate-400 uppercase tracking-widest">{nearbyQuests.length} active</span>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse bg-slate-50 rounded-2xl h-28 border border-slate-100" />
            ))}
          </div>
        ) : nearbyQuests.length === 0 ? (
          <div className="text-center py-16 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-[16px] font-black tracking-tight text-slate-700">No verification quests nearby</p>
            <p className="text-[14px] font-medium text-slate-400 mt-1">Report issues to create quests for others to verify</p>
          </div>
        ) : (
          <div className="space-y-4">
            {nearbyQuests.map((q) => {
              const timeLeft = Math.max(0, Math.round((q.expiresAt.getTime() - Date.now()) / 3600000));
              return (
                <button
                  key={q.id}
                  onClick={() => { setSelectedQuest(q); setResult(null); }}
                  className="w-full text-left bg-white rounded-[1.5rem] p-5 border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:border-indigo-300 hover:shadow-[0_8px_30px_rgb(99,102,241,0.1)] transition-all active:scale-[0.98] group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="flex items-start justify-between pl-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl drop-shadow-sm bg-slate-50 w-10 h-10 rounded-full flex items-center justify-center border border-slate-100">{categoryEmoji[q.issueCategory] || '📋'}</span>
                        <span className="text-[15px] font-black tracking-tight text-slate-900 truncate group-hover:text-indigo-700 transition-colors">{q.issueTitle}</span>
                      </div>
                      <div className="flex items-center gap-4 text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-3">
                        <span className="flex items-center gap-1.5 text-slate-600">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <strong className="text-slate-800">{q.currentVerifications}</strong>/{q.requiredVerifications}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          {timeLeft}h left
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1.5 text-amber-600">
                          <Star className="w-4 h-4 text-amber-400" />
                          +{q.rewardPoints} pts
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-indigo-500 transition-colors flex-shrink-0 mt-2" />
                  </div>
                  <div className="mt-4 w-full bg-slate-100 rounded-full h-2 pl-2 overflow-hidden shadow-inner">
                    <div
                      className="h-full rounded-full bg-indigo-500 shadow-[0_0_10px_rgb(99,102,241,0.5)] transition-all"
                      style={{ width: `${(q.currentVerifications / q.requiredVerifications) * 100}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Result Toast */}
      {result && !selectedQuest && (
        <div className={`fixed top-4 left-4 right-4 z-50 p-4 rounded-xl border shadow-lg backdrop-blur-md ${result.success ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800' : 'bg-red-50/90 border-red-200 text-red-800'}`}>
          <div className="flex items-start justify-between">
            <p className="text-[14px] font-bold">{result.message}</p>
            <button onClick={() => setResult(null)} className="ml-2 flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"><X className="w-5 h-5" /></button>
          </div>
        </div>
      )}

      {/* Verification Modal */}
      {selectedQuest && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md max-h-[85vh] overflow-y-auto border border-white shadow-[0_16px_40px_rgba(0,0,0,0.12)]">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black tracking-tight text-[22px] text-slate-900">Verify Issue</h3>
                <button onClick={() => setSelectedQuest(null)} className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[1.5rem] p-4 mb-5 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl drop-shadow-sm bg-white w-12 h-12 rounded-full flex items-center justify-center shadow-sm border border-slate-100 shrink-0">{categoryEmoji[selectedQuest.issueCategory] || '📋'}</span>
                  <span className="font-black tracking-tight text-[16px] text-slate-900 leading-tight">{selectedQuest.issueTitle}</span>
                </div>
                <p className="text-[12px] font-bold text-slate-500 mt-2 px-1 tracking-wide">
                  <span className="text-indigo-600">{selectedQuest.currentVerifications}/{selectedQuest.requiredVerifications}</span> verifications ·
                  <span className="text-amber-500"> +{selectedQuest.rewardPoints} pts</span> reward
                </p>
              </div>

              {/* Photo Capture */}
              <div className="mb-5">
                <label className="text-[13px] font-black uppercase tracking-widest text-slate-500 mb-2.5 block">Photo Evidence (optional)</label>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => setPhoto(e.target.files?.[0] || null)}
                />
                <button
                  onClick={() => fileInput.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-300 transition-colors"
                >
                  <Camera className="w-5 h-5 text-slate-400" />
                  <span className="text-[14px] font-bold text-slate-500">{photo ? photo.name : 'Take or upload photo'}</span>
                </button>
              </div>

              {/* Notes */}
              <div className="mb-5">
                <label className="text-[13px] font-black uppercase tracking-widest text-slate-500 mb-2.5 block">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 rounded-xl p-3.5 text-[14px] font-medium text-slate-900 border border-slate-200 focus:border-indigo-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(99,102,241,0.1)] transition-all outline-none resize-none placeholder:text-slate-400 placeholder:font-medium"
                  rows={3}
                  placeholder="Describe what you see at this location..."
                />
              </div>

              {/* GPS Status */}
              <div className="flex items-center gap-3 bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-3.5 mb-6">
                <MapPin className={`w-4 h-4 ${location ? 'text-indigo-500' : 'text-slate-400 animate-pulse'}`} />
                <span className="text-[13px] font-bold text-indigo-900/80 tracking-tight">
                  {location ? `Verified: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Acquiring secure GPS lock...'}
                </span>
              </div>

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={submitting || !location}
                className="w-full py-4 rounded-[1rem] font-black tracking-widest uppercase text-[14px] bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 disabled:opacity-50 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 text-white shadow-[0_4px_14px_0_rgba(99,102,241,0.39)] transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Verification
                  </>
                )}
              </button>

              {result && (
                <div className={`mt-4 p-3.5 rounded-[1rem] text-[13px] font-bold text-center border ${result.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                  {result.message}
                </div>
              )}

              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center mt-5 flex items-center justify-center gap-1.5 flex-wrap">
                <span className="text-xl leading-none">🔐</span> Hashed physically for tamper-proof proof-of-presence
              </p>
            </div>
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="bg-slate-50 rounded-[1.5rem] p-6 border border-slate-100 mt-8 shadow-sm">
        <h3 className="font-black tracking-tighter text-slate-900 text-[18px] mb-4">How SwarmVerify Works</h3>
        <div className="space-y-3 text-[14px] font-medium text-slate-600">
          {[
            { icon: '📢', text: 'A citizen reports an issue → A Verification Quest is created' },
            { icon: '🗺️', text: 'Nearby citizens see the quest and physically visit the location' },
            { icon: '📸', text: 'They take a photo and submit GPS-verified proof of presence' },
            { icon: '🔐', text: 'Each verification is SHA-256 hashed to guarantee unforgeable integrity' },
            { icon: '✅', text: '3+ verifications → Target issue auto-escalates to authorities' },
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <span className="text-[18px] leading-tight flex-shrink-0">{step.icon}</span>
              <p className="leading-snug">{step.text}</p>
            </div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
