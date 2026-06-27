import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { IssueCategory, CATEGORY_CONFIG, SmartSuggestion } from '@/types/civic';
import { useLocation } from '@/hooks/useLocation';
import { cn } from '@/lib/utils';

interface ReportStepperProps {
  onSubmit: (data: unknown) => Promise<void>;
  onCancel: () => void;
  smartSuggestion?: SmartSuggestion | null;
}

export const ReportStepper: React.FC<ReportStepperProps> = ({
  onSubmit,
  onCancel,
  smartSuggestion
}) => {
  const { userLocation } = useLocation();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '' as IssueCategory,
    isAnonymous: false
  });

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.category) return;
    
    await onSubmit({
      ...formData,
      location: userLocation ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        address: userLocation.address || 'Unknown location'
      } : null,
      reporterName: formData.isAnonymous ? 'Anonymous' : 'Current User'
    });
  };

  const categories = Object.entries(CATEGORY_CONFIG);

  return (
    <div className="space-y-6">
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Select Category</h3>
          <div className="grid grid-cols-2 gap-3">
            {categories.map(([key, config]) => (
              <button
                key={key}
                onClick={() => setFormData(prev => ({ ...prev, category: key as IssueCategory }))}
                className={cn(
                  "p-3 rounded-lg border-2 text-left transition-all",
                  formData.category === key
                    ? "border-royal bg-royal/5"
                    : "border-gray-200 hover:border-royal/30"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.icon}</span>
                  <span className="font-medium text-sm">{config.label}</span>
                </div>
              </button>
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>Cancel</Button>
            <Button 
              onClick={() => setStep(2)} 
              disabled={!formData.category}
              className="btn-royal"
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Issue Details</h3>
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              placeholder="Brief title for the issue"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Detailed description of the issue"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="min-h-24"
            />
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="anonymous"
              checked={formData.isAnonymous}
              onChange={(e) => setFormData(prev => ({ ...prev, isAnonymous: e.target.checked }))}
            />
            <Label htmlFor="anonymous" className="text-sm">Report anonymously</Label>
          </div>
          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(1)}>Previous</Button>
            <Button 
              onClick={handleSubmit}
              disabled={!formData.title || !formData.description}
              className="btn-royal"
            >
              Submit Report
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};