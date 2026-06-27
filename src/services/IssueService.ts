import { Issue, IssueCategory, IssueStatus, CreateIssueData, UpdateIssueData } from '@/types/civic';
import { supabase, subscribeToIssues } from '@/lib/supabase';
import { enhancedIssueService } from './EnhancedIssueService';

class IssueService {

  // Create report lookup token for email/admin search workflow
  async createReportLookupToken(issueId: string, reporterEmail: string): Promise<string | null> {
    try {
      return await enhancedIssueService.createReportLookupToken(issueId, reporterEmail);
    } catch (error) {
      console.error('❌ Failed to create report lookup token:', error);
      return null;
    }
  }

  // Create a new issue
  async createIssue(data: CreateIssueData): Promise<Issue> {
    try {
      return await enhancedIssueService.createIssue(data);
    } catch (error) {
      console.error('❌ Failed to create issue:', error);
      throw error;
    }
  }

  // Get all issues with filtering and pagination
  async getIssues(options: {
    category?: IssueCategory;
    status?: IssueStatus;
    limit?: number;
    offset?: number;
    includeHidden?: boolean;
  } = {}): Promise<{ issues: Issue[]; total: number }> {
    try {
      return await enhancedIssueService.getIssues(options);
    } catch (error) {
      console.error('❌ Failed to get issues:', error);
      throw error;
    }
  }

