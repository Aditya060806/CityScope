import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spotlight } from '@/components/ui/spotlight';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Star, 
  Target, 
  TrendingUp, 
  Users, 
  CheckCircle,
  BarChart3,
  Award,
  Zap,
  Crown
} from 'lucide-react';
import { motion } from 'framer-motion';

export const SpotlightDemo: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Main Spotlight Effect */}
      <div className="absolute inset-0 -top-40 left-0 right-0 h-full">
        <Spotlight className="top-0 left-0" fill="#3b82f6" />
      </div>
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <h1 className="text-6xl font-black text-white mb-6 relative z-10">
              Spotlight <span className="text-blue-400">Effects</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed relative z-10">
              Beautiful spotlight effects powered by Aceternity UI, perfect for drawing attention 
              to key elements and creating engaging user experiences.
            </p>
          </motion.div>

          {/* Demo Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Basic Spotlight Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <SpotlightCard
                spotlightColor="#3b82f6"
                spotlightPosition="top-left"
                intensity="medium"
                className="rounded-2xl"
              >
                <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Basic Spotlight</h3>
                        <p className="text-sm text-gray-300">Top-left position</p>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm">
                      This card uses a basic spotlight effect positioned at the top-left corner.
                    </p>
                  </CardContent>
                </Card>
              </SpotlightCard>
            </motion.div>

            {/* High Intensity Spotlight */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <SpotlightCard
                spotlightColor="#10b981"
                spotlightPosition="center"
                intensity="high"
                className="rounded-2xl"
              >
                <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                        <Star className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">High Intensity</h3>
                        <p className="text-sm text-gray-300">Center position</p>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm">
                      High intensity spotlight effect with center positioning for maximum impact.
                    </p>
                  </CardContent>
                </Card>
              </SpotlightCard>
            </motion.div>

            {/* Low Intensity Spotlight */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <SpotlightCard
                spotlightColor="#f59e0b"
                spotlightPosition="bottom-right"
                intensity="low"
                className="rounded-2xl"
              >
                <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center">
                        <Target className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Low Intensity</h3>
                        <p className="text-sm text-gray-300">Bottom-right position</p>
                      </div>
                    </div>
                    <p className="text-gray-300 text-sm">
                      Subtle spotlight effect with low intensity for gentle highlighting.
                    </p>
                  </CardContent>
                </Card>
              </SpotlightCard>
            </motion.div>
          </div>

          {/* Feature Showcase */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
            {/* Stats Card with Spotlight */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <SpotlightCard
                spotlightColor="#8b5cf6"
                spotlightPosition="top-left"
                intensity="medium"
                className="rounded-3xl"
              >
                <Card className="bg-gradient-to-br from-purple-500/20 to-blue-500/20 backdrop-blur-md border border-white/20 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                      <BarChart3 className="w-8 h-8 text-purple-400" />
                      Analytics Dashboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">1,247</div>
                        <div className="text-sm text-gray-300">Total Issues</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-white mb-1">892</div>
                        <div className="text-sm text-gray-300">Resolved</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-300">Resolution Rate</span>
                      <Badge className="bg-green-500/20 text-green-400 border-green-400/30">
                        71.5%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </SpotlightCard>
            </motion.div>

            {/* Leaderboard Card with Spotlight */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <SpotlightCard
                spotlightColor="#fbbf24"
                spotlightPosition="top-right"
                intensity="medium"
                className="rounded-3xl"
              >
                <Card className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-md border border-white/20 shadow-2xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
                      <Crown className="w-8 h-8 text-yellow-400" />
                      Top Performers
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { name: 'Priya Sharma', points: 1250, rank: 1 },
                      { name: 'Rajesh Kumar', points: 1180, rank: 2 },
                      { name: 'Anita Singh', points: 1090, rank: 3 }
                    ].map((user, index) => (
                      <div key={user.name} className="flex items-center justify-between p-3 rounded-xl bg-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-white">#{user.rank}</span>
                          </div>
                          <span className="text-white font-medium">{user.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Star className="w-4 h-4 text-yellow-400" />
                          <span className="text-white font-bold">{user.points.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </SpotlightCard>
            </motion.div>
          </div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center"
          >
            <SpotlightCard
              spotlightColor="#ef4444"
              spotlightPosition="center"
              intensity="high"
              className="rounded-3xl"
            >
              <Card className="bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur-md border border-white/20 shadow-2xl">
                <CardContent className="p-12">
                  <div className="flex items-center justify-center gap-4 mb-6">
                    <Zap className="w-12 h-12 text-red-400" />
                    <h2 className="text-4xl font-black text-white">Ready to Shine?</h2>
                  </div>
                  <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                    Experience the power of spotlight effects in your CityScope application. 
                    Navigate to Heroes and Analytics to see them in action!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg" 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                    >
                      <Trophy className="w-5 h-5 mr-2" />
                      View Heroes
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline"
                      className="border-white/30 text-white hover:bg-white/10 px-8 py-3 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
                    >
                      <BarChart3 className="w-5 h-5 mr-2" />
                      View Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </SpotlightCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
