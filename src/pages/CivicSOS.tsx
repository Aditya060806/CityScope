import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSOS } from '@/contexts/SOSContext';
import { sosService } from '@/services/SOSService';
import {
  SOSAlert, EmergencyType, EMERGENCY_EMOJI, EMERGENCY_LABELS, SEVERITY_COLORS, SEVERITY_BG,
} from '@/types/civic-sos';
import {
  AlertTriangle, Radio, MapPin, Camera, X, CheckCircle2, Clock, Users, Shield, Send,
} from 'lucide-react';

export default function CivicSOS() {
  const { user } = useAuth();
  const { activeAlerts } = useSOS();
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedAlert, setSelectedAlert] = useState<SOSAlert | null>(null);

  // Form state
  const [sosType, setSosType] = useState<EmergencyType>('accident');
  const [sosSeverity, setSosSeverity] = useState<SOSAlert['severity']>('medium');
  const [sosTitle, setSosTitle] = useState('');
  const [sosDesc, setSosDesc] = useState('');
  const [sosPhoto, setSosPhoto] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // GPS
  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (p) => setLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude }),
      () => {}, { enableHighAccuracy: true }
    );
  }, []);

  const handleBroadcast = async () => {
    if (!user || !location || !sosTitle.trim()) return;
    setSubmitting(true);
    const r = await sosService.broadcastSOS(
      sosType, sosTitle.trim(), sosDesc, sosSeverity, location,
      user.id, user.name || user.email || 'Citizen', sosPhoto || undefined
    );
    setResult(r);
    if (r.success) {
      setShowBroadcast(false);
      setSosTitle('');
      setSosDesc('');
      setSosPhoto(null);
    }
    setSubmitting(false);
  };

  const handleConfirm = async (alertId: string) => {
    await sosService.confirmAlert(alertId);
    setSelectedAlert(null);
  };

  const criticalAlerts = activeAlerts.filter((a) => a.severity === 'critical');
  const otherAlerts = activeAlerts.filter((a) => a.severity !== 'critical');

  return (
    <div className="page-container">
      <div className="max-w-4xl mx-auto rounded-[2rem] bg-white text-slate-900 pb-20 px-6 pt-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 min-h-[80vh]">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-50 rounded-full border border-red-100 mb-4 shadow-sm">
          <Radio className="w-5 h-5 text-red-500" />
          <span className="text-[13px] font-black tracking-widest uppercase text-red-600">CivicSOS</span>
        </div>
        <h1 className="text-[32px] font-black tracking-tighter text-slate-900 mb-2">Emergency Broadcast</h1>
        <p className="text-[15px] font-medium text-slate-500">Real-time emergency alerts & geo-shielded warnings</p>
      </div>

      {/* Giant SOS Button */}
      <button
        onClick={() => setShowBroadcast(true)}
        className="w-full py-6 mb-8 rounded-[1.5rem] font-black tracking-widest uppercase text-[18px] text-white bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 active:scale-[0.98] transition-all shadow-[0_8px_30px_rgba(225,29,72,0.3)] flex items-center justify-center gap-3 border border-red-400"
      >
        <AlertTriangle className="w-8 h-8" />
        BROADCAST SOS
      </button>

      {/* Result Toast */}
      {result && (
        <div className={`mb-4 p-4 rounded-xl border ${result.success ? 'bg-emerald-900/80 border-emerald-500/50' : 'bg-red-900/80 border-red-500/50'}`}>
          <div className="flex items-center justify-between">
            <p className="text-sm">{result.message}</p>
            <button onClick={() => setResult(null)}><X className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <div className="mb-8">
          <h3 className="text-[14px] font-black tracking-widest uppercase text-red-500 mb-4 flex items-center gap-2 animate-pulse bg-red-50 px-4 py-2 rounded-xl inline-flex drop-shadow-sm border border-red-100">
            <AlertTriangle className="w-5 h-5" /> CRITICAL ALERTS
          </h3>
          <div className="space-y-4">
            {criticalAlerts.map((alert) => (
              <button
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className="w-full text-left bg-rose-50 rounded-[1.25rem] p-5 border border-rose-200 hover:border-red-400 shadow-[0_4px_20px_rgb(225,29,72,0.05)] transition-all"
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl animate-pulse drop-shadow-md bg-white w-14 h-14 rounded-full flex items-center justify-center shadow-sm border border-rose-100">{EMERGENCY_EMOJI[alert.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[16px] text-slate-900 tracking-tight">{alert.title}</p>
                    <p className="text-[13px] font-medium text-slate-600 mt-1">{alert.description}</p>
                    <div className="flex items-center gap-4 text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-3">
                      <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-400" /> <strong className="text-slate-700">{alert.confirmedCount}</strong> confirmed</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> {timeSince(alert.createdAt)}</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Alerts */}
      <div className="mb-4">
        <h3 className="text-[15px] font-black tracking-tight text-slate-900 mb-4 flex items-center gap-2">
          <Radio className="w-5 h-5 text-red-500" /> Active Alerts ({activeAlerts.length})
        </h3>
        {activeAlerts.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
            <Shield className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-[16px] font-black tracking-tight text-slate-700">No active emergencies nearby</p>
            <p className="text-[14px] font-medium text-slate-400 mt-1">Your area is safe 🎉</p>
          </div>
        ) : (
          <div className="space-y-4">
            {otherAlerts.map((alert) => (
              <button
                key={alert.id}
                onClick={() => setSelectedAlert(alert)}
                className={`w-full text-left bg-white rounded-[1.25rem] p-5 border border-slate-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:border-slate-300 hover:shadow-md transition-all relative overflow-hidden`}
              >
                <div className={`absolute top-0 left-0 w-1.5 h-full ${SEVERITY_BG[alert.severity].replace('bg-','bg-opacity-100 bg-')}`} />
                <div className="flex items-center gap-4 pl-2">
                  <span className="text-3xl bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center border border-slate-100">{EMERGENCY_EMOJI[alert.type]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-[15px] tracking-tight text-slate-900">{alert.title}</p>
                    <div className="flex items-center gap-3 text-[12px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">
                      <span style={{ color: SEVERITY_COLORS[alert.severity] }}>{alert.severity}</span>
                      <span>•</span>
                      <span>{timeSince(alert.createdAt)} ago</span>
                      <span>•</span>
                      <span><strong className="text-slate-600">{alert.confirmedCount}</strong> confirmed</span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Broadcast Modal */}
      {showBroadcast && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto border border-white shadow-[0_16px_40px_rgba(0,0,0,0.1),0_0_0_1px_rgba(225,29,72,0.1)] p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black tracking-tight text-lg text-red-600 flex items-center gap-2">🆘 Broadcast Emergency</h3>
              <button onClick={() => setShowBroadcast(false)} className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"><X className="w-4 h-4" /></button>
            </div>

            {/* Type Selector */}
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">Emergency Type</p>
            <div className="grid grid-cols-5 gap-2.5 mb-5">
              {(Object.keys(EMERGENCY_EMOJI) as EmergencyType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => setSosType(type)}
                  className={`flex flex-col items-center p-2.5 rounded-[14px] border transition-all ${sosType === type ? 'border-red-500 bg-red-50 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <span className="text-[20px] mb-1">{EMERGENCY_EMOJI[type]}</span>
                  <span className={`text-[9px] font-bold uppercase tracking-wider truncate w-full text-center ${sosType === type ? 'text-red-700' : 'text-slate-500'}`}>{EMERGENCY_LABELS[type].split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {/* Severity */}
            <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3">Severity Rating</p>
            <div className="grid grid-cols-4 gap-2 mb-6">
              {(['low', 'medium', 'high', 'critical'] as SOSAlert['severity'][]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSosSeverity(s)}
                  className={`py-2.5 rounded-[12px] border text-[11px] font-black tracking-widest transition-all ${sosSeverity === s ? `border-current shadow-sm ${SEVERITY_BG[s]}` : 'border-slate-200 bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                  style={sosSeverity === s ? { color: SEVERITY_COLORS[s] } : {}}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Title */}
            <input
              value={sosTitle}
              onChange={(e) => setSosTitle(e.target.value)}
              placeholder="What's happening? (short title)"
              className="w-full bg-slate-50 rounded-xl p-3.5 text-[15px] font-bold text-slate-900 border border-slate-200 focus:border-red-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(248,113,113,0.1)] transition-all outline-none mb-3 placeholder:text-slate-400 placeholder:font-medium"
            />

            {/* Description */}
            <textarea
              value={sosDesc}
              onChange={(e) => setSosDesc(e.target.value)}
              placeholder="Provide crucial details..."
              className="w-full bg-slate-50 rounded-xl p-3.5 text-[14px] font-medium text-slate-900 border border-slate-200 focus:border-red-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(248,113,113,0.1)] transition-all outline-none resize-none mb-3 placeholder:text-slate-400"
              rows={3}
            />

            {/* Photo */}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setSosPhoto(e.target.files?.[0] || null)} />
            <button onClick={() => fileRef.current?.click()} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300 transition-colors mb-4">
              <Camera className="w-4 h-4 text-slate-400" />
              <span className="text-[13px] font-bold text-slate-500">{sosPhoto ? sosPhoto.name : 'Attach visual evidence (optional)'}</span>
            </button>

            {/* GPS */}
            <div className="flex items-center gap-3 bg-indigo-50/50 border border-indigo-100/50 rounded-xl p-3 mb-6">
              <MapPin className={`w-4 h-4 ${location ? 'text-indigo-500' : 'text-slate-400 animate-pulse'}`} />
              <span className="text-[13px] font-bold text-indigo-900/80 tracking-tight">
                {location ? `Verified: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}` : 'Acquiring secure GPS lock...'}
              </span>
            </div>

            {/* Submit */}
            <button
              onClick={handleBroadcast}
              disabled={submitting || !location || !sosTitle.trim()}
              className="w-full py-4 rounded-[1rem] font-black tracking-widest uppercase text-[15px] bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 disabled:opacity-50 disabled:from-slate-300 disabled:to-slate-300 disabled:text-slate-500 text-white shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 border border-red-400/50"
            >
              {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> Broadcast SOS</>}
            </button>

            <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 text-center mt-4 flex items-center justify-center gap-1.5">
              <Shield className="w-3 h-3" /> False broadcasts impact trust score
            </p>
          </div>
        </div>
      )}

      {/* Alert Detail */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md border border-white shadow-[0_16px_40px_rgba(0,0,0,0.12)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-2xl shadow-sm">{EMERGENCY_EMOJI[selectedAlert.type]}</div>
              <button onClick={() => setSelectedAlert(null)} className="p-1.5 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <h3 className="font-black text-[22px] tracking-tight text-slate-900 mb-2 leading-none">{selectedAlert.title}</h3>
            <p className="text-[15px] font-medium text-slate-600 mb-5 leading-relaxed">{selectedAlert.description}</p>
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center shadow-sm">
                <p className="font-black text-[15px] tracking-widest uppercase" style={{ color: SEVERITY_COLORS[selectedAlert.severity] }}>{selectedAlert.severity}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Severity</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center shadow-sm">
                <p className="font-black text-[15px] tracking-tight text-slate-900">{selectedAlert.confirmedCount}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Confirmed</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 text-center shadow-sm">
                <p className="font-black text-[15px] tracking-tight text-slate-900">{timeSince(selectedAlert.createdAt)}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">Ago</p>
              </div>
            </div>
            {selectedAlert.photoUrl && (
              <img src={selectedAlert.photoUrl} className="w-full h-48 object-cover rounded-xl mb-5 shadow-sm border border-slate-100" alt="Emergency Visual" />
            )}
            <button
              onClick={() => handleConfirm(selectedAlert.id)}
              className="w-full py-4 rounded-xl font-black tracking-widest uppercase text-[14px] bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 border border-orange-400/50"
            >
              <CheckCircle2 className="w-5 h-5" /> Confirm This Emergency
            </button>
          </div>
        </div>
      )}

      {/* How it works */}
      <div className="bg-slate-50 rounded-[1.5rem] p-6 border border-slate-100 mt-8 shadow-sm">
        <h3 className="font-black tracking-tighter text-slate-900 text-[18px] mb-4">How CivicSOS Works</h3>
        <div className="space-y-3 text-[14px] font-medium text-slate-600">
          {[
            { icon: '🆘', text: 'Tap SOS to broadcast an emergency alert to nearby citizens immediately' },
            { icon: '📡', text: 'Alerts propagate in real-time via advanced low-latency channels' },
            { icon: '✅', text: 'Nearby citizens confirm the emergency to boost its credibility radius' },
            { icon: '🛡️', text: 'Geo-shields filter noise, ensuring you only see what affects you' },
            { icon: '🔔', text: 'Critical broadcasts trigger device vibrations and push notifications' },
          ].map((s, i) => (
            <div key={i} className="flex items-start gap-3"><span className="text-[18px] leading-tight">{s.icon}</span><p className="leading-snug">{s.text}</p></div>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}

function timeSince(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  if (secs < 3600) return `${Math.floor(secs / 60)}m`;
  if (secs < 86400) return `${Math.floor(secs / 3600)}h`;
  return `${Math.floor(secs / 86400)}d`;
}
