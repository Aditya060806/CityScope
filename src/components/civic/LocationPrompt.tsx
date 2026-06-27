import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { useLocation } from '@/hooks/useLocation';

export const LocationPrompt: React.FC = () => {
  const { requestLocation, isLoading, error } = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-100 via-slate-50 to-white flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white border border-slate-200/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[1.25rem] overflow-hidden">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 mx-auto mb-4 bg-indigo-50 border border-indigo-100/50 rounded-[1.25rem] flex items-center justify-center shadow-sm">
            <MapPin className="w-8 h-8 text-indigo-600" />
          </div>
          <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Enable Location Access</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-4">
          <p className="text-center text-[15px] font-medium text-slate-500 leading-relaxed">
            CityScope needs your location to show civic issues in your 
            neighborhood and enable hyperlocal reporting.
          </p>

          {error && (
            <div className="p-4 bg-rose-50/50 border border-rose-200/50 rounded-xl flex items-start gap-3 shadow-[0_2px_10px_-4px_rgba(225,29,72,0.1)]">
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-700">Location Error</p>
                <p className="text-[13px] font-medium text-rose-600/80 mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <Button 
              onClick={requestLocation}
              disabled={isLoading}
              className="w-full h-12 rounded-xl text-[15px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-[0_4px_14px_0_rgba(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] transition-all hover:-translate-y-0.5"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                  Getting Location...
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4 mr-2" />
                  Enable Location
                </>
              )}
            </Button>

            <div className="text-[13px] font-medium text-slate-400 space-y-2.5 pt-2">
              <p className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-slate-300"/> Your location is only used to show nearby civic issues</p>
              <p className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-slate-300"/> We don't store or share your location data</p>
              <p className="flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-slate-300"/> You can report issues within a 5km radius</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};