  // Get issue by ID
  async getIssueById(id: string): Promise<Issue | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data ? this.convertFromDatabase(data) : null;
    } catch (error) {
      console.error('Failed to get issue:', error);
      return null;
    }
  }

  // Update issue
  async updateIssue(id: string, data: UpdateIssueData): Promise<Issue | null> {
    if (!supabase) throw new Error('Supabase not available');
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.assignedTo !== undefined) updateData.assigned_to = data.assignedTo;
      if (data.department !== undefined) updateData.department_id = data.department;
      if (data.resolutionNotes !== undefined) updateData.resolution_notes = data.resolutionNotes;
      if (data.resolvedAt !== undefined) updateData.resolved_at = data.resolvedAt?.toISOString();

      const { data: updatedData, error } = await supabase
        .from('issues')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedData ? this.convertFromDatabase(updatedData) : null;
    } catch (error) {
      console.error('Failed to update issue:', error);
      throw error;
    }
  }

  // Flag an issue
  async flagIssue(id: string, userId: string): Promise<boolean> {
    if (!supabase) throw new Error('Supabase not available');
    try {
      const { data: existingFlag } = await supabase
        .from('issue_flags')
        .select('id')
        .eq('issue_id', id)
        .eq('user_id', userId)
        .single();

      if (existingFlag) return false; // Already flagged

      const { error: flagError } = await supabase
        .from('issue_flags')
        .insert({ issue_id: id, user_id: userId, reason: 'User reported' });

      if (flagError) throw flagError;

      // Auto-hide at 3+ flags
      const { data: issue } = await supabase
        .from('issues')
        .select('flag_count')
        .eq('id', id)
        .single();

      if (issue && issue.flag_count >= 3) {
        await supabase.from('issues').update({ is_hidden: true }).eq('id', id);
      }

      return true;
    } catch (error) {
      console.error('Failed to flag issue:', error);
      throw error;
    }
  }

  // Get analytics data
  async getAnalytics(): Promise<{
    totalIssues: number;
    issuesByStatus: Record<IssueStatus, number>;
    issuesByCategory: Record<IssueCategory, number>;
    issuesByPriority: Record<string, number>;
    averageResolutionTime: number;
    topReporters: Array<{ userId: string; name: string; count: number }>;
    recentTrends: Array<{ date: string; count: number }>;
  }> {
    if (!supabase) throw new Error('Supabase not available');

    const { data: issues, error } = await supabase
      .from('issues')
      .select('*')
      .eq('is_hidden', false);

    if (error) throw error;
    const allIssues = issues || [];

    const issuesByStatus = allIssues.reduce((acc, issue) => {
      acc[issue.status as IssueStatus] = (acc[issue.status as IssueStatus] || 0) + 1;
      return acc;
    }, {} as Record<IssueStatus, number>);

    const issuesByCategory = allIssues.reduce((acc, issue) => {
      acc[issue.category as IssueCategory] = (acc[issue.category as IssueCategory] || 0) + 1;
      return acc;
    }, {} as Record<IssueCategory, number>);

    const issuesByPriority = allIssues.reduce((acc, issue) => {
      acc[issue.priority] = (acc[issue.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const resolvedIssues = allIssues.filter(i => i.resolved_at);
    const averageResolutionTime = resolvedIssues.length > 0
      ? resolvedIssues.reduce((sum, i) => {
          return sum + (new Date(i.resolved_at).getTime() - new Date(i.created_at).getTime());
        }, 0) / resolvedIssues.length / (1000 * 60 * 60 * 24)
      : 0;

    const reporterCounts = allIssues.reduce((acc, issue) => {
      const key = `${issue.reporter_id}_${issue.reporter_name}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topReporters = Object.entries(reporterCounts)
      .map(([key, count]) => {
        const [userId, name] = key.split('_');
        return { userId, name, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const recentTrends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = allIssues.filter(issue => issue.created_at?.startsWith(dateStr)).length;
      recentTrends.push({ date: dateStr, count });
    }

    return {
      totalIssues: allIssues.length,
      issuesByStatus,
      issuesByCategory,
      issuesByPriority,
      averageResolutionTime,
      topReporters,
      recentTrends
    };
  }



  // Convert database format to app format
  private convertFromDatabase(item: unknown): Issue {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      category: item.category as IssueCategory,
      status: item.status as IssueStatus,
      priority: item.priority as 'low' | 'medium' | 'high' | 'urgent',
      location: item.location as { latitude: number; longitude: number; address?: string },
      images: item.images || [],
      reporterId: item.reporter_id,
      reporterName: item.reporter_name,
      isAnonymous: item.is_anonymous || false,
      createdAt: new Date(item.created_at),
      updatedAt: new Date(item.updated_at),
      resolvedAt: item.resolved_at ? new Date(item.resolved_at) : null,
      assignedTo: item.assigned_to,
      departmentId: item.department_id, // Fixed: using department_id from database
      upvotes: item.upvotes || 0,
      flags: item.flag_count || 0,
      isHidden: item.is_hidden || false,
      resolutionNotes: item.resolution_notes || null,
      timeline: Array.isArray(item.timeline) ? item.timeline.map((t: unknown) => ({
        status: t.status,
        timestamp: new Date(t.timestamp),
        note: t.note,
        updatedBy: t.updatedBy || t.updated_by
      })) : []
    };
  }

  // Upvote an issue
  async upvoteIssue(id: string, userId: string): Promise<boolean> {
    if (!supabase) throw new Error('Supabase not available');
    try {
      const { data: existingUpvote } = await supabase
        .from('issue_upvotes')
        .select('id')
        .eq('issue_id', id)
        .eq('user_id', userId)
        .single();

      if (existingUpvote) {
        const { error } = await supabase
          .from('issue_upvotes')
          .delete()
          .eq('issue_id', id)
          .eq('user_id', userId);
        if (error) throw error;
        return false; // Upvote removed
      } else {
        const { error } = await supabase
          .from('issue_upvotes')
          .insert({ issue_id: id, user_id: userId });
        if (error) throw error;
        return true; // Upvote added
      }
    } catch (error) {
      console.error('Failed to toggle upvote:', error);
      throw error;
    }
  }

  // Subscribe to real-time updates
  subscribeToIssues(callback: (issues: Issue[]) => void) {
    if (!supabase) {
      console.warn('Supabase not available for real-time subscriptions');
      return null;
    }

    return supabase
      .channel('issues-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'issues' },
        async () => {
          try {
            const { issues } = await this.getIssues({ limit: 200, includeHidden: false });
            callback(issues);
          } catch (error) {
            console.error('Error refreshing issues after real-time update:', error);
          }
        }
      )
      .subscribe();
  }
}

// Export singleton instance
export const issueService = new IssueService();
export default issueService;
