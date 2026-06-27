import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  Square,
  Activity,
  AlertTriangle,
  Navigation,
  Timer,
  Gauge,
  ChevronUp,
  ChevronDown,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRoadAnomalyDetection } from '@/hooks/useRoadAnomalyDetection';
import { useTripRecording } from '@/hooks/useTripRecording';
import { PRADPermissionDialog } from './PRADPermissionDialog';
import { ANOMALY_TYPE_CONFIG, ANOMALY_SEVERITY_CONFIG } from '@/types/road-anomaly';
import { motion, AnimatePresence } from 'framer-motion';

interface TripRecorderProps {
  className?: string;
}

export const TripRecorder: React.FC<TripRecorderProps> = ({ className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [recentFlash, setRecentFlash] = useState(false);

  const {
    isDetecting,
    permissionState,
    anomalies,
    currentSpeed,
    batteryLevel,
    isSupported,
    requestPermission,
    startDetection,
    stopDetection,
  } = useRoadAnomalyDetection();

  const {
    currentTrip,
    tripStatus,
    distanceKm,
    durationMs,
    transportMode,
    avgSpeedKmh,
    startTrip,
    pauseTrip,
    resumeTrip,
    endTrip,
  } = useTripRecording();

  // Flash effect on new anomaly
  const anomalyCount = anomalies.length;
  useEffect(() => {
    if (anomalyCount > 0) {
      setRecentFlash(true);
      const t = setTimeout(() => setRecentFlash(false), 1000);
      return () => clearTimeout(t);
    }
  }, [anomalyCount]);

  const formatDuration = (ms: number) => {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    if (mins > 0) return `${mins}m ${secs % 60}s`;
    return `${secs}s`;
  };

  const handleStart = async () => {
    if (permissionState !== 'granted') {
      setShowPermissionDialog(true);
      return;
    }
    await startTrip();
    startDetection();
  };

  const handlePause = () => {
    pauseTrip();
    stopDetection();
  };

  const handleResume = async () => {
    resumeTrip();
    startDetection();
  };

  const handleStop = async () => {
    stopDetection();
    await endTrip();
  };

  const handlePermissionGranted = () => {
    setShowPermissionDialog(false);
  };

  const isActive = tripStatus === 'recording';
  const isPaused = tripStatus === 'paused';
  const isIdle = tripStatus === null || tripStatus === 'completed';

  const speedKmh = (currentSpeed ?? 0) * 3.6;

  // Severity color for the pulsing indicator
  const getStatusColor = () => {
    if (!isActive) return 'bg-gray-400';
    if (recentFlash) return 'bg-red-500';
    if (isDetecting) return 'bg-green-500';
    return 'bg-yellow-500';
  };

  return (
    <>
      <PRADPermissionDialog
        open={showPermissionDialog}
        onOpenChange={setShowPermissionDialog}
        onPermissionGranted={handlePermissionGranted}
        onPermissionDenied={() => setShowPermissionDialog(false)}
        requestPermission={async () => { const s = await requestPermission(); return s === 'granted'; }}
        isSupported={isSupported}
      />

      <AnimatePresence>
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className={cn(
            'fixed bottom-[140px] left-4 right-4 z-40 md:left-auto md:right-6 md:bottom-6 md:w-80',
            className
          )}
        >
          <div className={cn(
            'rounded-2xl border shadow-lg backdrop-blur-sm transition-all duration-300',
            isActive
              ? 'bg-white/95 border-blue-200 shadow-blue-100'
              : isPaused
                ? 'bg-white/95 border-yellow-200 shadow-yellow-100'
                : 'bg-white/90 border-gray-200'
          )}>
            {/* Compact Header — always visible */}
            <div
              className="flex items-center justify-between p-3 cursor-pointer"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <div className="flex items-center gap-2">
                {/* Pulsing status dot */}
                <div className="relative">
                  <div className={cn('h-3 w-3 rounded-full', getStatusColor())} />
                  {isActive && (
                    <div className={cn(
                      'absolute inset-0 h-3 w-3 rounded-full animate-ping',
                      recentFlash ? 'bg-red-400' : 'bg-green-400'
                    )} />
                  )}
                </div>

                <span className="text-sm font-semibold text-gray-800">
                  {isIdle ? 'Road Scanner' : isPaused ? 'Paused' : 'Detecting'}
                </span>

                {!isIdle && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                    {anomalyCount} bump{anomalyCount !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-2">
                {!isIdle && (
                  <span className="text-xs text-gray-500 font-mono">
                    {formatDuration(durationMs)}
                  </span>
                )}
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>

            {/* Expanded Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 space-y-3">
                    {/* Stats Grid */}
                    {!isIdle && (
                      <div className="grid grid-cols-4 gap-2">
                        <div className="text-center p-2 rounded-lg bg-gray-50">
                          <Gauge className="h-3.5 w-3.5 mx-auto text-blue-500 mb-1" />
                          <p className="text-xs font-bold">{speedKmh.toFixed(0)}</p>
                          <p className="text-[10px] text-gray-500">km/h</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-gray-50">
                          <Navigation className="h-3.5 w-3.5 mx-auto text-green-500 mb-1" />
                          <p className="text-xs font-bold">{distanceKm.toFixed(1)}</p>
                          <p className="text-[10px] text-gray-500">km</p>
                        </div>
                        <div className={cn(
                          'text-center p-2 rounded-lg transition-colors',
                          recentFlash ? 'bg-red-50' : 'bg-gray-50'
                        )}>
                          <AlertTriangle className={cn(
                            'h-3.5 w-3.5 mx-auto mb-1',
                            recentFlash ? 'text-red-500' : 'text-orange-500'
                          )} />
                          <p className="text-xs font-bold">{anomalyCount}</p>
                          <p className="text-[10px] text-gray-500">bumps</p>
                        </div>
                        <div className="text-center p-2 rounded-lg bg-gray-50">
                          <Zap className="h-3.5 w-3.5 mx-auto text-yellow-500 mb-1" />
                          <p className="text-xs font-bold">{batteryLevel !== null ? `${Math.round(batteryLevel * 100)}%` : '--'}</p>
                          <p className="text-[10px] text-gray-500">battery</p>
                        </div>
                      </div>
                    )}

                    {/* Recent anomalies list */}
                    {anomalies.length > 0 && (
                      <div className="max-h-24 overflow-y-auto space-y-1">
                        {anomalies.slice(-3).reverse().map((a, i) => {
                          const typeConfig = ANOMALY_TYPE_CONFIG[a.anomalyType];
                          const sevConfig = ANOMALY_SEVERITY_CONFIG[a.severity];
                          return (
                            <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 text-xs">
                              <span>{typeConfig?.icon ?? '⚠️'}</span>
                              <span className="font-medium flex-1">{typeConfig?.label ?? a.anomalyType}</span>
                              <Badge
                                variant="secondary"
                                className={cn('text-[10px] px-1 py-0 h-4', {
                                  'bg-green-100 text-green-700': a.severity === 'low',
                                  'bg-yellow-100 text-yellow-700': a.severity === 'medium',
                                  'bg-orange-100 text-orange-700': a.severity === 'high',
                                  'bg-red-100 text-red-700': a.severity === 'critical',
                                })}
                              >
                                {sevConfig?.label ?? a.severity}
                              </Badge>
                              <span className="text-gray-400">
                                {Math.round(a.confidence * 100)}%
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Transport mode indicator */}
                    {!isIdle && transportMode && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">
                        <Activity className="h-3 w-3" />
                        <span>Mode: {transportMode.replace('_', ' ')}</span>
                        {avgSpeedKmh > 0 && <span>• Avg {avgSpeedKmh.toFixed(0)} km/h</span>}
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      {isIdle && (
                        <Button
                          onClick={handleStart}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-9"
                          size="sm"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Start Trip
                        </Button>
                      )}

                      {isActive && (
                        <>
                          <Button
                            onClick={handlePause}
                            variant="outline"
                            className="flex-1 border-yellow-300 text-yellow-700 hover:bg-yellow-50 h-9"
                            size="sm"
                          >
                            <Pause className="h-4 w-4 mr-1" />
                            Pause
                          </Button>
                          <Button
                            onClick={handleStop}
                            variant="outline"
                            className="flex-1 border-red-300 text-red-700 hover:bg-red-50 h-9"
                            size="sm"
                          >
                            <Square className="h-4 w-4 mr-1" />
                            End Trip
                          </Button>
                        </>
                      )}

                      {isPaused && (
                        <>
                          <Button
                            onClick={handleResume}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white h-9"
                            size="sm"
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Resume
                          </Button>
                          <Button
                            onClick={handleStop}
                            variant="outline"
                            className="flex-1 border-red-300 text-red-700 hover:bg-red-50 h-9"
                            size="sm"
                          >
                            <Square className="h-4 w-4 mr-1" />
                            End Trip
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </AnimatePresence>
    </>
  );
};
