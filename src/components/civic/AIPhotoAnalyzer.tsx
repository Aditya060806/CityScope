import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Upload, 
  X, 
  Eye, 
  EyeOff, 
  Loader2, 
  CheckCircle, 
  AlertCircle,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Target,
  Zap,
  Video,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { geminiAIService } from '@/services/GeminiAIService';
import { IssueCategory, IssuePriority, CATEGORY_CONFIG, PRIORITY_CONFIG } from '@/types/civic';
import { toast } from 'sonner';
import '@/styles/mobile-camera.css';

interface AIPhotoAnalyzerProps {
  onAnalysisComplete: (analysis: {
    category: IssueCategory;
    priority: IssuePriority;
    confidence: number;
    detectedIssues: string[];
    description: string;
    suggestedTitle: string;
    tags: string[];
  }) => void;
  className?: string;
  disabled?: boolean;
}

interface PhotoAnalysis {
  id: string;
  file: File;
  preview: string;
  analysis?: {
    category: IssueCategory;
    priority: IssuePriority;
    confidence: number;
    detectedIssues: string[];
    description: string;
    suggestedTitle: string;
    tags: string[];
  };
  isAnalyzing: boolean;
  error?: string;
}

export const AIPhotoAnalyzer: React.FC<AIPhotoAnalyzerProps> = ({
  onAnalysisComplete,
  className,
  disabled = false
}) => {
  const [photos, setPhotos] = useState<PhotoAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showPreviews, setShowPreviews] = useState(true);
  
  // Camera capture states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Handle scroll locking on mobile when camera is open
  useEffect(() => {
    if (isCameraOpen) {
      // Lock scroll on mobile
      document.body.classList.add('camera-active');
      document.documentElement.classList.add('camera-active');
      
      // Prevent iOS bounce
      const preventScroll = (e: TouchEvent) => {
        if (e.target instanceof HTMLVideoElement) return;
        e.preventDefault();
      };
      
      document.addEventListener('touchmove', preventScroll, { passive: false });
      
      return () => {
        document.body.classList.remove('camera-active');
        document.documentElement.classList.remove('camera-active');
        document.removeEventListener('touchmove', preventScroll);
      };
    }
  }, [isCameraOpen]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length + photos.length > 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }

    const newPhotos: PhotoAnalysis[] = files.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      preview: URL.createObjectURL(file),
      isAnalyzing: false
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
  }, [photos.length]);

  const removePhoto = useCallback((id: string) => {
    setPhotos(prev => {
      const photo = prev.find(p => p.id === id);
      if (photo) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter(p => p.id !== id);
    });
  }, []);

  // Camera functions
  const startCamera = async () => {
    try {
      setCameraError(null);
      setIsCameraReady(false);
      
      // Detect if mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      // Mobile-optimized camera constraints
      const constraints = {
        video: { 
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: isMobile ? 1920 : 1920 },
          height: { ideal: isMobile ? 1080 : 1080 },
          aspectRatio: { ideal: 16/9 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true);
        };
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Could not access camera';
      
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          errorMessage = 'Camera permission denied. Please allow camera access.';
        } else if (error.name === 'NotFoundError') {
          errorMessage = 'No camera found on this device.';
        } else if (error.name === 'NotReadableError') {
          errorMessage = 'Camera is already in use by another application.';
        }
      }
      
      setCameraError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setIsCameraReady(false);
    setCameraError(null);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !isCameraReady) {
      toast.error('Camera not ready');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame to canvas
    const context = canvas.getContext('2d');
    if (context) {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Create a File object from the blob
          const file = new File([blob], `camera-capture-${Date.now()}.jpg`, {
            type: 'image/jpeg'
          });
          
          // Create photo analysis object
          const newPhoto: PhotoAnalysis = {
            id: Math.random().toString(36).substr(2, 9),
            file,
            preview: URL.createObjectURL(blob),
            isAnalyzing: false
          };
          
          setPhotos(prev => [...prev, newPhoto]);
          
          toast.success('Photo captured successfully');
          
          // Close camera after capture
          stopCamera();
          setIsCameraOpen(false);
        }
      }, 'image/jpeg', 0.95);
    }
  };

  const openCameraModal = () => {
    if (photos.length >= 5) {
      toast.error('Maximum 5 photos allowed');
      return;
    }
    
    setIsCameraOpen(true);
    // Start camera after modal opens
    setTimeout(() => {
      startCamera();
    }, 300);
  };

  const closeCameraModal = () => {
    stopCamera();
    setIsCameraOpen(false);
  };

  const analyzePhoto = async (photo: PhotoAnalysis) => {
    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(photo.file);
      });

      // Update photo state to analyzing
      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? { ...p, isAnalyzing: true, error: undefined } : p
      ));

      // Perform AI analysis
      const analysis = await geminiAIService.analyzeIssuePhoto(base64);
      
      // Update photo with analysis results
      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? { ...p, analysis, isAnalyzing: false } : p
      ));

      // Notify parent component
      onAnalysisComplete(analysis);

      toast.success(`Photo analyzed: ${analysis.detectedIssues.length} issues detected`);
    } catch (error) {
      console.error('Error analyzing photo:', error);
      
      const errorMessage = (error as Error).message;
      let displayMessage = 'Analysis failed';
      
      if (errorMessage.includes('quota exceeded')) {
        displayMessage = 'API quota exceeded';
        toast.error('AI quota exceeded. Please check your API limits.');
      } else if (errorMessage.includes('API key')) {
        displayMessage = 'API key issue';
        toast.error('AI API key configuration issue.');
      } else {
        toast.error('Failed to analyze photo');
      }
      
      setPhotos(prev => prev.map(p => 
        p.id === photo.id ? { 
          ...p, 
          isAnalyzing: false, 
          error: displayMessage 
        } : p
      ));
    }
  };

  const analyzeAllPhotos = async () => {
    setIsAnalyzing(true);
    
    try {
      const photosToAnalyze = photos.filter(p => !p.analysis && !p.isAnalyzing);
      
      for (const photo of photosToAnalyze) {
        await analyzePhoto(photo);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.7) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.4) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.7) return 'High';
    if (confidence >= 0.4) return 'Medium';
    return 'Low';
  };

  const getPriorityColor = (priority: IssuePriority) => {
    const config = PRIORITY_CONFIG[priority];
    return config.color;
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Upload Area */}
      <Card className="overflow-hidden border border-slate-200/80 bg-white shadow-sleek">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-slate-50/80">
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-royal" />
            AI Photo Analysis
            <Badge variant="outline" className="border-powder-200 bg-powder-50 text-[11px] text-powder-700">
              <Sparkles className="w-3 h-3 mr-1" />
              Powered by AI
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Upload and Camera Buttons */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Upload Button */}
              <label className="group flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-white to-slate-50 transition-colors hover:border-powder-400 hover:from-powder-50/50 hover:to-white">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="mb-2 h-8 w-8 text-slate-400 transition-colors group-hover:text-royal" />
                  <p className="text-sm font-semibold text-royal">Upload Photos</p>
                  <p className="text-xs text-slate-500">PNG, JPG up to 10MB each</p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={disabled || photos.length >= 5}
                />
              </label>

              {/* Camera Capture Button */}
              <button
                type="button"
                onClick={openCameraModal}
                disabled={disabled || photos.length >= 5}
                className="group flex h-32 w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-white to-slate-50 transition-colors hover:border-powder-400 hover:from-powder-50/50 hover:to-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Camera className="mb-2 h-8 w-8 text-slate-400 transition-colors group-hover:text-royal" />
                  <p className="text-sm font-semibold text-royal">Capture Photo</p>
                  <p className="text-xs text-slate-500">Use your camera to take a photo</p>
                </div>
              </button>
            </div>

            {/* Action Buttons */}
            {photos.length > 0 && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPreviews(!showPreviews)}
                    className="border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    {showPreviews ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                    {showPreviews ? 'Hide' : 'Show'} Previews
                  </Button>
                  
                  <Badge variant="outline" className="border-powder-200 bg-powder-50 text-powder-700">
                    {photos.length} photo{photos.length !== 1 ? 's' : ''}
                  </Badge>
                </div>

                <Button
                  onClick={analyzeAllPhotos}
                  disabled={isAnalyzing || photos.every(p => p.analysis || p.isAnalyzing)}
                  className="w-full bg-gradient-to-r from-royal to-powder-700 text-white shadow-royal hover:from-royal hover:to-powder-600 sm:w-auto"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Analyze All Photos
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Photo Previews and Analysis */}
      {showPreviews && photos.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {photos.map((photo, index) => (
            <Card
              key={photo.id}
              className="overflow-hidden border border-slate-200/80 bg-white shadow-sleek transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sleek-lg animate-fade-in-up motion-reduce:animate-none"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="relative">
                <img
                  src={photo.preview}
                  alt="Upload preview"
                  className="h-48 w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
                
                {/* Remove Button */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute right-2 top-2 h-8 w-8 p-0 shadow-sm"
                  onClick={() => removePhoto(photo.id)}
                >
                  <X className="w-4 h-4" />
                </Button>

                {/* Analysis Status */}
                {photo.isAnalyzing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-royal/65 backdrop-blur-[1px]">
                    <div className="text-center text-white">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                      <p className="text-sm font-semibold">Analyzing...</p>
                      <p className="text-[11px] text-white/80">AI is extracting issue signals</p>
                    </div>
                  </div>
                )}

                {photo.error && (
                  <div className="absolute inset-0 flex items-center justify-center bg-rose-600/70 backdrop-blur-[1px]">
                    <div className="text-center text-white">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p className="text-sm font-semibold">Analysis Failed</p>
                      <p className="text-[11px] text-white/80">Try re-running this photo</p>
                    </div>
                  </div>
                )}
              </div>

              <CardContent className="p-4">
                {photo.analysis ? (
                  <div className="space-y-3">
                    {/* Analysis Results */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className={cn('text-xs font-semibold', getConfidenceColor(photo.analysis.confidence))}
                        >
                          {getConfidenceLabel(photo.analysis.confidence)} Confidence
                        </Badge>
                        <Badge 
                          variant="outline"
                          className="text-xs font-semibold border-slate-200"
                          style={{ color: getPriorityColor(photo.analysis.priority) }}
                        >
                          {photo.analysis.priority}
                        </Badge>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-500">Category:</span>
                          <Badge variant="secondary" className="text-xs bg-powder-50 text-powder-700">
                            {CATEGORY_CONFIG[photo.analysis.category].icon} {CATEGORY_CONFIG[photo.analysis.category].label}
                          </Badge>
                        </div>

                        <div className="text-sm font-semibold text-royal">
                          {photo.analysis.suggestedTitle}
                        </div>
                      </div>
                    </div>

                    {/* Detected Issues */}
                    {photo.analysis.detectedIssues.length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-500">Detected Issues:</p>
                        <div className="flex flex-wrap gap-1">
                          {photo.analysis.detectedIssues.slice(0, 2).map((issue, index) => (
                            <Badge key={index} variant="outline" className="text-xs border-slate-200 bg-slate-50 text-slate-700">
                              {issue}
                            </Badge>
                          ))}
                          {photo.analysis.detectedIssues.length > 2 && (
                            <Badge variant="outline" className="text-xs border-slate-200 bg-slate-50 text-slate-700">
                              +{photo.analysis.detectedIssues.length - 2} more
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Confidence Bar */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-500">
                        <span>AI Confidence</span>
                        <span>{Math.round(photo.analysis.confidence * 100)}%</span>
                      </div>
                      <Progress 
                        value={photo.analysis.confidence * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                ) : !photo.isAnalyzing && !photo.error ? (
                  <div className="text-center py-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => analyzePhoto(photo)}
                      disabled={disabled}
                      className="w-full border-slate-200 text-slate-700 hover:bg-slate-50"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Analyze Photo
                    </Button>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Analysis Summary */}
      {photos.some(p => p.analysis) && (
        <Card className="overflow-hidden border border-powder-200 bg-gradient-to-r from-powder-50/70 to-white shadow-sleek animate-fade-in-up motion-reduce:animate-none">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-royal">Analysis Summary</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-500">Photos Analyzed:</span>
                <span className="ml-2 font-semibold text-royal">{photos.filter(p => p.analysis).length}</span>
              </div>
              <div>
                <span className="text-slate-500">Avg Confidence:</span>
                <span className="ml-2 font-semibold text-royal">
                  {Math.round(
                    photos
                      .filter(p => p.analysis)
                      .reduce((sum, p) => sum + (p.analysis?.confidence || 0), 0) /
                    photos.filter(p => p.analysis).length * 100
                  )}%
                </span>
              </div>
              <div>
                <span className="text-slate-500">Issues Detected:</span>
                <span className="ml-2 font-semibold text-royal">
                  {photos
                    .filter(p => p.analysis)
                    .reduce((sum, p) => sum + (p.analysis?.detectedIssues.length || 0), 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Camera Capture Modal - Mobile Optimized */}
      <Dialog open={isCameraOpen} onOpenChange={closeCameraModal}>
        <DialogContent className="max-w-full w-full h-full max-h-screen p-0 m-0 rounded-none sm:max-w-3xl sm:h-auto sm:rounded-lg sm:p-6 border-0 sm:border">
          {/* Mobile: Full Screen Header */}
          <DialogHeader className="p-4 sm:p-0 bg-black/90 sm:bg-transparent absolute sm:relative top-0 left-0 right-0 z-10 camera-header">
            <DialogTitle className="flex items-center gap-2 text-white sm:text-foreground camera-interface">
              <Camera className="w-5 h-5 text-white sm:text-royal" />
              Capture Photo
            </DialogTitle>
            <DialogDescription className="text-gray-300 sm:text-muted-foreground hidden sm:block">
              Position your camera to capture the civic issue. Make sure the image is clear and well-lit.
            </DialogDescription>
          </DialogHeader>

          <div className="h-full sm:h-auto flex flex-col sm:space-y-4 camera-modal-content">
            {/* Camera Preview - Full Screen on Mobile */}
            <div className="relative bg-black flex-1 sm:flex-none sm:rounded-lg overflow-hidden sm:aspect-video h-screen sm:h-auto camera-container camera-video-container">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover camera-video-mobile"
              />
              
              {/* Camera Loading State */}
              {!isCameraReady && !cameraError && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="text-center text-white">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-3" />
                    <p className="text-lg font-medium">Starting camera...</p>
                    <p className="text-sm text-gray-300 mt-1">Please allow camera access</p>
                  </div>
                </div>
              )}

              {/* Camera Error State */}
              {cameraError && (
                <div className="absolute inset-0 bg-red-900/50 flex items-center justify-center">
                  <div className="text-center text-white max-w-md p-6">
                    <AlertCircle className="w-12 h-12 mx-auto mb-3" />
                    <p className="text-lg font-medium mb-2">Camera Error</p>
                    <p className="text-sm text-gray-200">{cameraError}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={startCamera}
                      className="mt-4 text-white border-white hover:bg-white/20"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                </div>
              )}

              {/* Camera Ready Indicator */}
              {isCameraReady && (
                <div className="absolute top-20 sm:top-4 right-4 z-20">
                  <Badge variant="default" className="bg-green-500 text-white shadow-lg">
                    <Video className="w-3 h-3 mr-1" />
                    Camera Active
                  </Badge>
                </div>
              )}

              {/* Capture Guide Overlay - Mobile Optimized */}
              {isCameraReady && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Frame guide */}
                  <div className="absolute inset-0 border-4 border-white/30 sm:rounded-lg m-8 sm:m-4" />
                  
                  {/* Mobile: Bottom instruction */}
                  <div className="absolute bottom-32 sm:bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white px-6 py-3 rounded-full text-sm shadow-lg">
                    📸 Position the issue within the frame
                  </div>
                </div>
              )}
            </div>

            {/* Hidden canvas for photo capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Action Buttons - Mobile: Fixed Bottom, Desktop: Normal */}
            <div className="fixed sm:relative bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-auto p-4 sm:p-0 bg-gradient-to-t from-black via-black/90 to-transparent sm:bg-none flex items-center justify-between gap-4 z-20 camera-footer">
              <Button
                variant="outline"
                onClick={closeCameraModal}
                className="flex-1 bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 sm:bg-transparent sm:text-foreground sm:border-input camera-button"
                size="lg"
              >
                <X className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
                Cancel
              </Button>

              <Button
                onClick={capturePhoto}
                disabled={!isCameraReady}
                className="flex-1 bg-royal hover:bg-royal/90 text-white shadow-lg disabled:opacity-50 camera-button camera-capture-button"
                size="lg"
              >
                <Camera className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
                Capture
              </Button>
            </div>

            {/* Camera Tips - Desktop Only */}
            <div className="hidden sm:block bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Tips for Best Results
              </h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Ensure good lighting for clearer images</li>
                <li>• Get close enough to show the issue details</li>
                <li>• Hold the camera steady when capturing</li>
                <li>• Include context around the issue (street, building, etc.)</li>
              </ul>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
