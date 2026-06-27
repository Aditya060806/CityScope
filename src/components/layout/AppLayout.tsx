import React, { Suspense, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Activity, Brain, Gift, Home, LayoutGrid, Map, MessageCircle, Plus, Radio,
  Settings, Timer, TreePine, Trophy, User, Users, Volume2, Eye, ChevronLeft, ChevronRight, Menu
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { UserMenu } from '@/components/auth/UserMenu';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { useAuth } from '@/hooks/useAuth';
import { lazyRetry } from '@/lib/lazyRetry';
import { cn } from '@/lib/utils';
import { PRADLiveIndicator } from '@/components/prad/PRADLiveIndicator';
import { OnboardingTutorial } from '@/components/onboarding/OnboardingTutorial';

const EnhancedChatbot = lazyRetry(() => import('@/components/chatbot/RedesignedChatbot'));

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  adminOnly?: boolean;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'Main Menu',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/' },
      { id: 'map', label: 'Live Map', icon: Map, path: '/map' },
      { id: 'report', label: 'Report Issue', icon: Plus, path: '/report' },
      { id: 'analytics', label: 'Analytics', icon: LayoutGrid, path: '/analytics' },
    ]
  },
  {
    title: 'Civic Features',
    items: [
      { id: 'roads', label: 'PRAD Engine', icon: Activity, path: '/road-anomalies' },
      { id: 'sos', label: 'Civic SOS', icon: Radio, path: '/sos' },
      { id: 'sound', label: 'Noise Scope', icon: Volume2, path: '/sound-scope' },
      { id: 'verify', label: 'Swarm Verify', icon: Users, path: '/swarm-verify' },
      { id: 'ai', label: 'AI Analytics', icon: Brain, path: '/ai-analytics' },
    ]
  },
  {
    title: 'Community',
    items: [
      { id: 'heroes', label: 'Heroes', icon: Trophy, path: '/heroes' },
      { id: 'rewards', label: 'Rewards', icon: Gift, path: '/rewards' },
      { id: 'messages', label: 'Messages', icon: MessageCircle, path: '/messages' },
      { id: 'civic-ar', label: 'Civic AR', icon: Eye, path: '/civic-ar' },
      { id: 'timelapse', label: 'Timelapse', icon: Timer, path: '/timelapse' },
      { id: 'green-scope', label: 'Green Scope', icon: TreePine, path: '/green-scope' },
    ]
  },
  {
    title: 'Settings',
    items: [
      { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
      { id: 'settings', label: 'Settings', icon: Settings, path: '/settings' },
    ]
  }
];

