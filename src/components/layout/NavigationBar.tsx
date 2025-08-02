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
  LogIn
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { UserMenu } from '@/components/auth/UserMenu';
import { AuthModal } from '@/components/auth/AuthModal';

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
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navItems = [
    { id: 'home', icon: Home, label: 'Issues' },
    { id: 'map', icon: Map, label: 'Map' },
    { id: 'leaderboard', icon: Trophy, label: 'Heroes' },
    { id: 'profile', icon: User, label: 'Profile' }
  ];

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-powder/40 shadow-xl">
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 h-14 sm:h-16 lg:h-18 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-royal to-royal/80 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-royal hover:shadow-glow transition-all duration-300 hover:scale-105 cursor-pointer">
              <MapPin className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white drop-shadow-sm" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-black bg-gradient-to-r from-royal to-royal/80 bg-clip-text text-transparent truncate">CityScope</h1>
              <p className="text-xs sm:text-sm text-royal/70 hidden sm:block font-medium tracking-wide">Local Eyes, Real Fix</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onFilterClick}
              className="relative flex-shrink-0 bg-powder/60 hover:bg-powder/80 text-royal rounded-lg sm:rounded-xl hover:scale-105 transition-all duration-300 p-2 sm:p-3"
            >
              <Filter className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              {pendingReports > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-xs p-0 flex items-center justify-center bg-royal text-white rounded-full border-2 border-white"
                >
                  {pendingReports > 9 ? '9+' : pendingReports}
                </Badge>
              )}
            </Button>

            {user ? (
              <UserMenu />
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="flex items-center gap-2 bg-white/50 hover:bg-white/80 border-royal/20 text-royal hover:text-royal rounded-lg sm:rounded-xl hover:scale-105 transition-all duration-300 px-2 sm:px-3"
              >
                <LogIn className="w-4 h-4" />
                <span className="hidden sm:inline text-sm font-medium">Sign In</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-powder/40 safe-area-inset-bottom shadow-2xl">
        <div className="container mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-around h-14 sm:h-16 lg:h-18">
            {navItems.map((item) => (
              <Button
                key={item.id}
                variant="ghost"
                size="sm"
                onClick={() => onTabChange(item.id)}
                className={cn(
                  'flex flex-col items-center gap-0.5 sm:gap-1 h-10 sm:h-12 lg:h-14 px-2 sm:px-3 lg:px-4 transition-all duration-300 min-w-0 rounded-xl sm:rounded-2xl hover:scale-105',
                  activeTab === item.id 
                    ? 'text-white bg-royal shadow-royal scale-105' 
                    : 'text-royal/60 hover:text-royal hover:bg-powder/40'
                )}
              >
                <item.icon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
                <span className="text-xs sm:text-sm font-semibold truncate">{item.label}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Enhanced Floating Action Button */}
        <Button
          onClick={onReportClick}
          className="absolute -top-5 sm:-top-6 lg:-top-7 left-1/2 transform -translate-x-1/2 w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br from-royal to-royal/80 hover:from-royal/90 hover:to-royal/70 shadow-royal hover:shadow-glow transition-all duration-300 hover:scale-110 active:scale-95 group border-2 border-white/20 hover:border-white/40"
        >
          <Plus className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white group-hover:rotate-90 transition-transform duration-300 drop-shadow-sm" />
        </Button>
      </nav>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </>
  );
};