import React, { useState } from 'react';
import { RealMapView } from '@/components/civic/RealMapView';
import { Issue } from '@/types/civic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowLeft } from 'lucide-react';
import { DEFAULT_LOCATION } from '@/constants/location';

export const MapTest: React.FC = () => {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const userLocation = {
    latitude: DEFAULT_LOCATION.latitude,
    longitude: DEFAULT_LOCATION.longitude,
    address: DEFAULT_LOCATION.address,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Card className="card-sleek">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-royal to-royal/80 rounded-xl flex items-center justify-center shadow-sleek">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-gray-900">CityScope Map Test</h1>
                  <p className="text-gray-600 font-medium">Testing the interactive map component</p>
                </div>
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Map Component */}
        <div className="mb-6">
          <RealMapView
            onIssueSelect={setSelectedIssue}
            selectedIssueId={selectedIssue?.id}
            userLocation={userLocation}
            className="w-full"
          />
        </div>

        {/* Selected Issue Details */}
        {selectedIssue && (
          <Card className="card-sleek">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Selected Issue Details</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedIssue(null)}
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Close
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg text-gray-900">{selectedIssue.title}</h3>
                  <p className="text-gray-600 mt-1">{selectedIssue.description}</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Category</p>
                    <p className="text-sm text-gray-900 capitalize">{selectedIssue.category}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-sm text-gray-900 capitalize">{selectedIssue.status}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Priority</p>
                    <p className="text-sm text-gray-900 capitalize">{selectedIssue.priority}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Upvotes</p>
                    <p className="text-sm text-gray-900">{selectedIssue.upvotes}</p>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-sm text-gray-900">{selectedIssue.location.address}</p>
                  <p className="text-xs text-gray-500">
                    {selectedIssue.location.latitude.toFixed(4)}, {selectedIssue.location.longitude.toFixed(4)}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Reporter</p>
                  <p className="text-sm text-gray-900">
                    {selectedIssue.isAnonymous ? 'Anonymous' : selectedIssue.reporterName}
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-500">Created</p>
                  <p className="text-sm text-gray-900">
                    {selectedIssue.createdAt.toLocaleDateString()} at {selectedIssue.createdAt.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card className="card-sleek">
          <CardHeader>
            <CardTitle>Map Features Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">View Modes</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Pins: Individual issue markers</li>
                  <li>• Clusters: Grouped markers</li>
                  <li>• Heatmap: Density visualization</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Map Styles</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Street: Default map view</li>
                  <li>• Satellite: Aerial imagery</li>
                  <li>• Terrain: Topographical view</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Interactive Features</h4>
                <ul className="space-y-1 text-gray-600">
                  <li>• Click markers to select issues</li>
                  <li>• Use filters to narrow results</li>
                  <li>• Search by title or location</li>
                  <li>• Bookmark issues for later</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};