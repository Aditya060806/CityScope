import { Issue, IssueStatus, IssueCategory } from '@/types/civic';

interface MunicipalSystemConfig {
  systemId: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  enabled: boolean;
  syncEnabled: boolean;
  webhookUrl?: string;
}

interface IntegrationMapping {
  issueId: string;
  externalId: string;
  systemId: string;
  lastSync: Date;
  syncStatus: 'synced' | 'pending' | 'failed';
}

interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: Array<{ issueId: string; error: string }>;
}

interface WebhookPayload {
  event: 'issue_created' | 'issue_updated' | 'issue_resolved';
  issue: Issue;
  timestamp: Date;
  source: 'cityscope';
}

class ThirdPartyIntegrationService {
  private municipalSystems: MunicipalSystemConfig[] = [];
  private isInitialized = false;

  constructor() {
    this.initializeMunicipalSystems();
  }

  private initializeMunicipalSystems(): void {
    // Load municipal system configurations from environment or database
    this.municipalSystems = [
      {
        systemId: 'workorder_pro',
        name: 'WorkOrder Pro',
        baseUrl: import.meta.env.VITE_WORKORDER_PRO_URL || '',
        apiKey: import.meta.env.VITE_WORKORDER_PRO_API_KEY || '',
        enabled: !!import.meta.env.VITE_WORKORDER_PRO_API_KEY,
        syncEnabled: true,
        webhookUrl: import.meta.env.VITE_WORKORDER_PRO_WEBHOOK_URL
      },
      {
        systemId: 'civic_connect',
        name: 'Civic Connect',
        baseUrl: import.meta.env.VITE_CIVIC_CONNECT_URL || '',
        apiKey: import.meta.env.VITE_CIVIC_CONNECT_API_KEY || '',
        enabled: !!import.meta.env.VITE_CIVIC_CONNECT_API_KEY,
        syncEnabled: true
      },
      {
        systemId: 'municipal_erp',
        name: 'Municipal ERP',
        baseUrl: import.meta.env.VITE_MUNICIPAL_ERP_URL || '',
        apiKey: import.meta.env.VITE_MUNICIPAL_ERP_API_KEY || '',
        enabled: !!import.meta.env.VITE_MUNICIPAL_ERP_API_KEY,
        syncEnabled: false
      },
      {
        systemId: 'gis_system',
        name: 'GIS System',
        baseUrl: import.meta.env.VITE_GIS_SYSTEM_URL || '',
        apiKey: import.meta.env.VITE_GIS_SYSTEM_API_KEY || '',
        enabled: !!import.meta.env.VITE_GIS_SYSTEM_API_KEY,
        syncEnabled: true
      }
    ];
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Test connectivity to enabled systems
      await this.testSystemConnectivity();
      this.isInitialized = true;
      console.log('Third-party integration service initialized');
    } catch (error) {
      console.error('Failed to initialize third-party integration service:', error);
      this.isInitialized = true; // Allow service to work with limited functionality
    }
  }

  private async testSystemConnectivity(): Promise<void> {
    const enabledSystems = this.municipalSystems.filter(system => system.enabled);
    
    for (const system of enabledSystems) {
      try {
        await this.testSystemConnection(system);
        console.log(`Connected to ${system.name}`);
      } catch (error) {
        console.warn(`Failed to connect to ${system.name}:`, error);
      }
    }
  }

  private async testSystemConnection(system: MunicipalSystemConfig): Promise<void> {
    const response = await fetch(`${system.baseUrl}/api/health`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${system.apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Connection test failed: ${response.statusText}`);
    }
  }

  // Sync issue to municipal systems
  async syncIssueToSystems(issue: Issue): Promise<SyncResult> {
    await this.initialize();

    const enabledSystems = this.municipalSystems.filter(system => 
      system.enabled && system.syncEnabled
    );

    const results = await Promise.allSettled(
      enabledSystems.map(system => this.syncIssueToSystem(issue, system))
    );

    const success = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    const errors = results
      .map((result, index) => ({ result, system: enabledSystems[index] }))
      .filter(({ result }) => result.status === 'rejected')
      .map(({ result, system }) => ({
        issueId: issue.id,
        error: `${system.name}: ${(result as PromiseRejectedResult).reason}`
      }));

    return {
      success: success > 0,
      syncedCount: success,
      failedCount: failed,
      errors
    };
  }

  private async syncIssueToSystem(issue: Issue, system: MunicipalSystemConfig): Promise<void> {
    const payload = this.transformIssueForSystem(issue, system.systemId);
    
    const response = await fetch(`${system.baseUrl}/api/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${system.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.statusText}`);
    }

    const result = await response.json();
    
    // Store integration mapping
    await this.storeIntegrationMapping({
      issueId: issue.id,
      externalId: result.id || result.issueId,
      systemId: system.systemId,
      lastSync: new Date(),
      syncStatus: 'synced'
    });
  }

  private transformIssueForSystem(issue: Issue, systemId: string): unknown {
    // Transform issue data based on target system requirements
    switch (systemId) {
      case 'workorder_pro':
        return {
          title: issue.title,
          description: issue.description,
          category: this.mapCategoryToWorkOrderPro(issue.category),
          priority: this.mapPriorityToWorkOrderPro(issue.priority),
          location: {
            latitude: issue.location.latitude,
            longitude: issue.location.longitude,
            address: issue.location.address
          },
          reporter: {
            name: issue.reporterName,
            id: issue.reporterId
          },
          images: issue.images,
          created_at: issue.createdAt,
          status: this.mapStatusToWorkOrderPro(issue.status)
        };

      case 'civic_connect':
        return {
          issueId: issue.id,
          title: issue.title,
          description: issue.description,
          type: issue.category,
          severity: issue.priority,
          coordinates: [issue.location.longitude, issue.location.latitude],
          address: issue.location.address,
          reporter: issue.reporterName,
          attachments: issue.images,
          reportedAt: issue.createdAt,
          currentStatus: issue.status
        };

      case 'municipal_erp':
        return {
          workOrder: {
            id: issue.id,
            title: issue.title,
            description: issue.description,
            category: issue.category,
            priority: issue.priority,
            location: issue.location,
            requester: issue.reporterName,
            createdDate: issue.createdAt,
            status: issue.status,
            images: issue.images
          }
        };

      case 'gis_system':
        return {
          feature: {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [issue.location.longitude, issue.location.latitude]
            },
            properties: {
              id: issue.id,
              title: issue.title,
              description: issue.description,
              category: issue.category,
              status: issue.status,
              priority: issue.priority,
              reporter: issue.reporterName,
              created_at: issue.createdAt,
              images: issue.images
            }
          }
        };

      default:
        return {
          id: issue.id,
          title: issue.title,
          description: issue.description,
          category: issue.category,
          status: issue.status,
          priority: issue.priority,
          location: issue.location,
          reporter: issue.reporterName,
          createdAt: issue.createdAt,
          images: issue.images
        };
    }
  }

  private mapCategoryToWorkOrderPro(category: IssueCategory): string {
    const mapping = {
      roads: 'ROAD_MAINTENANCE',
      lighting: 'STREET_LIGHTING',
      water: 'WATER_UTILITIES',
      sanitation: 'SANITATION',
      traffic: 'TRAFFIC_MANAGEMENT',
      parks: 'PARKS_RECREATION',
      other: 'GENERAL'
    };
    return mapping[category] || 'GENERAL';
  }

  private mapPriorityToWorkOrderPro(priority: string): string {
    const mapping = {
      low: 'LOW',
      medium: 'MEDIUM',
      high: 'HIGH',
      urgent: 'CRITICAL'
    };
    return mapping[priority as keyof typeof mapping] || 'MEDIUM';
  }

  private mapStatusToWorkOrderPro(status: IssueStatus): string {
    const mapping = {
      pending: 'NEW',
      'in-progress': 'IN_PROGRESS',
      resolved: 'COMPLETED'
    };
    return mapping[status] || 'NEW';
  }

  // Update issue in municipal systems
  async updateIssueInSystems(issue: Issue): Promise<SyncResult> {
    await this.initialize();

    const mappings = await this.getIntegrationMappings(issue.id);
    const enabledSystems = this.municipalSystems.filter(system => 
      system.enabled && system.syncEnabled
    );

    const results = await Promise.allSettled(
      mappings.map(mapping => {
        const system = enabledSystems.find(s => s.systemId === mapping.systemId);
        if (!system) return Promise.reject(new Error('System not found'));
        
        return this.updateIssueInSystem(issue, system, mapping.externalId);
      })
    );

    const success = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    const errors = results
      .map((result, index) => ({ result, mapping: mappings[index] }))
      .filter(({ result }) => result.status === 'rejected')
      .map(({ result, mapping }) => ({
        issueId: issue.id,
        error: `${mapping.systemId}: ${(result as PromiseRejectedResult).reason}`
      }));

    return {
      success: success > 0,
      syncedCount: success,
      failedCount: failed,
      errors
    };
  }

  private async updateIssueInSystem(
    issue: Issue, 
    system: MunicipalSystemConfig, 
    externalId: string
  ): Promise<void> {
    const payload = this.transformIssueForSystem(issue, system.systemId);
    
    const response = await fetch(`${system.baseUrl}/api/issues/${externalId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${system.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Update failed: ${response.statusText}`);
    }

    // Update integration mapping
    await this.updateIntegrationMapping(issue.id, system.systemId, {
      lastSync: new Date(),
      syncStatus: 'synced'
    });
  }

  // Handle webhook from municipal systems
  async handleWebhook(systemId: string, payload: unknown): Promise<void> {
    await this.initialize();

    const system = this.municipalSystems.find(s => s.systemId === systemId);
    if (!system || !system.enabled) {
      throw new Error('System not found or disabled');
    }

    // Validate webhook signature if configured
    if (system.webhookUrl) {
      await this.validateWebhookSignature(system, payload);
    }

    // Process webhook based on system type
    switch (systemId) {
      case 'workorder_pro':
        await this.processWorkOrderProWebhook(payload);
        break;
      case 'civic_connect':
        await this.processCivicConnectWebhook(payload);
        break;
      case 'municipal_erp':
        await this.processMunicipalERPWebhook(payload);
        break;
      default:
        await this.processGenericWebhook(systemId, payload);
    }
  }

  private async processWorkOrderProWebhook(payload: unknown): Promise<void> {
    // Process WorkOrder Pro webhook
    const { issueService } = await import('@/services/IssueService');
    
    const mapping = await this.getIntegrationMappingByExternalId(
      payload.workOrderId, 
      'workorder_pro'
    );
    
    if (!mapping) {
      console.warn('No mapping found for WorkOrder Pro webhook');
      return;
    }

    // Update issue based on webhook data
    const updates: unknown = {};
    
    if (payload.status) {
      updates.status = this.mapWorkOrderProStatusToCityScope(payload.status);
    }
    
    if (payload.assignedTo) {
      updates.assignedTo = payload.assignedTo;
    }
    
    if (payload.completionNotes) {
      updates.resolutionNotes = payload.completionNotes;
    }

    if (Object.keys(updates).length > 0) {
      await issueService.updateIssue(mapping.issueId, updates);
    }
  }

  private async processCivicConnectWebhook(payload: unknown): Promise<void> {
    // Process Civic Connect webhook
    const { issueService } = await import('@/services/IssueService');
    
    const mapping = await this.getIntegrationMappingByExternalId(
      payload.issueId, 
      'civic_connect'
    );
    
    if (!mapping) {
      console.warn('No mapping found for Civic Connect webhook');
      return;
    }

    const updates: unknown = {};
    
    if (payload.status) {
      updates.status = this.mapCivicConnectStatusToCityScope(payload.status);
    }
    
    if (payload.assignedDepartment) {
      updates.department = payload.assignedDepartment;
    }

    if (Object.keys(updates).length > 0) {
      await issueService.updateIssue(mapping.issueId, updates);
    }
  }

  private async processMunicipalERPWebhook(payload: unknown): Promise<void> {
    // Process Municipal ERP webhook
    console.log('Processing Municipal ERP webhook:', payload);
  }

  private async processGenericWebhook(systemId: string, payload: unknown): Promise<void> {
    // Process generic webhook
    console.log(`Processing generic webhook for ${systemId}:`, payload);
  }

  private mapWorkOrderProStatusToCityScope(status: string): IssueStatus {
    const mapping: Record<string, IssueStatus> = {
      'NEW': 'pending',
      'ASSIGNED': 'pending',
      'IN_PROGRESS': 'in-progress',
      'COMPLETED': 'resolved',
      'CLOSED': 'resolved'
    };
    return mapping[status] || 'pending';
  }

  private mapCivicConnectStatusToCityScope(status: string): IssueStatus {
    const mapping: Record<string, IssueStatus> = {
      'OPEN': 'pending',
      'IN_PROGRESS': 'in-progress',
      'RESOLVED': 'resolved',
      'CLOSED': 'resolved'
    };
    return mapping[status] || 'pending';
  }

  // Store integration mapping
  private async storeIntegrationMapping(mapping: IntegrationMapping): Promise<void> {
    const { supabase } = await import('@/lib/supabase');
    
    const { error } = await supabase
      .from('integration_mappings')
      .insert({
        issue_id: mapping.issueId,
        external_id: mapping.externalId,
        system_id: mapping.systemId,
        last_sync: mapping.lastSync.toISOString(),
        sync_status: mapping.syncStatus
      });

    if (error) throw error;
  }

  // Get integration mappings for an issue
  private async getIntegrationMappings(issueId: string): Promise<IntegrationMapping[]> {
    const { supabase } = await import('@/lib/supabase');
    
    const { data, error } = await supabase
      .from('integration_mappings')
      .select('*')
      .eq('issue_id', issueId);

    if (error) throw error;
    
    return (data || []).map(item => ({
      issueId: item.issue_id,
      externalId: item.external_id,
      systemId: item.system_id,
      lastSync: new Date(item.last_sync),
      syncStatus: item.sync_status
    }));
  }

  // Get integration mapping by external ID
  private async getIntegrationMappingByExternalId(
    externalId: string, 
    systemId: string
  ): Promise<IntegrationMapping | null> {
    const { supabase } = await import('@/lib/supabase');
    
    const { data, error } = await supabase
      .from('integration_mappings')
      .select('*')
      .eq('external_id', externalId)
      .eq('system_id', systemId)
      .single();

    if (error) return null;
    
    return {
      issueId: data.issue_id,
      externalId: data.external_id,
      systemId: data.system_id,
      lastSync: new Date(data.last_sync),
      syncStatus: data.sync_status
    };
  }

  // Update integration mapping
  private async updateIntegrationMapping(
    issueId: string, 
    systemId: string, 
    updates: Partial<IntegrationMapping>
  ): Promise<void> {
    const { supabase } = await import('@/lib/supabase');
    
    const updateData: unknown = {};
    if (updates.lastSync) updateData.last_sync = updates.lastSync.toISOString();
    if (updates.syncStatus) updateData.sync_status = updates.syncStatus;

    const { error } = await supabase
      .from('integration_mappings')
      .update(updateData)
      .eq('issue_id', issueId)
      .eq('system_id', systemId);

    if (error) throw error;
  }

  // Validate webhook signature
  private async validateWebhookSignature(system: MunicipalSystemConfig, payload: unknown): Promise<void> {
    // Implement webhook signature validation
    // This would typically involve HMAC validation
    console.log('Validating webhook signature for', system.name);
  }

  // Get integration status
  getIntegrationStatus(): Array<{
    systemId: string;
    name: string;
    enabled: boolean;
    syncEnabled: boolean;
    lastSync?: Date;
    status: 'connected' | 'disconnected' | 'error';
  }> {
    return this.municipalSystems.map(system => ({
      systemId: system.systemId,
      name: system.name,
      enabled: system.enabled,
      syncEnabled: system.syncEnabled,
      status: system.enabled ? 'connected' : 'disconnected'
    }));
  }

  // Sync all pending issues
  async syncAllPendingIssues(): Promise<SyncResult> {
    await this.initialize();

    const { supabase } = await import('@/lib/supabase');
    
    // Get all issues that need syncing
    const { data: issues, error } = await supabase
      .from('issues')
      .select('*')
      .eq('sync_status', 'pending')
      .limit(100);

    if (error) throw error;

    let totalSynced = 0;
    let totalFailed = 0;
    const allErrors: Array<{ issueId: string; error: string }> = [];

    for (const issue of issues || []) {
      try {
        const result = await this.syncIssueToSystems(issue);
        totalSynced += result.syncedCount;
        totalFailed += result.failedCount;
        allErrors.push(...result.errors);
      } catch (error) {
        totalFailed++;
        allErrors.push({
          issueId: issue.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return {
      success: totalSynced > 0,
      syncedCount: totalSynced,
      failedCount: totalFailed,
      errors: allErrors
    };
  }
}

export const thirdPartyIntegrationService = new ThirdPartyIntegrationService();
