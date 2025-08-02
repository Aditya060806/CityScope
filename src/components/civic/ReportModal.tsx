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
import { Camera, MapPin, Send, X, Upload, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLocation } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { SmartSuggestionBanner } from './SmartSuggestionBanner';
import { useSmartCategorizer } from '@/hooks/useSmartCategorizer';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (issue: Omit<CivicIssue, 'id' | 'reportedAt' | 'updatedAt' | 'flagCount' | 'upvotes' | 'timeline'>) => Promise<void>;
}

export const ReportModal: React.FC<ReportModalProps> = ({
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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { userLocation } = useLocation();
  const { user } = useAuth();
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

  const handleCategorySelect = (category: IssueCategory) => {
    setFormData(prev => ({ ...prev, category }));
    resetSuggestion();
    setStep(2);
  };

  const handleAcceptSuggestion = () => {
    const acceptedSuggestion = acceptSuggestion();
    if (acceptedSuggestion) {
      setFormData(prev => ({ ...prev, category: acceptedSuggestion.category }));
      setStep(2);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Analyze the first image for category suggestion
    if (fileArray.length > 0 && step === 1) {
      analyzeImageForCategory(fileArray[0]);
    }

    // In a real app, you'd upload to cloud storage
    // For demo, we'll use placeholder URLs
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
        title: "Issue Reported Successfully!",
        description: "Your civic issue has been submitted for review.",
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        isAnonymous: false,
        images: []
      });
      setStep(1);
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
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="max-w-md mx-auto bg-background/95 backdrop-blur-sm max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-civic rounded-lg flex items-center justify-center">
              <Send className="w-4 h-4 text-white" />
            </div>
            Report Civic Issue
          </DialogTitle>
        </DialogHeader>

        <ProtectedRoute onAuthRequired={() => setShowAuthModal(true)}>
          <div className="space-y-6">
          {/* Progress Indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-2 flex-1 rounded-full transition-colors duration-300',
                  step >= i ? 'bg-primary' : 'bg-muted'
                )}
              />
            ))}
          </div>

          {/* Step 1: Category Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">What type of issue?</h3>
                <p className="text-sm text-muted-foreground">
                  Choose the category that best describes your civic issue
                </p>
              </div>

              {/* Smart Suggestion Banner */}
              {suggestion && (
                <div className="mb-4">
                  <SmartSuggestionBanner
                    suggestion={suggestion}
                    onAccept={handleAcceptSuggestion}
                    onReject={rejectSuggestion}
                    isVisible={suggestionVisible}
                  />
                </div>
              )}

              {/* AI Analysis Loading */}
              {isAnalyzing && (
                <Card className="bg-powder/20 border-powder/30 animate-pulse">
                  <div className="p-4 flex items-center gap-3">
                    <Loader2 className="w-4 h-4 text-royal animate-spin" />
                    <span className="text-sm text-royal">Analyzing image for category suggestions...</span>
                  </div>
                </Card>
              )}

              <div className="grid grid-cols-2 gap-3">
                {Object.entries(CATEGORY_CONFIG).map(([category, config]) => (
                  <Card
                    key={category}
                    className={cn(
                      'p-4 cursor-pointer transition-all duration-200 hover:shadow-civic hover:scale-105',
                      'border-border/50 hover:border-primary/50'
                    )}
                    onClick={() => handleCategorySelect(category as IssueCategory)}
                  >
                    <div className="flex flex-col items-center gap-2 text-center">
                      <div className="text-2xl">{config.icon}</div>
                      <div>
                        <p className="font-medium text-sm">{config.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {config.description}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Add photo upload in step 1 for AI analysis */}
              <div className="mt-4">
                <Label>Upload a photo for smart category detection (Optional)</Label>
                <Label
                  htmlFor="ai-photo-upload"
                  className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors mt-2"
                >
                  <Camera className="w-5 h-5" />
                  <span>Add Photo for AI Analysis</span>
                  <Input
                    id="ai-photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </Label>
              </div>
            </div>
          )}

          {/* Step 2: Issue Details */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="p-1"
                >
                  ←
                </Button>
                {formData.category && (
                  <Badge variant="outline" className="flex items-center gap-2">
                    <CategoryIcon category={formData.category} size="sm" />
                    {CATEGORY_CONFIG[formData.category]?.label}
                  </Badge>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Issue Title *</Label>
                  <Input
                    id="title"
                    placeholder="Brief description of the issue"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Provide detailed information about the issue"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1 min-h-[100px]"
                  />
                </div>

                <Button
                  onClick={() => setStep(3)}
                  disabled={!formData.title.trim() || !formData.description.trim()}
                  className="w-full"
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Photos & Submit */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStep(2)}
                  className="p-1"
                >
                  ←
                </Button>
                <h3 className="font-semibold">Add Photos & Submit</h3>
              </div>

              {/* Photo Upload */}
              <div>
                <Label>Photos (Optional, up to 5)</Label>
                <div className="mt-2 space-y-3">
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-3 gap-2">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Upload ${index + 1}`}
                            className="w-full h-20 object-cover rounded-lg"
                          />
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeImage(index)}
                            className="absolute -top-1 -right-1 w-6 h-6 p-0 rounded-full"
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
                      className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors"
                    >
                      <Camera className="w-5 h-5" />
                      <span>Add Photos</span>
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
                </div>
              </div>

              {/* Location Info */}
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="font-medium">Location:</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {userLocation?.address || 'Current location will be used'}
                </p>
              </div>

              {/* Anonymous Toggle */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <Label htmlFor="anonymous">Report Anonymously</Label>
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

              {/* Submit Button */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-gradient-civic hover:shadow-glow"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Submit Report
                  </>
                )}
              </Button>
            </div>
          )}
          </div>
        </ProtectedRoute>
      </DialogContent>
    </Dialog>
  );
};