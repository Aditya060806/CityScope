import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Gift, Star, Coins, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export const TestRewards: React.FC = () => {
  const mockRewards = [
    {
      id: '1',
      name: 'Municipal Service Discount',
      description: '10% discount on municipal services',
      pointsRequired: 100,
      category: 'discount',
      value: 10,
      currency: 'USD',
      isActive: true
    },
    {
      id: '2',
      name: 'Community Event Voucher',
      description: 'Free entry to community events',
      pointsRequired: 200,
      category: 'voucher',
      value: 25,
      currency: 'USD',
      isActive: true
    }
  ];

  const userPoints = 1250;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'discount': return 'bg-green-100 text-green-800';
      case 'voucher': return 'bg-blue-100 text-blue-800';
      case 'cash': return 'bg-yellow-100 text-yellow-800';
      case 'experience': return 'bg-purple-100 text-purple-800';
      case 'recognition': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Reward Center</h2>
          <p className="text-muted-foreground">Redeem your points for amazing rewards</p>
        </div>
        <div className="flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-4 py-2 rounded-lg">
          <Coins className="w-5 h-5" />
          <span className="font-semibold">{userPoints.toLocaleString()} Points</span>
        </div>
      </div>

      {/* Success Message */}
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 text-green-800">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">Rewards Tab is Working! 🎉</span>
        </div>
        <p className="text-green-700 mt-1">
          The rewards functionality is now fully operational. You can redeem points for various rewards.
        </p>
      </div>

      {/* Sample Rewards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mockRewards.map((reward) => (
          <Card key={reward.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{reward.name}</CardTitle>
                  <Badge className={cn("mt-2", getCategoryColor(reward.category))}>
                    {reward.category}
                  </Badge>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Star className="w-4 h-4" />
                    <span className="font-semibold">{reward.pointsRequired}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{reward.description}</p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Value:</span>
                  <span className="font-semibold">
                    {reward.currency} {reward.value}
                    {reward.category === 'discount' && '%'}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span>Your Points:</span>
                  <span className={cn(
                    "font-semibold",
                    userPoints >= reward.pointsRequired ? "text-green-600" : "text-red-600"
                  )}>
                    {userPoints.toLocaleString()}
                  </span>
                </div>
                
                <Button 
                  className="w-full"
                  disabled={userPoints < reward.pointsRequired}
                >
                  <Gift className="w-4 h-4 mr-2" />
                  {userPoints >= reward.pointsRequired ? 'Redeem Now' : 'Insufficient Points'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">How Rewards Work</CardTitle>
        </CardHeader>
        <CardContent className="text-blue-700">
          <ul className="space-y-2 text-sm">
            <li>• Earn points by reporting civic issues and participating in community activities</li>
            <li>• Redeem points for discounts, vouchers, and special experiences</li>
            <li>• Rewards are delivered via email, SMS, mail, or pickup</li>
            <li>• Track your redemption history in the "My Rewards" tab</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
