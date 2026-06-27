import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { chatAIService, ChatContext, ChatResponse } from '@/services/ChatAIService';
import { issueService } from '@/services/IssueService';
import { IssueCategory } from '@/types/civic';
import { DEFAULT_LOCATION } from '@/constants/location';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  provider?: 'gemini' | 'groq' | 'fallback';
  navigateTo?: string;
  reportCard?: {
    category: string;
    title: string;
    description: string;
    location: string;
    status: 'submitted' | 'failed';
    issueId?: string;
  };
}

interface IssueStats {
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  categories: Record<string, number>;
}

export function useChatAI() {
  const { user } = useAuth();
  const { userLocation } = useLocation();
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastProvider, setLastProvider] = useState<string | null>(null);

  // Cache issue stats — refresh every 5 minutes
  const statsRef = useRef<IssueStats | null>(null);
  const statsTimerRef = useRef<number>(0);

  const fetchStats = useCallback(async (): Promise<IssueStats> => {
    const now = Date.now();
    if (statsRef.current && now - statsTimerRef.current < 300_000) {
      return statsRef.current;
    }

    try {
      const { issues, total } = await issueService.getIssues({ limit: 500 });
      const stats: IssueStats = {
        total,
        pending: issues.filter(i => i.status === 'pending').length,
        inProgress: issues.filter(i => i.status === 'in-progress').length,
        resolved: issues.filter(i => i.status === 'resolved').length,
        categories: {},
      };
      issues.forEach(i => {
        stats.categories[i.category] = (stats.categories[i.category] || 0) + 1;
      });
      statsRef.current = stats;
      statsTimerRef.current = now;
      return stats;
    } catch {
      return statsRef.current || { total: 0, pending: 0, inProgress: 0, resolved: 0, categories: {} };
    }
  }, []);

  const buildContext = useCallback(async (): Promise<ChatContext> => {
    const stats = await fetchStats();

    // Map route to readable page name
    const pageMap: Record<string, string> = {
      '/': 'Dashboard (Home)',
      '/map': 'Map',
      '/report': 'Report Issue',
      '/rewards': 'Rewards',
      '/analytics': 'Analytics',
      '/ai-analytics': 'AI Analytics',
      '/leaderboard': 'Leaderboard',
      '/heroes': 'Heroes',
      '/messages': 'Messages',
      '/profile': 'Profile',
      '/settings': 'Settings',
      '/admin': 'Admin Panel',
    };

    return {
      userName: user?.name || user?.email?.split('@')[0],
      userEmail: user?.email,
      userRole: user?.role || 'citizen',
      userLocation: userLocation ? {
        city: (userLocation as any).city,
        state: (userLocation as any).state,
        area: (userLocation as any).area,
        address: userLocation.address,
      } : undefined,
      currentPage: pageMap[routerLocation.pathname] || routerLocation.pathname,
      issueStats: stats,
    };
  }, [user, userLocation, routerLocation.pathname, fetchStats]);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isProcessing) return;

    setError(null);

    // Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsProcessing(true);

    try {
      // ── AUTO-REPORT: detect "submit a report about X" ──────
      if (chatAIService.isReportSubmitIntent(trimmed)) {
        if (!user?.id) {
          setMessages(prev => [...prev, {
            id: `bot-${Date.now()}`, role: 'assistant' as const,
            content: "You need to be logged in to submit a report. Let me take you to the **Report page**.",
            timestamp: new Date(), suggestions: ['Take me to Report'], navigateTo: '/report', provider: 'fallback' as const,
          }]);
          setTimeout(() => navigate('/report'), 800);
          return;
        }

        const extraction = await chatAIService.extractReportData(trimmed);
        if (!extraction) {
          setMessages(prev => [...prev, {
            id: `bot-${Date.now()}`, role: 'assistant' as const,
            content: "I couldn't extract enough details. Let me take you to the **Report page** to fill it in manually.",
            timestamp: new Date(), suggestions: ['Take me to Report'], navigateTo: '/report', provider: 'fallback' as const,
          }]);
          setTimeout(() => navigate('/report'), 800);
          return;
        }

        const loc = userLocation
          ? { latitude: userLocation.latitude, longitude: userLocation.longitude, address: userLocation.address || 'Current location' }
          : {
              latitude: DEFAULT_LOCATION.latitude,
              longitude: DEFAULT_LOCATION.longitude,
              address: DEFAULT_LOCATION.address || 'Delhi, India',
            };

        const catLabels: Record<string, string> = {
          roads: '🚧 Roads & Infrastructure', lighting: '💡 Street Lighting', sanitation: '🧹 Sanitation',
          water: '💧 Water Supply', traffic: '🚦 Traffic & Safety', parks: '🌳 Parks & Recreation', other: '📋 Other Issues',
        };

        try {
          const issue = await issueService.createIssue({
            title: extraction.title,
            description: extraction.description,
            category: extraction.category as IssueCategory,
            location: loc,
            images: [],
            reporterId: user.id,
            reporterName: user.name || 'Anonymous',
            priority: 'medium',
          });

          setMessages(prev => [...prev, {
            id: `bot-${Date.now()}`, role: 'assistant' as const,
            content: `✅ **Report Submitted Successfully!**\n\n📋 **Category:** ${catLabels[extraction.category] || extraction.category}\n📌 **Title:** ${extraction.title}\n📝 **Description:** ${extraction.description}\n📍 **Location:** ${loc.address}\n🆔 **Report ID:** \`${issue.id.slice(0, 8)}\`\n\nYour report has been filed and will be reviewed by city officials. Thank you for helping improve your community! 🙌`,
            timestamp: new Date(),
            suggestions: ['Report another issue', 'View on map', 'Show statistics'],
            provider: 'gemini' as const,
            reportCard: { category: extraction.category, title: extraction.title, description: extraction.description, location: loc.address, status: 'submitted' as const, issueId: issue.id },
          }]);
        } catch (submitErr: any) {
          setMessages(prev => [...prev, {
            id: `bot-${Date.now()}`, role: 'assistant' as const,
            content: `❌ **Submission failed:** ${submitErr?.message || 'Unknown error'}\n\nLet me take you to the **Report page** to submit manually.`,
            timestamp: new Date(), suggestions: ['Take me to Report', 'Try again'], navigateTo: '/report', provider: 'fallback' as const,
          }]);
          setTimeout(() => navigate('/report'), 1500);
        }
        return;
      }

      // ── NORMAL AI FLOW ─────────────────────────────────────
      const context = await buildContext();
      const response: ChatResponse = await chatAIService.sendMessage(trimmed, context);

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: response.content,
        timestamp: new Date(),
        suggestions: response.suggestions,
        provider: response.provider,
        navigateTo: response.navigateTo,
      };
      setMessages(prev => [...prev, botMsg]);
      setLastProvider(response.provider);

      // Handle navigation
      if (response.navigateTo && response.navigateTo !== routerLocation.pathname) {
        setTimeout(() => {
          navigate(response.navigateTo!);
        }, 800);
      }
    } catch (err: any) {
      console.error('Chat AI Error:', err);
      const errMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        suggestions: ['Try again', 'Report an issue', 'View map'],
        provider: 'fallback',
      };
      setMessages(prev => [...prev, errMsg]);
      setError(err?.message || 'Connection error');
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, buildContext, routerLocation.pathname, navigate, user, userLocation]);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
    chatAIService.clearHistory();
  }, []);

  // Pre-fetch stats when hook mounts
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    messages,
    isProcessing,
    error,
    lastProvider,
    sendMessage,
    clearChat,
  };
}
