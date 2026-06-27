import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Gift,
  Star,
  Coins,
  Search,
  Filter,
  Trophy,
  Award,
  CreditCard,
  Sparkles,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  MapPin,
  Heart,
  Leaf,
  ShoppingBag,
  Bookmark,
  BookmarkCheck,
  Share2,
  Download,
  Copy,
  ExternalLink,
  Phone,
  Globe,
  Instagram,
  Bell,
  Settings,
  HelpCircle,
  Info,
  Zap,
  Target,
  Crown,
  Shield,
  BookOpen,
  Activity,
  BarChart3,
  PieChart,
  TrendingDown,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  FilterX,
  SortAsc,
  SortDesc,
  Grid3X3,
  List,
  SlidersHorizontal,
  Store
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useRewards } from '@/hooks/useRewards';
import { EnhancedRewardsCatalog } from '@/components/features/rewards/EnhancedRewardsCatalog';
import { MyRewards } from '@/components/features/rewards/MyRewards';
import { PartnerMarketplace } from '@/components/features/rewards/PartnerMarketplace';
import { IndianMakersSection } from '@/components/features/rewards/IndianMakersSection';
import { ConfettiAnimation } from '@/components/features/rewards/ConfettiAnimation';
import { VoucherQRCode } from '@/components/features/rewards/VoucherQRCode';
import { Reward, UserReward, Partner, RedeemRewardResponse } from '@/types/civic';
import { PageHeader } from '@/components/ui/page-header';
import { SectionCard } from '@/components/ui/section-card';
import { EmptyState } from '@/components/ui/empty-state';

interface EnhancedRewardsProps {
  userId: string;
  className?: string;
}

