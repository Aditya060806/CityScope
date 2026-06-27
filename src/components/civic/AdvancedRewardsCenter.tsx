import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Gift, 
  Star, 
  Trophy, 
  Coins, 
  CreditCard, 
  Mail, 
  Smartphone,
  Award,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Sparkles,
  Crown,
  Zap,
  Target,
  Users,
  Calendar,
  MapPin,
  ShoppingBag,
  Gamepad2,
  Camera,
  Music,
  BookOpen,
  Heart,
  Shield,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Download,
  Share2,
  Filter,
  Search,
  SortAsc,
  SortDesc,
  RefreshCw,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
  CheckCircle2,
  X,
  ExternalLink,
  Copy,
  QrCode,
  Bell,
  BellOff,
  Settings,
  User,
  LogOut,
  Home,
  Menu,
  MoreHorizontal,
  Star as StarIcon,
  Heart as HeartIcon,
  MessageCircle,
  ThumbsUp,
  ThumbsDown,
  Flag,
  Share,
  Bookmark,
  BookmarkCheck,
  Calendar as CalendarIcon,
  Clock as ClockIcon,
  MapPin as MapPinIcon,
  Phone,
  Mail as MailIcon,
  Globe,
  Instagram,
  Twitter,
  Facebook,
  Linkedin,
  Youtube,
  Github,
  Gitlab,
  Discord,
  Slack,
  Telegram,
  Whatsapp,
  Reddit,
  Pinterest,
  Snapchat,
  Tiktok,
  Twitch,
  Spotify,
  Apple,
  Google,
  Microsoft,
  Amazon,
  Netflix,
  Uber,
  Airbnb,
  Paypal,
  Visa,
  Mastercard,
  Amex,
  Discover,
  Bitcoin,
  Ethereum,
  Dogecoin,
  Solana,
  Polygon,
  Chainlink,
  Uniswap,
  Pancakeswap,
  Sushiswap,
  Compound,
  Aave,
  Maker,
  Curve,
  Yearn,
  Balancer,
  Synthetix,
  Ren,
  Kyber,
  Bancor,
  Loopring,
  Zksync,
  Arbitrum,
  Optimism,
  Avalanche,
  Fantom,
  Harmony,
  Near,
  Algorand,
  Cosmos,
  Polkadot,
  Cardano,
  Solana as SolanaIcon,
  Terra,
  Luna,
  Atom,
  Osmosis,
  Juno,
  Secret,
  Akash,
  Band,
  Kava,
  Regen,
  Sentinel,
  Persistence,
  Iris,
  Ixo,
  Likecoin,
  Desmos,
  Starname,
  Bitsong,
  Comdex,
  Cheqd,
  Stargaze,
  Chihuahua,
  Gravity,
  Umee,
  Evmos,
  Canto,
  Injective,
  Kujira,
  Nomic,
  Noble,
  Quicksilver,
  Sommelier,
  Stride,
  Crescent,
  Assetmantle,
  Passage,
  Teritori,
  Archway,
  Celestia,
  Dymension,
  Rollkit,
  Sovereign,
  Polygon as PolygonIcon,
  Arbitrum as ArbitrumIcon,
  Optimism as OptimismIcon,
  Base,
  Linea,
  Scroll,
  Mantle,
  Blast,
  Mode,
  Frax,
  Metis,
  Boba,
  Aurora,
  Celo,
  Gnosis,
  Moonbeam,
  Moonriver,
  Astar,
  Shiden,
  Karura,
  Bifrost,
  Centrifuge,
  Hydradx,
  Interlay,
  Kilt,
  Litentry,
  OriginTrail,
  Phala,
  Polkadex,
  Sora,
  Subsocial,
  Unique,
  Zeitgeist,
  Acala,
  Altair,
  Basilisk,
  Calamari,
  Crust,
  Darwinia,
  Edgeware,
  Equilibrium,
  Integritee,
  Kilt as KiltIcon,
  Litmus,
  Mangata,
  Nodle,
  Parallel,
  Picasso,
  Quartz,
  Robonomics,
  Sora as SoraIcon,
  Subspace,
  Ternoa,
  Unique as UniqueIcon,
  Zeitgeist as ZeitgeistIcon
} from 'lucide-react';
import { rewardsService, Reward, UserReward, UserPoints, PointsTransaction } from '@/services/RewardsService';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AdvancedRewardsCenterProps {
  className?: string;
}

