import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { securityService } from '@/services/SecurityService';
import { cn } from '@/lib/utils';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye, 
  Filter, 
  Search, 
  Download, 
  Ban, 
  Unlock, 
  Activity, 
  Users, 
  Globe, 
  Lock, 
  Key, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  RefreshCw,
  Settings,
  Bell,
  Flag,
  UserX,
  MapPin
} from 'lucide-react';

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

interface SecurityDashboardProps {
  className?: string;
}

export const SecurityDashboard: React.FC<SecurityDashboardProps> = ({
  className
}) => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [dashboardData, setDashboardData] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);
  const [resolutionText, setResolutionText] = useState('');
  const [filters, setFilters] = useState({
    severity: 'all',
    type: 'all',
    resolved: 'all',
    dateRange: '7d'
  });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadSecurityData();
  }, [filters, loadSecurityData]);

  const loadSecurityData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [eventsResult, logsResult, dashboardResult] = await Promise.all([
        securityService.getSecurityEvents({
          severity: filters.severity !== 'all' ? filters.severity : undefined,
          type: filters.type !== 'all' ? filters.type : undefined,
          resolved: filters.resolved !== 'all' ? filters.resolved === 'resolved' : undefined,
          limit: 50
        }),
        securityService.getAuditLogs({
          severity: filters.severity !== 'all' ? filters.severity : undefined,
          limit: 50
        }),
        securityService.getSecurityDashboardData()
      ]);

      setSecurityEvents(eventsResult.events);
      setAuditLogs(logsResult.logs);
      setDashboardData(dashboardResult);
    } catch (error) {
      console.error('Error loading security data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  const handleResolveEvent = async () => {
    if (!selectedEvent || !resolutionText.trim()) return;

    try {
      await securityService.resolveSecurityEvent(selectedEvent.id, resolutionText);
      setSecurityEvents(prev => prev.map(event => 
        event.id === selectedEvent.id 
          ? { ...event, resolved: true, resolution: resolutionText }
          : event
      ));
      setShowEventDialog(false);
      setSelectedEvent(null);
      setResolutionText('');
    } catch (error) {
      console.error('Error resolving security event:', error);
    }
  };

  const handleBlockIP = async (ipAddress: string) => {
    try {
      await securityService.blockIPAddress(ipAddress, 'Manual block from security dashboard');
      // Refresh data
      loadSecurityData();
    } catch (error) {
      console.error('Error blocking IP:', error);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'medium': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'low': return <CheckCircle className="w-4 h-4 text-green-500" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'login_attempt': return <Key className="w-4 h-4" />;
      case 'permission_denied': return <Lock className="w-4 h-4" />;
      case 'suspicious_activity': return <Eye className="w-4 h-4" />;
      case 'data_breach': return <Shield className="w-4 h-4" />;
      case 'rate_limit_exceeded': return <Activity className="w-4 h-4" />;
      default: return <Flag className="w-4 h-4" />;
    }
  };

  const filteredEvents = securityEvents.filter(event => {
    const matchesSearch = searchQuery === '' || 
      event.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.ipAddress.includes(searchQuery) ||
      (event.userId && event.userId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = searchQuery === '' || 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery) ||
      log.userId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span>Loading security data...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Security Dashboard
          </h2>
          <p className="text-muted-foreground">Monitor security events and audit logs</p>
        </div>
        <Button onClick={loadSecurityData} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Security Overview Cards */}
      {dashboardData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                  <p className="text-2xl font-bold">{dashboardData.totalEvents}</p>
                </div>
                <Activity className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Critical Events</p>
                  <p className="text-2xl font-bold text-red-600">{dashboardData.criticalEvents}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Resolved Events</p>
                  <p className="text-2xl font-bold text-green-600">{dashboardData.resolvedEvents}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Blocked IPs</p>
                  <p className="text-2xl font-bold">{dashboardData.blockedIPs}</p>
                </div>
                <Ban className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Security Events Tab */}
        <TabsContent value="events" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filters.severity} onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="login_attempt">Login Attempts</SelectItem>
                <SelectItem value="permission_denied">Permission Denied</SelectItem>
                <SelectItem value="suspicious_activity">Suspicious Activity</SelectItem>
                <SelectItem value="data_breach">Data Breach</SelectItem>
                <SelectItem value="rate_limit_exceeded">Rate Limit</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.resolved} onValueChange={(value) => setFilters(prev => ({ ...prev, resolved: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="unresolved">Unresolved</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Events List */}
          <div className="space-y-3">
            {filteredEvents.map(event => (
              <Card key={event.id} className={cn(
                "cursor-pointer transition-colors hover:bg-muted/50",
                event.resolved && "opacity-60"
              )}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getEventTypeIcon(event.type)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold capitalize">
                            {event.type.replace('_', ' ')}
                          </h3>
                          <Badge className={getSeverityColor(event.severity)}>
                            {getSeverityIcon(event.severity)}
                            <span className="ml-1">{event.severity}</span>
                          </Badge>
                          {event.resolved && (
                            <Badge variant="outline" className="text-green-600">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {event.ipAddress}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                          {event.userId && (
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {event.userId}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBlockIP(event.ipAddress)}
                      >
                        <Ban className="w-4 h-4 mr-1" />
                        Block IP
                      </Button>
                      {!event.resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedEvent(event);
                            setShowEventDialog(true);
                          }}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Audit Logs Tab */}
        <TabsContent value="audit" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search audit logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filters.severity} onValueChange={(value) => setFilters(prev => ({ ...prev, severity: value }))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severity</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Audit Logs List */}
          <div className="space-y-3">
            {filteredLogs.map(log => (
              <Card key={log.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {log.success ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold">{log.action}</h3>
                          <Badge className={getSeverityColor(log.severity)}>
                            {getSeverityIcon(log.severity)}
                            <span className="ml-1">{log.severity}</span>
                          </Badge>
                          <Badge variant={log.success ? "default" : "destructive"}>
                            {log.success ? 'Success' : 'Failed'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {log.userId}
                          </span>
                          <span className="flex items-center gap-1">
                            <FileText className="w-3 h-3" />
                            {log.resource}: {log.resourceId}
                          </span>
                          <span className="flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {log.ipAddress}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {log.errorMessage && (
                          <p className="text-sm text-red-600 mt-1">{log.errorMessage}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {dashboardData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Events */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Security Events</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData.recentEvents.slice(0, 5).map((event: SecurityEvent) => (
                      <div key={event.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          {getEventTypeIcon(event.type)}
                          <div>
                            <p className="font-medium capitalize">{event.type.replace('_', ' ')}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(event.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Audit Log Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Audit Log Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dashboardData.auditLogSummary.map((item: unknown) => (
                      <div key={item.action} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <Activity className="w-4 h-4" />
                          <div>
                            <p className="font-medium capitalize">{item.action.replace('_', ' ')}</p>
                            <p className="text-sm text-muted-foreground">Last 24 hours</p>
                          </div>
                        </div>
                        <Badge variant="outline">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Event Resolution Dialog */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Security Event</DialogTitle>
          </DialogHeader>
          
          {selectedEvent && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h3 className="font-semibold capitalize mb-2">
                  {selectedEvent.type.replace('_', ' ')}
                </h3>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p><strong>IP Address:</strong> {selectedEvent.ipAddress}</p>
                  <p><strong>Timestamp:</strong> {new Date(selectedEvent.timestamp).toLocaleString()}</p>
                  <p><strong>Severity:</strong> {selectedEvent.severity}</p>
                  {selectedEvent.userId && (
                    <p><strong>User ID:</strong> {selectedEvent.userId}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Resolution Notes</label>
                <Textarea
                  placeholder="Describe how this event was resolved..."
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowEventDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleResolveEvent}
                  disabled={!resolutionText.trim()}
                >
                  Mark as Resolved
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
