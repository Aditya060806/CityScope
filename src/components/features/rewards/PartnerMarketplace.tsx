import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PartnerImageContainer } from '@/components/common/PartnerImageContainer';
import { 
  Store, 
  MapPin, 
  Globe, 
  Instagram, 
  Phone, 
  Mail,
  Heart,
  Leaf,
  Award,
  Users,
  Sparkles,
  ExternalLink,
  CheckCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Partner } from '@/types/civic';

interface PartnerMarketplaceProps {
  partners: Partner[];
}

export const PartnerMarketplace: React.FC<PartnerMarketplaceProps> = ({ partners }) => {
  const getPartnerTypeIcon = (type: string) => {
    switch (type) {
      case 'artisan':
        return <Award className="w-5 h-5" />;
      case 'recycler':
        return <Leaf className="w-5 h-5" />;
      case 'eco-innovator':
        return <Sparkles className="w-5 h-5" />;
      default:
        return <Store className="w-5 h-5" />;
    }
  };

  const getPartnerTypeColor = (type: string) => {
    switch (type) {
      case 'artisan':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'recycler':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'eco-innovator':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPartnerTypeDescription = (type: string) => {
    switch (type) {
      case 'artisan':
        return 'Traditional crafts and handmade products';
      case 'recycler':
        return 'Waste reduction and circular economy';
      case 'eco-innovator':
        return 'Sustainable technology and innovation';
      default:
        return 'Community partner';
    }
  };

  const getEcoFriendlyBadge = (type: string) => {
    if (type === 'recycler' || type === 'eco-innovator') {
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 text-xs font-semibold">
          <Leaf className="w-3 h-3 mr-1" />
          🌱 Eco-Friendly
        </Badge>
      );
    }
    return null;
  };

  if (partners.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-white/60 backdrop-blur-3xl rounded-[2rem] border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-10 max-w-md mx-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 -z-10" />
          <div className="bg-white/80 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-indigo-50">
            <Store className="w-12 h-12 text-indigo-400" />
          </div>
          <h3 className="text-2xl font-black tracking-tighter text-slate-900 mb-2">No Partners Available</h3>
          <p className="text-slate-500 font-medium">Check back later for new partner collaborations!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center pt-8">
        <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 font-bold tracking-widest uppercase text-[11px] shadow-sm mb-4">
          <Store className="w-4 h-4" />
          Our Network
        </div>
        <h2 className="text-[36px] md:text-[44px] leading-tight font-black tracking-tighter text-slate-900 mb-4">Partner Marketplace</h2>
        <p className="text-lg text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed">
          Discover authentic Indian artisans, eco-innovators, and sustainability champions. 
          Each partner is carefully selected for their commitment to traditional crafts, 
          environmental responsibility, and community impact.
        </p>
      </div>

      {/* Partners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners.map((partner) => (
          <Card 
            key={partner.id} 
            className="group rounded-[1.5rem] bg-white/70 backdrop-blur-xl border border-white/80 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)] hover:border-indigo-200 transition-all duration-300 overflow-hidden hover:-translate-y-1.5 grayscale-0 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0" />
            <CardHeader className="pb-4 relative z-10">
              {/* Partner Image */}
              <div className="relative w-full h-56 rounded-2xl overflow-hidden mb-4 shadow-sm border border-white backdrop-blur-sm">
                {partner.image_url ? (
                  <PartnerImageContainer
                    src={partner.image_url}
                    alt={partner.name}
                    width={300}
                    height={200}
                    lazy={true}
                    fallback="/placeholder.svg"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                    <Store className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  {getEcoFriendlyBadge(partner.type)}
                </div>
                <div className="absolute bottom-2 left-2">
                  <Badge className={cn("text-xs font-semibold", getPartnerTypeColor(partner.type))}>
                    {getPartnerTypeIcon(partner.type)}
                    <span className="ml-1 capitalize">{partner.type.replace('-', ' ')}</span>
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <CardTitle className="text-[22px] font-black text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                  {partner.name}
                </CardTitle>
                
                <CardDescription className="text-slate-500 font-medium line-clamp-3 leading-relaxed">
                  {partner.description}
                </CardDescription>

                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  <span>{partner.location}</span>
                </div>

                {/* Specialties */}
                {partner.specialties && partner.specialties.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {partner.specialties.slice(0, 3).map((specialty, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="text-xs bg-gray-50 text-gray-700 border-gray-200"
                      >
                        {specialty}
                      </Badge>
                    ))}
                    {partner.specialties.length > 3 && (
                      <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                        +{partner.specialties.length - 3} more
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Partner Type Description */}
                <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    {getPartnerTypeIcon(partner.type)}
                    <span className="font-medium">Focus Area</span>
                  </div>
                  <p>{getPartnerTypeDescription(partner.type)}</p>
                </div>

                {/* Contact Buttons */}
                <div className="space-y-2">
                  {partner.instagram_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start hover:bg-pink-50 hover:border-pink-200 hover:text-pink-700"
                      onClick={() => window.open(partner.instagram_url, '_blank')}
                    >
                      <Instagram className="w-4 h-4 mr-2" />
                      Follow on Instagram
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </Button>
                  )}

                  {partner.website_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700"
                      onClick={() => window.open(partner.website_url, '_blank')}
                    >
                      <Globe className="w-4 h-4 mr-2" />
                      Visit Website
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </Button>
                  )}

                  {partner.contact_link && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start hover:bg-green-50 hover:border-green-200 hover:text-green-700"
                      onClick={() => window.open(partner.contact_link, '_blank')}
                    >
                      <Phone className="w-4 h-4 mr-2" />
                      Contact Partner
                      <ExternalLink className="w-3 h-3 ml-auto" />
                    </Button>
                  )}
                </div>

                {/* Eco-friendly highlight */}
                {(partner.type === 'recycler' || partner.type === 'eco-innovator') && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2 text-green-800 font-medium text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span>Verified Eco-Friendly Partner</span>
                    </div>
                    <p className="text-green-700 text-xs mt-1">
                      This partner is committed to environmental sustainability and circular economy practices.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Call to Action */}
      <Card className="rounded-[2.5rem] bg-white/60 backdrop-blur-3xl border border-emerald-100/50 shadow-[0_12px_40px_rgba(0,0,0,0.06)] relative overflow-hidden mt-12 group hover:shadow-[0_16px_50px_rgba(16,185,129,0.1)] transition-shadow duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/60 to-teal-50/60 pointer-events-none" />
        <div className="absolute -inset-1 opacity-10 group-hover:opacity-30 blur-2xl transition-opacity duration-500 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-[2.5rem] -z-10" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.12),transparent_70%)] rounded-bl-full pointer-events-none" />
        
        <CardContent className="p-12 text-center relative z-10">
          <h3 className="text-[32px] font-black tracking-tighter bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">
            Supporting Local Communities
          </h3>
          <p className="text-[15px] font-medium text-slate-500 mb-8 max-w-2xl mx-auto leading-relaxed">
            Every reward you redeem directly supports these amazing partners and their communities. 
            Together, we're building a more sustainable and connected India.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-[13px] font-bold tracking-widest uppercase text-slate-500">
            <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-xl shadow-sm border border-rose-100">
              <Heart className="w-5 h-5 text-rose-500 drop-shadow-sm" />
              <span>Artisans</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-xl shadow-sm border border-emerald-100">
              <Leaf className="w-5 h-5 text-emerald-500 drop-shadow-sm" />
              <span>Sustainability</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 px-4 py-2 rounded-xl shadow-sm border border-indigo-100">
              <Users className="w-5 h-5 text-indigo-500 drop-shadow-sm" />
              <span>Communities</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};