export const AdvancedRewardsCenter: React.FC<AdvancedRewardsCenterProps> = ({ className }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [userRewards, setUserRewards] = useState<UserReward[]>([]);
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null);
  const [pointsHistory, setPointsHistory] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReward, setSelectedReward] = useState<Reward | null>(null);
  const [showRedeemDialog, setShowRedeemDialog] = useState(false);
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('rewards');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'points' | 'name' | 'category'>('points');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Form state for redemption
  const [redemptionForm, setRedemptionForm] = useState({
    upi_id: '',
    email: '',
    phone: '',
    address: '',
    notes: ''
  });

  useEffect(() => {
    if (user) {
      loadRewardsData();
    }
  }, [user, loadRewardsData]);

  const loadRewardsData = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      const [rewardsData, userRewardsData, userPointsData, pointsHistoryData] = await Promise.all([
        rewardsService.getAvailableRewards(),
        rewardsService.getUserRewards(user.id),
        rewardsService.getUserPoints(user.id),
        rewardsService.getPointsHistory(user.id)
      ]);

      setRewards(rewardsData);
      setUserRewards(userRewardsData);
      setUserPoints(userPointsData);
      setPointsHistory(pointsHistoryData);
    } catch (error) {
      console.error('Error loading rewards data:', error);
      toast({
        title: "Error",
        description: "Failed to load rewards data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const handleRedeemReward = async () => {
    if (!selectedReward || !user) return;

    try {
      setRedeemLoading(true);

      // Validate form based on reward type
      if (selectedReward.category === 'cash' && !redemptionForm.upi_id) {
        toast({
          title: "UPI ID Required",
          description: "Please enter your UPI ID for cash rewards",
          variant: "destructive"
        });
        return;
      }

      if (selectedReward.category === 'voucher' && !redemptionForm.email) {
        toast({
          title: "Email Required",
          description: "Please enter your email for voucher delivery",
          variant: "destructive"
        });
        return;
      }

      const userReward = await rewardsService.redeemReward(
        user.id,
        selectedReward.id,
        redemptionForm
      );

      toast({
        title: "🎉 Reward Redeemed!",
        description: `Your ${selectedReward.name} has been processed successfully!`,
      });

      // Refresh data
      await loadRewardsData();
      setShowRedeemDialog(false);
      setSelectedReward(null);
      setRedemptionForm({
        upi_id: '',
        email: '',
        phone: '',
        address: '',
        notes: ''
      });
    } catch (error: unknown) {
      toast({
        title: "Redemption Failed",
        description: error.message || "Failed to redeem reward",
        variant: "destructive"
      });
    } finally {
      setRedeemLoading(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'cash': return <CreditCard className="w-5 h-5" />;
      case 'voucher': return <Gift className="w-5 h-5" />;
      case 'discount': return <Percent className="w-5 h-5" />;
      case 'experience': return <Star className="w-5 h-5" />;
      case 'recognition': return <Trophy className="w-5 h-5" />;
      default: return <Gift className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cash': return 'bg-green-100 text-green-800 border-green-200';
      case 'voucher': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'discount': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'experience': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'recognition': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing': return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'expired': return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredRewards = rewards
    .filter(reward => {
      const matchesSearch = reward.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           reward.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'all' || reward.category === filterCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'points':
          comparison = a.points_required - b.points_required;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'category':
          comparison = a.category.localeCompare(b.category);
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-royal" />
      </div>
    );
  }

  return (
    <div className={cn("space-y-8", className)}>
      {/* Header with Points Summary */}
      <div className="relative overflow-hidden bg-gradient-to-br from-royal via-royal/90 to-powder rounded-3xl p-8 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-royal/20 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-white/10 to-transparent rounded-full blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-black mb-2">🎁 Rewards Center</h1>
              <p className="text-white/80 text-lg">Earn points, redeem amazing rewards!</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-black">{userPoints?.total_points || 0}</div>
              <div className="text-white/80">Total Points</div>
            </div>
          </div>

          {/* Points Progress */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white/90 font-semibold">Level Progress</span>
              <span className="text-white/90 font-semibold">{userPoints?.level || 'Newcomer'}</span>
            </div>
            <Progress 
              value={userPoints?.progress_percentage || 0} 
              className="h-3 bg-white/20"
            />
            <div className="flex items-center justify-between text-sm text-white/80">
              <span>Next Level: {userPoints?.next_level_points || 500} points</span>
              <span>Rank #{userPoints?.rank || 1}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="card-sleek">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center">
                <Coins className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-black text-green-600">{userPoints?.available_points || 0}</div>
                <div className="text-gray-600 font-semibold">Available Points</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-sleek">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center">
                <Gift className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-black text-blue-600">{userRewards.length}</div>
                <div className="text-gray-600 font-semibold">Rewards Redeemed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-sleek">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-black text-purple-600">{userPoints?.level || 'Newcomer'}</div>
                <div className="text-gray-600 font-semibold">Current Level</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-sleek">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-black text-orange-600">#{userPoints?.rank || 1}</div>
                <div className="text-gray-600 font-semibold">Community Rank</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-white/50 backdrop-blur-sm">
          <TabsTrigger value="rewards" className="flex items-center gap-2">
            <Gift className="w-4 h-4" />
            Rewards
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="points" className="flex items-center gap-2">
            <Coins className="w-4 h-4" />
            Points
          </TabsTrigger>
          <TabsTrigger value="leaderboard" className="flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Leaderboard
          </TabsTrigger>
        </TabsList>

        {/* Rewards Tab */}
        <TabsContent value="rewards" className="space-y-6">
          {/* Filters and Search */}
          <Card className="card-sleek">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search rewards..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="cash">Cash Rewards</SelectItem>
                    <SelectItem value="voucher">Vouchers</SelectItem>
                    <SelectItem value="discount">Discounts</SelectItem>
                    <SelectItem value="experience">Experiences</SelectItem>
                    <SelectItem value="recognition">Recognition</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(value: React.ChangeEvent<HTMLInputElement>) => setSortBy(value)}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="points">Points Required</SelectItem>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="category">Category</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="w-full md:w-auto"
                >
                  {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Rewards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRewards.map((reward) => (
              <Card key={reward.id} className="card-sleek group hover:shadow-sleek-lg transition-all duration-300">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-royal/10 to-royal/20 rounded-2xl flex items-center justify-center">
                        {getCategoryIcon(reward.category)}
                      </div>
                      <div>
                        <CardTitle className="text-lg font-bold line-clamp-2">{reward.name}</CardTitle>
                        <Badge className={cn("mt-2", getCategoryColor(reward.category))}>
                          {reward.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-royal">{reward.points_required}</div>
                      <div className="text-sm text-gray-500">points</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600 text-sm line-clamp-3">{reward.description}</p>
                  
                  {reward.value > 0 && (
                    <div className="flex items-center gap-2 text-green-600 font-semibold">
                      <CreditCard className="w-4 h-4" />
                      Value: ₹{reward.value / 100}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Available: {reward.max_redemptions - reward.current_redemptions}</span>
                    <span>Limit: {reward.max_redemptions}</span>
                  </div>

                  <Button
                    onClick={() => {
                      setSelectedReward(reward);
                      setShowRedeemDialog(true);
                    }}
                    disabled={userPoints?.available_points < reward.points_required || reward.current_redemptions >= reward.max_redemptions}
                    className="w-full btn-royal"
                  >
                    {userPoints?.available_points < reward.points_required ? 'Insufficient Points' : 'Redeem Now'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card className="card-sleek">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Reward History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userRewards.map((userReward) => (
                  <div key={userReward.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-royal/10 to-royal/20 rounded-2xl flex items-center justify-center">
                        {getCategoryIcon(userReward.reward?.category || 'gift')}
                      </div>
                      <div>
                        <div className="font-semibold">{userReward.reward?.name}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(userReward.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-semibold text-royal">{userReward.points_spent} points</div>
                        <div className="text-sm text-gray-500">{userReward.status}</div>
                      </div>
                      {getStatusIcon(userReward.status)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Points Tab */}
        <TabsContent value="points" className="space-y-6">
          <Card className="card-sleek">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                Points History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pointsHistory.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center",
                        transaction.type === 'earned' ? 'bg-green-100' : 'bg-red-100'
                      )}>
                        {transaction.type === 'earned' ? (
                          <Plus className="w-6 h-6 text-green-600" />
                        ) : (
                          <Minus className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-semibold">{transaction.description}</div>
                        <div className="text-sm text-gray-500">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className={cn(
                      "font-semibold",
                      transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {transaction.type === 'earned' ? '+' : '-'}{transaction.amount}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="space-y-6">
          <Card className="card-sleek">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Community Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p>Leaderboard coming soon!</p>
                <p className="text-sm">Compete with other citizens and climb the ranks.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Redemption Dialog */}
      <Dialog open={showRedeemDialog} onOpenChange={setShowRedeemDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="w-5 h-5" />
              Redeem {selectedReward?.name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedReward && (
            <div className="space-y-6">
              {/* Reward Details */}
              <div className="p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-royal/10 to-royal/20 rounded-2xl flex items-center justify-center">
                    {getCategoryIcon(selectedReward.category)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{selectedReward.name}</h3>
                    <p className="text-gray-600 text-sm">{selectedReward.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <Badge className={getCategoryColor(selectedReward.category)}>
                        {selectedReward.category}
                      </Badge>
                      <span className="text-royal font-bold">{selectedReward.points_required} points</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {selectedReward.category === 'cash' && (
                  <div>
                    <Label htmlFor="upi_id">UPI ID *</Label>
                    <Input
                      id="upi_id"
                      placeholder="yourname@paytm"
                      value={redemptionForm.upi_id}
                      onChange={(e) => setRedemptionForm(prev => ({ ...prev, upi_id: e.target.value }))}
                    />
                  </div>
                )}

                {(selectedReward.category === 'voucher' || selectedReward.category === 'discount') && (
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your@email.com"
                      value={redemptionForm.email}
                      onChange={(e) => setRedemptionForm(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={redemptionForm.phone}
                    onChange={(e) => setRedemptionForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Additional Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any special instructions..."
                    value={redemptionForm.notes}
                    onChange={(e) => setRedemptionForm(prev => ({ ...prev, notes: e.target.value }))}
                  />
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
                <h4 className="font-semibold text-yellow-800 mb-2">Terms & Conditions</h4>
                <p className="text-sm text-yellow-700">{selectedReward.terms_and_conditions}</p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={() => setShowRedeemDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleRedeemReward}
                  disabled={redeemLoading}
                  className="flex-1 btn-royal"
                >
                  {redeemLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Redeem Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Add missing Percent icon
const Percent = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);
