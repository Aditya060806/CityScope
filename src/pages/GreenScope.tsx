import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { greenScopeService } from '@/services/GreenScopeService';
import {
  TreeRecord, GreenZone, HEALTH_COLORS, HEALTH_EMOJI, AGE_LABELS,
  getHealthScore, getNDVILabel, getNDVIColor,
} from '@/types/green-scope';
import {
  TreePine, Plus, Heart, Camera, Leaf, MapPin, BarChart3, X, ChevronRight, AlertTriangle,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

export default function GreenScope() {
  const { user } = useAuth();
  const [trees, setTrees] = useState<TreeRecord[]>([]);
  const [zone, setZone] = useState<GreenZone | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegister, setShowRegister] = useState(false);
  const [selectedTree, setSelectedTree] = useState<TreeRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [species, setSpecies] = useState('');
  const [age, setAge] = useState<string>('young');
  const [photo, setPhoto] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // GPS
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => {}, { enableHighAccuracy: true }
    );
  }, []);

  // Load data
  useEffect(() => {
    if (!location) return;
    setLoading(true);
    Promise.all([
      greenScopeService.getNearbyTrees(location),
      greenScopeService.getGreenZoneStats(location),
    ]).then(([t, z]) => { setTrees(t); setZone(z); setLoading(false); });
  }, [location]);

  // Register tree
  const handleRegister = async () => {
    if (!user || !location) return;
    setSubmitting(true);
    const tree = await greenScopeService.registerTree(species || '', age, location, user.id, photo || undefined);
    if (tree) setTrees((prev) => [tree, ...prev]);
    setShowRegister(false);
    setSpecies('');
    setPhoto(null);
    setSubmitting(false);
  };

  // Adopt tree
  const handleAdopt = async (tree: TreeRecord) => {
    if (!user) return;
    const ok = await greenScopeService.adoptTree(tree.id, user.id, user.name || user.email || 'Citizen');
    if (ok) {
      setTrees((prev) => prev.map((t) => t.id === tree.id ? { ...t, adoptedBy: user.id, adoptedByName: user.name || user.email } : t));
      setSelectedTree(null);
    }
  };

  const healthyCount = trees.filter((t) => t.healthStatus === 'healthy').length;
  const stressedCount = trees.filter((t) => t.healthStatus === 'stressed' || t.healthStatus === 'diseased').length;

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto rounded-[2.5rem] bg-white/60 backdrop-blur-3xl text-slate-900 pb-20 px-8 pt-10 shadow-[0_12px_40px_rgb(0,0,0,0.06)] border border-white/80 min-h-[80vh]">
      {/* Header */}
      <PageHeader
        icon={<TreePine className="h-6 w-6" />}
        title="Urban Green Monitor"
        description="Map, monitor, and protect neighborhood green cover."
        className="mb-10 border border-white/60 bg-white/40 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem]"
        titleClassName="bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent font-black tracking-tighter"
        descriptionClassName="text-slate-500 font-medium text-[15px]"
        iconShellClassName="bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-[0_4px_20px_rgba(16,185,129,0.4)] rounded-[1.25rem] p-3"
        actions={<span className="text-[12px] font-black tracking-widest uppercase rounded-full border border-white/80 bg-white/80 backdrop-blur-md shadow-sm px-4 py-2 text-green-600">GreenScope</span>}
      />

      {/* Zone Stats */}
      {zone && (
        <div className="bg-white/70 backdrop-blur-xl rounded-[2rem] p-8 border border-white/80 mb-8 shadow-[0_12px_40px_rgb(0,0,0,0.06)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2 opacity-20" style={{ backgroundColor: getNDVIColor(zone.ndviScore) }} />
          <h3 className="text-[15px] font-black tracking-tight text-slate-900 mb-6 flex items-center gap-3 relative z-10">
            <div className="p-2 bg-green-50 text-green-500 rounded-xl"><BarChart3 className="w-5 h-5" /></div>
            Your Neighborhood Overview
          </h3>
          <div className="grid grid-cols-2 gap-4 relative z-10">
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 text-center border border-white hover:border-green-200 transition-colors shadow-sm">
              <p className="text-[32px] font-black tracking-tighter text-green-500 leading-none mb-2 drop-shadow-sm">{zone.treeCount}</p>
              <p className="text-[12px] font-bold tracking-widest uppercase text-slate-400">Trees Mapped</p>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 text-center border border-white hover:border-green-200 transition-colors shadow-sm">
              <p className="text-[32px] font-black tracking-tighter leading-none mb-2 drop-shadow-sm" style={{ color: getNDVIColor(zone.ndviScore) }}>{zone.ndviScore.toFixed(2)}</p>
              <p className="text-[12px] font-bold tracking-widest uppercase text-slate-400">NDVI Score</p>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 text-center border border-white hover:border-green-200 transition-colors shadow-sm">
              <p className="text-[32px] font-black tracking-tighter text-slate-800 leading-none mb-2 drop-shadow-sm">{zone.canopyCoverPercent}%</p>
              <p className="text-[12px] font-bold tracking-widest uppercase text-slate-400">Canopy Cover</p>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-5 text-center border border-white hover:border-green-200 transition-colors shadow-sm">
              <p className="text-[32px] font-black tracking-tighter text-slate-800 leading-none mb-2 drop-shadow-sm">{zone.avgHealth}</p>
              <p className="text-[12px] font-bold tracking-widest uppercase text-slate-400">Avg Health</p>
            </div>
          </div>
          <div className="mt-6 flex justify-center relative z-10">
            <p className="text-[13px] font-bold px-4 py-2 bg-white rounded-xl border border-white shadow-sm uppercase tracking-wider" style={{ color: getNDVIColor(zone.ndviScore) }}>
              Zone Status: {getNDVILabel(zone.ndviScore)}
            </p>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100/50 rounded-[1.5rem] p-5 text-center shadow-sm">
          <p className="text-[28px] font-black tracking-tighter text-green-600 leading-none mb-2">{healthyCount}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-green-600/70">Healthy</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100/50 rounded-[1.5rem] p-5 text-center shadow-sm">
          <p className="text-[28px] font-black tracking-tighter text-amber-500 leading-none mb-2">{stressedCount}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-amber-600/70">At Risk</p>
        </div>
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-100/50 rounded-[1.5rem] p-5 text-center shadow-sm">
          <p className="text-[28px] font-black tracking-tighter text-cyan-500 leading-none mb-2">{trees.filter((t) => t.adoptedBy).length}</p>
          <p className="text-[11px] font-bold tracking-widest uppercase text-cyan-600/70">Adopted</p>
        </div>
      </div>

      {/* Register Button */}
      <button
        onClick={() => setShowRegister(true)}
        className="w-full py-5 mb-8 rounded-[1.5rem] font-bold tracking-wide border-2 border-dashed border-green-300 text-green-600 hover:text-green-700 bg-green-50/50 hover:bg-green-100/50 flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgb(34,197,94,0.08)] hover:shadow-[0_8px_30px_rgb(34,197,94,0.15)] active:scale-[0.98]"
      >
        <Plus className="w-6 h-6" /> Register a Neighborhood Tree
      </button>

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] w-full max-w-md p-6 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[19px] font-black tracking-tighter text-slate-900">Register Tree</h3>
              <button onClick={() => setShowRegister(false)} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <input
              value={species}
              onChange={(e) => setSpecies(e.target.value)}
              placeholder="Species (leave empty for AI detection)"
              className="w-full bg-slate-50 rounded-xl p-4 text-[15px] font-bold text-slate-900 border border-slate-200 focus:border-green-400 focus:ring-4 focus:ring-green-400/10 focus:outline-none mb-5 transition-all shadow-inner placeholder:text-slate-400 placeholder:font-medium"
            />
            <div className="grid grid-cols-2 gap-3 mb-5">
              {Object.entries(AGE_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setAge(key)}
                  className={`text-[12px] font-bold uppercase tracking-wider p-3 rounded-xl border transition-all ${age === key ? 'border-green-400 bg-green-50 text-green-700 shadow-[inset_0_0_0_1px_rgba(74,222,128,1)]' : 'border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
            <button onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 hover:border-green-300 hover:bg-green-50/50 mb-6 transition-all text-slate-600">
              <Camera className="w-5 h-5" />
              <span className="text-[14px] font-bold">{photo ? photo.name : 'Take photo (AI species detect)'}</span>
            </button>
            <button onClick={handleRegister} disabled={submitting} className="w-full py-4 rounded-[1.25rem] font-bold tracking-wide text-white bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 shadow-[0_8px_20px_rgba(16,185,129,0.25)] transition-all">
              {submitting ? 'Registering...' : '🌳 Register Tree'}
            </button>
          </div>
        </div>
      )}

      {/* Tree List */}
      <h3 className="text-[17px] font-black tracking-tight text-slate-900 mb-5 flex items-center gap-2 px-1">
        <Leaf className="w-5 h-5 text-green-500" /> Nearby Trees
      </h3>
      {loading ? (
        <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="animate-pulse bg-white/50 border border-white/60 rounded-2xl h-24" />)}</div>
      ) : trees.length === 0 ? (
        <div className="text-center py-16 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-dashed border-green-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-green-400/10 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
          <TreePine className="w-16 h-16 text-green-300 mx-auto mb-4 drop-shadow-sm" />
          <p className="text-[18px] font-black tracking-tight text-slate-800">No trees mapped nearby</p>
          <p className="text-[14px] font-bold text-slate-500 mt-2 max-w-sm mx-auto">Be the first to register and protect trees in your neighborhood.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {trees.slice(0, 20).map((tree) => (
            <button
              key={tree.id}
              onClick={() => setSelectedTree(tree)}
              className="w-full text-left bg-white/80 rounded-[1.5rem] p-6 border border-white hover:border-green-300 hover:shadow-[0_12px_40px_rgb(34,197,94,0.12)] shadow-[0_4px_20px_rgb(0,0,0,0.04)] backdrop-blur-md transition-all active:scale-[0.98] group relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-2 opacity-0 group-hover:opacity-100 transition-opacity" style={{ backgroundColor: HEALTH_COLORS[tree.healthStatus] }} />
              <div className="flex items-center justify-between pl-1">
                <div className="flex items-center gap-5">
                  <span className="text-4xl drop-shadow-sm bg-white w-14 h-14 rounded-full flex items-center justify-center shadow-sm border border-slate-100">{HEALTH_EMOJI[tree.healthStatus]}</span>
                  <div>
                    <p className="text-[17px] font-black tracking-tighter text-slate-900 group-hover:text-green-700 transition-colors mb-1">{tree.species}</p>
                    <div className="flex items-center gap-3 text-[12px] font-bold text-slate-400 uppercase tracking-widest">
                      <span className="px-2 py-0.5 rounded-md" style={{ color: HEALTH_COLORS[tree.healthStatus], backgroundColor: HEALTH_COLORS[tree.healthStatus] + '15' }}>{tree.healthStatus}</span>
                      <span>•</span>
                      <span>{tree.estimatedAge}</span>
                      {tree.adoptedBy && <span className="text-pink-500 ml-1 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100 flex items-center gap-1"><Heart className="w-3 h-3 inline fill-pink-500" /> Adopted</span>}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-green-500 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Tree Detail Sheet */}
      {selectedTree && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md max-h-[85vh] overflow-y-auto border border-slate-100 p-6 shadow-2xl animate-in slide-in-from-bottom-6 sm:slide-in-from-bottom-0 sm:fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[19px] font-black tracking-tighter text-slate-900">{selectedTree.species}</h3>
              <button onClick={() => setSelectedTree(null)} className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            {selectedTree.photoUrl && (
              <img src={selectedTree.photoUrl} className="w-full h-56 object-cover rounded-2xl mb-5 shadow-[0_2px_10px_rgb(0,0,0,0.05)] border border-slate-100" alt="" />
            )}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-slate-50 rounded-[1.25rem] p-4 text-center border border-slate-100">
                <span className="text-3xl drop-shadow-sm">{HEALTH_EMOJI[selectedTree.healthStatus]}</span>
                <p className="text-[12px] font-bold uppercase tracking-widest mt-2" style={{ color: HEALTH_COLORS[selectedTree.healthStatus] }}>
                  {selectedTree.healthStatus}
                </p>
              </div>
              <div className="bg-slate-50 rounded-[1.25rem] p-4 text-center border border-slate-100">
                <p className="text-[24px] font-black tracking-tighter text-slate-800 leading-none mb-1">{selectedTree.canopyDiameterM}m</p>
                <p className="text-[12px] font-bold uppercase tracking-widest text-slate-400">Canopy Ø</p>
              </div>
            </div>
            <p className="text-[13px] font-medium text-slate-500 mb-5 text-center bg-slate-50 rounded-xl py-3 border border-slate-100">
              Age: <strong>{AGE_LABELS[selectedTree.estimatedAge] || selectedTree.estimatedAge}</strong> • 
              Mapped: <strong>{selectedTree.createdAt.toLocaleDateString()}</strong>
            </p>
            {!selectedTree.adoptedBy && user && (
              <button
                onClick={() => handleAdopt(selectedTree)}
                className="w-full py-4 rounded-[1.25rem] font-bold tracking-wide text-white bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 flex items-center justify-center gap-2 mb-4 shadow-[0_8px_20px_rgba(244,63,94,0.25)] transition-all"
              >
                <Heart className="w-5 h-5" /> Adopt This Tree
              </button>
            )}
            {selectedTree.adoptedBy && (
              <div className="bg-pink-50 border border-pink-100 rounded-2xl p-4 text-center text-[14px] font-bold text-pink-600 mb-4 shadow-sm">
                ♥ Adopted by {selectedTree.adoptedByName || 'a citizen'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="bg-slate-50 rounded-[1.5rem] p-6 border border-slate-100 mt-8">
        <h3 className="text-[15px] font-black tracking-tight text-slate-900 mb-4">How GreenScope Works</h3>
        <div className="space-y-3 text-[13px] font-medium text-slate-600">
          {[
            { icon: '🌳', text: 'Citizens photograph and register trees in their neighborhood' },
            { icon: '🤖', text: 'AI identifies species and estimates CO₂ absorption capacity' },
            { icon: '💚', text: 'Adopt a tree to be its guardian — report health changes' },
            { icon: '📊', text: 'NDVI vegetation index tracks green cover density' },
            { icon: '🚨', text: 'Deforestation alerts when green cover drops significantly' },
          ].map((s, i) => (
            <div key={i} className="flex items-center gap-3"><span className="text-[18px] drop-shadow-sm bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-slate-100 shrink-0">{s.icon}</span><p>{s.text}</p></div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}
