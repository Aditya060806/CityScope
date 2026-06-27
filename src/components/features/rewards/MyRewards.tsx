import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Clock, 
  CheckCircle, 
  XCircle, 
  QrCode, 
  Copy, 
  ExternalLink,
  Phone,
  Globe,
  Instagram,
  Calendar,
  Gift,
  Star,
  MapPin,
  Coins,
  Award,
  Leaf,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { UserReward } from '@/types/civic';
import { VoucherQRCode } from './VoucherQRCode';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  unlocked: boolean;
  points: number;
}

interface MyRewardsProps {
  userRewards: UserReward[];
  achievements?: Achievement[];
  expiringSoon?: UserReward[];
  totalValue?: number;
  ecoFriendlyRedeemed?: number;
}

export const MyRewards: React.FC<MyRewardsProps> = ({ 
  userRewards, 
  achievements = [], 
  expiringSoon = [], 
  totalValue = 0, 
  ecoFriendlyRedeemed = 0 
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'redeemed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'expired':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'redeemed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expired':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'redeemed':
        return 'Redeemed';
      case 'pending':
        return 'Pending';
      case 'expired':
        return 'Expired';
      default:
        return 'Unknown';
    }
  };

  const copyVoucherCode = (code: string) => {
    navigator.clipboard.writeText(code);
    // You might want to add a toast notification here
  };

  const formatDate = (dateValue: string | Date | null) => {
    if (!dateValue) return '';
    return new Date(dateValue).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (userRewards.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white/60 backdrop-blur-3xl rounded-[2.5rem] border border-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.05)] p-12 max-w-md mx-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 -z-10" />
          <div className="bg-white/80 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-50">
            <Trophy className="w-12 h-12 text-indigo-400" />
          </div>
          <h3 className="text-[28px] font-black tracking-tighter text-slate-900 mb-3">No Rewards Yet</h3>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed max-w-xs mx-auto text-[15px]">
            Start earning points by engaging with your community and redeem amazing rewards!
          </p>
          <Button className="bg-gradient-to-br from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-black tracking-wide h-14 px-8 rounded-xl shadow-[0_8px_20px_rgba(99,102,241,0.3)] hover:shadow-[0_12px_25px_rgba(99,102,241,0.4)] transition-all hover:-translate-y-1 w-full text-[15px]">
            <Gift className="w-5 h-5 mr-2 drop-shadow-sm" />
            Browse Rewards
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-[28px] md:text-[36px] font-black tracking-tighter text-slate-900 mb-2">My Rewards</h2>
        <p className="text-[15px] font-medium text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Track your redeemed rewards and access your vouchers. Show QR codes to partners to claim your rewards.
        </p>
      </div>

      {/* Enhanced Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-[1.5rem] bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-center overflow-hidden relative group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)] hover:border-indigo-200">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(245,158,11,0.08),transparent_70%)] rounded-bl-full pointer-events-none transition-all group-hover:bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.08),transparent_70%)]" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Trophy className="w-7 h-7 text-amber-500" />
              <span className="text-[28px] font-black tracking-tighter text-slate-900 leading-none">{userRewards.length}</span>
            </div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Total Rewards</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-[1.5rem] bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-center overflow-hidden relative group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)] hover:border-indigo-200">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.08),transparent_70%)] rounded-bl-full pointer-events-none transition-all group-hover:bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.08),transparent_70%)]" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <CheckCircle className="w-7 h-7 text-emerald-500" />
              <span className="text-[28px] font-black tracking-tighter text-slate-900 leading-none">
                {userRewards.filter(r => r.status === 'redeemed').length}
              </span>
            </div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Redeemed</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-[1.5rem] bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-center overflow-hidden relative group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)] hover:border-indigo-200">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(139,92,246,0.08),transparent_70%)] rounded-bl-full pointer-events-none transition-all group-hover:bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.08),transparent_70%)]" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="w-7 h-7 text-purple-500 flex-shrink-0" />
              <span className="text-[28px] font-black tracking-tighter text-slate-900 leading-none truncate">₹{(totalValue / 100).toLocaleString()}</span>
            </div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Total Value</p>
          </CardContent>
        </Card>
        
        <Card className="rounded-[1.5rem] bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgba(0,0,0,0.04)] text-center overflow-hidden relative group transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)] hover:border-indigo-200">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(circle_at_top_right,rgba(34,197,94,0.08),transparent_70%)] rounded-bl-full pointer-events-none transition-all group-hover:bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.08),transparent_70%)]" />
          <CardContent className="pt-6 relative z-10">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Leaf className="w-7 h-7 text-emerald-500" />
              <span className="text-[28px] font-black tracking-tighter text-slate-900 leading-none">{ecoFriendlyRedeemed}</span>
            </div>
            <p className="text-[11px] font-bold tracking-widest uppercase text-slate-500">Eco-Friendly</p>
          </CardContent>
        </Card>
      </div>

      {/* Expiring Soon Alert */}
      {expiringSoon.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-xl border border-amber-200/50 rounded-[1.5rem] p-6 shadow-sm overflow-hidden relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none" />
          <div className="flex items-center gap-2 text-amber-600 font-black tracking-tighter mb-2 text-xl relative z-10">
            <AlertCircle className="w-5 h-5 drop-shadow-sm" />
            Rewards Expiring Soon
          </div>
          <p className="text-amber-800/80 text-[14px] font-medium mb-5 relative z-10">
            You have {expiringSoon.length} reward(s) expiring within 7 days. Don't miss out!
          </p>
          <div className="space-y-3 relative z-10">
            {expiringSoon.slice(0, 3).map((reward) => (
              <div key={reward.id} className="flex items-center justify-between bg-white/70 backdrop-blur-md p-3.5 rounded-xl border border-amber-100 shadow-[0_2px_10px_rgba(251,191,36,0.1)] transition-all hover:bg-white hover:-translate-y-0.5">
                <span className="font-black text-[15px] tracking-tight text-amber-900 line-clamp-1">{reward.reward?.name}</span>
                <span className="text-[11px] font-black tracking-widest uppercase text-white bg-gradient-to-r from-amber-500 to-orange-500 px-3 py-1 rounded-[0.5rem] shadow-sm ml-4 shrink-0">
                  Exp: {reward.expires_at ? new Date(reward.expires_at).toLocaleDateString() : 'Soon'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <Card className="rounded-[1.5rem] bg-white/70 backdrop-blur-xl border border-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.04)] overflow-hidden">
          <CardHeader className="pb-4 border-b border-slate-100/50 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/30 to-transparent pointer-events-none" />
            <CardTitle className="flex items-center gap-2 text-[19px] font-black tracking-tighter text-slate-900 relative z-10">
              <Award className="w-6 h-6 text-indigo-500 drop-shadow-sm" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className={cn(
                  "flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 backdrop-blur-sm",
                  achievement.unlocked 
                    ? "bg-emerald-50/40 border-emerald-100 shadow-sm hover:shadow-md hover:-translate-y-0.5" 
                    : "bg-white/40 border-slate-100 opacity-70 grayscale-[0.2]"
                )}>
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner",
                    achievement.unlocked 
                      ? "bg-gradient-to-br from-emerald-100 to-emerald-50 text-emerald-600 border border-emerald-200/50" 
                      : "bg-slate-100 text-slate-400 border border-slate-200/50"
                  )}>
                    <achievement.icon className={cn("w-6 h-6", achievement.unlocked && "drop-shadow-sm")} />
                  </div>
                  <div className="flex-1">
                    <div className="font-black tracking-tight text-slate-900 text-[15px] mb-0.5">{achievement.name}</div>
                    <div className="text-[13px] font-medium text-slate-500 leading-tight">{achievement.description}</div>
                  </div>
                  <div className={cn(
                    "text-[13px] font-black tracking-tight px-3 py-1 rounded-[0.5rem] border shadow-sm",
                    achievement.unlocked
                      ? "bg-amber-50 text-amber-600 border-amber-200"
                      : "bg-slate-50 text-slate-400 border-slate-200"
                  )}>
                    +{achievement.points} pts
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rewards List */}
      <div className="space-y-6">
        {userRewards.map((userReward) => (
            <Card 
            key={userReward.id} 
            className={cn(
              "group hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)] hover:border-indigo-300 transition-all duration-300 rounded-[1.5rem] overflow-hidden hover:-translate-y-1.5",
              userReward.status === 'redeemed' ? "border border-emerald-200 bg-emerald-50/40 backdrop-blur-xl" :
              userReward.status === 'pending' ? "border border-yellow-200 bg-yellow-50/40 backdrop-blur-xl" :
              "border border-white/80 bg-white/60 backdrop-blur-xl"
            )}
          >
            <CardHeader className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <CardTitle className="text-[19px] leading-tight font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {userReward.reward?.name || 'Unknown Reward'}
                    </CardTitle>
                    <Badge className={cn("text-[10px] uppercase tracking-widest font-bold shadow-sm pb-[2px]", getStatusColor(userReward.status))}>
                      {getStatusIcon(userReward.status)}
                      <span className="ml-1.5">{getStatusText(userReward.status)}</span>
                    </Badge>
                  </div>
                  
                  <CardDescription className="text-sm font-medium text-slate-500 leading-relaxed mb-4 max-w-3xl">
                    {userReward.reward?.description || 'No description available'}
                  </CardDescription>

                  {/* Partner Info */}
                  {userReward.reward?.partner && (
                    <div className="flex items-center gap-2 text-[13px] font-bold tracking-tight text-slate-500 mb-2">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{userReward.reward.partner.name}</span>
                      <span className="text-slate-300">•</span>
                      <span>{userReward.reward.partner.location}</span>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center gap-2 text-[13px] font-bold tracking-tight text-slate-500">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span>Redeemed on {formatDate(userReward.created_at)}</span>
                  </div>
                </div>

                {/* Points Spent */}
                <div className="sm:text-right bg-white/60 p-4 rounded-2xl border border-white/80 shrink-0 self-start shadow-inner backdrop-blur-sm">
                  <span className="text-[10px] font-black tracking-widest uppercase text-slate-400 mb-1 block">Tokens Used</span>
                  <div className="flex items-center sm:justify-end gap-2">
                    <Star className="w-5 h-5 text-amber-500 fill-amber-500 drop-shadow-[0_2px_4px_rgba(251,191,36,0.3)]" />
                    <span className="text-[28px] font-black tracking-tighter text-slate-900 leading-none drop-shadow-sm">{userReward.points_spent || 0}</span>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="px-6 pb-6 pt-0">
              {userReward.voucher_code && (
                <div className="mt-4 pt-6 border-t border-slate-100 space-y-5">
                  {/* Voucher Code & Actions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-white/40 border-[3px] border-dashed border-indigo-100/60 rounded-[1.5rem] p-6 relative overflow-hidden backdrop-blur-md hover:border-indigo-200 transition-colors">
                      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 to-transparent pointer-events-none" />
                      <div className="text-center relative z-10">
                        <p className="text-[11px] font-black tracking-widest uppercase text-indigo-400 mb-3 drop-shadow-sm">Voucher Code</p>
                        <div className="flex items-center justify-center gap-3 mb-6">
                          <code className="font-mono text-xl md:text-2xl font-black tracking-wider text-indigo-600 bg-white shadow-sm border border-indigo-50 px-5 py-2.5 rounded-xl">
                            {userReward.voucher_code}
                          </code>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyVoucherCode(userReward.voucher_code!)}
                            className="w-12 h-12 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-white border-white/60 shadow-sm bg-white/40 hover:-translate-y-0.5 transition-all"
                          >
                            <Copy className="w-5 h-5 drop-shadow-sm" />
                          </Button>
                        </div>
                        
                        {/* QR Code */}
                      <VoucherQRCode voucherCode={userReward.voucher_code} rewardName={userReward.reward?.name || 'Your Reward'} partnerName={userReward.reward?.partner?.name} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      {/* Partner Contact */}
                      {userReward.reward?.partner && (
                        <div className="bg-white/60 backdrop-blur-md rounded-2xl p-5 border border-white shadow-inner">
                          <h4 className="text-[13px] font-black tracking-widest uppercase text-slate-900 mb-3 drop-shadow-sm">Partner Contact</h4>
                          <div className="space-y-2.5">
                            {userReward.reward.partner.contact_link && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 h-10 rounded-xl text-[13px] font-bold text-slate-600"
                                onClick={() => window.open(userReward.reward!.partner!.contact_link, '_blank')}
                              >
                                <Phone className="w-4 h-4 mr-2" />
                                Contact Partner
                                <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                              </Button>
                            )}
                            
                            {userReward.reward.partner.instagram_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start hover:bg-pink-50 hover:text-pink-700 hover:border-pink-200 h-10 rounded-xl text-[13px] font-bold text-slate-600"
                                onClick={() => window.open(userReward.reward!.partner!.instagram_url, '_blank')}
                              >
                                <Instagram className="w-4 h-4 mr-2" />
                                Follow on Instagram
                                <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                              </Button>
                            )}
                            
                            {userReward.reward.partner.website_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full justify-start hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 h-10 rounded-xl text-[13px] font-bold text-slate-600"
                                onClick={() => window.open(userReward.reward!.partner!.website_url, '_blank')}
                              >
                                <Globe className="w-4 h-4 mr-2" />
                                Visit Website
                                <ExternalLink className="w-3 h-3 ml-auto opacity-50" />
                              </Button>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Instructions */}
                      <div className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 border border-indigo-100/50 rounded-2xl p-5 shadow-inner">
                        <div className="flex items-start gap-3">
                          <div className="bg-white p-2 rounded-lg shadow-sm">
                            <QrCode className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <p className="text-[13px] font-bold tracking-tight text-indigo-900 mb-1">
                              How to redeem:
                            </p>
                            <p className="text-xs font-medium text-indigo-800/80 leading-relaxed">
                              Show the QR code to the partner or provide your voucher code. 
                              Make sure to redeem before the expiry date.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call to Action */}
      <div className="text-center py-10 relative">
        <div className="bg-white/60 backdrop-blur-3xl rounded-[2.5rem] border border-indigo-100 p-12 max-w-2xl mx-auto shadow-[0_12px_40px_rgba(99,102,241,0.06)] relative overflow-hidden group hover:shadow-[0_16px_50px_rgba(99,102,241,0.12)] transition-shadow duration-500">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 pointer-events-none" />
          <div className="absolute -inset-1 opacity-20 group-hover:opacity-40 blur-2xl transition-opacity duration-500 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-[2.5rem] -z-10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-[radial-gradient(circle_at_top_right,rgba(79,70,229,0.1),transparent_70%)] rounded-bl-full pointer-events-none" />
          <div className="relative z-10">
            <h3 className="text-[28px] font-black tracking-tighter bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent mb-3">
              Want more rewards?
            </h3>
            <p className="text-[15px] font-medium text-slate-500 mb-8 max-w-lg mx-auto leading-relaxed">
              Keep engaging with your community to earn more points and unlock amazing rewards!
            </p>
            <Button className="bg-gradient-to-br from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black tracking-wide h-14 px-10 rounded-[1.25rem] shadow-[0_8px_25px_rgba(99,102,241,0.35)] hover:shadow-[0_12px_30px_rgba(99,102,241,0.45)] hover:-translate-y-1 transition-all">
              <Gift className="w-5 h-5 mr-2 drop-shadow-sm" />
              Browse More Rewards
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};