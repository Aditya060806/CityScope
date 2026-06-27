import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Home,
  Map,
  Plus,
  Filter,
  User,
  MapPin,
  Trophy,
  LogIn,
  RefreshCw,
  Gift,
  Bell,
  Globe,
  ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { UserMenu } from '@/components/auth/UserMenu';
import { AuthModal } from '@/components/auth/AuthModal';
import { useNavigate, useLocation as useRouterLocation } from 'react-router-dom';

interface NavigationBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onReportClick: () => void;
  onFilterClick: () => void;
  pendingReports?: number;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  activeTab,
  onTabChange,
  onReportClick,
  onFilterClick,
  pendingReports = 0
}) => {
  const { user } = useAuth();
  const { userLocation, refreshLocation, isLoading: locationLoading } = useLocation();
  const navigate = useNavigate();
  const routerLocation = useRouterLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navItems = [
    { id: 'home', icon: Home, label: 'Issues' },
    { id: 'map', icon: Map, label: 'Map' },
    { id: 'heroes', icon: Trophy, label: 'Heroes' },
    { id: 'rewards', icon: Gift, label: 'Rewards' },
    { id: 'showcase', icon: Globe, label: 'Showcase' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  return (
    <>
      {/* Sleek Top Header - Professional & Clean */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center gap-4 min-w-0 flex-1">
            <div className="w-10 h-10 flex flex-shrink-0 cursor-pointer group rounded-lg overflow-hidden border border-slate-200/50 shadow-sm transition-all duration-300 hover:shadow-md hover:scale-105">
              <img src="/CityScope-bg.png" alt="CityScope Logo" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900 tracking-tight truncate">CityScope</h1>
              <p className="text-xs text-slate-500 hidden sm:block font-medium">Civic Engagement Platform</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center gap-2">
            {[
              { id: 'home', icon: Home, label: 'Dashboard', active: activeTab === 'home' },
              { id: 'map', icon: Map, label: 'Map', active: activeTab === 'map' },
              { id: 'heroes', icon: Trophy, label: 'Heroes', active: activeTab === 'heroes' },
              { id: 'rewards', icon: Gift, label: 'Rewards', active: activeTab === 'rewards' }
            ].map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (item.id === 'home') {
                    if (routerLocation.pathname !== '/') navigate('/');
                    onTabChange('home');
                  } else if (item.id === 'heroes') {
                    navigate('/heroes');
                  } else if (item.id === 'map') {
                    if (routerLocation.pathname !== '/') navigate('/');
                    onTabChange('map');
                  } else if (item.id === 'rewards') {
                    if (routerLocation.pathname !== '/') navigate('/');
                    onTabChange('rewards');
                  }
                }}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200 font-medium',
                  item.active
                    ? 'text-royal bg-slate-100 shadow-sm'
                    : 'text-slate-600 hover:text-royal hover:bg-slate-50'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-semibold">{item.label}</span>
              </Button>
            ))}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <Button
              variant="ghost"
              size="sm"
              className="hidden sm:flex items-center gap-2 text-slate-600 hover:text-royal hover:bg-slate-50 rounded-md px-3 py-2 transition-all duration-200"
            >
              <Globe className="w-4 h-4" />
              <span className="font-semibold">EN</span>
              <ChevronDown className="w-3 h-3" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              size="sm"
              className="relative text-gray-600 hover:text-royal hover:bg-powder/30 rounded-2xl p-3 transition-all duration-300 hover:scale-105"
            >
              <Bell className="w-5 h-5" />
              {pendingReports > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 w-6 h-6 text-xs p-0 flex items-center justify-center bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full border-2 border-white shadow-sleek"
                >
                  {pendingReports > 9 ? '9+' : pendingReports}
                </Badge>
              )}
            </Button>

            {/* User Profile */}
            {user ? (
              <UserMenu />
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 bg-white hover:bg-slate-50 border-slate-200 text-slate-700 rounded-md transition-all duration-200 px-4 py-2 shadow-sm"
              >
                <User className="w-4 h-4" />
                <span className="font-medium hidden sm:inline">Sign In</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-100/50 safe-area-inset-bottom shadow-sleek-lg md:hidden">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-around h-18 py-2">
            {navItems.map((item) => {
              const handleClick = () => {
                if (item.id === 'home') {
                  if (routerLocation.pathname !== '/') {
                    navigate('/');
                  }
                  onTabChange('home');
                } else if (item.id === 'heroes') {
                  navigate('/heroes');
                } else if (item.id === 'map') {
                  if (routerLocation.pathname !== '/') {
                    navigate('/');
                  }
                  onTabChange('map');
                } else if (item.id === 'rewards') {
                  if (routerLocation.pathname !== '/') {
                    navigate('/');
                  }
                  onTabChange('rewards');
                } else if (item.id === 'profile') {
                  if (routerLocation.pathname !== '/') {
                    navigate('/');
                  }
                  onTabChange('profile');
                }
              };

              return (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={handleClick}
                  className={cn(
                    'flex flex-col items-center gap-1 h-14 px-4 transition-all duration-300 min-w-0 rounded-2xl hover:scale-105',
                    ((routerLocation.pathname === '/' && activeTab === item.id) ||
                      (routerLocation.pathname === '/heroes' && item.id === 'heroes'))
                      ? 'text-white bg-gradient-to-r from-royal to-royal/90 shadow-sleek-lg scale-105'
                      : 'text-gray-600 hover:text-royal hover:bg-powder/30'
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="text-xs font-semibold truncate">{item.label}</span>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Sleek Floating Action Button */}
        <Button
          onClick={onReportClick}
          className="absolute -top-6 left-1/2 transform -translate-x-1/2 w-12 h-12 rounded-full bg-royal hover:bg-slate-800 shadow-md transition-all duration-200 active:scale-95 group border-[3px] border-white"
        >
          <Plus className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-200" />
        </Button>
      </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};