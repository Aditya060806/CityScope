import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { civicARService } from '@/services/CivicARService';
import { ARMarker, SEVERITY_SIZES } from '@/types/civic-ar';
import { Camera, Compass, MapPin, AlertTriangle, X, Navigation, Eye } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

export default function CivicAR() {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [markers, setMarkers] = useState<ARMarker[]>([]);
  const [heading, setHeading] = useState(0);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<ARMarker | null>(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [hasOrientation, setHasOrientation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setHasCamera(true);
      }
    } catch (err) {
      setError('Camera access denied. CivicAR needs camera permission to show AR overlay.');
    }
  }, []);

  // Compass heading
  useEffect(() => {
    if (!started) return;

    const handleOrientation = (e: DeviceOrientationEvent) => {
      // Use webkitCompassHeading for iOS, alpha for Android
      const h = (e as any).webkitCompassHeading ?? (e.alpha != null ? (360 - e.alpha) % 360 : 0);
      setHeading(h);
      setHasOrientation(true);
    };

    // Request permission on iOS 13+
    if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      (DeviceOrientationEvent as any).requestPermission().then((resp: string) => {
        if (resp === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation, true);
        }
      });
    } else {
      window.addEventListener('deviceorientation', handleOrientation, true);
    }

    return () => window.removeEventListener('deviceorientation', handleOrientation, true);
  }, [started]);

  // GPS
  useEffect(() => {
    if (!started) return;
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      () => setError('GPS required for AR positioning'),
      { enableHighAccuracy: true, maximumAge: 10000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [started]);

  // Load and project markers
  useEffect(() => {
    if (!location || !started) return;
    const load = async () => {
      const raw = await civicARService.loadNearbyMarkers(location.latitude, location.longitude);
      const projected = civicARService.projectToScreen(raw, heading, screenW, screenH);
      setMarkers(projected);
    };
    load();
    const interval = setInterval(load, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [location, heading, started, screenW, screenH]);

  const handleStart = async () => {
    setStarted(true);
    await startCamera();
  };

  // ========================================================================
  // Pre-start screen
  // ========================================================================
  if (!started) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6">
        <div className="text-center max-w-sm w-full">
          <PageHeader
            icon={<Eye className="h-5 w-5" />}
            title="CivicAR"
            description="See reported issues and anomalies overlaid on your camera in real-time augmented reality."
            className="mb-8 border-violet-100 bg-white shadow-sm"
            titleClassName="text-[22px] font-black tracking-tighter text-slate-900"
            descriptionClassName="text-[14px] font-medium text-slate-500 mt-2"
            iconShellClassName="bg-violet-50 text-violet-600 border border-violet-100"
          />
          <div className="space-y-4 text-left text-[14px] font-medium text-slate-600 bg-white border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.03)] rounded-[1.5rem] p-6 mb-8">
            <p className="flex items-center gap-3"><Camera className="w-5 h-5 text-violet-500" /> Camera — live viewfinder</p>
            <p className="flex items-center gap-3"><Compass className="w-5 h-5 text-violet-500" /> Compass — marker positioning</p>
            <p className="flex items-center gap-3"><MapPin className="w-5 h-5 text-violet-500" /> GPS — nearby issues lookup</p>
          </div>
          <button
            onClick={handleStart}
            className="w-full py-4 rounded-[1.25rem] font-bold tracking-wide text-white bg-violet-600 hover:bg-violet-700 active:scale-[0.98] transition-all shadow-[0_8px_20px_rgb(139,92,246,0.25)]"
          >
            Launch AR View
          </button>
        </div>
      </div>
    );
  }

  // ========================================================================
  // AR View
  // ========================================================================
  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Camera Feed */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline
        muted
        autoPlay
      />

      {/* AR Overlay — markers */}
      <div className="absolute inset-0 pointer-events-none">
        {markers
          .filter((m) => m.screenX > -50 && m.screenX < screenW + 50)
          .map((m) => {
            const size = m.kind === 'issue' ? (SEVERITY_SIZES[m.severity] || 36) : 36;
            const color = civicARService.getMarkerColor(m);
            const opacity = Math.max(0.4, 1 - m.distanceM / 500);

            return (
              <button
                key={m.id}
                className="absolute pointer-events-auto transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                style={{ left: m.screenX, top: m.screenY, opacity }}
                onClick={() => setSelectedMarker(m)}
              >
                {/* Pulse ring */}
                <div
                  className="absolute rounded-full animate-ping"
                  style={{
                    width: size + 12, height: size + 12,
                    backgroundColor: color, opacity: 0.2,
                  }}
                />
                {/* Marker dot */}
                <div
                  className="rounded-full border-2 border-white flex items-center justify-center text-white font-bold shadow-lg"
                  style={{
                    width: size, height: size,
                    backgroundColor: color,
                    fontSize: size * 0.35,
                  }}
                >
                  {m.kind === 'issue' ? '!' : '⚠'}
                </div>
                {/* Distance label */}
                <div className="mt-1 bg-black/70 rounded px-1.5 py-0.5 text-white text-[10px] whitespace-nowrap">
                  {m.distanceM}m
                </div>
              </button>
            );
          })}
      </div>

      {/* HUD — top bar */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/60 to-transparent pt-2 pb-8 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-violet-400" />
            <span className="font-semibold text-sm text-white">CivicAR</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-white/70">
              <Navigation className="w-3 h-3" style={{ transform: `rotate(${heading}deg)` }} />
              {Math.round(heading)}°
            </div>
            <div className="text-xs text-white/70">{markers.length} nearby</div>
          </div>
        </div>
        {/* Compass bar */}
        <div className="mt-2 h-1 w-full rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full bg-violet-500 rounded-full transition-all duration-200"
            style={{ width: '2px', marginLeft: `${(heading / 360) * 100}%` }}
          />
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="absolute top-16 left-4 right-4 bg-red-900/90 border border-red-500/50 rounded-xl p-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-200">{error}</p>
        </div>
      )}

      {/* Status indicators */}
      <div className="absolute bottom-6 left-4 right-4 flex items-center justify-center gap-4">
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${hasCamera ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
          <Camera className="w-3 h-3" /> Camera
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${hasOrientation ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
          <Compass className="w-3 h-3" /> Compass
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs ${location ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'}`}>
          <MapPin className="w-3 h-3" /> GPS
        </div>
      </div>

      {/* Marker Detail Sheet */}
      {selectedMarker && (
        <div className="absolute bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur rounded-t-2xl border-t border-slate-700/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: civicARService.getMarkerColor(selectedMarker) }}
              />
              <span className="font-semibold text-sm text-white">
                {selectedMarker.kind === 'issue' ? selectedMarker.title : `Road ${selectedMarker.type.replace('_', ' ')}`}
              </span>
            </div>
            <button onClick={() => setSelectedMarker(null)} className="p-1 rounded-lg bg-slate-800">
              <X className="w-4 h-4 text-white" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-xs text-slate-400">
            <div className="bg-slate-800/60 rounded-lg p-2">
              <p className="text-white font-medium">{selectedMarker.distanceM}m</p>
              <p>Distance</p>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-2">
              <p className="text-white font-medium">{Math.round(selectedMarker.bearingDeg)}°</p>
              <p>Bearing</p>
            </div>
            <div className="bg-slate-800/60 rounded-lg p-2">
              <p className="text-white font-medium">
                {selectedMarker.kind === 'issue' ? selectedMarker.severity : `${selectedMarker.severity}/10`}
              </p>
              <p>Severity</p>
            </div>
          </div>
          {selectedMarker.kind === 'issue' && (
            <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
              <span>Status: {selectedMarker.status}</span>
              <span>•</span>
              <span>{selectedMarker.upvotes} upvotes</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
