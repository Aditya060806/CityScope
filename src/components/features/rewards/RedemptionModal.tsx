import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Gift, 
  Star, 
  Clock, 
  Users, 
  CheckCircle, 
  X, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  CreditCard,
  Download,
  Share2,
  Copy,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Reward } from '@/types/civic';
import { toast } from 'sonner';

interface RedemptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  reward: Reward | null;
  userPoints: number;
  onConfirm: (redemptionData: RedemptionData) => Promise<void>;
  loading?: boolean;
}

interface RedemptionData {
  deliveryMethod: string;
  email: string;
  phone?: string;
  address?: string;
  notes?: string;
  bankAccount?: string;
  ifscCode?: string;
}

export const RedemptionModal: React.FC<RedemptionModalProps> = ({
  isOpen,
  onClose,
  reward,
  userPoints,
  onConfirm,
  loading = false
}) => {
  const [deliveryMethod, setDeliveryMethod] = useState('email');
  const [email, setEmail] = useState('aditya060806@gmail.com');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  if (!reward) return null;

  const canRedeem = userPoints >= reward.points_required;
  const popularityPercentage = Math.floor(Math.random() * 30) + 70; // Mock popularity
  const availabilityPercentage = reward.max_redemptions ? 
    ((reward.max_redemptions - (reward.current_redemptions || 0)) / reward.max_redemptions) * 100 : 100;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'recognition':
        return <CheckCircle className="w-5 h-5" />;
      case 'discount':
        return <CreditCard className="w-5 h-5" />;
      case 'voucher':
        return <Gift className="w-5 h-5" />;
      case 'experience':
        return <Calendar className="w-5 h-5" />;
      case 'cash':
        return <Star className="w-5 h-5" />;
      default:
        return <Gift className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'recognition':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'discount':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'voucher':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'experience':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'cash':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleSubmit = async () => {
    if (!canRedeem) {
      toast.error('Insufficient points to redeem this reward');
      return;
    }

    const redemptionData: RedemptionData = {
      deliveryMethod,
      email,
      phone: phone || undefined,
      address: address || undefined,
      notes: notes || undefined,
      bankAccount: bankAccount || undefined,
      ifscCode: ifscCode || undefined
    };

    try {
      await onConfirm(redemptionData);
      toast.success('Reward redeemed successfully! 🎉');
      onClose();
    } catch (error) {
      toast.error('Failed to redeem reward. Please try again.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <Gift className="w-6 h-6 text-blue-600" />
            Redeem Reward
          </DialogTitle>
          <DialogDescription>
            Complete your reward redemption by providing the required information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Reward Details Card */}
          <Card className="border-2 border-gray-100">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl flex items-center justify-center">
                  {getCategoryIcon(reward.category)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold text-gray-900">{reward.name}</h3>
                    <Badge className={cn("text-xs font-semibold", getCategoryColor(reward.category))}>
                      {reward.category}
                    </Badge>
                  </div>
                  
                  <p className="text-gray-600 mb-4">{reward.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="font-semibold">{reward.points_required} points</span>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">
                        ₹{(reward.value || 0) / 100}
                      </div>
                      <div className="text-xs text-gray-500">Value</div>
                    </div>
                  </div>

                  {/* Popularity and Availability */}
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Popularity</span>
                        <span className="font-medium">{popularityPercentage}%</span>
                      </div>
                      <Progress value={popularityPercentage} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Availability</span>
                        <span className="font-medium">
                          {reward.max_redemptions ? 
                            `${reward.max_redemptions - (reward.current_redemptions || 0)}/${reward.max_redemptions}` : 
                            'Unlimited'
                          }
                        </span>
                      </div>
                      <Progress value={availabilityPercentage} className="h-2" />
                    </div>
                  </div>

                  {/* Validity */}
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Valid for {reward.expiry_days} days</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Redemption Form */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Redemption Details</h4>
            
            {/* Delivery Method */}
            <div className="space-y-2">
              <Label htmlFor="delivery-method">Delivery Method</Label>
              <Select value={deliveryMethod} onValueChange={setDeliveryMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select delivery method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Delivery
                    </div>
                  </SelectItem>
                  <SelectItem value="phone">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      SMS/Phone
                    </div>
                  </SelectItem>
                  <SelectItem value="address">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Physical Delivery
                    </div>
                  </SelectItem>
                  <SelectItem value="bank">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Bank Transfer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                required
              />
            </div>

            {/* Phone (conditional) */}
            {(deliveryMethod === 'phone' || deliveryMethod === 'address') && (
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter your phone number"
                />
              </div>
            )}

            {/* Address (conditional) */}
            {deliveryMethod === 'address' && (
              <div className="space-y-2">
                <Label htmlFor="address">Delivery Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your complete delivery address"
                  rows={3}
                />
              </div>
            )}

            {/* Bank Details (conditional) */}
            {deliveryMethod === 'bank' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bank-account">Bank Account Number</Label>
                  <Input
                    id="bank-account"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="Enter account number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifsc">IFSC Code</Label>
                  <Input
                    id="ifsc"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value)}
                    placeholder="Enter IFSC code"
                  />
                </div>
              </div>
            )}

            {/* Additional Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special instructions or notes..."
                rows={3}
              />
            </div>
          </div>

          {/* Terms and Conditions */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h5 className="font-semibold text-gray-900 mb-2">Terms & Conditions</h5>
            <p className="text-sm text-gray-600">{reward.terms_and_conditions}</p>
          </div>

          {/* Insufficient Points Warning */}
          {!canRedeem && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-semibold">Insufficient Points</span>
              </div>
              <p className="text-red-700 text-sm mt-1">
                You need {reward.points_required - userPoints} more points to redeem this reward.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!canRedeem || loading}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Confirm Redemption
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
