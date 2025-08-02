import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ReportStepper } from './ReportStepper';
import { SubmitToast } from './SubmitToast';
import { useSmartCategorizer } from '@/hooks/useSmartCategorizer';

interface EnhancedReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
}

export const EnhancedReportModal: React.FC<EnhancedReportModalProps> = ({
  open,
  onOpenChange,
  onSubmit
}) => {
  const [showSubmitToast, setShowSubmitToast] = useState(false);
  const [submittedIssueTitle, setSubmittedIssueTitle] = useState('');
  const { suggestion: smartSuggestion } = useSmartCategorizer();

  const handleSubmit = async (data: any) => {
    try {
      setSubmittedIssueTitle(data.title);
      setShowSubmitToast(true);
      
      // Close modal immediately to show toast
      onOpenChange(false);
      
      // Submit in background
      await onSubmit(data);
    } catch (error) {
      console.error('Failed to submit report:', error);
    }
  };

  const handleToastComplete = () => {
    setShowSubmitToast(false);
    setSubmittedIssueTitle('');
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-civic bg-clip-text text-transparent">
              🏛️ Report Civic Issue
            </DialogTitle>
          </DialogHeader>
          
          <ReportStepper
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            smartSuggestion={smartSuggestion}
          />
        </DialogContent>
      </Dialog>

      <SubmitToast
        show={showSubmitToast}
        onComplete={handleToastComplete}
        issueTitle={submittedIssueTitle}
      />
    </>
  );
};