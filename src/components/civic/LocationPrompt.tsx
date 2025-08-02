import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation, AlertCircle } from 'lucide-react';
import { useLocation } from '@/contexts/LocationContext';

export const LocationPrompt: React.FC = () => {
  const { requestLocation, isLoading, error } = useLocation();

  return (
    <div className="min-h-screen bg-gradient-civic flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-card/90 backdrop-blur-sm shadow-civic">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Enable Location Access</CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-center text-muted-foreground">
            CivicTrack needs your location to show civic issues in your 
            neighborhood and enable hyperlocal reporting.
          </p>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Location Error</p>
                <p className="text-xs text-destructive/80 mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <Button 
              onClick={requestLocation}
              disabled={isLoading}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
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

            <div className="text-xs text-muted-foreground space-y-2">
              <p>• Your location is only used to show nearby civic issues</p>
              <p>• We don't store or share your location data</p>
              <p>• You can report issues within a 5km radius</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};