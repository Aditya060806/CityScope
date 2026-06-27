import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useRewards } from '@/hooks/useRewards';
import { EnhancedRewardsCatalog } from './EnhancedRewardsCatalog';
import { MyRewards } from './MyRewards';
import { PartnerMarketplace } from './PartnerMarketplace';
import { ConfettiAnimation } from './ConfettiAnimation';
import { VoucherQRCode } from './VoucherQRCode';
import { 
  Gift, 
  Star, 
  ShoppingBag, 
  Store, 
  Trophy,
  CheckCircle,
  ExternalLink,
  QrCode,
  Copy,
  Phone,
  Globe,
  Instagram,
  Sparkles,
  Heart,
  Leaf,
  Users,
  MapPin,
  Clock,
  Award,
  TrendingUp,
  Activity,
  Zap,
  Target,
  Crown,
  Shield,
  BookOpen,
  Calendar,
  CreditCard,
  Download,
  Share2,
  Bell,
  Settings,
  HelpCircle,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { RedeemRewardResponse, Reward } from '@/types/civic';
import { motion, AnimatePresence } from 'framer-motion';

interface EnhancedRewardsMarketplaceProps {
  userId: string;
  className?: string;
}

export const EnhancedRewardsMarketplace: React.FC<EnhancedRewardsMarketplaceProps> = ({
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
    redeemReward
  } = useRewards(userId);
  
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [redeemResponse, setRedeemResponse] = useState<RedeemRewardResponse | null>(null);
  const [activeTab, setActiveTab] = useState('catalog');

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

  const copyVoucherCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Voucher code copied to clipboard!');
  };

  const copyPartnerContact = (contact: string) => {
    navigator.clipboard.writeText(contact);
    toast.success('Contact info copied to clipboard!');
  };

  if (loading) {
    return (
      <div className={cn('min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50', className)}>
        <div className="flex items-center justify-center min-h-[500px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg">Loading rewards...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50', className)}>
        <div className="text-center py-12">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
            <div className="text-red-600 text-xl font-semibold mb-2">Unable to Load Rewards</div>
            <p className="text-red-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50', className)}>
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-blue-900/90 to-indigo-900/90"></div>
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
                🎁 Rewards & Marketplace
              </h1>
              <p className="text-xl sm:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
                Earn points through civic engagement and redeem amazing rewards from authentic Indian artisans and eco-innovators
              </p>
            </motion.div>
            
            {/* Points Display */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm border border-white/30 rounded-full px-8 py-4 text-white"
            >
              <Trophy className="w-6 h-6 text-yellow-300" />
              <span className="text-2xl font-bold">{userPoints?.toLocaleString() || 0}</span>
              <span className="text-lg">Points Available</span>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Gift className="w-5 h-5 text-blue-300" />
                  <span className="text-sm font-medium">Available Rewards</span>
                </div>
                <div className="text-2xl font-bold">{rewards?.length || 0}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Store className="w-5 h-5 text-green-300" />
                  <span className="text-sm font-medium">Partners</span>
                </div>
                <div className="text-2xl font-bold">{partners?.length || 0}</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Trophy className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm font-medium">Redeemed</span>
                </div>
                <div className="text-2xl font-bold">{userRewards?.length || 0}</div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Navigation Tabs */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-4">
            <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 max-w-2xl mx-auto bg-gray-100">
              <TabsTrigger 
                value="catalog" 
                className="flex items-center gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Gift className="w-5 h-5" />
                <span className="hidden sm:inline">Rewards Catalog</span>
                <span className="sm:hidden">Catalog</span>
              </TabsTrigger>
              <TabsTrigger 
                value="my-rewards" 
                className="flex items-center gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Trophy className="w-5 h-5" />
                <span className="hidden sm:inline">My Rewards</span>
                <span className="sm:hidden">My Rewards</span>
              </TabsTrigger>
              <TabsTrigger 
                value="partners" 
                className="flex items-center gap-2 py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm"
              >
                <Store className="w-5 h-5" />
                <span className="hidden sm:inline">Partners</span>
                <span className="sm:hidden">Partners</span>
              </TabsTrigger>
            </TabsList>
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
                  <EnhancedRewardsCatalog 
                    rewards={rewards || []} 
                    userPoints={userPoints || 0} 
                    onRedeem={handleRedeem}
                  />
                </TabsContent>
                
                <TabsContent value="my-rewards" className="space-y-6">
                  <MyRewards userRewards={userRewards || []} />
                </TabsContent>
                
                <TabsContent value="partners" className="space-y-6">
                  <PartnerMarketplace partners={partners || []} />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </div>
        </Tabs>
      </div>

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-center text-3xl font-bold text-green-600 flex items-center justify-center gap-3">
              <Sparkles className="w-8 h-8" />
              🎉 Reward Redeemed!
            </DialogTitle>
            <DialogDescription className="text-center text-lg">
              Congratulations! Your reward has been successfully redeemed.
            </DialogDescription>
          </DialogHeader>
          
          {redeemResponse && (
            <div className="space-y-6">
              <div className="text-center bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-xl">
                <p className="text-xl font-bold text-gray-900 mb-2">{redeemResponse.rewardName}</p>
                <p className="text-lg text-gray-600">Partner: {redeemResponse.partnerName}</p>
              </div>
              
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-800 mb-4">Your Voucher Code</p>
                  <div className="bg-white p-4 rounded-lg border-2 border-gray-200 mb-4">
                    <p className="font-mono text-2xl font-bold text-gray-900 tracking-wider">{redeemResponse.voucherCode}</p>
                  </div>
                  <VoucherQRCode voucherCode={redeemResponse.voucherCode} />
                </div>
              </div>
              
              <div className="text-center bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  📱 Show this QR code to the partner to redeem your reward
                </p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              onClick={() => setShowSuccessModal(false)}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white py-3 text-lg font-semibold"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Awesome! Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confetti Animation */}
      <ConfettiAnimation isActive={showSuccessModal} />
    </div>
  );
};
