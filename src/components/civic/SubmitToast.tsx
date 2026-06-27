import React, { useEffect } from 'react';
import { CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface SubmitToastProps {
  show: boolean;
  onComplete: () => void;
  issueTitle: string;
}

export const SubmitToast: React.FC<SubmitToastProps> = ({
  show,
  onComplete,
  issueTitle
}) => {
  useEffect(() => {
    if (show) {
      toast({
        title: "Issue Reported Successfully!",
        description: `"${issueTitle}" has been submitted to the municipal team.`,
        duration: 3000,
      });
      
      const timer = setTimeout(() => {
        onComplete();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [show, issueTitle, onComplete]);

  return null;
};