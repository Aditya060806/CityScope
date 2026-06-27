import { useState, useEffect } from 'react';
import { useSoundScope } from '@/contexts/SoundScopeContext';
import { getDbColor, getDbLabel, NOISE_LIMITS } from '@/types/sound-scope';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PageHeader } from '@/components/ui/page-header';
import {
  Mic, MicOff, Volume2, VolumeX, Activity, AlertTriangle,
  BarChart3, Clock, MapPin
} from 'lucide-react';

// ============================================================================
// SoundScope Page — Real-time noise monitoring dashboard
// ============================================================================

export const SoundScope = () => {
  const {
    isListening,
    isSupported,
    currentDb,
    peakDb,
    currentClassification,
    currentSeverity,
    classificationConfidence,
    sampleCount,
    enableSoundScope,
    disableSoundScope,
  } = useSoundScope();

  const [sessionSeconds, setSessionSeconds] = useState(0);

  useEffect(() => {
    if (!isListening) return;
    const interval = setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isListening]);

  const dbColor = getDbColor(currentDb);
  const severityLabel = getDbLabel(currentSeverity);
  const dbPercent = Math.min(100, (currentDb / 130) * 100);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const classificationIcon = (c: string) => {
    switch (c) {
      case 'traffic': return '🚗';
      case 'construction': return '🏗️';
      case 'siren': return '🚨';
      case 'music': return '🎵';
      case 'horn_honking': return '📯';
      case 'ambient': return '🌿';
      case 'silence': return '🤫';
      default: return '❓';
    }
  };

  if (!isSupported) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <VolumeX className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-bold mb-2">SoundScope Not Available</h2>
        <p className="text-muted-foreground max-w-md">
          Your device doesn't support audio capture or SoundScope is disabled.
          Requires a browser with Web Audio API and microphone access.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 max-w-4xl mx-auto px-6 pt-8 page-container">
      <PageHeader
        icon={<Volume2 className="h-6 w-6" />}
        title="SoundScope"
        description="Passive city noise intelligence with privacy-safe ambient monitoring."
        className="mb-10 border border-white/60 bg-white/40 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem]"
        titleClassName="bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent font-black tracking-tighter"
        descriptionClassName="text-slate-500 font-medium text-[15px]"
        iconShellClassName="bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-[0_4px_20px_rgba(99,102,241,0.4)] rounded-[1.25rem] p-3"
        actions={
          <button
            onClick={isListening ? disableSoundScope : enableSoundScope}
            className={`flex items-center gap-2 h-14 px-8 rounded-full font-black tracking-widest uppercase text-[13px] transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isListening 
                ? 'shadow-[0_8px_24px_-4px_rgba(225,29,72,0.4)] bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-400 hover:to-red-500 text-white border border-rose-400/30' 
                : 'shadow-[0_8px_24px_-4px_rgba(79,70,229,0.4)] bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white border border-indigo-400/30'
            }`}
          >
            {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </button>
        }
      />

      {/* Real-time dB Meter */}
      <Card className="overflow-hidden border border-white/60 shadow-[0_12px_40px_rgb(0,0,0,0.06)] backdrop-blur-3xl rounded-[2.5rem] bg-white/70 mb-8">
        <CardContent className="p-10">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-[14px] font-black tracking-widest uppercase text-slate-400 mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500 animate-pulse" /> Current Noise Level
              </p>
              <div className="flex items-baseline gap-2">
                <span
                  className="text-[96px] font-black tracking-tighter tabular-nums transition-colors duration-300 leading-none drop-shadow-sm"
                  style={{ color: isListening ? dbColor : '#cbd5e1' }}
                >
                  {isListening ? Math.round(currentDb) : '--'}
                </span>
                <span className="text-[32px] text-slate-400 font-black tracking-tighter">dB</span>
              </div>
            </div>
            <div className="text-right space-y-3 flex flex-col items-end">
              <Badge style={{ backgroundColor: isListening ? dbColor : undefined, color: isListening ? '#fff' : undefined }} className={`text-[13px] font-black tracking-widest uppercase px-4 py-1.5 rounded-full border-0 shadow-sm ${!isListening && 'bg-slate-100 text-slate-400'}`}>
                {isListening ? severityLabel : 'Inactive'}
              </Badge>
              <div className="text-[14px] font-bold tracking-wide text-slate-400 bg-white/50 px-4 py-2 rounded-2xl border border-white/60">
                Peak: <span className="text-slate-800 font-black">{isListening ? `${Math.round(peakDb)} dB` : '--'}</span>
              </div>
            </div>
          </div>

          <div className="relative mb-8">
            <div className="w-full h-6 rounded-full bg-slate-100 shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] border border-white/60 overflow-hidden relative">
              <div 
                className="h-full rounded-full transition-all duration-300 ease-out" 
                style={{ width: `${isListening ? dbPercent : 0}%`, backgroundColor: isListening ? dbColor : '#cbd5e1' }}
              />
            </div>
            <div className="flex justify-between text-[11px] font-black text-slate-400 mt-3 tracking-widest uppercase px-2">
              <span>0 dB</span>
              <span>40</span>
              <span>60</span>
              <span>80</span>
              <span>100</span>
              <span>130 dB</span>
            </div>
          </div>

          {/* Noise limit reference */}
          <div className="mt-6 flex gap-3 flex-wrap">
            {Object.entries(NOISE_LIMITS).map(([zone, limits]) => (
              <div key={zone} className="text-[12px] font-bold bg-white/80 border border-white rounded-[1rem] px-4 py-2 text-slate-500 shadow-sm backdrop-blur-md">
                <span className="uppercase tracking-widest text-slate-800">{zone.replace('_', ' ')}</span>{' '}
                <span className="text-indigo-600 ml-1">{limits.day}/{limits.night} dB</span> <span className="text-slate-400 font-medium">(day/night)</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Classification + Session Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Classification */}
        <Card className="border border-white/60 shadow-[0_12px_40px_rgb(0,0,0,0.06)] backdrop-blur-3xl rounded-[2.5rem] bg-white/70 hover:shadow-[0_16px_40px_rgba(99,102,241,0.08)] transition-all">
          <div className="p-8 pb-4">
            <h3 className="text-[14px] font-black tracking-widest uppercase text-slate-400 flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl"><Activity className="h-5 w-5" /></div>
              Noise Classification
            </h3>
          </div>
          <div className="p-8 pt-2">
            <div className="flex items-center gap-5 bg-white border border-white/80 rounded-[2rem] p-6 shadow-sm mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
              <span className="text-6xl drop-shadow-md z-10">
                {isListening ? classificationIcon(currentClassification) : '🔇'}
              </span>
              <div className="z-10">
                <p className="text-[24px] font-black tracking-tighter capitalize text-slate-900 leading-tight">
                  {isListening ? currentClassification.replace('_', ' ') : 'Not listening'}
                </p>
                {isListening && (
                  <p className="text-[14px] font-bold text-slate-500 tracking-wide mt-1">
                    Confidence: <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg ml-1">{Math.round(classificationConfidence * 100)}%</span>
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {['traffic', 'construction', 'siren', 'horn_honking'].map((type) => (
                <div
                  key={type}
                  className={`text-center p-4 rounded-2xl text-[11px] font-black uppercase tracking-wider transition-all shadow-sm flex flex-col items-center justify-center ${
                    currentClassification === type && isListening
                      ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-[0_8px_20px_rgba(99,102,241,0.3)] scale-[1.05]'
                      : 'bg-white border border-slate-100 text-slate-400 hover:border-indigo-200'
                  }`}
                >
                  <div className="text-[28px] mb-2">{classificationIcon(type)}</div>
                  <div className="truncate px-1 w-full">{type.replace('_', ' ')}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Session Stats */}
        <Card className="border border-white/60 shadow-[0_12px_40px_rgb(0,0,0,0.06)] backdrop-blur-3xl rounded-[2.5rem] bg-white/70 hover:shadow-[0_16px_40px_rgba(99,102,241,0.08)] transition-all">
          <div className="p-8 pb-4">
            <h3 className="text-[14px] font-black tracking-widest uppercase text-slate-400 flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-500 rounded-xl"><BarChart3 className="h-5 w-5" /></div>
              Session Stats
            </h3>
          </div>
          <div className="p-8 pt-2 h-full flex flex-col justify-between">
            <div className="space-y-5 bg-white border border-white/80 rounded-[2rem] p-6 shadow-sm mb-6">
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold tracking-wide text-slate-500 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-400" /> Duration
                </span>
                <span className="text-[20px] font-black tracking-tighter text-slate-900 border border-slate-100 bg-slate-50 px-3 py-1 rounded-xl">{formatTime(sessionSeconds)}</span>
              </div>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold tracking-wide text-slate-500 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-indigo-400" /> Samples
                </span>
                <span className="text-[20px] font-black tracking-tighter text-slate-900 border border-slate-100 bg-slate-50 px-3 py-1 rounded-xl">{sampleCount}</span>
              </div>
              <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
              <div className="flex items-center justify-between">
                <span className="text-[14px] font-bold tracking-wide text-slate-500 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-indigo-400" /> Peak Recorded
                </span>
                <span className="text-[20px] font-black tracking-tighter border border-slate-100 bg-slate-50 px-3 py-1 rounded-xl" style={{ color: peakDb > 0 ? getDbColor(peakDb) : '#94a3b8' }}>
                  {peakDb > 0 ? `${Math.round(peakDb)} dB` : '--'}
                </span>
              </div>
            </div>

            <div className="text-[13px] font-medium text-slate-600 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 border border-indigo-100/50 rounded-[1.5rem] p-5 leading-relaxed mt-auto shadow-inner">
              <span className="text-lg mr-1 drop-shadow-sm">🔒</span> <strong className="text-indigo-900 font-bold">Privacy Locked:</strong> SoundScope operates 100% passively. Only frequency signatures are analysed for decibel measurement. Zero conversations are deciphered or transmitted.
            </div>
          </div>
        </Card>
      </div>

      {/* Info Card */}
      <Card className="border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] bg-gradient-to-r from-indigo-50/80 via-white/80 to-purple-50/80 backdrop-blur-xl mt-8">
        <CardContent className="p-8">
          <h3 className="text-[18px] font-black tracking-tighter text-slate-900 mb-4 flex items-center gap-3">
            <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-2xl"><Volume2 className="h-5 w-5" /></div>
            How SoundScope Architecture Works
          </h3>
          <div className="space-y-4 text-[15px] font-medium text-slate-600 leading-relaxed max-w-4xl">
            <p>
              SoundScope leverages your device's audio hardware to sample pure ambient wavelength structures. It classifies frequency bands against a local AI model (traffic, construction, sirens) in real-time.
            </p>
            <p>
              Aggregated cryptographic noise telemetry is batched and geo-synced to build a <strong className="font-extrabold text-slate-900 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">living city-wide noise contour map</strong>
              — autonomously pinpointing decibel offenses and infrastructure anomalies.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