export const EnhancedRewards: React.FC<EnhancedRewardsProps> = ({
  userId,
  className
}) => {
  const {
    userPoints,
    rewards,
    partners,
    userRewards,
    loading,
    error,
    redeemReward,
    refreshAll
  } = useRewards(userId);



  // State management
  const [activeTab, setActiveTab] = useState('catalog');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [redeemResponse, setRedeemResponse] = useState<RedeemRewardResponse | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('points');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarkedRewards, setBookmarkedRewards] = useState<Set<string>>(new Set());
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [achievements, setAchievements] = useState([
    { id: '1', name: 'First Redeemer', description: 'Redeemed your first reward', icon: Trophy, unlocked: true, points: 50 },
    { id: '2', name: 'Eco Warrior', description: 'Redeemed 5 eco-friendly rewards', icon: Leaf, unlocked: false, points: 100 },
    { id: '3', name: 'Loyal Customer', description: 'Redeemed 10 rewards total', icon: Crown, unlocked: false, points: 200 },
    { id: '4', name: 'Community Champion', description: 'Earned 1000+ points', icon: Award, unlocked: userPoints >= 1000, points: 300 }
  ]);

  // Calculate statistics
  const totalRedeemed = userRewards.length;
  // Use 0 for value if it doesn't exist
  const totalValue = userRewards.reduce((sum, reward) => sum + 0, 0);
  const ecoFriendlyRedeemed = userRewards.filter(r =>
    r.reward?.partner?.type === 'recycler' || r.reward?.partner?.type === 'eco-innovator'
  ).length;
  const recentRewards = userRewards.slice(0, 3);
  const expiringSoon = userRewards.filter(r => {
    if (!r.expires_at) return false;
    const daysUntilExpiry = Math.ceil((r.expires_at.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  });

  // Filter and sort rewards
  const filteredRewards = rewards
    .filter(reward => {
      const matchesSearch = reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        reward.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || reward.category === selectedCategory;
      const matchesBookmark = !showBookmarks || bookmarkedRewards.has(reward.id);
      return matchesSearch && matchesCategory && matchesBookmark;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'points':
          return a.points_required - b.points_required;
        case 'value':
          return 0; // Value not in type
        case 'popularity':
          return Math.random() - 0.5; // Mock popularity
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });

  // Handle reward redemption
  const handleRedeem = async (reward: Reward) => {
    try {
      const response = await redeemReward(reward.id);
      if (response.success) {
        setRedeemResponse(response);
        setShowSuccessModal(true);
        toast.success('Reward redeemed successfully! 🎉');
      } else {
        toast.error(response.error || 'Failed to redeem reward');
      }
    } catch (error) {
      console.error('Failed to redeem reward:', error);
      toast.error('Failed to redeem reward');
    }
  };

  // Toggle bookmark
  const toggleBookmark = (rewardId: string) => {
    const newBookmarks = new Set(bookmarkedRewards);
    if (newBookmarks.has(rewardId)) {
      newBookmarks.delete(rewardId);
      toast.success('Removed from bookmarks');
    } else {
      newBookmarks.add(rewardId);
      toast.success('Added to bookmarks');
    }
    setBookmarkedRewards(newBookmarks);
  };

  // Copy voucher code
  const copyVoucherCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Voucher code copied to clipboard!');
  };

  // Share reward
  const shareReward = (reward: Reward) => {
    const shareData = {
      title: reward.name,
      text: `Check out this amazing reward: ${reward.name}`,
      url: `${window.location.origin}/rewards/${reward.id}`
    };

    if (navigator.share) {
      navigator.share(shareData);
    } else {
      navigator.clipboard.writeText(shareData.url);
      toast.success('Reward link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className={cn('mx-auto flex h-full min-h-screen w-full max-w-[1600px] flex-col overflow-hidden px-4 pb-24 pt-4 md:px-8 md:pb-6 md:pt-8 bg-slate-50', className)}>

        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4 hover:shadow-[0_0_15px_rgba(79,70,229,0.5)] transition-shadow"></div>
            <p className="text-slate-500 font-medium text-lg tracking-tight">Loading rewards...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('mx-auto flex h-full min-h-screen w-full max-w-[1600px] flex-col overflow-hidden px-4 pb-24 pt-4 md:px-8 md:pb-6 md:pt-8 bg-slate-50', className)}>
        <div className="py-12 px-4">
          <EmptyState
            icon={<AlertCircle className="w-12 h-12 text-slate-400" />}
            title="Unable to Load Rewards"
            description={error}
            className="w-full max-w-md mx-auto bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100"
            action={
              <Button onClick={refreshAll} className="bg-red-600 hover:bg-red-700 text-white font-bold h-12 rounded-xl shadow-[0_8px_20px_rgb(220,38,38,0.2)]">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('mx-auto flex min-h-screen w-full max-w-[1600px] flex-col overflow-y-auto px-4 pb-24 pt-4 md:px-8 md:pb-6 md:pt-8 bg-slate-50', className)}>


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 w-full">
        <PageHeader
          icon={<Gift className="h-6 w-6" />}
          title="Enhanced Rewards & Marketplace"
          description="Earn points through civic engagement and redeem curated rewards from Indian artisans and eco-innovators."
          className="mb-10 border border-white/60 bg-white/40 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem]"
          titleClassName="bg-gradient-to-br from-slate-900 to-slate-600 bg-clip-text text-transparent font-black tracking-tighter"
          descriptionClassName="text-slate-500 font-medium text-[15px]"
          iconShellClassName="bg-gradient-to-br from-indigo-500 to-purple-500 text-white shadow-[0_4px_20px_rgba(99,102,241,0.4)] rounded-[1.25rem] p-3"
          actions={
            <Badge className="bg-indigo-50/80 backdrop-blur-md text-indigo-700 border-indigo-200/50 px-5 py-2.5 text-[14px] font-black tracking-widest uppercase shadow-sm rounded-xl">
              <Trophy className="w-5 h-5 mr-2 text-indigo-500" />
              {userPoints?.toLocaleString() || 0} Points Available
            </Badge>
          }
        />

        <SectionCard className="mt-4 rounded-[2.5rem] border border-white/60 bg-white/70 backdrop-blur-3xl shadow-[0_12px_40px_rgb(0,0,0,0.06)]" contentClassName="p-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
            <div className="rounded-[1.5rem] border border-white bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-6 shadow-sm transition-all hover:shadow-[0_8px_30px_rgba(99,102,241,0.12)] hover:-translate-y-1 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Gift className="w-5 h-5 text-indigo-500" />
                <span className="text-[13px] font-black tracking-widest uppercase text-slate-500">Available Rewards</span>
              </div>
              <div className="text-[40px] font-black tracking-tighter text-slate-900 leading-none drop-shadow-sm relative z-10">{rewards?.length || 0}</div>
            </div>
            <div className="rounded-[1.5rem] border border-white bg-gradient-to-br from-emerald-50/50 to-teal-50/50 p-6 shadow-sm transition-all hover:shadow-[0_8px_30px_rgba(16,185,129,0.12)] hover:-translate-y-1 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Store className="w-5 h-5 text-emerald-500" />
                <span className="text-[13px] font-black tracking-widest uppercase text-slate-500">Local Partners</span>
              </div>
              <div className="text-[40px] font-black tracking-tighter text-slate-900 leading-none drop-shadow-sm relative z-10">{partners?.length || 0}</div>
            </div>
            <div className="rounded-[1.5rem] border border-white bg-gradient-to-br from-amber-50/50 to-orange-50/50 p-6 shadow-sm transition-all hover:shadow-[0_8px_30px_rgba(245,158,11,0.12)] hover:-translate-y-1 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span className="text-[13px] font-black tracking-widest uppercase text-slate-500">Items Redeemed</span>
              </div>
              <div className="text-[40px] font-black tracking-tighter text-slate-900 leading-none drop-shadow-sm relative z-10">{totalRedeemed}</div>
            </div>
            <div className="rounded-[1.5rem] border border-white bg-gradient-to-br from-cyan-50/50 to-blue-50/50 p-6 shadow-sm transition-all hover:shadow-[0_8px_30px_rgba(6,182,212,0.12)] hover:-translate-y-1 relative overflow-hidden">
              <div className="flex items-center gap-2 mb-3 relative z-10">
                <Coins className="w-5 h-5 text-cyan-500" />
                <span className="text-[13px] font-black tracking-widest uppercase text-slate-500">Total Value</span>
              </div>
              <div className="text-[40px] font-black tracking-tighter text-slate-900 leading-none drop-shadow-sm relative z-10">₹{(totalValue / 100).toLocaleString()}</div>
            </div>
          </div>
        </SectionCard>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Navigation Tabs */}
          <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-white shadow-[0_4px_30px_rgba(0,0,0,0.03)] -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-5 transition-all">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-5 items-start lg:items-center justify-between">
              <TabsList className="grid w-full grid-cols-1 sm:grid-cols-5 max-w-4xl bg-slate-100/50 backdrop-blur-md rounded-[1.5rem] p-2 shadow-inner border border-slate-200/50">
                <TabsTrigger
                  value="catalog"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold tracking-wide text-slate-500 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all hover:bg-white/50"
                >
                  <Gift className="w-4 h-4" />
                  <span className="hidden sm:inline">Rewards Catalog</span>
                  <span className="sm:hidden">Catalog</span>
                </TabsTrigger>
                <TabsTrigger
                  value="indian-makers"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold tracking-wide text-slate-500 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-orange-600 transition-all hover:bg-white/50"
                >
                  <Award className="w-4 h-4" />
                  <span className="hidden sm:inline">Indian Makers</span>
                  <span className="sm:hidden">Makers</span>
                </TabsTrigger>
                <TabsTrigger
                  value="my-rewards"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold tracking-wide text-slate-500 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all hover:bg-white/50"
                >
                  <Trophy className="w-4 h-4" />
                  <span className="hidden sm:inline">My Rewards</span>
                  <span className="sm:hidden">My Rewards</span>
                </TabsTrigger>
                <TabsTrigger
                  value="partners"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold tracking-wide text-slate-500 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 transition-all hover:bg-white/50"
                >
                  <Store className="w-4 h-4" />
                  <span className="hidden sm:inline">Partners</span>
                  <span className="sm:hidden">Partners</span>
                </TabsTrigger>
                <TabsTrigger
                  value="analytics"
                  className="flex items-center justify-center gap-2 py-3 rounded-xl font-bold tracking-wide text-slate-500 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all hover:bg-white/50"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span className="hidden sm:inline">Analytics</span>
                  <span className="sm:hidden">Analytics</span>
                </TabsTrigger>
              </TabsList>

              {/* Quick Actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 font-bold h-10 rounded-xl text-slate-700 bg-white border-slate-200 hover:bg-slate-50 shadow-sm"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Filters
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBookmarks(!showBookmarks)}
                  className="flex items-center gap-2 font-bold h-10 rounded-xl text-slate-700 bg-white border-slate-200 hover:bg-slate-50 shadow-sm"
                >
                  <Bookmark className="w-4 h-4" />
                  Bookmarks
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshAll}
                  className="flex items-center gap-2 font-bold h-10 rounded-xl text-slate-700 bg-white border-slate-200 hover:bg-slate-50 shadow-sm"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 p-5 bg-white border border-slate-100 rounded-[1.25rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <Input
                      placeholder="Search rewards..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-11 bg-slate-50/50 border-slate-200 rounded-[0.85rem] focus:ring-indigo-500 font-medium"
                    />
                  </div>

                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 rounded-[0.85rem] font-medium text-slate-600 focus:ring-indigo-500">
                      <Filter className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="recognition">Recognition</SelectItem>
                      <SelectItem value="experience">Experience</SelectItem>
                      <SelectItem value="voucher">Voucher</SelectItem>
                      <SelectItem value="discount">Discount</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-11 bg-slate-50/50 border-slate-200 rounded-[0.85rem] font-medium text-slate-600 focus:ring-indigo-500">
                      <SortAsc className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200">
                      <SelectItem value="points">Points Required</SelectItem>
                      <SelectItem value="value">Value</SelectItem>
                      <SelectItem value="popularity">Popularity</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className={cn("h-11 w-11 p-0 rounded-[0.85rem] shadow-sm", viewMode === 'grid' ? "bg-indigo-600 text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50")}
                    >
                      <Grid3X3 className="w-5 h-5" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className={cn("h-11 w-11 p-0 rounded-[0.85rem] shadow-sm", viewMode === 'list' ? "bg-indigo-600 text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50")}
                    >
                      <List className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Tab Content */}
          <div className="mt-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <TabsContent value="catalog" className="space-y-6">
                  <div data-tutorial="rewards-catalog">
                    <EnhancedRewardsCatalog
                      rewards={filteredRewards}
                      userPoints={userPoints || 0}
                      onRedeem={handleRedeem}
                      viewMode={viewMode}
                      onToggleBookmark={toggleBookmark}
                      bookmarkedRewards={bookmarkedRewards}
                      onShare={shareReward}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="indian-makers" className="space-y-6">
                  <IndianMakersSection />
                </TabsContent>

                <TabsContent value="my-rewards" className="space-y-6">
                  <MyRewards
                    userRewards={userRewards || []}
                    achievements={achievements}
                    expiringSoon={expiringSoon}
                    totalValue={totalValue}
                    ecoFriendlyRedeemed={ecoFriendlyRedeemed}
                  />
                </TabsContent>

                <TabsContent value="partners" className="space-y-6">
                  <div data-tutorial="partners-section">
                    <PartnerMarketplace partners={partners || []} />
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Rewards Overview */}
                    <Card className="rounded-[1.5rem] bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.04)] overflow-hidden">
                      <CardHeader className="border-b border-indigo-50/50 pb-4">
                        <CardTitle className="flex items-center gap-2 text-[15px] font-black tracking-widest uppercase text-slate-800">
                          <BarChart3 className="w-5 h-5 text-indigo-500 drop-shadow-sm" />
                          Rewards Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 pt-6 relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/20 to-transparent pointer-events-none" />
                        <div className="grid grid-cols-2 gap-4 relative z-10">
                          <div className="text-center p-5 bg-white/60 backdrop-blur-md rounded-[1.25rem] border border-white/80 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-transform hover:-translate-y-1">
                            <div className="text-[32px] font-black tracking-tighter bg-gradient-to-br from-indigo-600 to-purple-600 bg-clip-text text-transparent leading-none mb-2">{totalRedeemed}</div>
                            <div className="text-[11px] font-black tracking-widest uppercase text-slate-400">Total Redeemed</div>
                          </div>
                          <div className="text-center p-5 bg-white/60 backdrop-blur-md rounded-[1.25rem] border border-white/80 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-transform hover:-translate-y-1">
                            <div className="text-[32px] font-black tracking-tighter bg-gradient-to-br from-emerald-500 to-teal-500 bg-clip-text text-transparent leading-none mb-2">₹{(totalValue / 100).toLocaleString()}</div>
                            <div className="text-[11px] font-black tracking-widest uppercase text-slate-400">Total Value</div>
                          </div>
                        </div>
                        <div className="space-y-3 mt-8 p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50 relative z-10">
                          <div className="flex justify-between items-center text-sm">
                            <span className="font-bold text-slate-600">Eco-Friendly Impact</span>
                            <span className="font-black text-emerald-600 px-2 py-0.5 bg-emerald-100 rounded-md text-xs">{ecoFriendlyRedeemed} Rewards</span>
                          </div>
                          <Progress value={totalRedeemed > 0 ? (ecoFriendlyRedeemed / totalRedeemed) * 100 : 0} className="h-2.5 bg-white/80 border border-emerald-100/50" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="rounded-[1.5rem] bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.04)] overflow-hidden">
                      <CardHeader className="border-b border-indigo-50/50 pb-4">
                        <CardTitle className="flex items-center gap-2 text-[15px] font-black tracking-widest uppercase text-slate-800">
                          <Activity className="w-5 h-5 text-indigo-500 drop-shadow-sm" />
                          Recent Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6 relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-purple-50/20 to-transparent pointer-events-none" />
                        <div className="space-y-3 relative z-10">
                          {recentRewards.length > 0 ? recentRewards.map((reward, index) => (
                            <div key={index} className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/80 transition-all hover:bg-white hover:shadow-sm hover:-translate-y-0.5">
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100/50 rounded-xl flex items-center justify-center shrink-0 shadow-inner">
                                <Gift className="w-5 h-5 text-indigo-500" />
                              </div>
                              <div className="flex-1">
                                <div className="font-black tracking-tight text-slate-900 text-[15px] mb-0.5">{reward.reward?.name}</div>
                                <div className="text-[12px] font-bold tracking-widest uppercase text-slate-400">
                                  {new Date(reward.created_at).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="text-[15px] font-black text-indigo-600 tracking-tight bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 shadow-sm">
                                -{reward.reward?.points_required || 0} pts
                              </div>
                            </div>
                          )) : (
                            <div className="text-[14px] font-medium text-slate-500 text-center py-8 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">No recent activity</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Achievements */}
                    <Card className="rounded-[1.5rem] bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.04)] overflow-hidden">
                      <CardHeader className="border-b border-indigo-50/50 pb-4">
                        <CardTitle className="flex items-center gap-2 text-[15px] font-black tracking-widest uppercase text-slate-800">
                          <Award className="w-5 h-5 text-indigo-500 drop-shadow-sm" />
                          Recent Achievements
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6 relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-amber-50/20 to-transparent pointer-events-none" />
                        <div className="space-y-3 relative z-10">
                          {achievements.slice(0, 3).map((achievement) => (
                            <div key={achievement.id} className={cn(
                              "flex items-center gap-4 p-3.5 rounded-2xl border transition-all backdrop-blur-sm",
                              achievement.unlocked
                                ? "bg-amber-50/40 border-amber-200/50 hover:shadow-sm hover:-translate-y-0.5"
                                : "bg-white/40 border-slate-100 opacity-70 grayscale-[0.2]"
                            )}>
                              <div className={cn(
                                "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                                achievement.unlocked
                                  ? "bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 border border-amber-200/50"
                                  : "bg-slate-100 text-slate-400 border border-slate-200"
                              )}>
                                <achievement.icon className={cn("w-6 h-6", achievement.unlocked && "drop-shadow-sm")} />
                              </div>
                              <div className="flex-1">
                                <div className={cn("font-black tracking-tight text-[15px] mb-0.5", achievement.unlocked ? "text-slate-900" : "text-slate-500")}>{achievement.name}</div>
                                <div className="text-[12px] font-medium leading-tight text-slate-500">{achievement.description}</div>
                              </div>
                              <div className={cn("text-[13px] font-black tracking-tight px-3 py-1 rounded-lg border shadow-sm", achievement.unlocked ? "text-amber-600 bg-amber-50 border-amber-200" : "text-slate-400 bg-slate-50 border-slate-200")}>
                                +{achievement.points} pts
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Points History */}
                    <Card className="rounded-[1.5rem] bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.04)] overflow-hidden mt-6 lg:mt-0 lg:col-span-2">
                      <CardHeader className="border-b border-indigo-50/50 pb-4">
                        <CardTitle className="flex items-center gap-2 text-[15px] font-black tracking-widest uppercase text-slate-800">
                          <TrendingUp className="w-5 h-5 text-indigo-500 drop-shadow-sm" />
                          Points History
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="pt-6 relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/20 to-transparent pointer-events-none" />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
                          <div className="flex flex-col p-5 bg-white/60 backdrop-blur-md rounded-[1.25rem] border border-white/80 shadow-sm transition-transform hover:-translate-y-1">
                            <span className="text-[11px] font-black tracking-widest uppercase text-slate-400 mb-2">Current Points</span>
                            <span className="text-[36px] font-black tracking-tighter bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent leading-none">{userPoints?.toLocaleString()}</span>
                          </div>
                          <div className="flex flex-col p-5 bg-white/60 backdrop-blur-md rounded-[1.25rem] border border-white/80 shadow-sm transition-transform hover:-translate-y-1">
                            <span className="text-[11px] font-black tracking-widest uppercase text-slate-400 mb-2">Points Spent</span>
                            <span className="text-[36px] font-black tracking-tighter bg-gradient-to-br from-indigo-500 to-purple-500 bg-clip-text text-transparent leading-none">
                              -{userRewards.reduce((sum, r) => sum + (r.reward?.points_required || 0), 0).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex flex-col p-5 bg-white/60 backdrop-blur-md rounded-[1.25rem] border border-white/80 shadow-sm transition-transform hover:-translate-y-1">
                            <span className="text-[11px] font-black tracking-widest uppercase text-slate-400 mb-2">Total Earned</span>
                            <span className="text-[36px] font-black tracking-tighter bg-gradient-to-br from-emerald-500 to-teal-500 bg-clip-text text-transparent leading-none">
                              +{(userPoints || 0) + userRewards.reduce((sum, r) => sum + (r.reward?.points_required || 0), 0).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-md w-full border-slate-100 rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-0 overflow-hidden hide-dialog-close">
          <div className="p-8 pb-6">
            <DialogHeader>
              <DialogTitle className="text-center text-3xl font-black tracking-tighter text-indigo-600 flex flex-col items-center justify-center gap-2 mb-2">
                <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center mb-2">
                  <Sparkles className="w-8 h-8" />
                </div>
                Reward Redeemed!
              </DialogTitle>
              <DialogDescription className="text-center text-lg font-medium text-slate-500">
                Congratulations! Your reward has been successfully redeemed.
              </DialogDescription>
            </DialogHeader>

            {redeemResponse && (
              <div className="space-y-6 mt-6">
                <div className="text-center bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                  <p className="text-xl font-bold tracking-tight text-slate-900 mb-1">{redeemResponse.reward_name || 'Reward'}</p>
                  <p className="text-[15px] font-semibold text-indigo-600">Partner: {redeemResponse.partner_name || 'Partner'}</p>
                </div>

                <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed border-slate-200">
                  <div className="text-center">
                    <p className="text-[13px] font-bold tracking-widest uppercase text-slate-500 mb-4">Your Voucher Code</p>
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-4">
                      <p className="font-mono text-2xl font-black text-slate-900 tracking-wider break-all">{redeemResponse.voucher_code || ''}</p>
                    </div>
                    <VoucherQRCode
                      voucherCode={redeemResponse.voucher_code || ''}
                      rewardName={redeemResponse.reward_name || 'Reward'}
                      partnerName={redeemResponse.partner_name || 'Partner'}
                    />
                  </div>
                </div>

                <div className="text-center bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
                  <p className="text-sm font-bold text-indigo-700">
                    📱 Show this QR code to the partner to redeem your reward
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-6 pt-0 bg-slate-50/50">
            <DialogFooter>
              <Button
                onClick={() => setShowSuccessModal(false)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-bold h-14 rounded-xl transition-all"
              >
                <CheckCircle className="w-5 h-5 mr-2" />
                Awesome! Got it
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confetti Animation */}
      <ConfettiAnimation isActive={showSuccessModal} />
    </div>
  );
};
