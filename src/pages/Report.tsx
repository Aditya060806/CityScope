import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useLocation } from '@/hooks/useLocation';
import { useAuth } from '@/hooks/useAuth';
import { useCivicIssues } from '@/hooks/useCivicIssues';
import { IssueCategory, CATEGORY_CONFIG, STATUS_CONFIG } from '@/types/civic';
import {
  ArrowLeft,
  MapPin,
  Send,
  CheckCircle,
  Loader2,
  Upload,
  X,
  Target,
  Sparkles,
  Camera,
  Brain,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { AIPhotoAnalyzer } from '@/components/civic/AIPhotoAnalyzer';
import { AISmartSuggestions } from '@/components/civic/AISmartSuggestions';
import { LocationPrompt } from '@/components/civic/LocationPrompt';
import { aiEnhancedIssueService } from '@/services/AIEnhancedIssueService';
import { SubmissionConfirmationCard } from '@/components/civic/SubmissionConfirmationCard';
import { emailService } from '@/services/EmailService';
import issueService from '@/services/IssueService';
import { Issue } from '@/types/civic';

import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { EmptyState } from '@/components/ui/empty-state';

export const Report: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userLocation, isLocationEnabled, isLoading: locationLoading, error: locationError, requestLocation } = useLocation();
  const { reportIssue } = useCivicIssues();



  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as IssueCategory,
    isAnonymous: false,
    images: [] as string[]
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [blobUrls, setBlobUrls] = useState<string[]>([]);
  const [aiAnalysis, setAiAnalysis] = useState<{
    category?: string;
    description?: string;
    confidence?: number;
    suggestions?: string[];
    suggestedTitle?: string;
  } | null>(null);
  const [enableAI, setEnableAI] = useState(true);
  const [reportMode, setReportMode] = useState<'manual' | 'photo'>('manual');
  const [initialStep, setInitialStep] = useState(1);
  const [useManualLocation, setUseManualLocation] = useState(false);
  const [manualLocation, setManualLocation] = useState({
    latitude: 0,
    longitude: 0,
    address: ''
  });
  const [submittedIssue, setSubmittedIssue] = useState<Issue | null>(null);

  // Location detection logic
  useEffect(() => {
    console.log('🔍 Location status:', {
      isLocationEnabled,
      userLocation: !!userLocation,
      locationLoading,
      locationError
    });

    if (!isLocationEnabled) {
      console.log('📍 Requesting location...');
      requestLocation();
    }
  }, [isLocationEnabled, requestLocation]);

  // Handle mode change and reset step
  const goToStep = (nextStep: number) => {
    setStep(nextStep);
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  };

  const handleModeChange = (mode: 'manual' | 'photo') => {
    setReportMode(mode);
    if (mode === 'photo') {
      goToStep(1); // Photo Analysis starts with photo upload
      setInitialStep(1);
    } else {
      goToStep(1); // Manual Report starts with category selection
      setInitialStep(1);
    }
  };


  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      blobUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [blobUrls]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + selectedImages.length > 5) {
      toast({
        title: "Too many images",
        description: "You can upload maximum 5 images per report.",
        variant: "destructive"
      });
      return;
    }

    // Create blob URLs for the new files
    const newBlobUrls = files.map(file => URL.createObjectURL(file));
    setBlobUrls(prev => [...prev, ...newBlobUrls]);
    setSelectedImages(prev => [...prev, ...files]);
  };

  const removeImage = (index: number) => {
    // Clean up the blob URL for the removed image
    if (blobUrls[index]) {
      URL.revokeObjectURL(blobUrls[index]);
    }
    setBlobUrls(prev => prev.filter((_, i) => i !== index));
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.category) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    // Check if we have either GPS location or manual location
    const currentLocation = userLocation || (useManualLocation && manualLocation.latitude !== 0 ? manualLocation : null);

    if (!currentLocation) {
      console.error('❌ Location not available:', {
        userLocation,
        isLocationEnabled,
        locationLoading,
        locationError,
        useManualLocation,
        manualLocation
      });
      toast({
        title: "Location required",
        description: "Please enable location access or provide a manual location to report an issue.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert images to base64 for local storage
      const imageUrls: string[] = [];

      if (selectedImages.length > 0) {
        for (const file of selectedImages) {
          try {
            const base64 = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
            imageUrls.push(base64);
          } catch (error) {
            console.error('Failed to convert image:', error);
          }
        }
        console.log('📸 Converted images to base64:', imageUrls.length);
      }

      let createdIssue: Issue;

      // Use AI-enhanced service only for photo mode with AI enabled
      if (reportMode === 'photo' && enableAI) {
        createdIssue = await aiEnhancedIssueService.createIssueWithAI({
          ...formData,
          images: imageUrls,
          location: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            address: currentLocation.address || 'Unknown location'
          },
          reporterId: user?.id || 'anonymous-user',
          reporterName: formData.isAnonymous ? 'Anonymous' : (user?.name || user?.email?.split('@')[0] || 'User'),
          enableAIAnalysis: true
        });
      } else {
        // Manual mode or photo mode without AI - use regular service
        createdIssue = await reportIssue({
          ...formData,
          images: imageUrls,
          location: {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
            address: currentLocation.address || 'Unknown location'
          },
          reporterName: formData.isAnonymous ? 'Anonymous' : (user?.name || user?.email?.split('@')[0] || 'User'),
          reporterId: user?.id || 'anonymous-user'
        });
      }

      // Store the created issue to show confirmation
      setSubmittedIssue(createdIssue);

      let reportToken: string | null = null;
      if (user?.email) {
        reportToken = await issueService.createReportLookupToken(createdIssue.id, user.email);
      }

      // Send confirmation email (don't block on failure)
      if (user?.email) {
        emailService.sendReportConfirmation({
          reportId: createdIssue.id,
          reportToken: reportToken || undefined,
          reportTitle: createdIssue.title,
          reportDescription: createdIssue.description,
          reportCategory: CATEGORY_CONFIG[createdIssue.category].label,
          reportLocation: (typeof createdIssue.location === 'object' && 'address' in createdIssue.location
            ? createdIssue.location.address
            : 'Unknown location') || 'Unknown location',
          reporterName: createdIssue.reporterName,
          reporterEmail: user.email,
          submittedDate: createdIssue.createdAt.toLocaleString(),
          reportStatus: STATUS_CONFIG[createdIssue.status].label,
        }).catch(error => {
          console.error('❌ Failed to send email (non-blocking):', error);
          // Log diagnostics for debugging
          const diagnostics = emailService.getDiagnostics();
          console.error('📊 Email Service Diagnostics:', diagnostics);
          console.error('💡 To debug: Check browser console and verify environment variables in deployment platform');
        });
      } else {
        console.warn('⚠️ Cannot send email: User email not available');
      }

      const successMessage = reportMode === 'photo' && enableAI
        ? "AI photo analysis completed. Thank you for helping improve our community."
        : "Thank you for helping improve our community.";

      toast({
        title: "Issue reported successfully!",
        description: successMessage,
      });
    } catch (error) {
      toast({
        title: "Failed to report issue",
        description: "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handlePhotoAnalysis = (analysis: {
    category?: string;
    description?: string;
    confidence?: number;
    suggestions?: string[];
    suggestedTitle?: string;
  }) => {
    setAiAnalysis(analysis);
    setFormData(prev => ({
      ...prev,
      category: (analysis.category || prev.category) as IssueCategory,
      title: analysis.suggestedTitle || analysis.description?.slice(0, 60) || '',
      description: analysis.description || ''
    }));
  };

  const handleSmartSuggestion = (suggestion: { type: string; value: string }) => {
    if (suggestion.type === 'title') {
      setFormData(prev => ({ ...prev, title: suggestion.value }));
    } else if (suggestion.type === 'description') {
      setFormData(prev => ({ ...prev, description: suggestion.value }));
    } else if (suggestion.type === 'category') {
      setFormData(prev => ({ ...prev, category: suggestion.value as IssueCategory }));
    }
  };

  const categories = Object.entries(CATEGORY_CONFIG);
  const steps = reportMode === 'manual'
    ? [
      { id: 1, label: 'Category', hint: 'Choose issue type' },
      { id: 2, label: 'Details', hint: 'Describe the problem' },
      { id: 3, label: 'Review', hint: 'Confirm and submit' },
    ]
    : [
      { id: 1, label: 'Photo Analysis', hint: 'Upload and inspect' },
      { id: 2, label: 'Details', hint: 'Add precise context' },
      { id: 3, label: 'Review', hint: 'Confirm and submit' },
    ];
  const stepProgress = ((step - 1) / (steps.length - 1)) * 100;
  const currentLocationLabel = userLocation?.address || manualLocation.address;

  // Show submission confirmation if issue was submitted
  if (submittedIssue) {
    return (
      <>

        <SubmissionConfirmationCard
          issue={submittedIssue}
          reporterEmail={user?.email}
          onGoHome={() => {
            setSubmittedIssue(null);
            navigate('/');
          }}
          onViewDetails={() => {
            setSubmittedIssue(null);
            navigate(`/`);
          }}
        />
      </>
    );
  }

  // Show location prompt if location is not available
  if (locationLoading && !userLocation) {
    return <LocationPrompt />;
  }

  if (locationError && !userLocation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <EmptyState
          icon={<AlertCircle className="w-12 h-12 text-slate-400" />}
          title="Location Access Required"
          description={locationError}
          className="w-full max-w-md bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100"
          action={
            <Button onClick={() => requestLocation()} className="w-full bg-royal hover:bg-royal/90 text-white shadow-royal font-semibold rounded-xl h-12">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="relative mx-auto flex h-full min-h-screen w-full max-w-[1600px] flex-col overflow-x-hidden bg-gradient-to-b from-bone via-slate-50 to-bone px-4 pb-24 pt-4 md:px-8 md:pb-6 md:pt-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-powder-100/50 via-powder-50/20 to-transparent" />

      <div className="relative container mx-auto max-w-5xl px-0 sm:px-2 lg:px-4">
        <div className="mb-6 space-y-4">
          <PageHeader
            icon={<Target className="h-5 w-5" />}
            title="Report Civic Issue"
            description="Share civic issues with structured details so city teams can act faster."
            className="border-slate-200/80 bg-white/90 shadow-sleek"
            actions={
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/')}
                className="border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-royal"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            }
          />

          <div className="flex flex-wrap items-center justify-start gap-2">
            <Badge variant="outline" className="border-powder-200 bg-powder-50 text-powder-700 px-3 py-1 font-semibold">
              <Target className="w-3.5 h-3.5 mr-1" />
              Citizen Reporting
            </Badge>
            {reportMode === 'photo' && enableAI && (
              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 px-3 py-1 font-semibold shadow-sm">
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                AI Assistance Enabled
              </Badge>
            )}
          </div>
        </div>

        <div className="mb-8 rounded-[1.75rem] border border-slate-200/70 bg-white/90 p-4 shadow-sleek sm:p-6">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleModeChange('manual')}
              className={cn(
                'group relative overflow-hidden rounded-2xl border px-4 py-4 text-left transition-all duration-300',
                reportMode === 'manual'
                  ? 'border-royal bg-gradient-to-br from-royal to-royal/90 text-white shadow-royal'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-powder-300 hover:bg-powder-50/40'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={cn('text-xs font-semibold uppercase tracking-[0.2em]', reportMode === 'manual' ? 'text-white/80' : 'text-slate-500')}>
                    Standard
                  </p>
                  <h3 className="mt-1 text-base font-bold sm:text-lg">Manual Report</h3>
                  <p className={cn('mt-1 text-sm', reportMode === 'manual' ? 'text-white/80' : 'text-slate-500')}>
                    Select a category and provide details directly.
                  </p>
                </div>
                <Target className={cn('h-5 w-5 shrink-0', reportMode === 'manual' ? 'text-white' : 'text-powder-600')} />
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('photo')}
              className={cn(
                'group relative overflow-hidden rounded-2xl border px-4 py-4 text-left transition-all duration-300',
                reportMode === 'photo'
                  ? 'border-royal bg-gradient-to-br from-royal to-royal/90 text-white shadow-royal'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-powder-300 hover:bg-powder-50/40'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={cn('text-xs font-semibold uppercase tracking-[0.2em]', reportMode === 'photo' ? 'text-white/80' : 'text-slate-500')}>
                    Assisted
                  </p>
                  <h3 className="mt-1 flex items-center gap-2 text-base font-bold sm:text-lg">
                    Photo Analysis
                    <Badge variant="outline" className={cn('h-6 border px-2 text-[11px]', reportMode === 'photo' ? 'border-white/30 bg-white/10 text-white' : 'border-powder-200 bg-powder-50 text-powder-700')}>
                      <Sparkles className="mr-1 h-3 w-3" />
                      AI
                    </Badge>
                  </h3>
                  <p className={cn('mt-1 text-sm', reportMode === 'photo' ? 'text-white/80' : 'text-slate-500')}>
                    Upload photos and let AI prefill issue details.
                  </p>
                </div>
                <Camera className={cn('h-5 w-5 shrink-0', reportMode === 'photo' ? 'text-white' : 'text-powder-600')} />
              </div>
            </button>
          </div>

          {reportMode === 'photo' && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3">
              <Label className="text-sm font-semibold text-royal">AI Photo Analysis</Label>
              <div className="inline-flex items-center rounded-full border border-slate-200 bg-white p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => setEnableAI(true)}
                  className={cn(
                    'inline-flex h-9 items-center rounded-full px-4 text-sm font-bold tracking-wide transition-all',
                    enableAI
                      ? 'bg-gradient-to-r from-royal to-powder-700 text-white shadow-royal'
                      : 'text-slate-500 hover:bg-slate-100'
                  )}
                >
                  <Brain className="mr-2 h-4 w-4" />
                  ON
                </button>
                <button
                  type="button"
                  onClick={() => setEnableAI(false)}
                  className={cn(
                    'inline-flex h-9 items-center rounded-full px-4 text-sm font-bold tracking-wide transition-all',
                    !enableAI
                      ? 'bg-slate-800 text-white shadow-sm'
                      : 'text-slate-500 hover:bg-slate-100'
                  )}
                >
                  OFF
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-gradient-to-r from-royal to-powder-600 transition-all duration-500"
                style={{ width: `${stepProgress}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {steps.map((item) => {
                const isCompleted = step > item.id;
                const isActive = step === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => item.id <= step && goToStep(item.id)}
                    disabled={item.id > step}
                    className={cn('text-center transition-all', item.id <= step ? 'cursor-pointer' : 'cursor-not-allowed')}
                  >
                    <div
                      className={cn(
                        'mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full border text-sm font-bold transition-all duration-300',
                        isCompleted && 'border-emerald-600 bg-emerald-600 text-white shadow-sm',
                        isActive && 'border-royal bg-royal text-white shadow-royal',
                        !isCompleted && !isActive && 'border-slate-300 bg-white text-slate-500'
                      )}
                    >
                      {isCompleted ? <CheckCircle className="h-4 w-4" /> : item.id}
                    </div>
                    <p className={cn('text-xs font-semibold sm:text-sm', isActive ? 'text-royal' : 'text-slate-600')}>
                      {item.label}
                    </p>
                    <p className="hidden text-[11px] text-slate-500 sm:block">{item.hint}</p>
                  </button>
                );
              })}
            </div>
            <div className="mt-4 text-center text-sm font-semibold text-slate-600">
              Step {step} of 3: {steps[step - 1]?.label}
            </div>
          </div>
        </div>

        <SectionCard className="rounded-[2rem] border border-slate-200/70 bg-white shadow-sleek-lg" contentClassName="p-5 sm:p-8">
            {/* Step 1: Category Selection (Manual Mode) or Photo Analysis (Photo Mode) */}
            {step === 1 && (
              <div className="space-y-6 animate-fade-in-up motion-reduce:animate-none">
                {reportMode === 'manual' ? (
                  // Manual Mode: Category Selection
                  <>
                    <div className="mb-8 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-powder-700">Step 1</p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight text-royal sm:text-3xl">Select Issue Category</h2>
                      <p className="mt-2 text-sm font-medium text-slate-600">Choose the category that best describes your issue.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
                      {categories.map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => setFormData(prev => ({ ...prev, category: key as IssueCategory }))}
                          className={cn(
                            'group min-h-[132px] rounded-[1.25rem] border p-5 text-left transition-all duration-300 hover:-translate-y-0.5 sm:p-6',
                            formData.category === key
                              ? 'border-royal bg-gradient-to-br from-royal/10 to-powder-50 shadow-sleek'
                              : 'border-slate-200 bg-white hover:border-powder-300 hover:bg-powder-50/30 hover:shadow-soft'
                          )}
                        >
                          <div className="flex h-full flex-row items-center gap-4 text-left">
                            <div className={cn(
                              'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-sm transition-colors',
                              formData.category === key ? 'bg-royal text-white' : 'bg-powder-100/80 text-powder-700'
                            )}>
                              {config.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-base font-bold leading-tight text-royal sm:text-lg">{config.label}</h3>
                              <p className="mt-1 line-clamp-3 text-sm font-medium leading-snug text-slate-500">{config.description}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="flex justify-center sm:justify-end">
                      <Button
                        onClick={() => goToStep(2)}
                        disabled={!formData.category}
                        className="h-12 w-full rounded-xl bg-royal px-8 font-bold text-white shadow-royal hover:bg-royal/90 sm:w-auto"
                      >
                        Next Step
                      </Button>
                    </div>
                  </>
                ) : (
                  // Photo Mode: Photo Analysis
                  <>
                    <div className="mb-8 text-center">
                      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-powder-700">Step 1</p>
                      <h2 className="mt-2 text-2xl font-black tracking-tight text-royal sm:text-3xl">Photo Analysis</h2>
                      <p className="mt-2 text-sm font-medium text-slate-600">Upload photos for AI analysis and get suggested issue context.</p>
                    </div>

                    <AIPhotoAnalyzer
                      onAnalysisComplete={handlePhotoAnalysis}
                      className="mb-6"
                    />

                    {aiAnalysis && (
                      <div className="rounded-2xl border border-powder-200 bg-gradient-to-r from-powder-50 to-white px-4 py-3">
                        <p className="text-sm font-semibold text-royal">AI has prepared a draft from your photos.</p>
                        <p className="mt-1 text-xs text-slate-600">
                          Category and description were pre-filled for review. You can edit anything in the next step.
                        </p>
                      </div>
                    )}

                    <div className="flex justify-center sm:justify-end">
                      <Button
                        onClick={() => goToStep(2)}
                        disabled={!formData.category}
                        className="h-12 w-full rounded-xl bg-royal px-8 font-bold text-white shadow-royal hover:bg-royal/90 sm:w-auto"
                      >
                        Next Step
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-fade-in-up motion-reduce:animate-none">
                <div className="mb-8 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-powder-700">Step 2</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-royal sm:text-3xl">Describe the Issue</h2>
                  <p className="mt-2 text-sm font-medium text-slate-600">
                    {reportMode === 'photo'
                      ? 'Refine the AI draft and add location context for accurate resolution.'
                      : 'Add clear details so teams can verify and resolve the issue quickly.'}
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="rounded-2xl border border-powder-200/80 bg-gradient-to-r from-powder-50/70 to-white p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="border-slate-300 bg-white text-slate-700">
                        {reportMode === 'photo' ? 'AI-Assisted Flow' : 'Manual Flow'}
                      </Badge>
                      {formData.category && (
                        <Badge variant="outline" className="border-powder-200 bg-powder-50 text-powder-700">
                          {CATEGORY_CONFIG[formData.category].icon} {CATEGORY_CONFIG[formData.category].label}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-2 text-xs font-medium text-slate-600">
                      Be specific about location, visible impact, and urgency to help teams triage your report faster.
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="title" className="text-[13px] font-bold tracking-widest uppercase text-slate-500">Issue Title *</Label>
                      <span className="text-xs font-medium text-slate-400">{formData.title.length} characters</span>
                    </div>
                    <Input
                      id="title"
                      placeholder="Brief, descriptive title for the issue"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-2 h-14 rounded-[1rem] border-slate-200 font-medium text-slate-900 shadow-sm focus:border-powder-500 focus:ring-powder-500/20"
                    />
                    {/* Smart Suggestions for Title - Only in Photo Mode */}
                    {reportMode === 'photo' && enableAI && formData.title.length > 3 && (
                      <div data-tutorial="ai-suggestions">
                        <AISmartSuggestions
                          partialText={formData.title}
                          context="title"
                          onSuggestionSelect={handleSmartSuggestion}
                          className="mt-2"
                          mode="photo"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <Label htmlFor="description" className="text-[13px] font-bold tracking-widest uppercase text-slate-500">Description *</Label>
                      <span className="text-xs font-medium text-slate-400">{formData.description.length} characters</span>
                    </div>
                    <Textarea
                      id="description"
                      placeholder="Provide detailed information about the issue..."
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-2 min-h-32 resize-none rounded-[1rem] border-slate-200 bg-slate-50 font-medium text-slate-900 shadow-sm focus:border-powder-500 focus:bg-white focus:ring-powder-500/20"
                    />
                    {/* Smart Suggestions for Description - Only in Photo Mode */}
                    {reportMode === 'photo' && enableAI && formData.description.length > 10 && (
                      <AISmartSuggestions
                        partialText={formData.description}
                        context="description"
                        onSuggestionSelect={handleSmartSuggestion}
                        className="mt-2"
                        mode="photo"
                      />
                    )}
                  </div>

                  {userLocation ? (
                    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white p-4" data-tutorial="location-picker">
                      <div className="mb-2 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-emerald-600" />
                        <span className="font-semibold text-emerald-800">Location Detected</span>
                      </div>
                      <p className="text-sm font-medium text-emerald-700">{userLocation.address}</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-[1rem] border border-amber-200/80 bg-amber-50/60 p-4">
                        <div className="mb-2 flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-amber-600" />
                          <span className="font-bold text-amber-800">Location Not Available</span>
                        </div>
                        <p className="text-sm font-medium text-amber-700 mb-3">
                          GPS location could not be detected. You can either try again or provide a manual location.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => requestLocation()}
                            className="border-amber-300 text-amber-700 hover:bg-amber-100/60"
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setUseManualLocation(!useManualLocation)}
                            className="border-amber-300 text-amber-700 hover:bg-amber-100/60"
                          >
                            <MapPin className="w-4 h-4 mr-2" />
                            {useManualLocation ? 'Hide Manual Input' : 'Enter Manually'}
                          </Button>
                        </div>
                      </div>

                      {useManualLocation && (
                        <div className="rounded-[1rem] border border-powder-200/80 bg-gradient-to-r from-powder-50/60 to-white p-4">
                          <div className="mb-3 flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-powder-700" />
                            <span className="font-bold text-royal">Manual Location</span>
                          </div>
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="manual-address" className="text-[13px] font-bold tracking-widest uppercase text-powder-700">
                                Address or Location Description
                              </Label>
                              <Input
                                id="manual-address"
                                placeholder="e.g., Near Central Park, Mumbai"
                                value={manualLocation.address}
                                onChange={(e) => setManualLocation(prev => ({ ...prev, address: e.target.value }))}
                                className="mt-1 h-12 rounded-xl border-powder-200 bg-white shadow-sm"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor="manual-lat" className="text-sm font-medium text-powder-700">
                                  Latitude (optional)
                                </Label>
                                <Input
                                  id="manual-lat"
                                  type="number"
                                  step="any"
                                  placeholder="19.0760"
                                  value={manualLocation.latitude || ''}
                                  onChange={(e) => setManualLocation(prev => ({ ...prev, latitude: parseFloat(e.target.value) || 0 }))}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="manual-lng" className="text-sm font-medium text-powder-700">
                                  Longitude (optional)
                                </Label>
                                <Input
                                  id="manual-lng"
                                  type="number"
                                  step="any"
                                  placeholder="72.8777"
                                  value={manualLocation.longitude || ''}
                                  onChange={(e) => setManualLocation(prev => ({ ...prev, longitude: parseFloat(e.target.value) || 0 }))}
                                  className="mt-1"
                                />
                              </div>
                            </div>
                            <p className="mt-2 text-xs font-semibold text-powder-700">
                              Tip: You can find coordinates in Google Maps by right-clicking on a location.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <Label className="text-[13px] font-bold tracking-widest uppercase text-slate-500">Photos (Optional)</Label>
                    <p className="text-sm font-medium text-slate-500 mb-3">Add up to 5 photos to help illustrate the issue</p>

                    <div className="space-y-4">
                      <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-[1rem] border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-white transition-colors hover:border-powder-400 hover:from-powder-50 hover:to-white">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="mb-2 h-8 w-8 text-powder-600" />
                          <p className="text-sm font-bold text-royal">Click to upload photos</p>
                          <p className="text-xs font-medium text-slate-500">PNG, JPG up to 10MB each</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          multiple
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                      </label>

                      {selectedImages.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {selectedImages.map((file, index) => (
                            <div key={index} className="relative group">
                              <img
                                src={blobUrls[index]}
                                alt={`Upload ${index + 1}`}
                                className="h-24 w-full rounded-lg border border-slate-200 object-cover"
                              />
                              <button
                                onClick={() => removeImage(index)}
                                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 rounded-[1rem] border border-slate-200 bg-slate-50 p-4">
                    <input
                      type="checkbox"
                      id="anonymous"
                      checked={formData.isAnonymous}
                      onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
                      className="h-5 w-5 rounded border-slate-300 text-powder-600 focus:ring-powder-500"
                    />
                    <Label htmlFor="anonymous" className="text-[13px] font-bold text-slate-700 cursor-pointer">
                      Report anonymously (your identity will not be shared)
                    </Label>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <Button
                    variant="outline"
                    onClick={() => goToStep(1)}
                    className="order-2 h-12 rounded-xl border-slate-200 px-8 font-bold text-slate-700 shadow-sm hover:bg-slate-50 sm:order-1"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => goToStep(3)}
                    disabled={!formData.title || !formData.description}
                    className="order-1 h-12 rounded-xl bg-royal px-8 font-bold text-white shadow-royal hover:bg-royal/90 sm:order-2"
                  >
                    Review Report
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-fade-in-up motion-reduce:animate-none">
                <div className="mb-8 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-powder-700">Step 3</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-royal sm:text-3xl">Review Your Report</h2>
                  <p className="mt-2 text-sm font-medium text-slate-600">Confirm your information before final submission.</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-5">
                    <h3 className="mb-2 text-[13px] font-bold uppercase tracking-widest text-slate-400">Category</h3>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-2xl shadow-sm">
                        {CATEGORY_CONFIG[formData.category].icon}
                      </div>
                      <span className="text-lg font-bold text-royal">{CATEGORY_CONFIG[formData.category].label}</span>
                    </div>
                  </div>

                  <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-5">
                    <h3 className="mb-2 text-[13px] font-bold uppercase tracking-widest text-slate-400">Privacy</h3>
                    <div className="flex items-center gap-2">
                      {formData.isAnonymous ? (
                        <>
                          <AlertCircle className="w-4 h-4 text-amber-600" />
                          <span className="font-bold text-slate-700">Anonymous report</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          <span className="font-bold text-slate-700">Public report with your name</span>
                        </>
                      )}
                    </div>
                  </div>

                  {currentLocationLabel && (
                    <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-5 sm:col-span-2">
                      <h3 className="mb-2 text-[13px] font-bold uppercase tracking-widest text-slate-400">Location</h3>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-powder-600" />
                        <span className="font-bold text-slate-700">{currentLocationLabel}</span>
                      </div>
                    </div>
                  )}

                  <div className="rounded-[1rem] border border-slate-200 bg-slate-50 p-5 sm:col-span-2">
                    <h3 className="mb-2 text-[13px] font-bold uppercase tracking-widest text-slate-400">Issue Details</h3>
                    <h4 className="mb-2 text-lg font-bold text-royal">{formData.title}</h4>
                    <p className="font-medium leading-relaxed text-slate-700">{formData.description}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-powder-200 bg-gradient-to-r from-powder-50 to-white p-4">
                  <h3 className="text-sm font-bold text-royal">What Happens Next</h3>
                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <div className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />
                      <span>Your report is queued for city moderation and verification.</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />
                      <span>Approved issues become visible to help community tracking.</span>
                    </div>
                    <div className="flex items-start gap-2 text-xs text-slate-600">
                      <CheckCircle className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />
                      <span>Critical and verified reports are prioritized for response.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col justify-between gap-4 sm:flex-row">
                  <Button
                    variant="outline"
                    onClick={() => goToStep(2)}
                    disabled={isSubmitting}
                    className="order-2 h-14 rounded-xl border-slate-200 px-8 font-bold text-slate-700 shadow-sm hover:bg-slate-50 sm:order-1"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    data-tutorial="submit-button"
                    className="order-1 h-14 rounded-xl bg-royal px-8 font-bold text-white shadow-royal hover:bg-royal/90 sm:order-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        Submit Report
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
        </SectionCard>
      </div>
    </div>
  );
};