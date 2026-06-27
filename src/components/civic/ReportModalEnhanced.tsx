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
import { useLocation } from '@/hooks/useLocation';
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
        reporterName: formData.isAnonymous ? 'Anonymous' : 'Current User',
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
      <DialogContent className="max-w-3xl mx-auto bg-white dark:bg-gray-950 border border-gray-200/50 dark:border-gray-800/50 max-h-[90vh] overflow-y-auto rounded-3xl shadow-sleek-xl dark:shadow-2xl">
        <DialogHeader className="p-10 pb-8">
          <DialogTitle className="flex items-center gap-6">
            <div className="w-16 h-16 bg-gradient-to-br from-royal to-royal/90 dark:from-royal/80 dark:to-royal-600 rounded-3xl flex items-center justify-center shadow-sleek-lg">
              <Send className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 dark:text-white">Report Civic Issue</h2>
              <p className="text-gray-600 dark:text-gray-400 font-semibold text-lg">Help improve your community. Step {step} of 5</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="px-10 pb-10 space-y-10">
          {/* Sleek Progress Bar */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              {steps.map((s, index) => (
                <div key={s.id} className="flex flex-col items-center gap-3">
                  <div className={cn(
                    'w-14 h-14 rounded-3xl flex items-center justify-center transition-all duration-500 shadow-sleek',
                    step >= s.id
                      ? 'bg-gradient-to-r from-royal to-royal/90 dark:from-royal/80 dark:to-royal-600 text-white shadow-sleek-lg'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                  )}>
                    <s.icon className="w-7 h-7" />
                  </div>
                  <div className="text-center">
                    <p className={cn(
                      'text-sm font-bold transition-colors duration-300',
                      step >= s.id ? 'text-royal dark:text-royal-400' : 'text-gray-400 dark:text-gray-500'
                    )}>
                      {s.title}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{s.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-3">
              {steps.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    'h-3 flex-1 rounded-full transition-all duration-500',
                    step >= s.id ? 'bg-gradient-to-r from-royal to-royal/90 dark:from-royal/80 dark:to-royal-600' : 'bg-gray-200 dark:bg-gray-800'
                  )}
                />
              ))}
            </div>
          </div>

          <div className="min-h-[500px]">
            {/* Step 1: Upload Photos */}
            {step === 1 && (
              <div className="space-y-8 animate-fade-in">
                <div className="text-center">
                  <h3 className="text-2xl font-black text-royal dark:text-royal-400 mb-3">📸 Add Visual Evidence</h3>
                  <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                    Photos help authorities understand the issue better (Optional)
                  </p>
                </div>

                <div className="space-y-6">
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-2 gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-32 object-cover rounded-2xl shadow-sleek"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeImage(index)}
                            className="absolute -top-3 -right-3 w-8 h-8 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sleek"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {formData.images.length < 5 && (
                    <Label
                      htmlFor="photo-upload"
                      className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-12 cursor-pointer hover:scale-[1.02] transition-all duration-300 block text-center rounded-3xl border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-royal/50 hover:from-royal/5 hover:to-royal/10 dark:hover:from-royal/20 dark:hover:to-royal/10"
                    >
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-royal/10 to-royal/20 dark:from-royal/20 dark:to-royal/30 rounded-2xl flex items-center justify-center mx-auto">
                          <Camera className="w-8 h-8 text-royal dark:text-royal-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-royal dark:text-royal-400 text-lg">Upload Photos</h4>
                          <p className="text-gray-600 dark:text-gray-400 font-medium">
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
                  <h3 className="text-lg font-semibold text-royal dark:text-royal-400 mb-2">✍️ Describe the Problem</h3>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">
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
                  <h3 className="text-lg font-semibold text-royal dark:text-royal-400 mb-2">🎯 Choose Category</h3>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">
                    Select the category that best describes your issue
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(CATEGORY_CONFIG).map(([category, config]) => (
                    <Card
                      key={category}
                      className={cn(
                        'p-2 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-civic group',
                        'glass-card border-powder/30 hover:border-royal/50 dark:border-slate-800 dark:bg-slate-900/50',
                        formData.category === category && 'border-royal dark:border-royal-500 bg-royal/5 dark:bg-royal/10 shadow-royal dark:shadow-none'
                      )}
                      onClick={() => handleCategorySelect(category as IssueCategory)}
                    >
                      <div className="flex flex-row items-center gap-4 text-left p-2">
                        <div className="text-4xl flex-shrink-0 bg-white/50 dark:bg-slate-800 p-3 rounded-2xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-lg text-royal dark:text-royal-400 leading-tight pr-2 truncate">
                            {config.label}
                          </p>
                          <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1 line-clamp-2 leading-snug pr-1">
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
                  <h3 className="text-lg font-semibold text-royal dark:text-royal-400 mb-2">📍 Confirm Location</h3>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">
                    We'll use your current location for the report
                  </p>
                </div>

                <Card className="glass-card border-powder/30 dark:border-slate-800 dark:bg-slate-900/50 p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-royal/10 dark:bg-royal/20 rounded-xl flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-royal dark:text-royal-400" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-royal dark:text-royal-400">Current Location</h4>
                      <p className="text-sm text-muted-foreground dark:text-gray-400">
                        {userLocation?.address || 'Detecting your location...'}
                      </p>
                      {userLocation && (
                        <p className="text-xs text-muted-foreground dark:text-gray-500 mt-1">
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
                  <h3 className="text-lg font-semibold text-royal dark:text-royal-400 mb-2">✅ Final Review</h3>
                  <p className="text-sm text-muted-foreground dark:text-gray-400">
                    Review your report before submitting
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Summary Card */}
                  <Card className="glass-card border-powder/30 dark:border-slate-800 dark:bg-slate-900/50 p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-royal dark:text-royal-400">Issue Summary</h4>
                        {formData.category && (
                          <Badge variant="outline" className="bg-royal/5 dark:bg-royal/10 border-royal/20 dark:border-royal/30 text-royal dark:text-royal-300">
                            {CATEGORY_CONFIG[formData.category]?.icon} {CATEGORY_CONFIG[formData.category]?.label}
                          </Badge>
                        )}
                      </div>

                      <div>
                        <p className="font-medium text-royal dark:text-royal-300">{formData.title}</p>
                        <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1 line-clamp-2">
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
                  <Card className="glass-card border-powder/30 dark:border-slate-800 dark:bg-slate-900/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label htmlFor="anonymous" className="font-medium text-royal dark:text-royal-400">Report Anonymously</Label>
                        <p className="text-xs text-muted-foreground dark:text-gray-400">
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
          <div className="flex items-center justify-between pt-8 border-t border-gray-100/50 dark:border-gray-800/50">
            <Button
              variant="outline"
              onClick={handlePrev}
              disabled={step === 1}
              className="border-2 border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 hover:border-royal/30 dark:hover:border-royal/50 px-8 py-4 rounded-2xl font-bold transition-all duration-300 hover:scale-105"
            >
              <ArrowLeft className="w-5 h-5 mr-3" />
              Previous
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-semibold">
                Step {step} of {steps.length}
              </p>
            </div>

            {step < 5 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-royal to-royal/90 hover:from-royal/90 hover:to-royal/80 text-white px-8 py-4 rounded-2xl font-bold shadow-sleek hover:shadow-sleek-lg transition-all duration-300 hover:scale-105"
              >
                Next
                <ArrowRight className="w-5 h-5 ml-3" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !canProceed()}
                className="bg-gradient-to-r from-royal to-royal/90 hover:from-royal/90 hover:to-royal/80 text-white px-10 py-4 rounded-2xl font-bold shadow-sleek hover:shadow-sleek-lg transition-all duration-300 hover:scale-105 min-w-[160px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 mr-3" />
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