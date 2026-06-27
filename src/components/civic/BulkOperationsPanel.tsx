import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Issue, IssueStatus, IssuePriority, IssueCategory } from '@/types/civic';
import { cn } from '@/lib/utils';
import { 
  CheckSquare, 
  Square, 
  Users, 
  Calendar, 
  Tag, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  Archive,
  Send,
  Download,
  Upload,
  Filter,
  Search,
  X,
  Loader2
} from 'lucide-react';
import { issueService } from '@/services/IssueService';
import { notificationService } from '@/services/NotificationService';

interface BulkOperationsPanelProps {
  issues: Issue[];
  selectedIssues: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onIssuesUpdate: (updatedIssues: Issue[]) => void;
  className?: string;
}

interface BulkOperation {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  requiresConfirmation: boolean;
  execute: (issueIds: string[], options?: unknown) => Promise<void>;
}

interface BulkOperationResult {
  success: number;
  failed: number;
  errors: Array<{ issueId: string; error: string }>;
}

export const BulkOperationsPanel: React.FC<BulkOperationsPanelProps> = ({
  issues,
  selectedIssues,
  onSelectionChange,
  onIssuesUpdate,
  className
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [operationProgress, setOperationProgress] = useState(0);
  const [operationResult, setOperationResult] = useState<BulkOperationResult | null>(null);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [bulkOperationOptions, setBulkOperationOptions] = useState<unknown>({});

  // Select all/none functionality
  const allSelected = selectedIssues.length === issues.length && issues.length > 0;
  const someSelected = selectedIssues.length > 0 && selectedIssues.length < issues.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(issues.map(issue => issue.id));
    }
  };

  const handleSelectIssue = (issueId: string, selected: boolean) => {
    if (selected) {
      onSelectionChange([...selectedIssues, issueId]);
    } else {
      onSelectionChange(selectedIssues.filter(id => id !== issueId));
    }
  };

  // Bulk operations
  const bulkOperations: BulkOperation[] = [
    {
      id: 'update_status',
      name: 'Update Status',
      description: 'Change status of selected issues',
      icon: <CheckCircle className="w-4 h-4" />,
      requiresConfirmation: true,
      execute: async (issueIds: string[], options: { status: IssueStatus }) => {
        const results = await Promise.allSettled(
          issueIds.map(id => issueService.updateIssue(id, { status: options.status }))
        );

        const success = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        const errors = results
          .map((result, index) => ({ result, issueId: issueIds[index] }))
          .filter(({ result }) => result.status === 'rejected')
          .map(({ result, issueId }) => ({
            issueId,
            error: (result as PromiseRejectedResult).reason?.message || 'Unknown error'
          }));

        return { success, failed, errors };
      }
    },
    {
      id: 'assign_department',
      name: 'Assign Department',
      description: 'Assign issues to specific department',
      icon: <Users className="w-4 h-4" />,
      requiresConfirmation: true,
      execute: async (issueIds: string[], options: { department: string }) => {
        const results = await Promise.allSettled(
          issueIds.map(id => issueService.updateIssue(id, { department: options.department }))
        );

        const success = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        const errors = results
          .map((result, index) => ({ result, issueId: issueIds[index] }))
          .filter(({ result }) => result.status === 'rejected')
          .map(({ result, issueId }) => ({
            issueId,
            error: (result as PromiseRejectedResult).reason?.message || 'Unknown error'
          }));

        return { success, failed, errors };
      }
    },
    {
      id: 'update_priority',
      name: 'Update Priority',
      description: 'Change priority of selected issues',
      icon: <AlertTriangle className="w-4 h-4" />,
      requiresConfirmation: true,
      execute: async (issueIds: string[], options: { priority: IssuePriority }) => {
        const results = await Promise.allSettled(
          issueIds.map(id => issueService.updateIssue(id, { priority: options.priority }))
        );

        const success = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        const errors = results
          .map((result, index) => ({ result, issueId: issueIds[index] }))
          .filter(({ result }) => result.status === 'rejected')
          .map(({ result, issueId }) => ({
            issueId,
            error: (result as PromiseRejectedResult).reason?.message || 'Unknown error'
          }));

        return { success, failed, errors };
      }
    },
    {
      id: 'add_comment',
      name: 'Add Comment',
      description: 'Add a comment to selected issues',
      icon: <Send className="w-4 h-4" />,
      requiresConfirmation: true,
      execute: async (issueIds: string[], options: { comment: string }) => {
        const results = await Promise.allSettled(
          issueIds.map(id => issueService.addComment(id, options.comment))
        );

        const success = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        const errors = results
          .map((result, index) => ({ result, issueId: issueIds[index] }))
          .filter(({ result }) => result.status === 'rejected')
          .map(({ result, issueId }) => ({
            issueId,
            error: (result as PromiseRejectedResult).reason?.message || 'Unknown error'
          }));

        return { success, failed, errors };
      }
    },
    {
      id: 'send_notification',
      name: 'Send Notification',
      description: 'Send notification to issue reporters',
      icon: <Send className="w-4 h-4" />,
      requiresConfirmation: true,
      execute: async (issueIds: string[], options: { title: string; message: string }) => {
        const selectedIssuesData = issues.filter(issue => issueIds.includes(issue.id));
        
        const results = await Promise.allSettled(
          selectedIssuesData.map(issue => 
            notificationService.sendNotification({
              userId: issue.reporterId,
              type: 'issue_update',
              title: options.title,
              message: options.message,
              data: { issueId: issue.id }
            })
          )
        );

        const success = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        const errors = results
          .map((result, index) => ({ result, issueId: issueIds[index] }))
          .filter(({ result }) => result.status === 'rejected')
          .map(({ result, issueId }) => ({
            issueId,
            error: (result as PromiseRejectedResult).reason?.message || 'Unknown error'
          }));

        return { success, failed, errors };
      }
    },
    {
      id: 'export_data',
      name: 'Export Data',
      description: 'Export selected issues data',
      icon: <Download className="w-4 h-4" />,
      requiresConfirmation: false,
      execute: async (issueIds: string[]) => {
        const selectedIssuesData = issues.filter(issue => issueIds.includes(issue.id));
        
        // Create CSV content
        const headers = ['ID', 'Title', 'Description', 'Category', 'Status', 'Priority', 'Reporter', 'Created At', 'Location'];
        const csvContent = [
          headers.join(','),
          ...selectedIssuesData.map(issue => [
            issue.id,
            `"${issue.title.replace(/"/g, '""')}"`,
            `"${issue.description.replace(/"/g, '""')}"`,
            issue.category,
            issue.status,
            issue.priority,
            `"${issue.reporterName}"`,
            new Date(issue.createdAt).toISOString(),
            `"${issue.location.address}"`
          ].join(','))
        ].join('\n');

        // Download CSV
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `issues_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        return { success: selectedIssuesData.length, failed: 0, errors: [] };
      }
    },
    {
      id: 'archive_issues',
      name: 'Archive Issues',
      description: 'Archive selected issues (soft delete)',
      icon: <Archive className="w-4 h-4" />,
      requiresConfirmation: true,
      execute: async (issueIds: string[]) => {
        const results = await Promise.allSettled(
          issueIds.map(id => issueService.updateIssue(id, { isHidden: true }))
        );

        const success = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        const errors = results
          .map((result, index) => ({ result, issueId: issueIds[index] }))
          .filter(({ result }) => result.status === 'rejected')
          .map(({ result, issueId }) => ({
            issueId,
            error: (result as PromiseRejectedResult).reason?.message || 'Unknown error'
          }));

        return { success, failed, errors };
      }
    }
  ];

  const executeBulkOperation = async (operation: BulkOperation) => {
    if (selectedIssues.length === 0) return;

    setIsProcessing(true);
    setOperationProgress(0);
    setOperationResult(null);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setOperationProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const result = await operation.execute(selectedIssues, bulkOperationOptions);
      
      clearInterval(progressInterval);
      setOperationProgress(100);
      
      setOperationResult(result);
      setShowResultDialog(true);

      // Refresh issues if operation was successful
      if (result.success > 0) {
        const updatedIssues = await issueService.getIssues({ limit: 1000 });
        onIssuesUpdate(updatedIssues.issues);
      }

    } catch (error) {
      console.error('Bulk operation failed:', error);
      setOperationResult({
        success: 0,
        failed: selectedIssues.length,
        errors: [{ issueId: 'all', error: error instanceof Error ? error.message : 'Unknown error' }]
      });
      setShowResultDialog(true);
    } finally {
      setIsProcessing(false);
      setOperationProgress(0);
    }
  };

  const getOperationOptions = (operationId: string) => {
    switch (operationId) {
      case 'update_status':
        return (
          <Select
            value={bulkOperationOptions.status || ''}
            onValueChange={(value) => setBulkOperationOptions({ ...bulkOperationOptions, status: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
            </SelectContent>
          </Select>
        );
      case 'assign_department':
        return (
          <Select
            value={bulkOperationOptions.department || ''}
            onValueChange={(value) => setBulkOperationOptions({ ...bulkOperationOptions, department: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Public Works">Public Works</SelectItem>
              <SelectItem value="Sanitation Department">Sanitation Department</SelectItem>
              <SelectItem value="Public Safety">Public Safety</SelectItem>
              <SelectItem value="Utilities">Utilities</SelectItem>
              <SelectItem value="Environmental Services">Environmental Services</SelectItem>
            </SelectContent>
          </Select>
        );
      case 'update_priority':
        return (
          <Select
            value={bulkOperationOptions.priority || ''}
            onValueChange={(value) => setBulkOperationOptions({ ...bulkOperationOptions, priority: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        );
      case 'add_comment':
        return (
          <Textarea
            placeholder="Enter comment..."
            value={bulkOperationOptions.comment || ''}
            onChange={(e) => setBulkOperationOptions({ ...bulkOperationOptions, comment: e.target.value })}
          />
        );
      case 'send_notification':
        return (
          <div className="space-y-2">
            <Input
              placeholder="Notification title"
              value={bulkOperationOptions.title || ''}
              onChange={(e) => setBulkOperationOptions({ ...bulkOperationOptions, title: e.target.value })}
            />
            <Textarea
              placeholder="Notification message"
              value={bulkOperationOptions.message || ''}
              onChange={(e) => setBulkOperationOptions({ ...bulkOperationOptions, message: e.target.value })}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5" />
            Bulk Operations
          </span>
          <Badge variant="secondary">
            {selectedIssues.length} selected
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Selection Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected;
              }}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm">
              {allSelected ? 'Deselect All' : 'Select All'}
            </span>
          </div>
          {selectedIssues.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelectionChange([])}
            >
              <X className="w-4 h-4 mr-2" />
              Clear Selection
            </Button>
          )}
        </div>

        {/* Issues List */}
        <div className="max-h-60 overflow-y-auto space-y-2">
          {issues.map(issue => (
            <div
              key={issue.id}
              className="flex items-center gap-3 p-2 border rounded hover:bg-muted/50"
            >
              <Checkbox
                checked={selectedIssues.includes(issue.id)}
                onCheckedChange={(checked) => handleSelectIssue(issue.id, checked as boolean)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{issue.title}</p>
                <p className="text-xs text-muted-foreground">
                  {issue.category} • {issue.status} • {issue.priority}
                </p>
              </div>
              <Badge variant="outline" className="text-xs">
                {issue.flags} upvotes
              </Badge>
            </div>
          ))}
        </div>

        {/* Bulk Operations */}
        {selectedIssues.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Available Operations</h4>
            <div className="grid grid-cols-2 gap-2">
              {bulkOperations.map(operation => (
                <Dialog key={operation.id}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      disabled={isProcessing}
                    >
                      {operation.icon}
                      <span className="ml-2">{operation.name}</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        {operation.icon}
                        {operation.name}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-muted-foreground">
                        {operation.description}
                      </p>
                      <p className="text-sm">
                        This will affect <strong>{selectedIssues.length}</strong> selected issues.
                      </p>
                      
                      {getOperationOptions(operation.id)}
                      
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setBulkOperationOptions({})}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => executeBulkOperation(operation)}
                          disabled={isProcessing}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            'Execute'
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        {isProcessing && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Processing bulk operation...</span>
              <span>{operationProgress}%</span>
            </div>
            <Progress value={operationProgress} className="w-full" />
          </div>
        )}

        {/* Results Dialog */}
        {showResultDialog && operationResult && (
          <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk Operation Results</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-green-600">{operationResult.success}</p>
                    <p className="text-sm text-green-600">Successful</p>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-2xl font-bold text-red-600">{operationResult.failed}</p>
                    <p className="text-sm text-red-600">Failed</p>
                  </div>
                </div>

                {operationResult.errors.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Errors:</h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {operationResult.errors.map((error, index) => (
                        <Alert key={index} variant="destructive">
                          <AlertDescription className="text-xs">
                            <strong>{error.issueId}:</strong> {error.error}
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => setShowResultDialog(false)}
                  className="w-full"
                >
                  Close
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};
