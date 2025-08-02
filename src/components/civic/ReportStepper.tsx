import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SmartSuggestionChip } from './SmartSuggestionChip';
import { IssueCategory, CATEGORY_CONFIG, SmartSuggestion } from '@/types/civic';
import { cn } from '@/lib/utils';
import { 
  Camera, 
  FileText, 
  Tag, 
  MapPin, 
  Send, 
  ArrowLeft, 
  ArrowRight,
  Upload,
  CheckCircle,
  X,
  ImagePlus
} from 'lucide-react';

interface ReportStepperProps {
  onSubmit: (data: any) => void;
  onCancel: () => void;
  smartSuggestion?: SmartSuggestion;
}

type StepType = 'details' | 'category' | 'location' | 'upload' | 'submit';

interface StepConfig {
  id: StepType;
  title: string;
  icon: any;
  description: string;
}

const STEPS: StepConfig[] = [
  {
    id: 'details',
    title: 'Add Details',
    icon: FileText,
    description: 'Describe what you observed'
  },
  {
    id: 'category',
    title: 'Category',
    icon: Tag,
    description: 'Classify the type of issue'
  },
  {
    id: 'location',
    title: 'Location',
    icon: MapPin,
    description: 'Confirm the exact location'
  },
  {
    id: 'upload',
    title: 'Upload Photos',
    icon: Camera,
    description: '(Optional) Add photos to help authorities understand the issue'
  },
  {
    id: 'submit',
    title: 'Review & Submit',
    icon: Send,
    description: 'Review and submit your report'
  }
];

