import { supabase } from '@/lib/supabase';
import { Issue, IssueStatus, IssueCategory, User, Department, Notification, ChatMessage, VoiceRecording } from '@/types/civic';

export class SupabaseService {
  // Issues
  async getIssues(filters?: {
    category?: IssueCategory;
    status?: IssueStatus;
    limit?: number;
    offset?: number;
    location?: { lat: number; lng: number; radius: number };
  }) {
    let query = supabase
      .from('issues')
      .select(`
        *,
        reporter:users!reporter_id(name, avatar_url),
        assigned_user:users!assigned_to(name, avatar_url),
        department:departments(name, contact_email)
      `)
      .eq('is_hidden', false)
      .order('created_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      issues: data?.map(this.transformIssue) || [],
      total: data?.length || 0
    };
  }

  async createIssue(issueData: {
    title: string;
    description: string;
    category: IssueCategory;
    location: { latitude: number; longitude: number; address: string };
    images?: string[];
    reporterId: string;
    reporterName: string;
    isAnonymous?: boolean;
    priority?: string;
    voiceRecordingId?: string;
  }) {
    const { data, error } = await supabase
      .from('issues')
      .insert({
        title: issueData.title,
        description: issueData.description,
        category: issueData.category,
        location: issueData.location,
        images: issueData.images || [],
        reporter_id: issueData.reporterId,
        reporter_name: issueData.reporterName,
        is_anonymous: issueData.isAnonymous || false,
        priority: issueData.priority || 'medium',
        voice_recording_id: issueData.voiceRecordingId,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-assign to department based on routing logic
    await this.autoAssignIssue(data.id);

    return this.transformIssue(data);
  }

  async updateIssue(id: string, updates: {
    status?: IssueStatus;
    assignedTo?: string;
    departmentId?: string;
    priority?: string;
    resolvedAt?: Date;
    timeline?: unknown[];
  }) {
    const updateData: unknown = { ...updates };
    
    if (updates.resolvedAt) {
      updateData.resolved_at = updates.resolvedAt.toISOString();
    }

    const { data, error } = await supabase
      .from('issues')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Send notification to reporter
    if (updates.status) {
      await this.sendIssueUpdateNotification(id, updates.status);
    }

    return this.transformIssue(data);
  }

  async deleteIssue(id: string) {
    const { error } = await supabase
      .from('issues')
      .update({ is_hidden: true })
      .eq('id', id);

    if (error) throw error;
    return true;
  }

  async upvoteIssue(issueId: string, userId: string) {
    const { error } = await supabase
      .from('issue_upvotes')
      .upsert({
        issue_id: issueId,
        user_id: userId
      });

    if (error) throw error;
    return true;
  }

  async flagIssue(issueId: string, userId: string, reason?: string) {
    const { error } = await supabase
      .from('issue_flags')
      .insert({
        issue_id: issueId,
        user_id: userId,
        reason
      });

    if (error) throw error;
    return true;
  }

  // Auto-assignment logic
  private async autoAssignIssue(issueId: string) {
    const { data: issue } = await supabase
      .from('issues')
      .select('category, location, department_id')
      .eq('id', issueId)
      .single();

    if (!issue) return;

    // Get routing settings
    const { data: settings } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'routing_settings')
      .single();

    const routingSettings = settings?.value || { auto_assign: true };

    if (!routingSettings.auto_assign) return;

    // Find best department based on category and location
    const { data: departments } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true);

    if (!departments) return;

    const bestDepartment = this.findBestDepartment(issue, departments);
    
    if (bestDepartment) {
      await supabase
        .from('issues')
        .update({ department_id: bestDepartment.id })
        .eq('id', issueId);
    }
  }

  private findBestDepartment(issue: React.ChangeEvent<HTMLInputElement>, departments: unknown[]) {
    // Simple routing logic - can be enhanced with ML
    const categoryMapping: Record<string, string[]> = {
      'infrastructure': ['Public Works', 'Utilities'],
      'sanitation': ['Sanitation Department'],
      'safety': ['Public Safety'],
      'transportation': ['Public Works'],
      'environment': ['Environmental Services'],
      'utilities': ['Utilities']
    };

    const preferredDepartments = categoryMapping[issue.category] || ['Public Works'];
    
    return departments.find(dept => 
      preferredDepartments.includes(dept.name)
    ) || departments[0];
  }

  // Users
  async getUsers(limit = 50) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('reports_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data?.map(this.transformUser) || [];
  }

  async getUser(id: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return this.transformUser(data);
  }

  async updateUser(id: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.transformUser(data);
  }

