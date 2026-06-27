import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserMenu } from '@/components/auth/UserMenu';
import { NotificationDropdown } from '@/components/notifications/NotificationDropdown';
import { 
  Home, 
  Map, 
  Trophy, 
  Gift, 
  User, 
  Plus, 
  Filter,
  Bell,
  Menu,
  X,
  BarChart3,
  MessageCircle,
  Github
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface EnhancedNavigationBarProps {
  onReportClick: () => void;
  onFilterClick: () => void;
  pendingReports?: number;
}

export const EnhancedNavigationBar: React.FC<EnhancedNavigationBarProps> = ({
  onReportClick,
  onFilterClick,
  pendingReports = 0
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'map', label: 'Map', icon: Map, path: '/map' },
    { id: 'heroes', label: 'Heroes', icon: Trophy, path: '/heroes' },
    { id: 'rewards', label: 'Rewards', icon: Gift, path: '/rewards' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/analytics' },
    { id: 'profile', label: 'Profile', icon: User, path: '/profile' },
  ];

  const activeTab = navItems.find(item => item.path === location.pathname)?.id || 'home';

  const NavButton = ({ item, isMobile = false }: { item: typeof navItems[0], isMobile?: boolean }) => (
    <Button
      variant={activeTab === item.id ? 'default' : 'ghost'}
      onClick={() => {
        navigate(item.path);
        if (isMobile) setIsMobileMenuOpen(false);
      }}
      className={cn(
        'relative transition-all duration-300',
        isMobile ? 'w-full justify-start' : 'flex-col h-auto py-3 px-4',
        activeTab === item.id
          ? 'bg-royal text-white shadow-sleek hover:bg-royal/90'
          : 'text-gray-600 hover:text-royal hover:bg-royal/5'
      )}
    >
      <item.icon className={cn('w-5 h-5', !isMobile && 'mb-1')} />
      <span className={cn('text-xs font-semibold', isMobile && 'ml-3 text-sm')}>
        {item.label}
      </span>
      {activeTab === item.id && !isMobile && (
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
      )}
    </Button>
  );

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-sleek">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-royal to-royal/80 rounded-xl flex items-center justify-center shadow-sleek">
                <span className="text-white font-black text-lg">C</span>
              </div>
              <div>
                <h1 className="text-xl font-black text-gray-900">CityScope</h1>
                <p className="text-xs text-gray-500 font-medium">Civic Engagement Platform</p>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="flex items-center gap-2" data-tutorial="navigation">
              {navItems.map((item) => (
                <NavButton key={item.id} item={item} />
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={onFilterClick}
                className="border-royal/20 text-royal hover:bg-royal/5 hover:border-royal/40"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
              
              <Button
                onClick={onReportClick}
                className="btn-royal px-6 py-2 rounded-xl font-bold"
              >
                <Plus className="w-4 h-4 mr-2" />
                Report
              </Button>

              {/* GitHub Link */}
              <a
                href="https://github.com/Aditya060806"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 hover:border-royal/40 bg-white hover:bg-royal/5 text-gray-600 hover:text-royal transition-all duration-200 hover:scale-105"
                title="View on GitHub"
                aria-label="GitHub Profile"
              >
                <Github className="w-5 h-5" />
              </a>

              {/* Notifications */}
              <NotificationDropdown />

              {/* User Menu */}
              <UserMenu />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200/50 shadow-sleek">
        <div className="flex items-center justify-between h-16 px-4">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-royal to-royal/80 rounded-lg flex items-center justify-center">
              <span className="text-white font-black text-sm">C</span>
            </div>
            <span className="text-lg font-black text-gray-900">CityScope</span>
          </div>

          {/* Mobile Action Buttons */}
          <div className="flex items-center gap-2">
            {/* GitHub Link - Mobile */}
            <a
              href="https://github.com/Aditya060806"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-gray-200 hover:border-royal/40 bg-white hover:bg-royal/5 text-gray-600 hover:text-royal transition-all duration-200"
              title="View on GitHub"
              aria-label="GitHub Profile"
            >
              <Github className="w-5 h-5" />
            </a>

            {/* Mobile Notifications */}
            <NotificationDropdown />
            
            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-royal hover:bg-royal/5"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 right-0 bg-white border-b border-gray-200/50 shadow-sleek-lg">
            <div className="p-4 space-y-2">
              {navItems.map((item) => (
                <NavButton key={item.id} item={item} isMobile />
              ))}
              
              <div className="pt-4 border-t border-gray-200/50 space-y-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    onFilterClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start border-royal/20 text-royal hover:bg-royal/5"
                >
                  <Filter className="w-5 h-5 mr-3" />
                  Filter Issues
                </Button>
                
                <Button
                  onClick={() => {
                    onReportClick();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start btn-royal"
                >
                  <Plus className="w-5 h-5 mr-3" />
                  Report Issue
                </Button>
                
                {/* Mobile Notifications */}
                <div className="w-full">
                  <NotificationDropdown />
                </div>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 shadow-sleek-lg pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              onClick={() => navigate(item.path)}
              className={cn(
                'flex-col h-auto py-2 px-3 transition-all duration-300',
                activeTab === item.id
                  ? 'text-royal bg-royal/10'
                  : 'text-gray-600 hover:text-royal hover:bg-royal/5'
              )}
            >
              <item.icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-semibold">{item.label}</span>
              {activeTab === item.id && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-royal rounded-t-full" />
              )}
            </Button>
          ))}
        </div>
      </nav>

      {/* Floating Action Button for Mobile */}
      <Button
        onClick={onReportClick}
        className="md:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-full btn-royal shadow-sleek-xl hover:scale-110 transition-all duration-300"
      >
        <Plus className="w-6 h-6" />
      </Button>

      {/* Mobile Menu Backdrop */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
};