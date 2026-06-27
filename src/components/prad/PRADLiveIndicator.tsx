import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Activity,
  Gauge,
  Vibrate,
  AlertTriangle,
  Navigation,
  Zap,
  X,
  ChevronUp,
  ChevronDown,
  Smartphone,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { usePRADAutoDetectionSafe } from '@/contexts/PRADAutoDetectionContext';
import { ANOMALY_TYPE_CONFIG, ANOMALY_SEVERITY_CONFIG } from '@/types/road-anomaly';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// PRADLiveIndicator — Tiny floating pill that shows live detection status
//
// Always visible on mobile when detection is running. Expands to show real-time
// metrics: g-force, vibration intensity, speed, and recent detections with
// haptic flash feedback.
// ============================================================================

export const PRADLiveIndicator: React.FC = () => {
  const prad = usePRADAutoDetectionSafe();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const prevAnomalyCount = useRef(0);

  // Show a toast flash whenever a new anomaly is detected
  useEffect(() => {
    if (!prad) return;
    if (prad.anomalyCount > prevAnomalyCount.current && prevAnomalyCount.current > 0) {
      setShowToast(true);
      const t = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(t);
    }
    prevAnomalyCount.current = prad.anomalyCount;
  }, [prad?.anomalyCount]);

  if (!prad || !prad.isMobile || !prad.isDetecting) return null;

  const { lastAnomaly } = prad;
  const lastConfig = lastAnomaly ? ANOMALY_TYPE_CONFIG[lastAnomaly.anomalyType] : null;

  // G-force color coding
  const gForceColor = prad.currentGForce > 2 ? 'text-red-500' :
    prad.currentGForce > 1 ? 'text-orange-500' :
    prad.currentGForce > 0.5 ? 'text-yellow-500' : 'text-green-500';

  // Vibration bar color
  const vibColor = prad.vibrationIntensity > 70 ? 'bg-red-500' :
    prad.vibrationIntensity > 40 ? 'bg-orange-500' :
    prad.vibrationIntensity > 20 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <>
      {/* Detection Toast — pops up for 3s when anomaly detected */}
      <AnimatePresence>
        {showToast && lastAnomaly && (
          <motion.div
            initial={{ y: -80, opacity: 0, scale: 0.9 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -80, opacity: 0, scale: 0.9 }}
            className="fixed top-16 left-4 right-4 z-50 md:left-auto md:right-6 md:w-80"
          >
            <div className={cn(
              'rounded-xl border-2 p-3 shadow-lg backdrop-blur-sm flex items-center gap-3',
              lastAnomaly.severity === 'critical' ? 'bg-red-50/95 border-red-300' :
              lastAnomaly.severity === 'high' ? 'bg-orange-50/95 border-orange-300' :
              lastAnomaly.severity === 'medium' ? 'bg-yellow-50/95 border-yellow-300' :
              'bg-green-50/95 border-green-300'
            )}>
              <div className="text-2xl animate-bounce">
                {lastConfig?.icon ?? '⚠️'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold truncate">
                    {lastConfig?.label ?? lastAnomaly.anomalyType} detected!
                  </p>
                  <Badge
                    variant="secondary"
                    className={cn('text-[10px] shrink-0', {
                      'bg-green-100 text-green-700': lastAnomaly.severity === 'low',
                      'bg-yellow-100 text-yellow-700': lastAnomaly.severity === 'medium',
                      'bg-orange-100 text-orange-700': lastAnomaly.severity === 'high',
                      'bg-red-100 text-red-700': lastAnomaly.severity === 'critical',
                    })}
                  >
                    {lastAnomaly.severity}
                  </Badge>
                </div>
                <p className="text-[10px] text-gray-500">
                  {lastAnomaly.features.peakMagnitude.toFixed(1)} m/s²
                  ({(lastAnomaly.features.peakMagnitude / 9.81).toFixed(1)}g) •
                  {Math.round(lastAnomaly.confidence * 100)}% confidence
                </p>
              </div>
              <Vibrate className="h-5 w-5 text-gray-400 animate-pulse shrink-0" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent floating pill */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-[140px] right-4 z-40 md:bottom-6"
      >
        <div className={cn(
          'rounded-2xl border shadow-lg backdrop-blur-sm transition-all duration-300',
          isExpanded ? 'w-72 bg-white/95 border-blue-200' : 'bg-white/90 border-gray-200'
        )}>
          {/* Compact pill — always visible */}
          <div
            className="flex items-center gap-2 px-3 py-2 cursor-pointer"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {/* Pulsing dot */}
            <div className="relative">
              <div className={cn(
                'h-2.5 w-2.5 rounded-full',
                prad.isDetecting ? 'bg-green-500' : 'bg-gray-400'
              )} />
              {prad.isDetecting && (
                <div className="absolute inset-0 h-2.5 w-2.5 rounded-full bg-green-400 animate-ping" />
              )}
            </div>

            {/* G-force reading */}
            <span className={cn('text-xs font-mono font-bold', gForceColor)}>
              {prad.currentGForce.toFixed(1)}g
            </span>

            {/* Anomaly count pill */}
            {prad.anomalyCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 bg-orange-100 text-orange-700">
                {prad.anomalyCount}
              </Badge>
            )}

            {/* Speed */}
            <span className="text-[10px] text-gray-500 font-mono">
              {prad.currentSpeedKmh.toFixed(0)}km/h
            </span>

            {isExpanded
              ? <ChevronDown className="h-3 w-3 text-gray-400 ml-auto" />
              : <ChevronUp className="h-3 w-3 text-gray-400 ml-auto" />
            }
          </div>

          {/* Expanded panel */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 space-y-2.5 border-t border-gray-100 pt-2">
                  {/* Vibration intensity bar */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                      <span className="flex items-center gap-1">
                        <Vibrate className="h-3 w-3" />
                        Vibration Intensity
                      </span>
                      <span className="font-mono font-bold">{prad.vibrationIntensity.toFixed(0)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={cn('h-full rounded-full transition-all duration-200', vibColor)}
                        style={{ width: `${prad.vibrationIntensity}%` }}
                      />
                    </div>
                  </div>

                  {/* Metrics row */}
                  <div className="grid grid-cols-3 gap-1.5">
                    <div className="text-center p-1.5 rounded-lg bg-gray-50">
                      <Gauge className="h-3 w-3 mx-auto text-blue-500 mb-0.5" />
                      <p className={cn('text-xs font-bold font-mono', gForceColor)}>
                        {prad.currentGForce.toFixed(2)}
                      </p>
                      <p className="text-[8px] text-gray-400">g-force</p>
                    </div>
                    <div className="text-center p-1.5 rounded-lg bg-gray-50">
                      <Navigation className="h-3 w-3 mx-auto text-green-500 mb-0.5" />
                      <p className="text-xs font-bold font-mono">
                        {prad.currentSpeedKmh.toFixed(0)}
                      </p>
                      <p className="text-[8px] text-gray-400">km/h</p>
                    </div>
                    <div className="text-center p-1.5 rounded-lg bg-gray-50">
                      <Zap className="h-3 w-3 mx-auto text-yellow-500 mb-0.5" />
                      <p className="text-xs font-bold font-mono">
                        {prad.batteryLevel !== null ? `${Math.round(prad.batteryLevel * 100)}` : '--'}
                      </p>
                      <p className="text-[8px] text-gray-400">battery%</p>
                    </div>
                  </div>

                  {/* Recent detections */}
                  {prad.anomalies.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-[10px] text-gray-500 font-semibold">Recent</p>
                      {prad.anomalies.slice(0, 3).map((a, i) => {
                        const tc = ANOMALY_TYPE_CONFIG[a.anomalyType];
                        return (
                          <div key={i} className="flex items-center gap-1.5 text-[10px]">
                            <span>{tc?.icon ?? '⚠️'}</span>
                            <span className="font-medium flex-1 truncate">{tc?.label ?? a.anomalyType}</span>
                            <span className="text-gray-400">
                              {(a.features.peakMagnitude / 9.81).toFixed(1)}g
                            </span>
                            <Badge
                              variant="secondary"
                              className={cn('text-[8px] px-1 py-0 h-3.5', {
                                'bg-green-100 text-green-700': a.severity === 'low',
                                'bg-yellow-100 text-yellow-700': a.severity === 'medium',
                                'bg-orange-100 text-orange-700': a.severity === 'high',
                                'bg-red-100 text-red-700': a.severity === 'critical',
                              })}
                            >
                              {a.severity}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Stop button */}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-7 text-xs border-red-200 text-red-600 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      prad.disableAutoDetection();
                      localStorage.setItem('prad_auto_enabled', 'false');
                    }}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Stop Detection
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
};
