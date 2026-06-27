import { supabase } from '@/lib/supabase';

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  severity: 'low' | 'medium' | 'high' | 'critical';
  success: boolean;
  errorMessage?: string;
}

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'permission_denied' | 'suspicious_activity' | 'data_breach' | 'rate_limit_exceeded';
  userId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolved: boolean;
  resolution?: string;
}

interface RateLimitRule {
  endpoint: string;
  maxRequests: number;
  windowMs: number;
  blockDurationMs: number;
}

interface SecurityPolicy {
  id: string;
  name: string;
  description: string;
  rules: Array<{
    condition: string;
    action: 'allow' | 'deny' | 'log' | 'alert';
    severity: 'low' | 'medium' | 'high' | 'critical';
  }>;
  enabled: boolean;
}

class SecurityService {
  private rateLimitStore: Map<string, { count: number; resetTime: number }> = new Map();
  private securityPolicies: SecurityPolicy[] = [];
  private isInitialized = false;

  constructor() {
    this.initializeDefaultPolicies();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Initialize with default policies first
      this.initializeDefaultPolicies();
      
      // Try to load from database (non-blocking)
      await this.loadSecurityPolicies();
      await this.setupSecurityMonitoring();
      
      this.isInitialized = true;
      console.log('Security Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Security Service:', error);
      // Continue with default policies even if initialization fails
      this.initializeDefaultPolicies();
      this.isInitialized = true; // Allow service to work with basic functionality
    }
  }


  private async loadSecurityPolicies(): Promise<void> {
    try {
      // Add a small delay to ensure database is ready
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Load security policies from database
      const { data, error } = await supabase
        .from('security_policies')
        .select('*')
        .eq('enabled', true);

      if (error) {
        console.warn('Failed to load security policies from database:', error);
        // Use default policies if database table doesn't exist or has errors
        this.initializeDefaultPolicies();
        return;
      }

      if (data && data.length > 0) {
        this.securityPolicies = data.map(policy => ({
          id: policy.id,
          name: policy.name,
          description: policy.description,
          rules: policy.rules,
          enabled: policy.enabled
        }));
      } else {
        // No policies found, use defaults
        this.initializeDefaultPolicies();
      }
    } catch (error) {
      console.warn('Error loading security policies:', error);
      // Continue with default policies
      this.initializeDefaultPolicies();
    }
  }

  private initializeDefaultPolicies(): void {
    this.securityPolicies = [
      {
        id: 'default-auth-policy',
        name: 'Authentication Policy',
        description: 'Default authentication security policy',
        rules: [
          {
            condition: 'failed_login_attempts > 5',
            action: 'deny',
            severity: 'high'
          },
          {
            condition: 'suspicious_ip_address',
            action: 'alert',
            severity: 'medium'
          }
        ],
        enabled: true
      },
      {
        id: 'default-data-policy',
        name: 'Data Access Policy',
        description: 'Default data access security policy',
        rules: [
          {
            condition: 'bulk_data_export',
            action: 'log',
            severity: 'medium'
          },
          {
            condition: 'sensitive_data_access',
            action: 'log',
            severity: 'high'
          }
        ],
        enabled: true
      }
    ];
  }

  private async setupSecurityMonitoring(): Promise<void> {
    try {
      // Set up real-time monitoring for security events
      const { data, error } = await supabase
        .channel('security_events')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'security_events' },
          (payload) => this.handleSecurityEvent(payload.new as SecurityEvent)
        )
        .subscribe();

      if (error) {
        console.warn('Failed to set up security monitoring:', error);
      }
    } catch (error) {
      console.warn('Error setting up security monitoring:', error);
      // Continue without real-time monitoring if table doesn't exist
    }
  }

  // Log audit event
  async logAuditEvent(
    userId: string,
    action: string,
    resource: string,
    resourceId: string,
    details: Record<string, unknown> = {},
    severity: 'low' | 'medium' | 'high' | 'critical' = 'low',
    success: boolean = true,
    errorMessage?: string
  ): Promise<void> {
    // Skip audit logging in development to avoid database errors
    if (process.env.NODE_ENV === 'development') {
      console.log('Audit event (development mode):', { action, resource, success });
      return;
    }
    
    await this.initialize();

    const auditLog: Omit<AuditLog, 'id'> = {
      userId,
      action,
      resource,
      resourceId,
      details,
      ipAddress: await this.getClientIP(),
      userAgent: navigator.userAgent,
      timestamp: new Date(),
      severity,
      success,
      errorMessage
    };

    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          user_id: auditLog.userId,
          action: auditLog.action,
          resource: auditLog.resource,
          resource_id: auditLog.resourceId,
          details: auditLog.details,
          ip_address: auditLog.ipAddress,
          user_agent: auditLog.userAgent,
          timestamp: auditLog.timestamp.toISOString(),
          severity: auditLog.severity,
          success: auditLog.success,
          error_message: auditLog.errorMessage
        });

      if (error) {
        console.warn('Failed to log audit event to database:', error);
        // Continue without database logging if table doesn't exist
        return;
      }

      // Check security policies
      await this.checkSecurityPolicies(auditLog);

    } catch (error) {
      console.warn('Error logging audit event:', error);
      // Continue without audit logging if there are issues
    }
  }

  // Check security policies
  private async checkSecurityPolicies(auditLog: Omit<AuditLog, 'id'>): Promise<void> {
    for (const policy of this.securityPolicies) {
      if (!policy.enabled) continue;

      for (const rule of policy.rules) {
        if (await this.evaluateRule(rule.condition, auditLog)) {
          await this.executeRuleAction(rule.action, rule.severity, auditLog);
        }
      }
    }
  }

  // Evaluate security rule condition
  private async evaluateRule(condition: string, auditLog: Omit<AuditLog, 'id'>): Promise<boolean> {
    switch (condition) {
      case 'failed_login_attempts > 5':
        return await this.checkFailedLoginAttempts(auditLog.userId, 5);
      
      case 'suspicious_ip_address':
        return await this.checkSuspiciousIP(auditLog.ipAddress);
      
      case 'admin_action_without_2fa':
        return await this.checkAdminActionWithout2FA(auditLog);
      
      case 'bulk_data_export':
        return auditLog.action === 'export_data' && auditLog.details.count > 100;
      
      case 'cross_tenant_data_access':
        return await this.checkCrossTenantAccess(auditLog);
      
      case 'sensitive_data_access':
        return await this.checkSensitiveDataAccess(auditLog);
      
      case 'rate_limit_exceeded':
        return await this.checkRateLimit(auditLog.ipAddress, auditLog.resource);
      
      case 'invalid_api_key':
        return auditLog.action === 'api_access' && !auditLog.success;
      
      case 'suspicious_api_usage':
        return await this.checkSuspiciousAPIUsage(auditLog);
      
      default:
        return false;
    }
  }

  // Execute security rule action
  private async executeRuleAction(
    action: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    auditLog: Omit<AuditLog, 'id'>
  ): Promise<void> {
    switch (action) {
      case 'allow':
        // Allow the action
        break;
      
      case 'deny':
        // Deny the action and log security event
        await this.createSecurityEvent({
          type: 'permission_denied',
          userId: auditLog.userId,
          ipAddress: auditLog.ipAddress,
          userAgent: auditLog.userAgent,
          details: {
            action: auditLog.action,
            resource: auditLog.resource,
            reason: 'Security policy violation'
          },
          severity,
          timestamp: new Date(),
          resolved: false
        });
        break;
      
      case 'log':
        // Log the event for monitoring
        await this.createSecurityEvent({
          type: 'suspicious_activity',
          userId: auditLog.userId,
          ipAddress: auditLog.ipAddress,
          userAgent: auditLog.userAgent,
          details: {
            action: auditLog.action,
            resource: auditLog.resource,
            details: auditLog.details
          },
          severity,
          timestamp: new Date(),
          resolved: false
        });
        break;
      
      case 'alert':
        // Send alert to administrators
        await this.sendSecurityAlert(severity, auditLog);
        break;
    }
  }

  // Check failed login attempts
  private async checkFailedLoginAttempts(userId: string, threshold: number): Promise<boolean> {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('action', 'login_attempt')
      .eq('success', false)
      .gte('timestamp', new Date(Date.now() - 15 * 60 * 1000).toISOString()) // Last 15 minutes
      .limit(threshold + 1);

    if (error) return false;
    return (data?.length || 0) > threshold;
  }

  // Check suspicious IP address
  private async checkSuspiciousIP(ipAddress: string): Promise<boolean> {
    // Check if IP is in known malicious IP list
    const { data, error } = await supabase
      .from('blocked_ips')
      .select('*')
      .eq('ip_address', ipAddress)
      .eq('active', true)
      .single();

    if (error) return false;
    return !!data;
  }

  // Check admin action without 2FA
  private async checkAdminActionWithout2FA(auditLog: Omit<AuditLog, 'id'>): Promise<boolean> {
    if (auditLog.action !== 'admin_action') return false;

    // Check if user has 2FA enabled and verified
    const { data, error } = await supabase
      .from('users')
      .select('two_factor_enabled, two_factor_verified')
      .eq('id', auditLog.userId)
      .single();

    if (error) return false;
    return data?.two_factor_enabled && !data?.two_factor_verified;
  }

  // Check cross-tenant data access
  private async checkCrossTenantAccess(auditLog: Omit<AuditLog, 'id'>): Promise<boolean> {
    // Implement cross-tenant access check
    // This would check if user is accessing data from a different tenant
    return false; // Simplified for demo
  }

  // Check sensitive data access
  private async checkSensitiveDataAccess(auditLog: Omit<AuditLog, 'id'>): Promise<boolean> {
    const sensitiveResources = ['user_personal_data', 'payment_info', 'admin_settings'];
    return sensitiveResources.includes(auditLog.resource);
  }

  // Check rate limit
  private async checkRateLimit(ipAddress: string, endpoint: string): Promise<boolean> {
    const key = `${ipAddress}:${endpoint}`;
    const now = Date.now();
    const windowMs = 60000; // 1 minute
    const maxRequests = 100;

    const current = this.rateLimitStore.get(key);
    
    if (!current || now > current.resetTime) {
      this.rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return false;
    }

    if (current.count >= maxRequests) {
      return true;
    }

    current.count++;
    this.rateLimitStore.set(key, current);
    return false;
  }

  // Check suspicious API usage
  private async checkSuspiciousAPIUsage(auditLog: Omit<AuditLog, 'id'>): Promise<boolean> {
    // Check for unusual API usage patterns
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('ip_address', auditLog.ipAddress)
      .eq('action', 'api_access')
      .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString()) // Last hour
      .limit(1000);

    if (error) return false;
    
    // Check for unusual patterns (e.g., too many requests, unusual endpoints)
    const requestCount = data?.length || 0;
    const uniqueEndpoints = new Set(data?.map(log => log.resource) || []).size;
    
    return requestCount > 500 || uniqueEndpoints > 50;
  }

  // Create security event
  private async createSecurityEvent(event: Omit<SecurityEvent, 'id'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('security_events')
        .insert({
          type: event.type,
          user_id: event.userId,
          ip_address: event.ipAddress,
          user_agent: event.userAgent,
          details: event.details,
          severity: event.severity,
          timestamp: event.timestamp.toISOString(),
          resolved: event.resolved,
          resolution: event.resolution
        });

      if (error) throw error;
    } catch (error) {
      console.error('Failed to create security event:', error);
    }
  }

  // Send security alert
  private async sendSecurityAlert(
    severity: 'low' | 'medium' | 'high' | 'critical',
    auditLog: Omit<AuditLog, 'id'>
  ): Promise<void> {
    try {
      const { notificationService } = await import('@/services/NotificationService');
      
      // Get admin users
      const { data: admins, error } = await supabase
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .eq('is_active', true);

      if (error || !admins) return;

      // Send alert to all admins
      for (const admin of admins) {
        await notificationService.sendNotification({
          userId: admin.id,
          type: 'system',
          title: `Security Alert: ${severity.toUpperCase()}`,
          message: `Security event detected: ${auditLog.action} on ${auditLog.resource} from IP ${auditLog.ipAddress}`,
          data: {
            severity,
            auditLogId: auditLog.userId,
            timestamp: auditLog.timestamp.toISOString()
          }
        });
      }
    } catch (error) {
      console.error('Failed to send security alert:', error);
    }
  }

  // Handle security event
  private async handleSecurityEvent(event: SecurityEvent): Promise<void> {
    console.log('Security event received:', event);
    
    // Implement real-time security event handling
    if (event.severity === 'critical') {
      await this.handleCriticalSecurityEvent(event);
    }
  }

  // Handle critical security event
  private async handleCriticalSecurityEvent(event: SecurityEvent): Promise<void> {
    // Implement critical security event handling
    // This could include automatic account suspension, IP blocking, etc.
    console.log('Critical security event:', event);
  }

  // Get client IP address
  private async getClientIP(): Promise<string> {
    try {
      // In a real application, this would get the actual client IP
      // For demo purposes, we'll use a placeholder
      return '127.0.0.1';
    } catch (error) {
      return 'unknown';
    }
  }

  // Get audit logs
  async getAuditLogs(filters: {
    userId?: string;
    action?: string;
    resource?: string;
    severity?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ logs: AuditLog[]; total: number }> {
    await this.initialize();

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' });

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.action) {
      query = query.eq('action', filters.action);
    }

    if (filters.resource) {
      query = query.eq('resource', filters.resource);
    }

    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }

    if (filters.startDate) {
      query = query.gte('timestamp', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('timestamp', filters.endDate.toISOString());
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    query = query.order('timestamp', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    const logs = (data || []).map(item => ({
      id: item.id,
      userId: item.user_id,
      action: item.action,
      resource: item.resource,
      resourceId: item.resource_id,
      details: item.details,
      ipAddress: item.ip_address,
      userAgent: item.user_agent,
      timestamp: new Date(item.timestamp),
      severity: item.severity,
      success: item.success,
      errorMessage: item.error_message
    }));

    return { logs, total: count || 0 };
  }

  // Get security events
  async getSecurityEvents(filters: {
    type?: string;
    severity?: string;
    resolved?: boolean;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  } = {}): Promise<{ events: SecurityEvent[]; total: number }> {
    await this.initialize();

    let query = supabase
      .from('security_events')
      .select('*', { count: 'exact' });

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.severity) {
      query = query.eq('severity', filters.severity);
    }

    if (filters.resolved !== undefined) {
      query = query.eq('resolved', filters.resolved);
    }

    if (filters.startDate) {
      query = query.gte('timestamp', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('timestamp', filters.endDate.toISOString());
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
    }

    query = query.order('timestamp', { ascending: false });

    const { data, error, count } = await query;

    if (error) throw error;

    const events = (data || []).map(item => ({
      id: item.id,
      type: item.type,
      userId: item.user_id,
      ipAddress: item.ip_address,
      userAgent: item.user_agent,
      details: item.details,
      severity: item.severity,
      timestamp: new Date(item.timestamp),
      resolved: item.resolved,
      resolution: item.resolution
    }));

    return { events, total: count || 0 };
  }

  // Resolve security event
  async resolveSecurityEvent(eventId: string, resolution: string): Promise<void> {
    await this.initialize();

    const { error } = await supabase
      .from('security_events')
      .update({
        resolved: true,
        resolution,
        resolved_at: new Date().toISOString()
      })
      .eq('id', eventId);

    if (error) throw error;
  }

  // Block IP address
  async blockIPAddress(ipAddress: string, reason: string, duration?: number): Promise<void> {
    await this.initialize();

    const expiresAt = duration 
      ? new Date(Date.now() + duration * 1000).toISOString()
      : null;

    const { error } = await supabase
      .from('blocked_ips')
      .insert({
        ip_address: ipAddress,
        reason,
        expires_at: expiresAt,
        active: true,
        created_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  // Unblock IP address
  async unblockIPAddress(ipAddress: string): Promise<void> {
    await this.initialize();

    const { error } = await supabase
      .from('blocked_ips')
      .update({ active: false })
      .eq('ip_address', ipAddress);

    if (error) throw error;
  }

  // Get security dashboard data
  async getSecurityDashboardData(): Promise<{
    totalEvents: number;
    criticalEvents: number;
    resolvedEvents: number;
    blockedIPs: number;
    recentEvents: SecurityEvent[];
    auditLogSummary: Array<{ action: string; count: number }>;
  }> {
    await this.initialize();

    const [eventsResult, auditLogsResult, blockedIPsResult] = await Promise.all([
      this.getSecurityEvents({ limit: 10 }),
      supabase
        .from('audit_logs')
        .select('action')
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase
        .from('blocked_ips')
        .select('*', { count: 'exact' })
        .eq('active', true)
    ]);

    const totalEvents = eventsResult.total;
    const criticalEvents = eventsResult.events.filter(e => e.severity === 'critical').length;
    const resolvedEvents = eventsResult.events.filter(e => e.resolved).length;
    const blockedIPs = blockedIPsResult.count || 0;

    // Process audit logs for summary
    const auditLogSummary = (auditLogsResult.data || []).reduce((acc: unknown, log: unknown) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {});

    const auditLogSummaryArray = Object.entries(auditLogSummary).map(([action, count]) => ({
      action,
      count: count as number
    }));

    return {
      totalEvents,
      criticalEvents,
      resolvedEvents,
      blockedIPs,
      recentEvents: eventsResult.events,
      auditLogSummary: auditLogSummaryArray
    };
  }
}

export const securityService = new SecurityService();
