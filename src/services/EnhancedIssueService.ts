import { Issue, IssueCategory, IssueStatus, CreateIssueData, UpdateIssueData } from '@/types/civic';
import { supabase } from '@/lib/supabase';

class EnhancedIssueService {
  private readonly ISSUE_CACHE_TTL_MS = 4000;
  private issuesQueryCache = new Map<string, { timestamp: number; data: { issues: Issue[]; total: number } }>();
  private inFlightIssueQueries = new Map<string, Promise<{ issues: Issue[]; total: number }>>();

  private getIssuesCacheKey(options: {
    category?: IssueCategory;
    status?: IssueStatus;
    limit?: number;
    offset?: number;
    includeHidden?: boolean;
    userId?: string;
  }) {
    return JSON.stringify({
      category: options.category || null,
      status: options.status || null,
      limit: options.limit || 50,
      offset: options.offset || 0,
      includeHidden: !!options.includeHidden,
      userId: options.userId || null,
    });
  }

  // Create a lookup token for report tracking/admin search.
  async createReportLookupToken(issueId: string, reporterEmail: string): Promise<string | null> {
    if (!supabase || !issueId || !reporterEmail) {
      return null;
    }

    try {
      const token = `CSR-${crypto.randomUUID().replace(/-/g, '').slice(0, 20).toUpperCase()}`;

      const { error: tokenInsertError } = await supabase
        .from('report_tokens')
        .insert({
          issue_id: issueId,
          reporter_email: reporterEmail,
          token,
          token_type: 'lookup',
        });

      if (tokenInsertError) {
        console.warn('⚠️ Could not insert report token:', tokenInsertError.message);
        return null;
      }

      // Best-effort denormalized field on issues for faster admin search.
      const { error: issueUpdateError } = await supabase
        .from('issues')
        .update({ report_token: token, updated_at: new Date().toISOString() })
        .eq('id', issueId);

      if (issueUpdateError) {
        console.warn('⚠️ Could not update issue with report token:', issueUpdateError.message);
      }

      return token;
    } catch (error) {
      console.warn('⚠️ Failed to create report lookup token:', error);
      return null;
    }
  }

  private invalidateIssueCaches() {
    this.issuesQueryCache.clear();
    this.inFlightIssueQueries.clear();
  }

