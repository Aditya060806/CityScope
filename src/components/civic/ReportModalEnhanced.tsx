import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IssueCategory, CATEGORY_CONFIG, CivicIssue } from '@/types/civic';
import { CategoryIcon } from './CategoryIcon';
import { SmartSuggestionBanner } from './SmartSuggestionBanner';
import { useSmartCategorizer } from '@/hooks/useSmartCategorizer';
import { 
  Camera, 
  MapPin, 
  Send, 
  X, 
  Upload, 
  Loader2, 
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from '@/contexts/LocationContext';
import { useToast } from '@/hooks/use-toast';

interface ReportModalEnhancedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (issue: Omit<CivicIssue, 'id' | 'reportedAt' | 'updatedAt' | 'flagCount' | 'upvotes' | 'timeline'>) => Promise<void>;
}

export const ReportModalEnhanced: React.FC<ReportModalEnhancedProps> = ({
  open,
  onOpenChange,
  onSubmit
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as IssueCategory | '',
    isAnonymous: false,
    images: [] as string[]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { userLocation } = useLocation();
  const { toast } = useToast();
  
  const {
    suggestion,
    isAnalyzing,
    isVisible: suggestionVisible,
    analyzeImageForCategory,
    acceptSuggestion,
    rejectSuggestion,
    resetSuggestion
  } = useSmartCategorizer();

  const steps = [
    { id: 1, title: 'Upload Photos', subtitle: 'Add visual evidence', icon: Camera },
    { id: 2, title: 'Describe Issue', subtitle: 'Tell us what happened', icon: Sparkles },
    { id: 3, title: 'Choose Category', subtitle: 'AI-powered suggestions', icon: Target },
    { id: 4, title: 'Confirm Location', subtitle: 'Pin exact spot', icon: MapPin },
    { id: 5, title: 'Final Review', subtitle: 'Submit your report', icon: CheckCircle }
  ];

  const handleNext = () => {
    if (step < 5) setStep(step + 1);
  };

  const handlePrev = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Analyze the first image for category suggestion
    if (fileArray.length > 0 && formData.images.length === 0) {
      analyzeImageForCategory(fileArray[0]);
    }

    // In a real app, you'd upload to cloud storage
    const newImages = fileArray.slice(0, 5 - formData.images.length).map(
      (_, index) => `/placeholder.svg?${Date.now()}-${index}`
    );
    
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleCategorySelect = (category: IssueCategory) => {
    setFormData(prev => ({ ...prev, category }));
    resetSuggestion();
    handleNext();
  };

  const handleAcceptSuggestion = () => {
    const acceptedSuggestion = acceptSuggestion();
    if (acceptedSuggestion) {
      setFormData(prev => ({ ...prev, category: acceptedSuggestion.category }));
      handleNext();
    }
  };

  const handleSubmit = async () => {
    if (!userLocation) {
      toast({
        title: "Location Required",
        description: "Please enable location access to report an issue.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        status: 'reported',
        location: {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          address: userLocation.address || 'Unknown location'
        },
        images: formData.images,
        reportedBy: formData.isAnonymous ? 'anonymous' : 'Current User',
        isAnonymous: formData.isAnonymous
      });

      toast({
        title: "✅ Report submitted! Your voice is powering change.",
        description: "Your civic issue has been submitted for review.",
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to Report Issue",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: '',
      isAnonymous: false,
      images: []
    });
    setStep(1);
    resetSuggestion();
  };

  const isStepComplete = (stepNum: number) => {
    switch (stepNum) {
      case 1: return true; // Photos are optional
      case 2: return formData.title.trim() && formData.description.trim();
      case 3: return !!formData.category;
      case 4: return !!userLocation;
      case 5: return true;
      default: return false;
    }
  };

  const canProceed = () => {
    return isStepComplete(step);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="max-w-lg mx-auto glass-card border-powder/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-civic rounded-xl flex items-center justify-center">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-royal">Report Civic Issue</h2>
              <p className="text-sm text-muted-foreground">Enhance your city. Step {step} of 5</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Enhanced Progress Bar */}
          <div className="space-y-3">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              {steps.map((s, index) => (
                <div key={s.id} className="flex flex-col items-center gap-1">
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500',
                    step >= s.id 
                      ? 'bg-royal text-white shadow-royal' 
                      : 'bg-bone border-2 border-powder/50 text-muted-foreground'
                  )}>
                    <s.icon className="w-4 h-4" />
                  </div>
                  <span className={cn(
                    'text-center transition-colors duration-300',
                    step >= s.id ? 'text-royal font-medium' : 'text-muted-foreground'
                  )}>
                    {s.title}
                  </span>
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-1">
              {steps.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    'h-1 flex-1 rounded-full transition-all duration-500',
                    step >= s.id ? 'bg-royal shadow-glow' : 'bg-powder'
                  )}
                />
              ))}
            </div>
          </div>

          <div className="min-h-[400px]">
            {/* Step 1: Upload Photos */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-royal mb-2">📸 Add Visual Evidence</h3>
                  <p className="text-sm text-muted-foreground">
                    Photos help authorities understand the issue better (Optional)
                  </p>
                </div>

                <div className="space-y-4">
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-3">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-24 object-cover rounded-xl shadow-civic"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {formData.images.length < 5 && (
                    <Label
                      htmlFor="photo-upload"
                      className="glass-float p-8 cursor-pointer hover:scale-[1.02] transition-all duration-300 block text-center rounded-2xl border-2 border-dashed border-powder/50 hover:border-royal/50"
                    >
                      <div className="space-y-3">
                        <div className="w-12 h-12 bg-royal/10 rounded-xl flex items-center justify-center mx-auto">
                          <Camera className="w-6 h-6 text-royal" />
                        </div>
                        <div>
                          <h4 className="font-medium text-royal">Upload Photos</h4>
                          <p className="text-sm text-muted-foreground">
                            Up to {5 - formData.images.length} more photos
                          </p>
                        </div>
                      </div>
                      <Input
                        id="photo-upload"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </Label>
                  )}

                  {/* AI Analysis Loading */}
                  {isAnalyzing && (
                    <Card className="bg-powder/20 border-powder/30 animate-pulse">
                      <div className="p-4 flex items-center gap-3">
                        <Loader2 className="w-5 h-5 text-royal animate-spin" />
                        <div>
                          <p className="font-medium text-royal">🧠 AI Analysis in Progress</p>
                          <p className="text-sm text-muted-foreground">Analyzing image for smart category suggestions...</p>
                        </div>
                      </div>
                    </Card>
                  )}

                  {/* Smart Suggestion Banner */}
                  {suggestion && suggestionVisible && (
                    <SmartSuggestionBanner
                      suggestion={suggestion}
                      onAccept={handleAcceptSuggestion}
                      onReject={rejectSuggestion}
                      isVisible={suggestionVisible}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Describe Issue */}
            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-royal mb-2">✍️ Describe the Problem</h3>
                  <p className="text-sm text-muted-foreground">
                    Help us understand what needs to be fixed
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-royal font-medium">Issue Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Large pothole on Main Street"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-2 input-civic"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-royal font-medium">Detailed Description *</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the issue in detail. Include when you first noticed it, how it affects the community, and any safety concerns..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-2 textarea-civic"
                      rows={5}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Choose Category */}
            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-royal mb-2">🎯 Choose Category</h3>
                  <p className="text-sm text-muted-foreground">
                    Select the category that best describes your issue
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(CATEGORY_CONFIG).map(([category, config]) => (
                    <Card
                      key={category}
                      className={cn(
                        'p-4 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-civic',
                        'glass-card border-powder/30 hover:border-royal/50',
                        formData.category === category && 'border-royal bg-royal/5 shadow-royal'
                      )}
                      onClick={() => handleCategorySelect(category as IssueCategory)}
                    >
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="text-3xl">{config.icon}</div>
                        <div>
                          <p className="font-semibold text-royal">{config.label}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {config.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Step 4: Confirm Location */}
            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-royal mb-2">📍 Confirm Location</h3>
                  <p className="text-sm text-muted-foreground">
                    We'll use your current location for the report
                  </p>
                </div>

                <Card className="glass-card border-powder/30 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-royal/10 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-royal" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-royal">Current Location</h4>
                      <p className="text-sm text-muted-foreground">
                        {userLocation?.address || 'Detecting your location...'}
                      </p>
                      {userLocation && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {userLocation.latitude.toFixed(6)}, {userLocation.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Step 5: Final Review */}
            {step === 5 && (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-royal mb-2">✅ Final Review</h3>
                  <p className="text-sm text-muted-foreground">
                    Review your report before submitting
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Summary Card */}
                  <Card className="glass-card border-powder/30 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-royal">Issue Summary</h4>
                        {formData.category && (
                          <Badge variant="outline" className="bg-royal/5 border-royal/20">
                            {CATEGORY_CONFIG[formData.category]?.icon} {CATEGORY_CONFIG[formData.category]?.label}
                          </Badge>
                        )}
                      </div>
                      
                      <div>
                        <p className="font-medium text-royal">{formData.title}</p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {formData.description}
                        </p>
                      </div>

                      {formData.images.length > 0 && (
                        <div className="flex gap-2">
                          {formData.images.slice(0, 3).map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Photo ${index + 1}`}
                              className="w-12 h-12 object-cover rounded-lg"
                            />
                          ))}
                          {formData.images.length > 3 && (
                            <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center text-xs">
                              +{formData.images.length - 3}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Anonymous Toggle */}
                  <Card className="glass-card border-powder/30 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="anonymous" className="font-medium text-royal">Report Anonymously</Label>
                        <p className="text-xs text-muted-foreground">
                          Your identity will not be shared publicly
                        </p>
                      </div>
                      <Switch
                        id="anonymous"
                        checked={formData.isAnonymous}
                        onCheckedChange={(checked) => 
                          setFormData(prev => ({ ...prev, isAnonymous: checked }))
                        }
                      />
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-powder/30">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={step === 1}
              className="glass-card border-powder/30"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                Step {step} of {steps.length}
              </p>
            </div>

            {step < 5 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="btn-civic"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !canProceed()}
                className="btn-civic min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};