// Flat list for mobile / routing checks
const allNavItems = navGroups.flatMap(group => group.items);

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const filterNavItems = (items: NavItem[]) => items.filter((item) => !item.adminOnly || user?.role === 'admin');

  // Find current label for Breadcrumb
  const currentItem = allNavItems.find(item => 
    location.pathname === item.path || 
    (item.path !== '/' && location.pathname.startsWith(item.path))
  );

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f8fafc] text-slate-900 font-sans">
      {/* Sidebar - Desktop */}
      <aside 
        className={cn(
          "hidden lg:flex flex-col h-full bg-white border-r border-slate-200 transition-all duration-300",
          isSidebarCollapsed ? "w-[80px]" : "w-[260px] xl:w-[280px]"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <button
            onClick={() => navigate('/')}
            className="flex items-center justify-center gap-3 overflow-hidden text-left"
          >
            <div className="h-10 w-10 shrink-0 flex items-center justify-center">
              <img src="/CityScope.png" alt="CityScope Logo" className="w-full h-full object-contain drop-shadow-md" />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <h1 className="text-sm font-extrabold tracking-tight text-slate-900">CityScope</h1>
                <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Command Center</p>
              </div>
            )}
          </button>
          <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 hidden lg:block transition-colors"
          >
            {isSidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 space-y-8 no-scrollbar">
          {navGroups.map((group) => {
            const items = filterNavItems(group.items);
            if (items.length === 0) return null;

            return (
              <div key={group.title} className="space-y-1">
                {!isSidebarCollapsed && (
                  <p className="px-6 text-[11px] font-extrabold text-slate-400 uppercase tracking-[0.15em] mb-4">
                    {group.title}
                  </p>
                )}
                <div className="space-y-1 pr-4">
                  {items.map((item) => {
                    const isActive =
                      location.pathname === item.path ||
                      (item.path !== '/' && location.pathname.startsWith(item.path));
                      
                    return (
                      <button
                        key={item.id}
                        onClick={() => navigate(item.path)}
                        title={isSidebarCollapsed ? item.label : undefined}
                        className={cn(
                          'group flex items-center transition-all duration-200',
                          isSidebarCollapsed 
                            ? 'justify-center p-2.5 mx-auto w-10 h-10 rounded-xl mb-2' 
                            : 'w-full gap-3 py-2.5 pl-6 pr-4 rounded-r-2xl border-l-[3px]',
                          isActive 
                            ? isSidebarCollapsed 
                                ? 'bg-indigo-50 text-indigo-700 font-semibold shadow-sm'
                                : 'bg-indigo-50/70 text-indigo-700 font-bold border-indigo-600'
                            : isSidebarCollapsed 
                                ? 'text-slate-500 hover:bg-slate-50 border-transparent'
                                : 'text-slate-500 hover:bg-slate-50/50 hover:text-slate-900 border-transparent font-medium'
                        )}
                      >
                        <item.icon className={cn('h-[18px] w-[18px] shrink-0', isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600')} />
                        {!isSidebarCollapsed && (
                          <span className="text-[14px]">{item.label}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main Content wrapper */}
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {/* Topbar */}
        <header className="h-16 bg-white/60 backdrop-blur-xl saturate-150 border-b border-slate-200/50 shadow-[0_4px_30px_rgba(0,0,0,0.02)] px-4 lg:px-6 flex items-center justify-between shrink-0 z-20 sticky top-0">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-500" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex text-sm text-slate-500 items-center gap-2">
              <span>Main Menu</span>
              <span className="text-slate-300">/</span>
              <span className="font-semibold text-slate-900">{currentItem?.label || 'Dashboard'}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Button 
              onClick={() => navigate('/report')} 
              size="sm" 
              className="hidden sm:flex h-9 relative overflow-hidden bg-slate-900 text-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.1),0_0_0_1px_rgba(255,255,255,0.05)_inset] px-4 font-semibold hover:shadow-[0_4px_16px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.1)_inset] active:scale-[0.96] transition-all"
            >
              <span className="absolute inset-0 w-full h-full bg-[linear-gradient(110deg,transparent_25%,rgba(255,255,255,0.25)_50%,transparent_75%)] bg-[length:200%_100%] animate-shimmer pointer-events-none" />
              <Plus className="w-4 h-4 mr-2 relative z-10" /> 
              <span className="relative z-10">Report Issue</span>
            </Button>
            <NotificationDropdown />
            <UserMenu />
          </div>
        </header>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 w-full bg-white border-b border-slate-200 z-50 p-4 lg:hidden shadow-lg h-[calc(100vh-64px)] overflow-y-auto">
            <div className="mb-4">
              <Button onClick={() => { navigate('/report'); setIsMobileMenuOpen(false); }} className="w-full bg-slate-900 text-white mb-4 rounded-xl">
                <Plus className="w-4 h-4 mr-2" /> Report Issue
              </Button>
            </div>
            {navGroups.map(group => (
              <div key={group.title} className="mb-6">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3 pl-2">{group.title}</p>
                <div className="space-y-1">
                  {filterNavItems(group.items).map(item => (
                    <button
                      key={item.id}
                      onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                      className={cn(
                        "flex items-center gap-3 w-full p-3 rounded-xl text-left text-sm transition-colors",
                        location.pathname === item.path ? 'bg-indigo-50 font-semibold text-indigo-700' : 'text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      <item.icon className={cn('w-4 h-4', location.pathname === item.path ? 'text-indigo-600' : 'text-slate-400')} />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-[#f8fafc] relative">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.06),transparent_60%),radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.04),transparent_60%)] pointer-events-none" />
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.99 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="h-full relative z-10"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <PRADLiveIndicator />

      <Suspense fallback={null}>
        <EnhancedChatbot />
      </Suspense>

      {/* Centralized New-User Tutorial — fires exactly once after first login */}
      <OnboardingTutorial />
    </div>
  );
};
