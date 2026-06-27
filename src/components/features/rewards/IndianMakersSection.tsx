import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ImageContainer } from '@/components/common/ImageContainer';
import { 
  ExternalLink, 
  Instagram, 
  MapPin, 
  Users, 
  Star, 
  Search,
  Filter,
  Globe,
  Heart,
  Award,
  Leaf,
  Recycle,
  ShoppingBag
} from 'lucide-react';
import { IndianMaker, indianMakers, getMakersByCategory, getFeaturedMakers, searchMakers } from '@/data/indianMakers';
import { cn } from '@/lib/utils';

interface IndianMakersSectionProps {
  className?: string;
}

export const IndianMakersSection: React.FC<IndianMakersSectionProps> = ({ className }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'traditional' | 'recycled' | 'marketplace'>('all');
  const [favorites, setFavorites] = useState<string[]>([]);

  const filteredMakers = React.useMemo(() => {
    let makers = indianMakers;
    
    if (selectedCategory !== 'all') {
      makers = getMakersByCategory(selectedCategory);
    }
    
    if (searchQuery) {
      makers = searchMakers(searchQuery);
    }
    
    return makers;
  }, [selectedCategory, searchQuery]);

  const toggleFavorite = (makerId: string) => {
    setFavorites(prev => 
      prev.includes(makerId) 
        ? prev.filter(id => id !== makerId)
        : [...prev, makerId]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'traditional':
        return <Award className="w-4 h-4" />;
      case 'recycled':
        return <Recycle className="w-4 h-4" />;
      case 'marketplace':
        return <ShoppingBag className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  const getPriceRangeColor = (priceRange: string) => {
    switch (priceRange) {
      case 'budget':
        return 'bg-green-100 text-green-800';
      case 'mid':
        return 'bg-blue-100 text-blue-800';
      case 'premium':
        return 'bg-purple-100 text-purple-800';
      case 'luxury':
        return 'bg-gold-100 text-gold-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const MakerCard: React.FC<{ maker: IndianMaker }> = ({ maker }) => {
    const [imageError, setImageError] = React.useState(false);
    
    return (
      <Card className="group rounded-[1.5rem] bg-white/70 backdrop-blur-xl border border-white/80 hover:shadow-[0_20px_40px_-15px_rgba(99,102,241,0.2)] hover:border-indigo-200 transition-all duration-300 overflow-hidden hover:-translate-y-1.5 grayscale-0 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0" />
        <div className="relative z-10">
          <div className="aspect-[4/3] bg-slate-50 border-b border-slate-100 flex items-center justify-center overflow-hidden">
            {!imageError ? (
              <div className="w-full h-full flex items-center justify-center bg-white p-2">
                <img
                  src={maker.image}
                  alt={maker.name}
                  className="w-full h-full object-contain mix-blend-multiply"
                  style={{
                    minWidth: '85%',
                    minHeight: '85%',
                    maxWidth: '100%',
                    maxHeight: '100%'
                  }}
                  loading="lazy"
                  onError={() => setImageError(true)}
                />
              </div>
            ) : (
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-slate-100">
                {getCategoryIcon(maker.category)}
              </div>
            )}
          </div>
        <Button
          size="sm"
          variant="ghost"
          className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur shadow-sm hover:bg-white rounded-lg w-8 h-8 p-0"
          onClick={() => toggleFavorite(maker.id)}
        >
          <Heart 
            className={cn(
              "w-4 h-4",
              favorites.includes(maker.id) ? "fill-red-500 text-red-500" : "text-slate-400"
            )} 
          />
        </Button>
        {maker.featured && (
          <Badge className="absolute top-3 left-3 bg-indigo-600 text-white font-bold tracking-widest uppercase shadow-sm text-[10px]">
            <Star className="w-3 h-3 mr-1 fill-white" />
            Featured
          </Badge>
        )}
      </div>
      
      <CardContent className="p-5">
        <div className="space-y-4">
          <div>
            <h3 className="text-[19px] leading-tight font-black tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">{maker.name}</h3>
            <p className="text-[10px] font-bold tracking-widest uppercase text-indigo-600 mb-2">{maker.subcategory}</p>
            <p className="text-sm font-medium text-slate-500 line-clamp-2 leading-relaxed">{maker.description}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className={cn("text-[10px] font-bold tracking-widest uppercase border-none", getPriceRangeColor(maker.priceRange))}>
              {maker.priceRange.charAt(0).toUpperCase() + maker.priceRange.slice(1)}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-[11px] font-bold tracking-tight text-slate-700 border-slate-200">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              {maker.rating}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1 text-[11px] font-bold tracking-tight text-slate-700 border-slate-200">
              <MapPin className="w-3 h-3 text-slate-400" />
              {maker.location}
            </Badge>
          </div>

          {maker.artisans && maker.artisans > 0 && (
            <div className="flex items-center gap-4 text-xs font-bold tracking-tight text-slate-500 py-3 border-y border-slate-100 my-3">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-indigo-400" />
                {maker.artisans.toLocaleString()} artisans
              </div>
              {maker.products && (
                <div className="flex items-center gap-1.5">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" />
                  {maker.products.toLocaleString()} products
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1.5">Specialties</h4>
              <div className="flex flex-wrap gap-1.5">
                {maker.specialties.slice(0, 3).map((specialty, index) => (
                  <Badge key={index} variant="secondary" className="text-[11px] font-medium bg-slate-50 text-slate-600 hover:bg-slate-100">
                    {specialty}
                  </Badge>
                ))}
                {maker.specialties.length > 3 && (
                  <Badge variant="secondary" className="text-[11px] font-medium bg-slate-50 text-slate-600 hover:bg-slate-100">
                    +{maker.specialties.length - 3} more
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-[10px] font-bold tracking-widest uppercase text-slate-400 mb-1.5">Sustainability</h4>
              <div className="flex flex-wrap gap-1.5">
                {maker.sustainability.slice(0, 2).map((sustainability, index) => (
                  <Badge key={index} variant="outline" className="text-[11px] font-medium border-emerald-100 bg-emerald-50/50 text-emerald-700">
                    <Leaf className="w-3 h-3 mr-1 text-emerald-500" />
                    {sustainability}
                  </Badge>
                ))}
                {maker.sustainability.length > 2 && (
                  <Badge variant="outline" className="text-[11px] font-medium border-emerald-100 bg-emerald-50/50 text-emerald-700">
                    +{maker.sustainability.length - 2} more
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2 mt-2">
            <Button
              size="sm"
              className="flex-1 bg-gradient-to-br from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-[0_4px_12px_rgba(99,102,241,0.25)] font-black tracking-wide text-[13px] h-11 rounded-xl transition-all hover:-translate-y-0.5"
              onClick={() => window.open(maker.website, '_blank')}
            >
              <Globe className="w-4 h-4 mr-2 drop-shadow-sm" />
              Visit Website
            </Button>
            {maker.instagram && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(maker.instagram, '_blank')}
                className="border-pink-200 text-pink-600 hover:bg-pink-50 h-10 w-10 p-0 rounded-xl shadow-sm"
              >
                <Instagram className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
    );
  };

  const categoryStats = {
    all: indianMakers.length,
    traditional: getMakersByCategory('traditional').length,
    recycled: getMakersByCategory('recycled').length,
    marketplace: getMakersByCategory('marketplace').length,
  };

  return (
    <div className={cn("space-y-8 max-w-7xl mx-auto w-full", className)}>
      {/* Header */}
      <div className="text-center space-y-4 pt-6">
        <div className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 font-bold tracking-widest uppercase text-[11px] shadow-sm">
          <Award className="w-4 h-4" />
          Indian Traditional Makers & Innovators
        </div>
        <h2 className="text-[36px] md:text-[48px] leading-tight font-black tracking-tighter text-slate-900">
          Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-500">Sustainable</span> Excellence
        </h2>
        <p className="text-lg text-slate-500 max-w-3xl mx-auto font-medium leading-relaxed">
          Explore India's finest traditional artisans, recycled innovators, and sustainable marketplaces. 
          Support authentic craftsmanship and environmental responsibility.
        </p>
      </div>

      {/* Search and Filters */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              placeholder="Search makers, specialties, or sustainability practices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 h-14 bg-white border-slate-200 rounded-[1.25rem] shadow-sm focus:ring-indigo-500 font-medium text-[15px]"
            />
          </div>
          <Button variant="outline" className="border-slate-200 text-slate-600 font-bold bg-white hover:bg-slate-50 h-14 px-6 rounded-[1.25rem] shadow-sm">
            <Filter className="w-5 h-5 mr-2" />
            Advanced Filters
          </Button>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as 'all' | 'traditional' | 'recycled' | 'marketplace')}>
          <TabsList className="grid w-full grid-cols-4 bg-slate-100/80 rounded-[1.25rem] p-1.5 shadow-inner">
            <TabsTrigger value="all" className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all text-sm">
              <Globe className="w-4 h-4 hidden sm:block" />
              All ({categoryStats.all})
            </TabsTrigger>
            <TabsTrigger value="traditional" className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-amber-600 transition-all text-sm">
              <Award className="w-4 h-4 hidden sm:block" />
              Traditional ({categoryStats.traditional})
            </TabsTrigger>
            <TabsTrigger value="recycled" className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-emerald-600 transition-all text-sm">
              <Recycle className="w-4 h-4 hidden sm:block" />
              Recycled ({categoryStats.recycled})
            </TabsTrigger>
            <TabsTrigger value="marketplace" className="flex items-center justify-center gap-2 py-2.5 rounded-xl font-bold text-slate-500 data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-indigo-600 transition-all text-sm">
              <ShoppingBag className="w-4 h-4 hidden sm:block" />
              Marketplace ({categoryStats.marketplace})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Featured Makers */}
      {selectedCategory === 'all' && (
        <div className="space-y-6">
          <h3 className="flex items-center gap-2 text-[15px] font-bold tracking-widest uppercase text-slate-800">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            Featured Makers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getFeaturedMakers().slice(0, 6).map((maker) => (
              <MakerCard key={maker.id} maker={maker} />
            ))}
          </div>
        </div>
      )}

      {/* All Makers */}
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <h3 className="text-[20px] font-black tracking-tight text-slate-900">
            {selectedCategory === 'all' ? 'All Makers' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Makers`}
          </h3>
          <p className="text-[13px] font-bold tracking-widest uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
            {filteredMakers.length} found
          </p>
        </div>

        {filteredMakers.length === 0 ? (
          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center py-16">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-[24px] font-black tracking-tighter text-slate-900 mb-2">No Makers Found</h3>
            <p className="text-slate-500 font-medium mb-6 max-w-md mx-auto">Try adjusting your search or filter criteria to find the makers you're looking for.</p>
            <Button 
              onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 rounded-xl px-8 shadow-sm"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMakers.map((maker) => (
              <MakerCard key={maker.id} maker={maker} />
            ))}
          </div>
        )}
      </div>

      {/* Call to Action */}
      <Card className="rounded-[2.5rem] bg-white/60 backdrop-blur-3xl border border-white/80 shadow-[0_12px_40px_rgba(0,0,0,0.06)] relative overflow-hidden mt-10 group hover:shadow-[0_16px_50px_rgba(99,102,241,0.1)] transition-shadow duration-500">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/60 to-purple-50/60 pointer-events-none" />
        <div className="absolute -inset-1 opacity-10 group-hover:opacity-30 blur-2xl transition-opacity duration-500 bg-gradient-to-br from-indigo-400 to-purple-400 rounded-[2.5rem] -z-10" />
        <div className="absolute top-0 right-0 w-80 h-80 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_70%)] rounded-bl-full pointer-events-none" />
        
        <CardContent className="p-12 text-center relative z-10">
          <h3 className="text-[32px] font-black tracking-tighter bg-gradient-to-br from-slate-900 to-slate-700 bg-clip-text text-transparent mb-4">
            Support Indian Artisans & Innovators
          </h3>
          <p className="text-[15px] text-slate-500 mb-8 font-medium max-w-2xl mx-auto leading-relaxed">
            By choosing these makers, you're supporting traditional craftsmanship, environmental sustainability, 
            and the livelihoods of thousands of artisans across India.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-gradient-to-br from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-[0_8px_20px_rgb(99,102,241,0.3)] transition-all hover:scale-105 hover:shadow-[0_12px_25px_rgb(99,102,241,0.4)] font-black tracking-wide h-14 rounded-xl px-10 text-[15px]">
              <Heart className="w-5 h-5 mr-2 drop-shadow-sm" />
              Support Local Artisans
            </Button>
            <Button variant="outline" className="border-indigo-200/50 bg-white/80 backdrop-blur-md text-indigo-700 font-black tracking-wide hover:bg-white h-14 px-10 rounded-xl shadow-[0_4px_12px_rgba(0,0,0,0.03)] text-[15px] transition-all hover:-translate-y-1">
              <Globe className="w-5 h-5 mr-2" />
              Learn More
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