  // Ensure user exists in users table (fixes foreign key constraint)
  private async ensureUserExists(userId: string, userName: string, userEmail?: string): Promise<void> {
    if (!supabase) return;

    try {
      // Check if user exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      // If user exists, we're done
      if (existingUser && !checkError) {
        return;
      }

      // User doesn't exist, create them
      // Create a minimal user profile if missing (foreign-key guard).
      
      // Try to get email from auth.users if not provided
      let email = userEmail;
      if (!email) {
        try {
          const { data: authUser } = await supabase.auth.getUser();
          if (authUser?.user?.id === userId) {
            email = authUser.user.email || `user-${userId.substring(0, 8)}@cityscope.local`;
          }
        } catch {
          email = `user-${userId.substring(0, 8)}@cityscope.local`;
        }
      }

      const { error: createError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email || `user-${userId.substring(0, 8)}@cityscope.local`,
          name: userName || 'CityScope User',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          reports_count: 0,
          verified_percentage: 0,
          badges: [],
          is_active: true
        });

      if (createError) {
        // If it's a conflict (user was created between check and insert), that's fine
        if (createError.code !== '23505') { // Not a unique constraint violation
          console.warn('⚠️ Failed to create user profile (may already exist):', createError.message);
        }
      } else {
      }
    } catch (error) {
      console.warn('⚠️ Error ensuring user exists:', error);
      // Don't throw - we'll let the issue creation try anyway
    }
  }

  // Create issue with enhanced error handling and blockchain token rewards
  async createIssue(data: CreateIssueData): Promise<Issue> {
    if (!supabase) {
      throw new Error('Database connection not available');
    }

    try {
      // Validate required fields
      if (!data.title || !data.description || !data.category) {
        throw new Error('Missing required fields: title, description, or category');
      }

      if (!data.location || !data.location.latitude || !data.location.longitude) {
        throw new Error('Valid location coordinates are required');
      }

      // Ensure user exists in users table (fixes foreign key constraint)
      await this.ensureUserExists(data.reporterId, data.reporterName);

      // Create the issue
      const issueData = {
        title: data.title.trim(),
        description: data.description.trim(),
        category: data.category,
        status: 'pending' as IssueStatus,
        priority: data.priority || 'medium',
        location: {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          address: data.location.address || 'Unknown location'
        },
        images: data.images || [],
        reporter_id: data.reporterId,
        reporter_name: data.reporterName,
        is_anonymous: data.reporterName === 'Anonymous',
        department_id: null,
        timeline: [{
          status: 'pending',
          timestamp: new Date().toISOString(),
          note: 'Issue reported by citizen',
          updatedBy: data.reporterName
        }]
      };

      const { data: insertedIssue, error } = await supabase
        .from('issues')
        .insert(issueData)
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        
        // If it's a foreign key constraint error, try to create user and retry
        if (error.code === '23503' || error.message.includes('foreign key') || error.message.includes('reporter_id')) {
          await this.ensureUserExists(data.reporterId, data.reporterName);
          
          // Retry the insert
          const { data: retryIssue, error: retryError } = await supabase
            .from('issues')
            .insert(issueData)
            .select()
            .single();
          
          if (retryError) {
            throw new Error(`Failed to create issue after retry: ${retryError.message}`);
          }
          
          this.invalidateIssueCaches();
          await this.awardDatabasePoints(data.reporterId, 10);
          return this.convertFromDatabase(retryIssue);
        }
        
        throw new Error(`Failed to create issue: ${error.message}`);
      }
      
      this.invalidateIssueCaches();

      // Award points for reporting
      await this.awardDatabasePoints(data.reporterId, 10);

      return this.convertFromDatabase(insertedIssue);
    } catch (error) {
      console.error('❌ Failed to create issue:', error);
      throw error;
    }
  }

  // Award database points for civic participation
  private async awardDatabasePoints(userId: string, points: number) {
    try {
      const { data: user } = await supabase
        .from('users')
        .select('total_points')
        .eq('id', userId)
        .single();

      if (user) {
        await supabase
          .from('users')
          .update({ total_points: (user.total_points || 0) + points })
          .eq('id', userId);
      }
    } catch (error) {
      console.error('Failed to award database points:', error);
    }
  }

  // Enhanced issue retrieval with better filtering
  async getIssues(options: {
    category?: IssueCategory;
    status?: IssueStatus;
    limit?: number;
    offset?: number;
    includeHidden?: boolean;
    userId?: string;
  } = {}): Promise<{ issues: Issue[]; total: number }> {
    if (!supabase) {
      throw new Error('Database connection not available');
    }

    const cacheKey = this.getIssuesCacheKey(options);
    const now = Date.now();
    const cached = this.issuesQueryCache.get(cacheKey);
    if (cached && now - cached.timestamp < this.ISSUE_CACHE_TTL_MS) {
      return cached.data;
    }

    const existingRequest = this.inFlightIssueQueries.get(cacheKey);
    if (existingRequest) {
      return existingRequest;
    }

    const request = (async () => {
      let query = supabase
        .from('issues')
        .select('*', { count: 'exact' });

      // Apply filters
      if (options.category) {
        query = query.eq('category', options.category);
      }
      if (options.status) {
        query = query.eq('status', options.status);
      }
      if (options.userId) {
        query = query.eq('reporter_id', options.userId);
      }
      if (!options.includeHidden) {
        query = query.eq('is_hidden', false);
      }

      // Apply pagination
      const offset = options.offset || 0;
      const limit = options.limit || 50;
      query = query.range(offset, offset + limit - 1);

      // Sort by creation date (newest first)
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        throw new Error(`Failed to fetch issues: ${error.message}`);
      }

      const issues = (data || []).map(item => this.convertFromDatabase(item));
      const result = { issues, total: count || 0 };
      this.issuesQueryCache.set(cacheKey, { timestamp: Date.now(), data: result });
      return result;
    })();

    this.inFlightIssueQueries.set(cacheKey, request);

    try {
      return await request;
    } catch (error) {
      console.error('❌ Database error:', error);
      throw error;
    } finally {
      this.inFlightIssueQueries.delete(cacheKey);
    }
  }

  // Enhanced upvote with user tracking
  async upvoteIssue(issueId: string, userId: string): Promise<boolean> {
    if (!supabase) {
      throw new Error('Database connection not available');
    }

    try {
      // Check if user already upvoted
      const { data: existingUpvote } = await supabase
        .from('issue_upvotes')
        .select('id')
        .eq('issue_id', issueId)
        .eq('user_id', userId)
        .single();

      if (existingUpvote) {
        // Remove upvote
        const { error } = await supabase
          .from('issue_upvotes')
          .delete()
          .eq('issue_id', issueId)
          .eq('user_id', userId);

        if (error) throw error;
        this.invalidateIssueCaches();
        return false;
      } else {
        // Add upvote
        const { error } = await supabase
          .from('issue_upvotes')
          .insert({
            issue_id: issueId,
            user_id: userId
          });

        if (error) throw error;
        this.invalidateIssueCaches();
        return true;
      }
    } catch (error) {
      console.error('❌ Upvote operation failed:', error);
      throw error;
    }
  }

  // Enhanced analytics
  async getAnalytics(): Promise<{
    totalIssues: number;
    issuesByStatus: Record<IssueStatus, number>;
    issuesByCategory: Record<IssueCategory, number>;
    recentTrends: Array<{ date: string; count: number }>;
  }> {
    if (!supabase) {
      throw new Error('Database connection not available');
    }

    try {
      // Get total issues
      const { count: totalIssues } = await supabase
        .from('issues')
        .select('*', { count: 'exact', head: true })
        .eq('is_hidden', false);

      // Get issues by status
      const { data: statusData } = await supabase
        .from('issues')
        .select('status')
        .eq('is_hidden', false);

      const issuesByStatus = (statusData || []).reduce((acc, item) => {
        acc[item.status as IssueStatus] = (acc[item.status as IssueStatus] || 0) + 1;
        return acc;
      }, {} as Record<IssueStatus, number>);

      // Get issues by category
      const { data: categoryData } = await supabase
        .from('issues')
        .select('category')
        .eq('is_hidden', false);

      const issuesByCategory = (categoryData || []).reduce((acc, item) => {
        acc[item.category as IssueCategory] = (acc[item.category as IssueCategory] || 0) + 1;
        return acc;
      }, {} as Record<IssueCategory, number>);

      // Get recent trends (last 7 days)
      const recentTrends = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const { count } = await supabase
          .from('issues')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', `${dateStr}T00:00:00.000Z`)
          .lt('created_at', `${dateStr}T23:59:59.999Z`)
          .eq('is_hidden', false);

        recentTrends.push({ date: dateStr, count: count || 0 });
      }

      return {
        totalIssues: totalIssues || 0,
        issuesByStatus,
        issuesByCategory,
        recentTrends
      };
    } catch (error) {
      console.error('❌ Analytics query failed:', error);
      throw error;
    }
  }

  // Real-time subscription with enhanced error handling
  subscribeToIssues(callback: (issues: Issue[]) => void) {
    if (!supabase) {
      console.warn('Supabase not available for real-time subscriptions');
      return null;
    }

    return supabase
      .channel('issues-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues'
        },
        async (payload) => {
          try {
            const { issues } = await this.getIssues({ limit: 1500 });
            callback(issues);
          } catch (error) {
            console.error('Error refreshing issues after real-time update:', error);
          }
        }
      )
      .subscribe();
  }



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
      departmentId: item.department_id,
      upvotes: item.upvotes || 0,
      flags: item.flag_count || 0,
      isHidden: item.is_hidden || false,
      resolutionNotes: item.resolution_notes || null,
      verificationStatus: item.verification_status || 'pending_review',
      timeline: Array.isArray(item.timeline) ? item.timeline.map((t: unknown) => ({
        status: t.status,
        timestamp: new Date(t.timestamp),
        note: t.note,
        updatedBy: t.updatedBy || t.updated_by
      })) : []
    };
  }
}

export const enhancedIssueService = new EnhancedIssueService();
export default enhancedIssueService;