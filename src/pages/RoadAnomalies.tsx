import React, { useState, useEffect, useRef, useCallback } from 'react';
import type L from 'leaflet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  MapPin,
  BarChart3,
  Shield,
  Navigation,
  Smartphone,
  AlertTriangle,
  Loader2,
  Gauge,
  Vibrate,
  Play,
  Square,
  Locate,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/ui/page-header';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { useRoadAnomalyDetection } from '@/hooks/useRoadAnomalyDetection';
import { TripRecorder } from '@/components/prad/TripRecorder';
import { AnomalyMapLayer } from '@/components/prad/AnomalyMapLayer';
import { AnomalyDashboard } from '@/components/prad/AnomalyDashboard';
import { RoadHealthIndex } from '@/components/prad/RoadHealthIndex';
import { SensorWaveform } from '@/components/prad/SensorWaveform';
import { roadAnomalyService } from '@/services/RoadAnomalyService';
import { toMapCenter } from '@/constants/location';
import {
  AnomalyCluster,
  RoadAnomaly,
  ANOMALY_TYPE_CONFIG,
  ANOMALY_SEVERITY_CONFIG,
} from '@/types/road-anomaly';

export const RoadAnomalies: React.FC = () => {
  const { user } = useAuth();
  const { userLocation } = useLocation();
  const [activeTab, setActiveTab] = useState('detect');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [clusters, setClusters] = useState<AnomalyCluster[]>([]);
  const [allAnomalies, setAllAnomalies] = useState<RoadAnomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const userMarkerRef = useRef<L.CircleMarker | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef  = useRef<L.Map | null>(null);

  const {
    isDetecting,
    anomalies: detectedAnomalies,
    clusters: detectedClusters,
    isSupported,
    permissionState,
    currentGForce,
    vibrationIntensity,
    requestPermission,
    startDetection,
    stopDetection,
  } = useRoadAnomalyDetection();

  const featureEnabled = import.meta.env.VITE_ENABLE_ROAD_ANOMALY_DETECTION !== 'false';
  const webReadOnly = import.meta.env.VITE_PRAD_WEB_READ_ONLY !== 'false';

  // Load map data
  useEffect(() => {
    const loadMapData = async () => {
      const [centerLat, centerLng] = toMapCenter(userLocation);
      try {
        const [clustersData, anomaliesData] = await Promise.all([
          roadAnomalyService.getClusters(undefined, undefined, { latitude: centerLat, longitude: centerLng }),
          roadAnomalyService.getNearbyAnomalies(centerLat, centerLng, 20),
        ]);
        setClusters(clustersData);
        setAllAnomalies(anomaliesData);
      } catch (err) {
        console.error('❌ Failed to load anomaly map data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadMapData();
  }, [userLocation]);

  // Real-time subscriptions
  useEffect(() => {
    const anomalySub = roadAnomalyService.subscribeToAnomalies(
      (anomaly) => {
        setAllAnomalies(prev => [anomaly, ...prev.slice(0, 499)]);
      },
      {
        event: 'INSERT',
        source: 'app',
      }
    );
    const clusterSub = roadAnomalyService.subscribeToClusters((cluster) => {
      setClusters(prev => {
        const idx = prev.findIndex(c => c.id === cluster.id);
        if (idx >= 0) {
          const updated = [...prev];
          updated[idx] = cluster;
          return updated;
        }
        return [cluster, ...prev];
      });
    });

    return () => {
      anomalySub?.();
      clusterSub?.();
    };
  }, []);

  // Update user location marker on the map in real-time
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;
    let L: typeof import('leaflet');
    import('leaflet').then(mod => {
      L = mod.default || mod;
      const { latitude: lat, longitude: lng } = userLocation;

      if (userMarkerRef.current) {
        userMarkerRef.current.setLatLng([lat, lng]);
      } else {
        userMarkerRef.current = L.circleMarker([lat, lng], {
          radius: 8,
          fillColor: '#3b82f6',
          color: '#fff',
          weight: 2,
          fillOpacity: 0.9,
        }).addTo(map).bindPopup('📍 You are here');
      }
    });
  }, [userLocation, mapLoaded]);

  // Auto-pan map to user when entering map tab, if detecting
  useEffect(() => {
    if (activeTab !== 'map') return;
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;
    map.setView([userLocation.latitude, userLocation.longitude], map.getZoom(), { animate: true });
  }, [activeTab, userLocation, mapLoaded]);

  // Initialise Leaflet map for the "Map" tab
  const initMap = useCallback(async () => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    try {
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');
      const [centerLat, centerLng] = toMapCenter(userLocation);

      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 13,
        zoomControl: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      L.control.zoom({ position: 'topright' }).addTo(map);

      mapInstanceRef.current = map;
      setMapLoaded(true);

      // Fix tile rendering after tab switch
      setTimeout(() => map.invalidateSize(), 100);
    } catch (err) {
      console.error('❌ Failed to initialise map:', err);
    }
  }, [userLocation]);

  // Init map when switching to map tab
  useEffect(() => {
    if (activeTab === 'map') {
      const timer = setTimeout(initMap, 50);
      return () => clearTimeout(timer);
    }
  }, [activeTab, initMap]);

  // Invalidate size when switching back to map tab
  useEffect(() => {
    if (activeTab === 'map' && mapInstanceRef.current) {
      setTimeout(() => mapInstanceRef.current?.invalidateSize(), 100);
    }
  }, [activeTab]);

  // Merge detected + historical anomalies and clusters
  const mergedAnomalies = [
    ...detectedAnomalies,
    ...allAnomalies.filter(a => !detectedAnomalies.find(d => d.id === a.id)),
  ];
  const mergedClusters = [
    ...detectedClusters,
    ...clusters.filter(c => !detectedClusters.find(d => d.id === c.id)),
  ];

  if (!featureEnabled) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Shield className="h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">Road Anomaly Detection</h2>
        <p className="text-gray-500 max-w-md">
          This feature is currently disabled. Set <code className="text-sm bg-gray-100 px-1 rounded">VITE_ENABLE_ROAD_ANOMALY_DETECTION=true</code> in
          your environment to enable it.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto space-y-6 pb-24 md:pb-12 px-4 pt-6">
      
      {/* Platform Unity Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-200/50 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Activity className="h-6 w-6 text-indigo-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">PRAD Engine</h1>
            {isDetecting && (
                <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 ml-3 gap-1.5 animate-pulse rounded-[4px] px-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" /> Live
                </Badge>
            )}
          </div>
          <p className="text-[13px] font-medium text-slate-500">Passive pothole and bump detection powered by motion sensors.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-4 border border-slate-200/80 bg-white/80">
            <TabsTrigger value="detect" className="text-xs sm:text-sm">
              <Smartphone className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
              Detect
            </TabsTrigger>
            <TabsTrigger value="map" className="text-xs sm:text-sm">
              <MapPin className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
              Map
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="text-xs sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
              Stats
            </TabsTrigger>
            <TabsTrigger value="health" className="text-xs sm:text-sm">
              <Shield className="h-3.5 w-3.5 mr-1 hidden sm:inline" />
              Health
            </TabsTrigger>
          </TabsList>

          {/* Detect Tab */}
          <TabsContent value="detect" className="mt-4">
            <div className="space-y-4">

              {/* Permission / compatibility warning */}
              {!isSupported && (
                <Card className={cn(
                  webReadOnly ? 'border-blue-200 bg-blue-50' : 'border-yellow-200 bg-yellow-50'
                )}>
                  <CardContent className="p-4 flex items-start gap-3">
                    <AlertTriangle className={cn(
                      'h-5 w-5 mt-0.5',
                      webReadOnly ? 'text-blue-600' : 'text-yellow-600'
                    )} />
                    <div>
                      <p className={cn(
                        'text-sm font-medium',
                        webReadOnly ? 'text-blue-800' : 'text-yellow-800'
                      )}>
                        {webReadOnly ? 'Web Client Is Read-Only' : 'Limited Device Support'}
                      </p>
                      <p className={cn(
                        'text-xs mt-1',
                        webReadOnly ? 'text-blue-600' : 'text-yellow-600'
                      )}>
                        {webReadOnly
                          ? 'This website now listens only. Send detections from the mobile app and watch live charts update here.'
                          : 'Enable accelerometer access in Chrome -> Settings -> Site Settings -> Motion Sensors.'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── LIVE WAVEFORM ─────────────────────────────────────── */}
              <Card className="overflow-hidden border-indigo-100 bg-gradient-to-br from-white to-indigo-50/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[1.5rem]">
                <CardContent className="p-0">
                  <SensorWaveform
                    isDetecting={isDetecting}
                    anomalyCount={detectedAnomalies.length}
                    lastAnomalyType={detectedAnomalies[0]?.anomalyType}
                    lastAnomalySeverity={detectedAnomalies[0]?.severity}
                    height={150}
                    className="rounded-xl"
                  />
                </CardContent>
              </Card>

              {/* ── LIVE METRICS ROW ──────────────────────────────────── */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* G-Force */}
                <div className={cn(
                  'bg-white border rounded-[1.25rem] p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] transition-colors duration-300 relative overflow-hidden flex justify-between flex-col min-h-[148px]',
                  currentGForce > 1.5 ? 'border-rose-200/80 bg-rose-50/20' :
                  currentGForce > 1.0 ? 'border-orange-200/80 bg-orange-50/20' :
                  currentGForce > 0.6 ? 'border-amber-200/80 bg-amber-50/20' :
                  'border-slate-200/60'
                )}>
                  <div className="flex items-center justify-between mb-2 relative z-10 w-full">
                    <p className="text-[13px] font-medium text-slate-500 tracking-wide">Accelerometer G-Force</p>
                    <Gauge className="h-4 w-4 text-slate-400 opacity-50" />
                  </div>
                  <h3 className={cn(
                    'text-[36px] font-black tracking-tighter leading-none',
                    currentGForce > 1.5 ? 'text-rose-600' :
                    currentGForce > 1.0 ? 'text-orange-600' :
                    currentGForce > 0.6 ? 'text-amber-600' : 'text-slate-800'
                  )}>{currentGForce.toFixed(2)}<span className="text-[20px] text-slate-400 font-bold ml-1">g</span></h3>
                </div>

                {/* Vibration */}
                <div className="bg-white border border-slate-200/60 rounded-[1.25rem] p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] relative overflow-hidden flex justify-between flex-col min-h-[148px]">
                  <div className="flex items-center justify-between mb-2 relative z-10 w-full">
                    <p className="text-[13px] font-medium text-slate-500 tracking-wide">Vibration Noise</p>
                    <Vibrate className="h-4 w-4 text-slate-400 opacity-50" />
                  </div>
                  <div>
                    <h3 className="text-[36px] font-black tracking-tighter text-slate-800 leading-none">{Math.round(vibrationIntensity)}<span className="text-[20px] text-slate-400 font-bold ml-1">%</span></h3>
                    <div className="mt-4 h-1.5 rounded-full bg-slate-100 overflow-hidden w-full">
                      <div
                        className={cn('h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(0,0,0,0.1)]',
                          vibrationIntensity > 70 ? 'bg-rose-500' :
                          vibrationIntensity > 40 ? 'bg-orange-500' :
                          vibrationIntensity > 20 ? 'bg-amber-500' : 'bg-indigo-500'
                        )}
                        style={{ width: `${Math.min(100, vibrationIntensity)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bumps */}
                <div className={cn(
                  'bg-white border rounded-[1.25rem] p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] transition-all flex justify-between flex-col min-h-[148px]',
                  detectedAnomalies.length > 0 ? 'border-orange-200/80 bg-orange-50/20' : 'border-slate-200/60'
                )}>
                  <div className="flex items-center justify-between mb-2 relative z-10 w-full">
                    <p className="text-[13px] font-medium text-slate-500 tracking-wide">Bumps Detected</p>
                    <AlertTriangle className="h-4 w-4 text-slate-400 opacity-50" />
                  </div>
                  <h3 className={cn(
                    'text-[36px] font-black tracking-tighter leading-none',
                    detectedAnomalies.length > 0 ? 'text-orange-600' : 'text-slate-800'
                  )}>{detectedAnomalies.length}</h3>
                </div>
              </div>

              {/* ── START / STOP BUTTON ───────────────────────────────── */}
              <div className="flex gap-4">
                {webReadOnly ? (
                  <Button
                    className="flex-1 h-14 rounded-xl text-[15px] font-bold bg-slate-200 text-slate-600 shadow-none cursor-not-allowed"
                    disabled
                  >
                    <Square className="h-5 w-5 mr-2" />
                    Web Read-Only Mode
                  </Button>
                ) : !isDetecting ? (
                  <Button
                    className="flex-1 h-14 rounded-xl text-[15px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] transition-all hover:-translate-y-0.5"
                    onClick={async () => {
                      if (permissionState !== 'granted') await requestPermission();
                      startDetection();
                    }}
                  >
                    <Play className="h-5 w-5 mr-2 fill-current" />
                    Start Telemetry
                  </Button>
                ) : (
                  <Button
                    className="flex-1 h-14 rounded-xl text-[15px] font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)] transition-all hover:-translate-y-0.5"
                    onClick={stopDetection}
                  >
                    <Square className="h-5 w-5 mr-2 fill-current" />
                    Halt Telemetry
                  </Button>
                )}
                <Button
                  variant="outline"
                  className="h-14 w-14 rounded-xl border-slate-200/80 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 bg-white"
                  onClick={() => setActiveTab('map')}
                >
                  <MapPin className="h-5 w-5 text-slate-600" />
                </Button>
              </div>

              {/* ── RECENT DETECTIONS ─────────────────────────────────── */}
              {detectedAnomalies.length > 0 && (
                <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[1.5rem] bg-white">
                  <CardContent className="p-6">
                    <h3 className="text-[15px] font-black tracking-tight text-slate-900 mb-4">
                      Detected this session ({detectedAnomalies.length})
                    </h3>
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                      {detectedAnomalies.map((a, i) => {
                        const typeConfig = ANOMALY_TYPE_CONFIG[a.anomalyType];
                        return (
                          <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-slate-50 border border-slate-100 hover:shadow-sm transition-all">
                            <span className="text-2xl drop-shadow-sm bg-white w-10 h-10 rounded-full flex items-center justify-center shadow-sm border border-slate-100 shrink-0">{typeConfig?.icon ?? '⚠️'}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[14px] font-bold text-slate-900 truncate">{typeConfig?.label ?? a.anomalyType}</p>
                              <p className="text-[12px] font-medium text-slate-500 mt-0.5">
                                {a.features.peakMagnitude.toFixed(1)} m/s² · {(a.features.peakMagnitude / 9.81).toFixed(1)}g · <span className="text-indigo-600 font-bold">{Math.round(a.confidence * 100)}% conf</span>
                              </p>
                            </div>
                            <div className="text-right shrink-0 flex flex-col items-end justify-center">
                              <Badge
                                variant="secondary"
                                className={cn('text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg mb-1.5 border-0', {
                                  'bg-emerald-50 text-emerald-700': a.severity === 'low',
                                  'bg-amber-50 text-amber-700': a.severity === 'medium',
                                  'bg-orange-50 text-orange-700': a.severity === 'high',
                                  'bg-rose-50 text-rose-700': a.severity === 'critical',
                                })}
                              >{a.severity}</Badge>
                              <p className="text-[10px] font-bold text-slate-400">
                                {new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ── EMPTY STATE / HINT ───────────────────────────────── */}
              {!isDetecting && detectedAnomalies.length === 0 && (
                <div className="border border-dashed border-slate-200 bg-slate-50/50 rounded-[1.5rem] p-8 text-center transition-all hover:bg-slate-50">
                  <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="h-8 w-8 text-slate-400" />
                  </div>
                  <p className="text-[15px] font-black tracking-tight text-slate-900 mb-1">
                    {webReadOnly ? 'Use the mobile app to publish detections' : 'Open in Chrome on your phone'}
                  </p>
                  <p className="text-[13px] font-medium text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {webReadOnly
                      ? 'Once app events arrive in Supabase, this page updates in real time with pothole and rough-road trends.'
                      : 'Hit Start Telemetry, then drive or walk over a bump. The waveform will spike and your phone will vibrate.'}
                  </p>
                </div>
              )}

            </div>
          </TabsContent>

          {/* Map Tab */}
          <TabsContent value="map" className="mt-4">
            <Card className="overflow-hidden border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[1.5rem]">
              <CardContent className="p-0 relative">
                <div
                  ref={mapContainerRef}
                  className="w-full h-[60vh] md:h-[70vh]"
                />
                {!mapLoaded && activeTab === 'map' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/80 backdrop-blur-sm z-10">
                    <div className="p-4 bg-white rounded-[1.25rem] shadow-sm border border-slate-100 flex flex-col items-center">
                      <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mb-3" />
                      <p className="text-[13px] font-bold text-slate-600 tracking-wide">Initializing Telemetry Map...</p>
                    </div>
                  </div>
                )}
                {mapLoaded && mapInstanceRef.current && (
                  <AnomalyMapLayer
                    map={mapInstanceRef.current}
                    anomalies={mergedAnomalies}
                    clusters={mergedClusters}
                  />
                )}
                {/* Legend */}
                <div className="absolute bottom-5 left-5 bg-white/95 backdrop-blur-md rounded-[1rem] p-4 shadow-[0_8px_20px_rgb(0,0,0,0.08)] border border-slate-100 z-[1000] min-w-[140px]">
                  <p className="text-[11px] font-black tracking-widest uppercase text-slate-400 mb-3">Legend</p>
                  <div className="space-y-2.5">
                    {Object.entries(ANOMALY_TYPE_CONFIG).map(([key, config]) => (
                      <div key={key} className="flex items-center gap-2.5 text-[12px] font-bold text-slate-600">
                        <span className="w-6 h-6 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">{config.icon}</span>
                        <span>{config.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="mt-4">
            <AnomalyDashboard userId={user?.id} />
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="mt-4 space-y-4">
            <RoadHealthIndex
              score={(() => {
                // Weight each active cluster by its severity (0-10 scale)
                const activeClusters = mergedClusters.filter(c => c.status === 'probable' || c.status === 'verified');
                if (activeClusters.length === 0) return 100;
                const totalSeverityPenalty = activeClusters.reduce((sum, c) => sum + (c.severityScore ?? 3), 0);
                return Math.max(0, Math.min(100, Math.round(100 - totalSeverityPenalty * 2)));
              })()}
              trend={(() => {
                const now = Date.now();
                const oneHour = 60 * 60 * 1000;
                const recentCount = mergedAnomalies.filter(a => now - new Date(a.detectedAt).getTime() < oneHour).length;
                const olderCount = mergedAnomalies.filter(a => {
                  const age = now - new Date(a.detectedAt).getTime();
                  return age >= oneHour && age < 2 * oneHour;
                }).length;
                if (recentCount > olderCount + 2) return 'declining' as const;
                if (recentCount < olderCount - 2) return 'improving' as const;
                return 'stable' as const;
              })()}
              totalDetections={mergedAnomalies.length}
              activeHotspots={mergedClusters.filter(c => c.status === 'probable' || c.status === 'verified').length}
            />

            {/* Severity Breakdown */}
            <Card className="border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[1.5rem] bg-white mt-6">
              <CardContent className="p-6">
                <h3 className="text-[15px] font-black tracking-tight text-slate-900 mb-5">Hotspot Severity Distribution</h3>
                <div className="space-y-4">
                  {['critical', 'high', 'medium', 'low'].map(level => {
                    const count = mergedClusters.filter(c => {
                      const s = c.severityScore ?? 5;
                      if (level === 'critical') return s >= 8;
                      if (level === 'high') return s >= 6 && s < 8;
                      if (level === 'medium') return s >= 4 && s < 6;
                      return s < 4;
                    }).length;
                    const total = mergedClusters.length || 1;
                    const pct = (count / total) * 100;
                    const colors: Record<string, string> = {
                      critical: 'bg-rose-500 shadow-[0_0_10px_rgba(225,29,72,0.3)]',
                      high: 'bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]',
                      medium: 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)]',
                      low: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]',
                    };
                    return (
                      <div key={level}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[12px] font-bold tracking-widest uppercase text-slate-500">{level}</span>
                          <span className="text-[13px] font-black tracking-tighter text-slate-900">{count}</span>
                        </div>
                        <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
                          <div
                            className={cn('h-full rounded-full transition-all duration-500', colors[level])}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Trip Recorder Widget (floating) */}
      {!webReadOnly && <TripRecorder />}
    </div>
  );
};
