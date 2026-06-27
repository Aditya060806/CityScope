import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Copy, 
  Mail, 
  MapPin, 
  Calendar,
  FileText,
  Home,
  ExternalLink,
  ShieldCheck,
  Bell,
  Clock3
} from 'lucide-react';
import { Issue, CATEGORY_CONFIG, STATUS_CONFIG } from '@/types/civic';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface SubmissionConfirmationCardProps {
  issue: Issue;
  reporterEmail?: string;
  onViewDetails?: () => void;
  onGoHome?: () => void;
}

export const SubmissionConfirmationCard: React.FC<SubmissionConfirmationCardProps> = ({
  issue,
  reporterEmail,
  onViewDetails,
  onGoHome
}) => {
  const copyReportId = () => {
    navigator.clipboard.writeText(issue.id)
      .then(() => {
        toast({
          title: "Report ID Copied",
          description: "Your full report ID is now in the clipboard.",
        });
      })
      .catch(() => {
        toast({
          title: "Copy Failed",
          description: "Please copy the report ID manually.",
          variant: 'destructive',
        });
      });
  };

  const categoryConfig = CATEGORY_CONFIG[issue.category];
  const statusConfig = STATUS_CONFIG[issue.status];
  const shortReportId = issue.id.slice(0, 8).toUpperCase();
  const createdAt = issue.createdAt instanceof Date ? issue.createdAt : new Date(issue.createdAt);

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-b from-bone via-slate-50 to-bone px-4 pb-8 pt-20">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-powder-100/45 via-powder-50/20 to-transparent" />

      <Card className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/95 shadow-sleek-xl">
        <CardHeader className="border-b border-slate-100 pb-6 text-center">
          <div className="mb-5 flex items-center justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-royal to-powder-700 shadow-royal">
              <CheckCircle2 className="h-11 w-11 text-white" />
            </div>
          </div>
          <CardTitle className="mb-2 text-3xl font-black tracking-tight text-royal">
            Report Submitted Successfully
          </CardTitle>
          <p className="mx-auto max-w-xl text-sm font-medium text-slate-600 sm:text-base">
            Your civic issue has been received and assigned a unique tracking ID for status updates and follow-up.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700">
              <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
              Received
            </Badge>
            <Badge variant="outline" className="border-powder-200 bg-powder-50 text-powder-700">
              {categoryConfig.icon} {categoryConfig.label}
            </Badge>
            <Badge variant="outline" style={{ borderColor: statusConfig.color, color: statusConfig.color }}>
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6 p-5 sm:p-8">
          {/* Report ID Section */}
          <div className="rounded-2xl border border-royal/20 bg-gradient-to-r from-royal/5 to-powder-50 p-5 sm:p-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Your Report ID</p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <code className="font-mono text-2xl font-bold text-royal">
                    {shortReportId}
                  </code>
                  <Badge variant="outline" className="border-slate-300 bg-white text-[11px] text-slate-600">
                    {issue.id}
                  </Badge>
                </div>
                <p className="mt-2 text-xs font-medium text-slate-500">
                  Save this ID to track your report status
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyReportId}
                className="h-10 shrink-0 rounded-full border-slate-300 bg-white px-4 font-semibold text-slate-700 hover:bg-slate-100"
              >
                <Copy className="w-4 h-4 mr-2" />
                Copy Full ID
              </Button>
            </div>
          </div>

          {/* Email Confirmation */}
          {reporterEmail && (
            <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
              <Mail className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div className="flex-1">
                <p className="mb-1 font-semibold text-emerald-800">
                  Confirmation Email Sent
                </p>
                <p className="text-sm text-emerald-700">
                  A confirmation email with your report details has been sent to{' '}
                  <strong>{reporterEmail}</strong>
                </p>
              </div>
            </div>
          )}

          {/* Report Details */}
          <div className="space-y-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-royal">
              <FileText className="h-5 w-5 text-royal" />
              Report Details
            </h3>

            <div className="grid gap-4">
              {/* Title & Category */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-royal/10 to-powder-100 text-2xl">
                    {categoryConfig.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="mb-1 line-clamp-2 text-lg font-bold text-royal">
                      {issue.title}
                    </p>
                    <Badge 
                      variant="outline" 
                      className="mt-2"
                      style={{ borderColor: categoryConfig.color }}
                    >
                      {categoryConfig.label}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="mb-2 text-sm font-semibold text-slate-500">Description</p>
                <p className="leading-relaxed text-slate-700">{issue.description}</p>
              </div>

              {/* Location */}
              {issue.location && (
                <div className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-600" />
                  <div className="flex-1 min-w-0">
                    <p className="mb-1 text-sm font-semibold text-slate-500">Location</p>
                    <p className="text-slate-700">
                      {typeof issue.location === 'object' && 'address' in issue.location
                        ? issue.location.address
                        : 'Location provided'}
                    </p>
                  </div>
                </div>
              )}

              {/* Status & Date */}
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 text-sm font-semibold text-slate-500">Status</p>
                  <Badge 
                    variant="outline"
                    className="text-sm"
                    style={{ 
                      borderColor: statusConfig.color,
                      color: statusConfig.color 
                    }}
                  >
                    {statusConfig.label}
                  </Badge>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="mb-2 flex items-center gap-1 text-sm font-semibold text-slate-500">
                    <Calendar className="w-4 h-4" />
                    Submitted
                  </p>
                  <p className="text-sm text-slate-700">
                    {format(createdAt, 'MMM dd, yyyy')}
                  </p>
                  <p className="text-xs text-slate-500">
                    {format(createdAt, 'h:mm a')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="rounded-2xl border border-powder-200 bg-gradient-to-r from-powder-50/80 to-white p-4">
            <h3 className="text-sm font-bold text-royal">What Happens Next</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-1 flex items-center gap-2 text-slate-700">
                  <Clock3 className="h-4 w-4 text-powder-700" />
                  <span className="text-xs font-semibold">Queue Review</span>
                </div>
                <p className="text-xs text-slate-600">Your issue is added to the moderation queue for review.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-1 flex items-center gap-2 text-slate-700">
                  <ShieldCheck className="h-4 w-4 text-powder-700" />
                  <span className="text-xs font-semibold">Verification</span>
                </div>
                <p className="text-xs text-slate-600">City admins verify, categorize, and prioritize the report.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="mb-1 flex items-center gap-2 text-slate-700">
                  <Bell className="h-4 w-4 text-powder-700" />
                  <span className="text-xs font-semibold">Status Updates</span>
                </div>
                <p className="text-xs text-slate-600">You receive updates as your report moves toward resolution.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row">
            {onGoHome && (
              <Button
                variant="outline"
                onClick={onGoHome}
                className="h-12 flex-1 border-slate-200 font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Home className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            )}
            {onViewDetails && (
              <Button
                onClick={onViewDetails}
                className="h-12 flex-1 bg-gradient-to-r from-royal to-powder-700 text-white shadow-royal hover:from-royal hover:to-powder-600"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                View Report Details
              </Button>
            )}
          </div>

          {/* Help Text */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-center text-xs text-slate-500">
              You can track the progress of your report using the Report ID above.
              We'll notify you when there are updates.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubmissionConfirmationCard;
