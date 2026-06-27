import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { civicTimelapseService } from '@/services/CivicTimelapseService';
import {
  MonitoringPoint, TimelapseCapture, DecayTimeline,
  CATEGORY_LABELS, getDecayLabel, getDecayColor, DECAY_COLORS,
} from '@/types/civic-timelapse';
import {
  Timer, Camera, MapPin, Plus, TrendingUp, AlertTriangle, ChevronLeft, X, Image as ImageIcon, Clock,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

export default function CivicTimeLapse() {
  const { user } = useAuth();
  const [points, setPoints] = useState<MonitoringPoint[]>([]);
  const [selectedPoint, setSelectedPoint] = useState<MonitoringPoint | null>(null);
  const [timeline, setTimeline] = useState<DecayTimeline | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [compareIdx, setCompareIdx] = useState<[number, number] | null>(null);

  // GPS
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => {},
      { enableHighAccuracy: true }
    );
  }, []);

  // Load points
  useEffect(() => {
    if (!location) return;
    setLoading(true);
    civicTimelapseService.getNearbyPoints(location).then((pts) => { setPoints(pts); setLoading(false); });
  }, [location]);

  // Load timeline when point selected
  useEffect(() => {
    if (!selectedPoint) { setTimeline(null); return; }
    civicTimelapseService.getDecayTimeline(selectedPoint.id).then(setTimeline);
  }, [selectedPoint]);

  // Create new point
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<MonitoringPoint['category']>('road');
  const handleCreate = async () => {
    if (!user || !location || !newTitle.trim()) return;
    setSubmitting(true);
    const pt = await civicTimelapseService.createMonitoringPoint(newTitle.trim(), '', newCategory, location, user.id);
    if (pt) setPoints((prev) => [pt, ...prev]);
    setShowCreate(false);
    setNewTitle('');
    setSubmitting(false);
  };

  // Submit new capture
  const fileRef = useRef<HTMLInputElement>(null);
  const handleCapture = async (file: File) => {
    if (!selectedPoint || !user) return;
    setSubmitting(true);
    const result = await civicTimelapseService.submitCapture(selectedPoint.id, user.id, file);
    if (result.success) {
      const tl = await civicTimelapseService.getDecayTimeline(selectedPoint.id);
      setTimeline(tl);
    }
    setSubmitting(false);
  };

  // ========================================================================
  // Detail View
  // ========================================================================
  if (selectedPoint) {
    const captures = timeline?.captures || [];
    return (
      <div className="page-container">
        <div className="max-w-4xl mx-auto rounded-[2.5rem] bg-white/60 backdrop-blur-3xl text-slate-900 pb-20 px-8 pt-10 shadow-[0_12px_40px_rgb(0,0,0,0.06)] border border-white/80 min-h-[80vh]">
        <button onClick={() => { setSelectedPoint(null); setCompareIdx(null); }} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 bg-white border border-white shadow-sm px-4 py-2 rounded-full text-[13px] font-bold tracking-wide mb-8 transition-colors w-fit">
          <ChevronLeft className="w-4 h-4" /> Back to List
        </button>

        <h2 className="text-[28px] font-black tracking-tighter text-slate-900 mb-2">{selectedPoint.title}</h2>
        <p className="text-[13px] font-black tracking-widest uppercase text-slate-400 mb-8">{CATEGORY_LABELS[selectedPoint.category]}</p>

        {/* Decay Score */}
        <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-8 border border-white/80 mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 opacity-20" style={{ backgroundColor: getDecayColor(selectedPoint.decayScore) }} />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <span className="text-[15px] font-black tracking-widest uppercase text-slate-400">Decay Score</span>
            <span className="text-[12px] font-black tracking-widest uppercase px-4 py-1.5 rounded-full shadow-sm" style={{ color: getDecayColor(selectedPoint.decayScore), backgroundColor: getDecayColor(selectedPoint.decayScore) + '15', border: `1px solid ${getDecayColor(selectedPoint.decayScore)}40` }}>
              {getDecayLabel(selectedPoint.decayScore)}
            </span>
          </div>
          <div className="text-[48px] font-black tracking-tighter leading-none relative z-10 drop-shadow-sm" style={{ color: getDecayColor(selectedPoint.decayScore) }}>
            {selectedPoint.decayScore}
            <span className="text-slate-400 text-2xl ml-2 font-bold">/ 100</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3 mt-6 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] border border-white/60 overflow-hidden relative z-10">
            <div className="h-full rounded-full transition-all duration-700 ease-out" style={{ width: `${selectedPoint.decayScore}%`, backgroundColor: getDecayColor(selectedPoint.decayScore) }} />
          </div>
          {timeline?.overallDecayRate && (
            <p className="text-[13px] font-bold mt-5 px-3 py-1.5 bg-white rounded-lg border border-slate-100 w-fit relative z-10" style={{ color: DECAY_COLORS[timeline.overallDecayRate] }}>
              Historical Decay Rate: {timeline.overallDecayRate.toUpperCase()}
            </p>
          )}
        </div>

        {/* Add Capture */}
        <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleCapture(e.target.files[0])} />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={submitting}
          className="w-full py-5 rounded-[1.5rem] font-black tracking-widest uppercase text-[14px] text-white bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 disabled:opacity-50 flex items-center justify-center gap-2 mb-8 shadow-[0_8px_24px_-4px_rgba(245,158,11,0.4)] hover:shadow-[0_12px_30px_-4px_rgba(245,158,11,0.5)] transition-all active:scale-[0.98] border border-orange-400/30"
        >
          {submitting ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Camera className="w-6 h-6" /> Add New Capture</>}
        </button>

        {/* Before/After Compare */}
        {captures.length >= 2 && compareIdx && (
          <div className="bg-slate-50 rounded-[1.5rem] p-5 border border-slate-100 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[15px] font-bold tracking-tight text-slate-900">Before / After Comparison</h3>
              <button onClick={() => setCompareIdx(null)} className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <img src={captures[compareIdx[0]].photoUrl} className="rounded-xl w-full aspect-square object-cover shadow-[0_2px_10px_rgb(0,0,0,0.05)] border border-slate-200/50" alt="Before" />
                <p className="text-[12px] font-bold tracking-wide uppercase text-slate-500 mt-2 text-center">{captures[compareIdx[0]].capturedAt.toLocaleDateString()}</p>
              </div>
              <div>
                <img src={captures[compareIdx[1]].photoUrl} className="rounded-xl w-full aspect-square object-cover shadow-[0_2px_10px_rgb(0,0,0,0.05)] border border-slate-200/50" alt="After" />
                <p className="text-[12px] font-bold tracking-wide uppercase text-slate-500 mt-2 text-center">{captures[compareIdx[1]].capturedAt.toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Timeline */}
        <h3 className="text-[17px] font-black tracking-tight text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-amber-500" /> Capture Timeline ({captures.length})
        </h3>
        {captures.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-[1.5rem] border border-dashed border-slate-200">
            <ImageIcon className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <p className="text-[15px] font-bold text-slate-700">No captures yet</p>
            <p className="text-[13px] font-medium text-slate-500 mt-1">Take the first photo to start tracking decay</p>
          </div>
        ) : (
          <div className="space-y-4">
            {captures.slice().reverse().map((c, i) => (
              <div key={c.id} className="bg-white rounded-[1.25rem] overflow-hidden border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.03)] hover:shadow-md transition-shadow">
                <div className="flex">
                  <img src={c.thumbnailUrl} className="w-28 h-28 object-cover flex-shrink-0 border-r border-slate-100" alt="" />
                  <div className="p-4 flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-[12px] font-bold tracking-wider uppercase text-slate-400 mb-1">{c.capturedAt.toLocaleDateString()}</p>
                    {c.aiAnalysis && (
                      <>
                        <p className="text-[14px] font-bold mb-0.5" style={{ color: getDecayColor(100 - c.aiAnalysis.conditionScore) }}>
                          AI Condition: {c.aiAnalysis.conditionScore}/100
                        </p>
                        <p className="text-[13px] font-medium text-slate-500 truncate">{c.aiAnalysis.issuesDetected[0]}</p>
                      </>
                    )}
                    {captures.length >= 2 && i < captures.length - 1 && (
                      <button
                        onClick={() => setCompareIdx([captures.length - 1 - i - 1, captures.length - 1 - i])}
                        className="text-[13px] font-bold text-amber-600 mt-2 hover:text-amber-700 w-fit"
                      >
                        Compare with previous &rarr;
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    );
  }

  // ========================================================================
  // List View
  // ========================================================================
  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto rounded-[2.5rem] bg-white/60 backdrop-blur-3xl text-slate-900 pb-20 px-8 pt-10 shadow-[0_12px_40px_rgb(0,0,0,0.06)] border border-white/80 min-h-[80vh]">
      {/* Header */}
      <PageHeader
        icon={<Timer className="h-6 w-6" />}
        title="Infrastructure Decay Tracker"
        description="Monitor structural deterioration over time with AI-assisted analysis."
        className="mb-10 border border-white/60 bg-white/40 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem]"
        titleClassName="bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent font-black tracking-tighter"
        descriptionClassName="text-slate-500 font-medium text-[15px]"
        iconShellClassName="bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-[0_4px_20px_rgba(245,158,11,0.4)] rounded-[1.25rem] p-3"
        actions={<span className="text-[12px] font-black tracking-widest uppercase rounded-full border border-white/80 bg-white/80 backdrop-blur-md shadow-sm px-4 py-2 text-amber-600">CivicTimeLapse</span>}
      />

      {/* Create Button */}
      <button
        onClick={() => setShowCreate(true)}
        className="w-full py-5 mb-8 rounded-[1.5rem] font-bold tracking-wide border-2 border-dashed border-amber-300 text-amber-600 hover:text-amber-700 bg-amber-50/50 hover:bg-amber-100/50 flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgb(245,158,11,0.08)] hover:shadow-[0_8px_30px_rgb(245,158,11,0.15)] active:scale-[0.98]"
      >
        <Plus className="w-6 h-6" /> Add Monitoring Point
      </button>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-md p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[19px] font-black tracking-tighter text-slate-900">New Monitoring Point</h3>
              <button onClick={() => setShowCreate(false)} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="e.g., Main Street Bridge Pillar #3"
              className="w-full bg-slate-50 rounded-xl p-4 text-[15px] font-bold text-slate-900 border border-slate-200 focus:border-amber-400 focus:ring-4 focus:ring-amber-400/10 focus:outline-none mb-5 transition-all shadow-inner placeholder:text-slate-400 placeholder:font-medium"
            />
            <div className="grid grid-cols-3 gap-3 mb-6">
              {(Object.keys(CATEGORY_LABELS) as MonitoringPoint['category'][]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setNewCategory(cat)}
                  className={`text-[12px] font-bold uppercase tracking-wider p-3 rounded-xl border transition-all ${newCategory === cat ? 'border-amber-400 bg-amber-50 text-amber-700 shadow-[inset_0_0_0_1px_rgba(251,191,36,1)]' : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'}`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
            <button onClick={handleCreate} disabled={!newTitle.trim() || submitting} className="w-full py-4 rounded-[1.25rem] font-bold tracking-wide text-white bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 disabled:opacity-50 shadow-[0_8px_20px_rgba(245,158,11,0.25)] transition-all">
              {submitting ? 'Creating...' : 'Create Point'}
            </button>
          </div>
        </div>
      )}

      {/* Points List */}
      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="animate-pulse bg-white/50 border border-white/60 rounded-2xl h-24" />)}</div>
      ) : points.length === 0 ? (
        <div className="text-center py-16 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-dashed border-amber-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-400/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          <TrendingUp className="w-16 h-16 text-amber-300 mx-auto mb-4 drop-shadow-sm" />
          <p className="text-[18px] font-black tracking-tight text-slate-800">No monitoring points nearby</p>
          <p className="text-[14px] font-bold text-slate-500 mt-2 max-w-sm mx-auto">Create one to start tracking infrastructure decay and earn contribution points.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {points.map((pt) => (
            <button
              key={pt.id}
              onClick={() => setSelectedPoint(pt)}
              className="w-full text-left bg-white/80 rounded-[1.5rem] p-6 border border-white hover:border-amber-300 hover:shadow-[0_12px_40px_rgb(245,158,11,0.12)] shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-md transition-all active:scale-[0.98] group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-amber-400 to-orange-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-3 pl-2">
                <span className="text-[18px] font-black tracking-tight text-slate-900 group-hover:text-amber-700 transition-colors">{pt.title}</span>
                <span className="text-[11px] font-bold tracking-widest uppercase px-3 py-1 rounded-lg" style={{ color: getDecayColor(pt.decayScore), backgroundColor: getDecayColor(pt.decayScore) + '15' }}>
                  {getDecayLabel(pt.decayScore)}
                </span>
              </div>
              <div className="flex items-center gap-4 text-[13px] font-bold text-slate-500 mb-3">
                <span className="uppercase tracking-wider">{CATEGORY_LABELS[pt.category]}</span>
                <span className="flex items-center gap-1"><Camera className="w-3.5 h-3.5" /> {pt.captureCount} captures</span>
                {pt.lastCapturedAt && <span>Last: {pt.lastCapturedAt.toLocaleDateString()}</span>}
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 shadow-inner overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pt.decayScore}%`, backgroundColor: getDecayColor(pt.decayScore) }} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* How it works */}
      <div className="bg-slate-50 rounded-[1.5rem] p-6 border border-slate-100 mt-8">
        <h3 className="text-[15px] font-black tracking-tight text-slate-900 mb-4">How CivicTimeLapse Works</h3>
        <div className="space-y-3 text-[13px] font-medium text-slate-600">
          {[
            { icon: '📍', text: 'Mark infrastructure locations (bridges, roads, walls) to monitor' },
            { icon: '📸', text: 'Periodically photograph the same spot over weeks/months' },
            { icon: '🤖', text: 'AI analyzes each photo for cracks, erosion, and deterioration' },
            { icon: '📊', text: 'Track decay scores over time with before/after comparison' },
            { icon: '⚠️', text: 'Auto-alert authorities when rapid deterioration is detected' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3"><span className="text-[18px] drop-shadow-sm bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-slate-100">{s.icon}</span><p>{s.text}</p></div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
