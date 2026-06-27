import React from 'react';
import { RealMapView } from '@/components/civic/RealMapView';
import { useLocation } from '@/hooks/useLocation';
import { useCivicIssues } from '@/hooks/useCivicIssues';
import { Issue } from '@/types/civic';

import { motion } from 'framer-motion';
import { MapPin, Info, Compass, LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGsapReveal } from '@/hooks/useGsapReveal';
import { PageHeader } from '@/components/ui/page-header';

export const Map: React.FC = () => {
  const pageRef = React.useRef<HTMLDivElement | null>(null);
  const { userLocation, locationSource, isTracking, requestLocation, isLoading: locationLoading, error: locationError } = useLocation();
  const { issues } = useCivicIssues();
  const [selectedIssue, setSelectedIssue] = React.useState<Issue | null>(null);
  const [focusUserLocationSignal, setFocusUserLocationSignal] = React.useState(0);

  const locationStatus = React.useMemo(() => {
    if (locationSource === 'live' && isTracking) {
      return { label: 'Live GPS tracking', tone: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
    }
    if (locationSource === 'last-known') {
      return { label: 'Using last known location', tone: 'text-amber-700 bg-amber-50 border-amber-200' };
    }
    if (locationError) {
      return { label: 'Location permission needed', tone: 'text-rose-700 bg-rose-50 border-rose-200' };
    }
    return { label: 'Using default city center', tone: 'text-slate-700 bg-slate-100 border-slate-200' };
  }, [isTracking, locationError, locationSource]);



  useGsapReveal(pageRef, {
    selector: '[data-reveal-map]',
    y: 12,
    stagger: 0.07,
    duration: 0.48,
  });

  return (
    <div
      ref={pageRef}
      className="mx-auto flex h-full max-h-screen min-h-screen w-full max-w-[1600px] flex-col overflow-hidden px-4 pb-24 pt-4 md:px-8 md:pb-6 md:pt-8 bg-slate-50"
    >
      {/* Header Panel */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-20 mb-5 shrink-0"
        data-reveal-map
      >
        <PageHeader
          icon={<MapPin className="h-5 w-5" />}
          title="Main CityScope Map"
          description="Explore active civic issues, anomalies, and city response in real time."
          actions={
            <>
              <div className="hidden items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-soft md:flex">
                <Compass className="h-4 w-4 text-blue-600" /> Civic geospatial mode active
              </div>
              <div className={`hidden items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold shadow-soft md:flex ${locationStatus.tone}`}>
                <span>{locationStatus.label}</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-10 px-4"
                disabled={locationLoading}
                onClick={() => {
                  if (userLocation) {
                    setFocusUserLocationSignal((prev) => prev + 1);
                    return;
                  }
                  requestLocation();
                }}
              >
                <LocateFixed className="h-4 w-4" /> My Location
              </Button>
            </>
          }
        />
      </motion.div>

      {/* Main Map Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 25, delay: 0.1 } }}
        className="relative z-10 flex-1 w-full overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
        data-reveal-map
      >
        {/* Map Header Status Indicator */}
        <div className="absolute left-6 top-6 z-20 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 shadow-sm">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="font-bold text-sm text-slate-800">{issues.length} Active Reports</span>
        </div>

        <div className="absolute right-6 top-6 z-20 hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm md:flex">
          <Info className="h-4 w-4 text-blue-600" /> Tap markers to inspect issue details
        </div>

        <RealMapView
          onIssueSelect={setSelectedIssue}
          selectedIssueId={selectedIssue?.id}
          userLocation={userLocation}
          focusUserLocationSignal={focusUserLocationSignal}
          className="w-full h-full"
        />
      </motion.div>
    </div>
  );
};
