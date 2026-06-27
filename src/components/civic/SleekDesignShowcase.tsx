import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, CardSleek, CardGlass, CardPremium } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Calendar, Shield, TrendingUp, Star, Zap, Heart, Award } from 'lucide-react';

const SleekDesignShowcase: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-powder/5 to-bone/10 p-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gradient-royal">
            Sleek & Classic Design Showcase
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience the enhanced button and card components with modern, sleek styling inspired by contemporary design trends.
          </p>
        </div>

        {/* Button Showcase */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-900">Enhanced Buttons</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Primary Buttons */}
            <CardSleek className="p-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Primary Buttons</CardTitle>
                <CardDescription>Main action buttons with gradient effects</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="default" size="lg" className="w-full">
                  <Users className="w-4 h-4" />
                  Join the Club
                </Button>
                <Button variant="royal" size="lg" className="w-full">
                  <Star className="w-4 h-4" />
                  Premium Access
                </Button>
                <Button variant="premium" size="lg" className="w-full">
                  <Award className="w-4 h-4" />
                  Get Started
                </Button>
              </CardContent>
            </CardSleek>

            {/* Secondary Buttons */}
            <CardSleek className="p-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Secondary Buttons</CardTitle>
                <CardDescription>Supporting action buttons</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="secondary" size="lg" className="w-full">
                  <Calendar className="w-4 h-4" />
                  Explore Events
                </Button>
                <Button variant="powder" size="lg" className="w-full">
                  <Shield className="w-4 h-4" />
                  View Projects
                </Button>
                <Button variant="bone" size="lg" className="w-full">
                  <TrendingUp className="w-4 h-4" />
                  Analytics
                </Button>
              </CardContent>
            </CardSleek>

            {/* Special Buttons */}
            <CardSleek className="p-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Special Effects</CardTitle>
                <CardDescription>Glass and outline variants</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" size="lg" className="w-full">
                  <Zap className="w-4 h-4" />
                  Watch Demo
                </Button>
                <Button variant="glass" size="lg" className="w-full">
                  <Heart className="w-4 h-4" />
                  Glass Effect
                </Button>
                <Button variant="ghost" size="lg" className="w-full">
                  Learn More
                </Button>
              </CardContent>
            </CardSleek>
          </div>
        </section>

        {/* Card Showcase */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-900">Enhanced Cards</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Standard Card */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Standard Card</CardTitle>
                  <Badge variant="secondary">New</Badge>
                </div>
                <CardDescription>
                  Clean and minimal design with subtle hover effects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4 text-royal" />
                    <span className="text-sm text-gray-600">500+ Active Members</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-royal" />
                    <span className="text-sm text-gray-600">50+ Events Hosted</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  Learn More
                </Button>
              </CardFooter>
            </Card>

            {/* Sleek Card */}
            <CardSleek>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Sleek Card</CardTitle>
                  <Badge variant="default">Premium</Badge>
                </div>
                <CardDescription>
                  Enhanced with gradient backgrounds and smooth animations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-royal" />
                    <span className="text-sm text-gray-600">25+ Projects</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-royal" />
                    <span className="text-sm text-gray-600">95% Success Rate</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="royal" size="sm" className="w-full">
                  Get Started
                </Button>
              </CardFooter>
            </CardSleek>

            {/* Glass Card */}
            <CardGlass>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Glass Card</CardTitle>
                  <Badge variant="outline" className="border-white/30 text-white">
                    Glass
                  </Badge>
                </div>
                <CardDescription className="text-white/80">
                  Modern glassmorphism effect with backdrop blur
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-white" />
                    <span className="text-sm text-white/80">Premium Features</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-white" />
                    <span className="text-sm text-white/80">Lightning Fast</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="glass" size="sm" className="w-full">
                  Explore
                </Button>
              </CardFooter>
            </CardGlass>

            {/* Premium Card */}
            <CardPremium>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Premium Card</CardTitle>
                  <Badge variant="default" className="bg-gradient-to-r from-royal to-powder">
                    Elite
                  </Badge>
                </div>
                <CardDescription>
                  Luxury design with multiple gradient layers and premium effects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Award className="w-4 h-4 text-royal" />
                    <span className="text-sm text-gray-600">Elite Status</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-royal" />
                    <span className="text-sm text-gray-600">Community Favorite</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="premium" size="sm" className="w-full">
                  Upgrade Now
                </Button>
              </CardFooter>
            </CardPremium>

            {/* Statistics Cards */}
            <CardSleek className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-gradient-to-br from-royal to-powder rounded-2xl flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-royal">500+</CardTitle>
                <CardDescription>Active Members</CardDescription>
              </CardHeader>
            </CardSleek>

            <CardSleek className="text-center">
              <CardHeader>
                <div className="mx-auto w-12 h-12 bg-gradient-to-br from-powder to-bone rounded-2xl flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-royal" />
                </div>
                <CardTitle className="text-3xl font-bold text-royal">50+</CardTitle>
                <CardDescription>Events Hosted</CardDescription>
              </CardHeader>
            </CardSleek>
          </div>
        </section>

        {/* Interactive Demo */}
        <section className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-900">Interactive Demo</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CardPremium className="p-8">
              <CardHeader>
                <CardTitle className="text-2xl">Try the New Buttons</CardTitle>
                <CardDescription>
                  Hover over the buttons to see the enhanced animations and effects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button variant="default">Default</Button>
                  <Button variant="royal">Royal</Button>
                  <Button variant="premium">Premium</Button>
                  <Button variant="glass">Glass</Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline">Outline</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
              </CardContent>
            </CardPremium>

            <CardGlass className="p-8">
              <CardHeader>
                <CardTitle className="text-2xl text-white">Card Variants</CardTitle>
                <CardDescription className="text-white/80">
                  Different card styles for various use cases
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-4 bg-white/10 rounded-xl border border-white/20">
                    <h4 className="font-semibold text-white mb-2">Standard Card</h4>
                    <p className="text-sm text-white/80">Clean and minimal design</p>
                  </div>
                  <div className="p-4 bg-white/10 rounded-xl border border-white/20">
                    <h4 className="font-semibold text-white mb-2">Sleek Card</h4>
                    <p className="text-sm text-white/80">Enhanced with gradients</p>
                  </div>
                  <div className="p-4 bg-white/10 rounded-xl border border-white/20">
                    <h4 className="font-semibold text-white mb-2">Premium Card</h4>
                    <p className="text-sm text-white/80">Luxury design elements</p>
                  </div>
                </div>
              </CardContent>
            </CardGlass>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SleekDesignShowcase;