  async getLeaderboard(timeframe: 'week' | 'month' | 'year' = 'month') {
    const { data, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        avatar_url,
        reports_count,
        verified_percentage,
        badges,
        created_at
      `)
      .eq('is_active', true)
      .order('reports_count', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data?.map(this.transformUser) || [];
  }

  // Departments
  async getDepartments() {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data?.map(this.transformDepartment) || [];
  }

  // Notifications
  async getNotifications(userId: string, limit = 20) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data?.map(this.transformNotification) || [];
  }

  async markNotificationAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);

    if (error) throw error;
    return true;
  }

  async sendNotification(notification: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: unknown;
    expiresAt?: Date;
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        expires_at: notification.expiresAt?.toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return this.transformNotification(data);
  }

  private async sendIssueUpdateNotification(issueId: string, status: IssueStatus) {
    const { data: issue } = await supabase
      .from('issues')
      .select('reporter_id, title')
      .eq('id', issueId)
      .single();

    if (!issue) return;

    const statusMessages = {
      'pending': 'Your issue has been received and is under review',
      'in-progress': 'Work has started on your issue',
      'resolved': 'Your issue has been resolved!',
      'closed': 'Your issue has been closed'
    };

    await this.sendNotification({
      userId: issue.reporter_id,
      type: 'issue_update',
      title: 'Issue Status Update',
      message: statusMessages[status] || 'Your issue status has been updated',
      data: { issueId, status }
    });
  }

  // Chat Messages
  async getChatMessages(issueId: string, limit = 50) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data?.map(this.transformChatMessage) || [];
  }

  async sendChatMessage(message: {
    issueId: string;
    senderId: string;
    senderName: string;
    message: string;
    messageType?: string;
    attachments?: string[];
  }) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        issue_id: message.issueId,
        sender_id: message.senderId,
        sender_name: message.senderName,
        message: message.message,
        message_type: message.messageType || 'text',
        attachments: message.attachments || []
      })
      .select()
      .single();

    if (error) throw error;
    return this.transformChatMessage(data);
  }

  // Voice Recordings
  async uploadVoiceRecording(recording: {
    issueId: string;
    userId: string;
    audioUrl: string;
    duration: number;
    transcription?: string;
  }) {
    const { data, error } = await supabase
      .from('voice_recordings')
      .insert({
        issue_id: recording.issueId,
        user_id: recording.userId,
        audio_url: recording.audioUrl,
        duration: recording.duration,
        transcription: recording.transcription
      })
      .select()
      .single();

    if (error) throw error;
    return this.transformVoiceRecording(data);
  }

  // Analytics
  async getAnalytics(timeRange: '7d' | '30d' | '90d' | '1y' = '30d') {
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data: issues } = await supabase
      .from('issues')
      .select('*')
      .gte('created_at', startDate.toISOString());

    if (!issues) return null;

    const analytics = {
      totalIssues: issues.length,
      issuesByStatus: issues.reduce((acc, issue) => {
        acc[issue.status] = (acc[issue.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      issuesByCategory: issues.reduce((acc, issue) => {
        acc[issue.category] = (acc[issue.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      issuesByPriority: issues.reduce((acc, issue) => {
        acc[issue.priority] = (acc[issue.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      averageResolutionTime: this.calculateAverageResolutionTime(issues),
      topReporters: this.getTopReporters(issues),
      recentTrends: this.getRecentTrends(issues, days)
    };

    return analytics;
  }

  private calculateAverageResolutionTime(issues: unknown[]) {
    const resolvedIssues = issues.filter(issue => issue.resolved_at);
    if (resolvedIssues.length === 0) return 0;

    const totalTime = resolvedIssues.reduce((sum, issue) => {
      const created = new Date(issue.created_at);
      const resolved = new Date(issue.resolved_at);
      return sum + (resolved.getTime() - created.getTime());
    }, 0);

    return totalTime / resolvedIssues.length / (1000 * 60 * 60 * 24); // days
  }

  private getTopReporters(issues: unknown[]) {
    const reporterCounts = issues.reduce((acc, issue) => {
      const key = `${issue.reporter_id}_${issue.reporter_name}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(reporterCounts)
      .map(([key, count]) => {
        const [userId, name] = key.split('_');
        return { userId, name, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private getRecentTrends(issues: unknown[], days: number) {
    const trends = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = issues.filter(issue => 
        issue.created_at.startsWith(dateStr)
      ).length;

      trends.push({ date: dateStr, count });
    }
    return trends;
  }

  // Transform functions
  private transformIssue(data: unknown): Issue {
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      category: data.category,
      status: data.status,
      priority: data.priority,
      location: data.location,
      images: data.images || [],
      reporterId: data.reporter_id,
      reporterName: data.reporter_name,
      isAnonymous: data.is_anonymous,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      resolvedAt: data.resolved_at ? new Date(data.resolved_at) : null,
      assignedTo: data.assigned_to,
      departmentId: data.department_id,
      upvotes: data.upvotes || 0,
      flagCount: data.flag_count || 0,
      isHidden: data.is_hidden,
      timeline: data.timeline || [],
      voiceRecordingId: data.voice_recording_id
    };
  }

  private transformUser(data: unknown): User {
    return {
      id: data.id,
      email: data.email,
      name: data.name,
      avatarUrl: data.avatar_url,
      role: data.role,
      departmentId: data.department_id,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      reportsCount: data.reports_count || 0,
      verifiedPercentage: data.verified_percentage || 0,
      badges: data.badges || [],
      isActive: data.is_active
    };
  }

  private transformDepartment(data: unknown): Department {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      headId: data.head_id,
      contactEmail: data.contact_email,
      contactPhone: data.contact_phone,
      serviceAreas: data.service_areas || [],
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      isActive: data.is_active
    };
  }

  private transformNotification(data: unknown): Notification {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type,
      title: data.title,
      message: data.message,
      data: data.data || {},
      isRead: data.is_read,
      createdAt: new Date(data.created_at),
      expiresAt: data.expires_at ? new Date(data.expires_at) : null
    };
  }

  private transformChatMessage(data: unknown): ChatMessage {
    return {
      id: data.id,
      issueId: data.issue_id,
      senderId: data.sender_id,
      senderName: data.sender_name,
      message: data.message,
      messageType: data.message_type,
      attachments: data.attachments || [],
      createdAt: new Date(data.created_at),
      isRead: data.is_read
    };
  }

  private transformVoiceRecording(data: unknown): VoiceRecording {
    return {
      id: data.id,
      issueId: data.issue_id,
      userId: data.user_id,
      audioUrl: data.audio_url,
      duration: data.duration,
      transcription: data.transcription,
      createdAt: new Date(data.created_at)
    };
  }
}

export const supabaseService = new SupabaseService();