export const ReportStepper: React.FC<ReportStepperProps> = ({
  onSubmit,
  onCancel,
  smartSuggestion
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    images: [] as string[],
    title: '',
    description: '',
    category: '' as IssueCategory,
    location: null as any,
    isAnonymous: false
  });

  const currentStepConfig = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const canProceed = () => {
    switch (currentStepConfig.id) {
      case 'details':
        return formData.title.trim() && formData.description.trim();
      case 'category':
        return formData.category;
      case 'location':
        return formData.location;
      case 'upload':
        return true; // Optional step - always allow proceeding
      case 'submit':
        return true;
      default:
        return false;
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, reader.result as string].slice(0, 5) // Limit to 5 images
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, index) => index !== indexToRemove)
    }));
  };

  const renderStepContent = () => {
    switch (currentStepConfig.id) {
      case 'upload':
        return (
          <div className="space-y-6">
            <div className="text-center space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center justify-center gap-2 text-blue-700 mb-2">
                  <ImagePlus className="w-5 h-5" />
                  <span className="font-medium">Optional Step</span>
                </div>
                <p className="text-sm text-blue-600">
                  Add photos to help authorities better understand the issue. You can skip this step if you prefer.
                </p>
              </div>

              <div className="border-2 border-dashed border-powder rounded-2xl p-8 hover:border-royal transition-colors duration-300 bg-gradient-to-br from-bone/20 to-powder/10">
                <Camera className="w-12 h-12 text-royal mx-auto mb-4" />
                <h3 className="font-semibold text-royal mb-2">Upload Photos</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add up to 5 photos of the issue
                </p>
                <label htmlFor="image-upload">
                  <Button variant="outline" className="cursor-pointer">
                    <Upload className="w-4 h-4 mr-2" />
                    Choose Photos
                  </Button>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            </div>

            {formData.images.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-royal">Uploaded Photos ({formData.images.length}/5):</h4>
                  <Badge variant="outline" className="bg-green-50 text-green-700">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    {formData.images.length} added
                  </Badge>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative rounded-xl overflow-hidden group">
                      <img
                        src={image}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-24 object-cover"
                      />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formData.images.length === 0 && (
              <div className="text-center p-4 bg-powder/10 rounded-xl">
                <p className="text-sm text-muted-foreground">
                  No photos added yet. You can proceed without photos or add some to help provide context.
                </p>
              </div>
            )}
          </div>
        );

      case 'details':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-royal mb-2">
                  Issue Title *
                </label>
                <Input
                  placeholder="Brief description of the issue"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="input-civic"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-royal mb-2">
                  Detailed Description *
                </label>
                <Textarea
                  placeholder="Provide more details about what you observed..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="textarea-civic"
                />
              </div>
            </div>
          </div>
        );

      case 'category':
        return (
          <div className="space-y-6">
            {smartSuggestion && !formData.category && (
              <SmartSuggestionChip
                suggestion={smartSuggestion}
                onAccept={(category) => setFormData(prev => ({ ...prev, category }))}
                onReject={() => {}}
              />
            )}

            <div className="space-y-3">
              <h4 className="font-medium text-royal">Select Category:</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(CATEGORY_CONFIG).map(([category, config]) => (
                  <Button
                    key={category}
                    variant={formData.category === category ? "default" : "outline"}
                    onClick={() => setFormData(prev => ({ ...prev, category: category as IssueCategory }))}
                    className={cn(
                      "h-auto p-4 flex flex-col items-center gap-2 text-center",
                      formData.category === category && "ring-2 ring-royal/30"
                    )}
                  >
                    <span className="text-xl">{config.icon}</span>
                    <span className="text-sm font-medium">{config.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'location':
        return (
          <div className="space-y-6">
            <div className="text-center p-8">
              <MapPin className="w-12 h-12 text-royal mx-auto mb-4" />
              <h3 className="font-semibold text-royal mb-2">Confirm Location</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We'll use your current location for this report
              </p>
              <Button
                onClick={() => setFormData(prev => ({ ...prev, location: { lat: 0, lng: 0 } }))}
                className="bg-royal hover:bg-royal/90"
              >
                <MapPin className="w-4 h-4 mr-2" />
                Use Current Location
              </Button>
            </div>
          </div>
        );

      case 'submit':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-royal mb-2">Ready to Submit</h3>
              <p className="text-muted-foreground">
                Review your report and submit to help improve your community
              </p>
            </div>

            <Card className="glass-card border-royal/20">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{CATEGORY_CONFIG[formData.category]?.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-bold text-royal text-lg">{formData.title}</h4>
                    <Badge variant="outline" className="bg-royal/10 text-royal mt-1">
                      {CATEGORY_CONFIG[formData.category]?.label}
                    </Badge>
                  </div>
                </div>
                
                <div className="bg-bone/30 rounded-xl p-4">
                  <p className="text-sm text-royal leading-relaxed">{formData.description}</p>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  {formData.images.length > 0 ? (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {formData.images.length} photo{formData.images.length !== 1 ? 's' : ''} attached
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <ImagePlus className="w-3 h-3 mr-1" />
                      No photos (submitted as text report)
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-royal/10 text-royal">
                    <MapPin className="w-3 h-3 mr-1" />
                    Current location
                  </Badge>
                </div>

                {formData.images.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium text-royal">Attached Photos:</h5>
                    <div className="grid grid-cols-4 gap-2">
                      {formData.images.map((image, index) => (
                        <div key={index} className="relative rounded-lg overflow-hidden">
                          <img
                            src={image}
                            alt={`Attachment ${index + 1}`}
                            className="w-full h-16 object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-royal">
            Step {currentStep + 1} of {STEPS.length}: {currentStepConfig.title}
          </h2>
          <Badge variant="outline" className="bg-royal/10 text-royal border-royal/20">
            {Math.round(progress)}%
          </Badge>
        </div>
        
        <Progress value={progress} className="h-2" />
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <currentStepConfig.icon className="w-4 h-4" />
          {currentStepConfig.description}
        </div>
      </div>

      {/* Step Content */}
      <Card className="glass-card">
        <CardContent className="p-6">
          <div className="animate-fade-in">
            {renderStepContent()}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={currentStep === 0 ? onCancel : handlePrevious}
          className="border-powder hover:bg-powder/20"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {currentStep === 0 ? 'Cancel' : 'Previous'}
        </Button>

        <Button
          onClick={currentStep === STEPS.length - 1 ? handleSubmit : handleNext}
          disabled={!canProceed()}
          className="bg-royal hover:bg-royal/90"
        >
          {currentStep === STEPS.length - 1 ? (
            <>
              <Send className="w-4 h-4 mr-2" />
              Submit Report
            </>
          ) : (
            <>
              Next
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
};