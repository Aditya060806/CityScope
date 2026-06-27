import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock, User, Eye, EyeOff, Shield, Users, Award, MapPin, Star, ArrowRight, Sparkles, Download, Smartphone, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
const FloatingDownloadButton = () => {
  const [downloadState, setDownloadState] = useState<'idle' | 'downloading' | 'completed'>('idle');

  const handleDownload = () => {
    if (downloadState !== 'idle') return;
    
    setDownloadState('downloading');
    
    // Simulate an actual download feeling for the UI
    setTimeout(() => {
      const link = document.createElement('a');
      link.href = '/app-release.apk';
      link.download = 'CityScope.apk';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setDownloadState('completed');
      
      // Reset after showing completion state
      setTimeout(() => {
        setDownloadState('idle');
      }, 3000);
    }, 1800); // 1.8s downloading spin animation
  };

  return (
    <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
      <motion.div
        whileHover={downloadState === 'idle' ? { scale: 1.03 } : {}}
        whileTap={downloadState === 'idle' ? { scale: 0.96 } : { scale: 0.98 }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.4 }}
        className={`relative group ${downloadState === 'idle' ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={handleDownload}
      >
        {/* Soft elegant shadow glow behind */}
        <div className="absolute -inset-3 bg-indigo-500/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        
        <motion.div
          animate={{
            backgroundColor: downloadState === 'completed' 
              ? 'rgba(240, 253, 244, 0.98)' // green
              : downloadState === 'downloading' 
                ? 'rgba(255, 255, 255, 0.98)' // white
                : 'rgba(255, 255, 255, 0.95)', // premium white
            borderColor: downloadState === 'completed' 
              ? 'rgba(134, 239, 172, 0.8)' 
              : downloadState === 'downloading' 
                ? 'rgba(99, 102, 241, 0.2)' 
                : 'rgba(228, 228, 231, 0.8)', // zinc-200
          }}
          className="relative backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] group-hover:shadow-[0_16px_40px_rgb(0,0,0,0.12)] h-[44px] sm:h-[48px] px-5 sm:px-6 rounded-full flex items-center justify-between transition-all duration-300 border overflow-hidden"
        >
          {downloadState === 'idle' && (
            <motion.div
              animate={{ x: ["-100%", "200%"] }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 1 }}
              className="absolute inset-0 z-0 w-1/4 bg-gradient-to-r from-transparent via-zinc-100 to-transparent skew-x-[-20deg]"
            />
          )}

          <div className="relative z-10 flex items-center h-full">
            <AnimatePresence mode="wait">
              {downloadState === 'idle' && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2.5 sm:gap-3"
                >
                  <Download className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] text-indigo-500 transition-colors group-hover:text-indigo-600" strokeWidth={2.5} />
                  <span className="tracking-tight text-[14px] sm:text-[15px] font-[800] text-zinc-900/90 transition-colors group-hover:text-zinc-900">Get App</span>
                  
                  <div className="ml-1 sm:ml-2 flex items-center bg-zinc-100 px-2.5 py-[3px] rounded-full border border-zinc-200/60 transition-all">
                    <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase leading-none">APK</span>
                  </div>
                </motion.div>
              )}

              {downloadState === 'downloading' && (
                <motion.div
                  key="downloading"
                  initial={{ opacity: 0, scale: 0.8, filter: "blur(4px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 1.1, filter: "blur(4px)" }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2.5 px-3"
                >
                  <Loader2 className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] text-indigo-600 animate-spin" />
                  <span className="tracking-tight text-[14px] sm:text-[15px] font-[700] text-indigo-900">Downloading...</span>
                </motion.div>
              )}

              {downloadState === 'completed' && (
                <motion.div
                  key="completed"
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  className="flex items-center gap-2.5 pl-1 pr-3"
                >
                  <div className="bg-green-500 rounded-full p-1 shadow-sm shadow-green-500/20">
                    <Check className="w-[14px] h-[14px] sm:w-[16px] sm:h-[16px] text-white" strokeWidth={3} />
                  </div>
                  <span className="tracking-tight text-[14px] sm:text-[15px] font-[800] text-green-700">Downloaded</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export const Auth: React.FC = () => {
  const { signIn, signUp, signInWithGoogle, isLoading, user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('signin');
  const authFormRef = useRef<HTMLDivElement | null>(null);
  const signInEmailInputRef = useRef<HTMLInputElement | null>(null);

  // Handle callback errors
  useEffect(() => {
    const callbackError = searchParams.get('error');
    if (callbackError === 'callback_failed') {
      setError('Authentication failed. Please try again.');
    }
  }, [searchParams]);

  const [signInData, setSignInData] = useState({
    email: '',
    password: ''
  });

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    name: ''
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await signIn(signInData.email, signInData.password);
      toast({
        title: "Welcome back!",
        description: "You have successfully signed in to CityScope.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      setError(errorMessage);
      toast({
        title: "Sign in failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      await signUp(signUpData.email, signUpData.password, signUpData.name);
      toast({
        title: "Account created!",
        description: "Welcome to CityScope! Please check your email to verify your account.",
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      setError(errorMessage);
      toast({
        title: "Sign up failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);

    try {
      await signInWithGoogle();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign in failed';
      setError(errorMessage);
      toast({
        title: "Google sign in failed",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const focusAuthForm = () => {
    setActiveTab('signin');
    authFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      signInEmailInputRef.current?.focus();
    }, 260);
  };

  const features = [
    {
      icon: MapPin,
      title: "Smart Reporting",
      description: "AI-powered issue detection with precise location tracking"
    },
    {
      icon: Users,
      title: "Community Impact",
      description: "Connect with 10,000+ active citizens making real change"
    },
    {
      icon: Award,
      title: "Earn Rewards",
      description: "Get recognized for your civic contributions with tokens"
    }
  ];

  const floatingPixels = [
    { top: '10%', x: '8%', size: 'h-5 w-5', tone: 'dark' },
    { top: '18%', x: '22%', size: 'h-4 w-4', tone: 'soft' },
    { top: '24%', x: '38%', size: 'h-7 w-7', tone: 'dark' },
    { top: '33%', x: '28%', size: 'h-6 w-6', tone: 'mid' },
    { top: '40%', x: '58%', size: 'h-5 w-5', tone: 'soft' },
    { top: '48%', x: '42%', size: 'h-8 w-8', tone: 'dark' },
    { top: '56%', x: '74%', size: 'h-6 w-6', tone: 'mid' },
    { top: '64%', x: '52%', size: 'h-5 w-5', tone: 'soft' },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#d5d6d9]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.65),transparent_48%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(24,24,27,0.06)_100%)]" />

      {/* Floating Download Button - Always Visible God-Tier Pill */}
      <FloatingDownloadButton />

      <div className="relative z-10 flex min-h-screen">
        <div className="relative hidden lg:flex lg:w-[58%] flex-col px-8 py-6 xl:px-14 xl:py-8">
          <div className="flex items-center justify-between text-[13px] text-zinc-800/90">
            <div className="flex items-center gap-3 font-semibold tracking-tight">
              <img src="/CityScope.png" alt="CityScope" className="h-6 w-6 object-contain" />
              <span>CITYSCOPE</span>
            </div>
            <div className="flex items-center gap-5 text-zinc-700">
              <span>Smart Civic Platform</span>
              <span>Citizen Impact Network</span>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[38%] overflow-hidden lg:block" aria-hidden="true">
            <div className="absolute right-[12%] top-[14%] h-28 w-28 rounded-full bg-white/20 blur-2xl" />
            <div className="absolute left-[18%] top-[54%] h-24 w-24 rounded-full bg-zinc-900/8 blur-2xl" />
            {floatingPixels.map((pixel, index) => {
              const toneClass =
                pixel.tone === 'dark'
                  ? 'bg-zinc-900/92'
                  : pixel.tone === 'mid'
                    ? 'bg-zinc-800/74'
                    : 'bg-zinc-700/55';

              return (
                <div
                  key={`${pixel.top}-${pixel.x}-${index}`}
                  className={`absolute ${pixel.size} ${toneClass} rounded-[2px] shadow-[0_10px_24px_rgba(24,24,27,0.18)] animate-float-smooth`}
                  style={{ top: pixel.top, left: pixel.x, animationDelay: `${index * 0.25}s` }}
                />
              );
            })}
          </div>

          <div className="relative z-20 flex flex-1 flex-col justify-center pb-24 pt-10">
            <div className="max-w-[39rem] space-y-8 animate-fade-in-up">
              <div className="space-y-5" style={{ animationDelay: '80ms' }}>
                <h2 className="max-w-[14ch] text-[clamp(2.7rem,4.7vw,5rem)] leading-[0.93] font-black tracking-[-0.03em] text-zinc-900">
                  <span className="inline-block pr-3 align-middle text-[0.88em]">•</span>
                  <span className="align-middle">Make Your City</span>
                  <span className="block">Better Together</span>
                </h2>
                <p className="max-w-[32rem] text-[clamp(1.2rem,1.55vw,1.68rem)] leading-relaxed text-zinc-700">
                  Join thousands of citizens using AI-powered technology to create positive change in their communities.
                </p>
              </div>

              <button
                type="button"
                onClick={focusAuthForm}
                className="text-sm font-bold uppercase tracking-wide text-red-600 transition-colors hover:text-red-700"
              >
                [ Start Civic Journey ]
              </button>

              <div className="space-y-4 pt-1">
                {features.map((feature) => (
                  <div key={feature.title} className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-700/20 bg-white/70 shadow-sm">
                      <feature.icon className="h-4 w-4 text-zinc-800" />
                    </div>
                    <div>
                      <h3 className="text-[clamp(1.75rem,2vw,2.1rem)] font-extrabold leading-[1.02] tracking-tight text-zinc-900">{feature.title}</h3>
                      <p className="mt-1 text-base leading-snug text-zinc-700">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-6 border-t border-zinc-700/20 pt-6">
                <div className="flex items-center gap-2 text-zinc-700">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm font-semibold">Secure & Private</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700">
                  <Star className="h-4 w-4" />
                  <span className="text-sm font-semibold">4.9/5 Rating</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-zinc-900 [clip-path:polygon(0_48%,4%_48%,4%_36%,8%_36%,8%_58%,12%_58%,12%_44%,18%_44%,18%_62%,24%_62%,24%_40%,30%_40%,30%_56%,36%_56%,36%_38%,42%_38%,42%_52%,48%_52%,48%_34%,56%_34%,56%_60%,62%_60%,62%_42%,70%_42%,70%_54%,76%_54%,76%_37%,84%_37%,84%_58%,90%_58%,90%_45%,96%_45%,96%_62%,100%_62%,100%_100%,0_100%)]" />
        </div>

        <div className="w-full lg:w-[42%] flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div className="w-full max-w-md space-y-7 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            <div className="lg:hidden text-center space-y-4 pt-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg shadow-zinc-900/10">
                <img src="/CityScope.png" alt="CityScope" className="w-10 h-10 object-contain" />
              </div>
              <div>
                <h1 className="text-3xl font-black tracking-tight text-zinc-900">CityScope</h1>
                <p className="text-zinc-600">Civic Engagement Platform</p>
              </div>
            </div>

            <Card ref={authFormRef} className="border border-zinc-300/80 bg-white/95 shadow-2xl shadow-zinc-900/10 backdrop-blur-sm">
              <CardHeader className="space-y-3 pb-6">
                <div className="text-center space-y-1.5">
                  <CardTitle className="text-4xl font-black tracking-tight text-zinc-900">
                    {activeTab === 'signin' ? 'Welcome back' : 'Get started'}
                  </CardTitle>
                  <p className="text-zinc-600 text-sm">
                    {activeTab === 'signin'
                      ? 'Sign in to continue your civic journey'
                      : 'Create your account and start making impact'
                    }
                  </p>
                </div>

                {/* Social Proof */}
                <div className="flex items-center justify-center gap-2 text-xs text-zinc-500 pt-2">
                  <div className="flex -space-x-1.5">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-5 h-5 bg-gradient-to-r from-zinc-500 to-zinc-800 rounded-full border-2 border-white" />
                    ))}
                  </div>
                  <span>Join 10,000+ citizens</span>
                </div>
              </CardHeader>

              <CardContent className="px-6 pb-6">
                {error && (
                  <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
                    <AlertDescription className="text-red-800 text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 h-11 rounded-lg bg-zinc-100 p-0.5 mb-6">
                    <TabsTrigger
                      value="signin"
                      className="text-sm font-semibold text-zinc-600 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm rounded-md"
                    >
                      Sign In
                    </TabsTrigger>
                    <TabsTrigger
                      value="signup"
                      className="text-sm font-semibold text-zinc-600 data-[state=active]:bg-white data-[state=active]:text-zinc-900 data-[state=active]:shadow-sm rounded-md"
                    >
                      Sign Up
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="signin" className="mt-0">
                    <form onSubmit={handleSignIn} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="signin-email" className="text-sm font-medium text-zinc-700">
                          Email address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                          <Input
                            ref={signInEmailInputRef}
                            id="signin-email"
                            type="email"
                            placeholder="Enter your email"
                            value={signInData.email}
                            onChange={(e) => setSignInData(prev => ({ ...prev, email: e.target.value }))}
                            style={{ paddingLeft: '44px', paddingRight: '12px' }}
                            className="h-11 border-zinc-300 bg-white focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Link
                          to="/auth/forgot-password"
                          className="text-xs font-semibold text-zinc-600 underline underline-offset-2 transition-colors hover:text-zinc-900"
                        >
                          Forgot password?
                        </Link>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="signin-password" className="text-sm font-medium text-zinc-700">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                          <Input
                            id="signin-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            value={signInData.password}
                            onChange={(e) => setSignInData(prev => ({ ...prev, password: e.target.value }))}
                            style={{ paddingLeft: '44px', paddingRight: '44px' }}
                            className="h-11 border-zinc-300 bg-white focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                            required
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-11 bg-zinc-900 hover:bg-black text-white font-semibold mt-6"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Signing in...
                          </>
                        ) : (
                          <>
                            Sign in
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="signup" className="mt-0">
                    <form onSubmit={handleSignUp} className="space-y-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-name" className="text-sm font-medium text-zinc-700">
                          Full name
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                          <Input
                            id="signup-name"
                            type="text"
                            placeholder="Enter your full name"
                            value={signUpData.name}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, name: e.target.value }))}
                            style={{ paddingLeft: '44px', paddingRight: '12px' }}
                            className="h-11 border-zinc-300 bg-white focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="signup-email" className="text-sm font-medium text-zinc-700">
                          Email address
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                          <Input
                            id="signup-email"
                            type="email"
                            placeholder="Enter your email"
                            value={signUpData.email}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, email: e.target.value }))}
                            style={{ paddingLeft: '44px', paddingRight: '12px' }}
                            className="h-11 border-zinc-300 bg-white focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="signup-password" className="text-sm font-medium text-zinc-700">
                          Password
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 pointer-events-none" />
                          <Input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Create a password"
                            value={signUpData.password}
                            onChange={(e) => setSignUpData(prev => ({ ...prev, password: e.target.value }))}
                            style={{ paddingLeft: '44px', paddingRight: '44px' }}
                            className="h-11 border-zinc-300 bg-white focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                            required
                            minLength={6}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <p className="text-xs text-zinc-500">Must be at least 6 characters</p>
                      </div>

                      <Button
                        type="submit"
                        className="w-full h-11 bg-zinc-900 hover:bg-black text-white font-semibold mt-6"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Create account
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>
                </Tabs>

                {/* Divider */}
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-zinc-200" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-white px-2 text-zinc-500">OR</span>
                  </div>
                </div>

                {/* Google Sign In */}
                <Button
                  variant="outline"
                  type="button"
                  className="w-full h-11 border-zinc-300 hover:bg-zinc-50 text-zinc-700 font-medium"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="text-center space-y-3">
              <p className="text-xs text-zinc-500 leading-relaxed">
                By continuing, you agree to our{' '}
                <Link to="/auth/terms" className="text-zinc-700 hover:text-zinc-900 font-medium underline underline-offset-2">
                  Terms of Service
                </Link>
                {' '}and{' '}
                <Link to="/auth/privacy" className="text-zinc-700 hover:text-zinc-900 font-medium underline underline-offset-2">
                  Privacy Policy
                </Link>
              </p>
              <Link
                to="/auth/help"
                className="inline-block text-xs font-semibold uppercase tracking-wide text-zinc-600 hover:text-zinc-900"
              >
                Need help?
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};