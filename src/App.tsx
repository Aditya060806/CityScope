import { FC, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import { LocationProvider } from './contexts/LocationContextProvider';
import { AuthProvider } from './contexts/AuthContextProvider';
import { PRADAutoDetectionProvider } from './contexts/PRADAutoDetectionContext';
import { SoundScopeProvider } from './contexts/SoundScopeContext';
import { SOSProvider } from './contexts/SOSContext';
import { useAuth } from './hooks/useAuth';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { Toaster } from '@/components/ui/toaster';
import { FullPageLoader } from '@/lib/loading-states';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { lazyRetry } from '@/lib/lazyRetry';

// Lazy load pages (with auto-retry on stale deployment chunks)
const Dashboard = lazyRetry(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Report = lazyRetry(() => import('./pages/Report').then(m => ({ default: m.Report })));
const Auth = lazyRetry(() => import('./pages/Auth').then(m => ({ default: m.Auth })));
const AuthTerms = lazyRetry(() => import('./pages/AuthTerms').then(m => ({ default: m.AuthTerms })));
const AuthPrivacy = lazyRetry(() => import('./pages/AuthPrivacy').then(m => ({ default: m.AuthPrivacy })));
const AuthHelp = lazyRetry(() => import('./pages/AuthHelp').then(m => ({ default: m.AuthHelp })));
const AuthForgotPassword = lazyRetry(() => import('./pages/AuthForgotPassword').then(m => ({ default: m.AuthForgotPassword })));
const AuthResetPassword = lazyRetry(() => import('./pages/AuthResetPassword').then(m => ({ default: m.AuthResetPassword })));
const EnhancedRewards = lazyRetry(() => import('./pages/EnhancedRewards').then(m => ({ default: m.EnhancedRewards })));
const Map = lazyRetry(() => import('./pages/Map').then(m => ({ default: m.Map })));
const Leaderboard = lazyRetry(() => import('./pages/Leaderboard').then(m => ({ default: m.Leaderboard })));
const EnhancedAnalytics = lazyRetry(() => import('./pages/EnhancedAnalytics').then(m => ({ default: m.EnhancedAnalytics })));
const AIAnalytics = lazyRetry(() => import('./pages/AIAnalytics').then(m => ({ default: m.AIAnalytics })));
const EnhancedHeroes = lazyRetry(() => import('./pages/EnhancedHeroes').then(m => ({ default: m.EnhancedHeroes })));
const Profile = lazyRetry(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const Settings = lazyRetry(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const Admin = lazyRetry(() => import('./pages/Admin').then(m => ({ default: m.Admin })));
const Messages = lazyRetry(() => import('./pages/Messages').then(m => ({ default: m.Messages })));
const RoadAnomalies = lazyRetry(() => import('./pages/RoadAnomalies').then(m => ({ default: m.RoadAnomalies })));
const SoundScope = lazyRetry(() => import('./pages/SoundScope').then(m => ({ default: m.SoundScope })));
const SwarmVerify = lazyRetry(() => import('./pages/SwarmVerify'));
const CivicAR = lazyRetry(() => import('./pages/CivicAR'));
const CivicTimeLapse = lazyRetry(() => import('./pages/CivicTimeLapse'));
const GreenScope = lazyRetry(() => import('./pages/GreenScope'));
const CivicSOS = lazyRetry(() => import('./pages/CivicSOS'));
const AuthCallback = lazyRetry(() => import('./components/auth/AuthCallback').then(m => ({ default: m.AuthCallback })));
const NotFound = lazyRetry(() => import('./pages/NotFound'));

// Query client with robust error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: unknown) => {
        const err = error as { status?: number };
        if (err?.status && err.status >= 400 && err.status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
    mutations: { retry: 1 },
  },
});

// Rewards wrapper — needs auth context
const RewardsWrapper: FC = () => {
  const { user } = useAuth();
  return <EnhancedRewards userId={user?.id || ''} />;
};

const App: FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider attribute="class" defaultTheme="light" disableTransitionOnChange>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <AuthProvider>
              <LocationProvider>
                <PRADAutoDetectionProvider>
                <SoundScopeProvider>
                <SOSProvider>
                <Suspense fallback={<FullPageLoader />}>
                  <Routes>
                    {/* Public routes — no layout wrapper */}
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/auth/callback" element={<AuthCallback />} />
                    <Route path="/auth/terms" element={<AuthTerms />} />
                    <Route path="/auth/privacy" element={<AuthPrivacy />} />
                    <Route path="/auth/help" element={<AuthHelp />} />
                    <Route path="/auth/forgot-password" element={<AuthForgotPassword />} />
                    <Route path="/auth/reset-password" element={<AuthResetPassword />} />

                    {/* Protected routes — all share AppLayout (nav, dark mode, chatbot) */}
                    <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                      <Route index element={<Dashboard />} />
                      <Route path="/report" element={<Report />} />
                      <Route path="/map" element={<Map />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/rewards" element={<RewardsWrapper />} />
                      <Route path="/analytics" element={<EnhancedAnalytics />} />
                      <Route path="/ai-analytics" element={<AIAnalytics />} />
                      <Route path="/heroes" element={<EnhancedHeroes />} />
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/admin" element={<Admin />} />
                      <Route path="/messages" element={<Messages />} />
                      <Route path="/road-anomalies" element={<RoadAnomalies />} />
                      <Route path="/sound-scope" element={<SoundScope />} />
                      <Route path="/swarm-verify" element={<SwarmVerify />} />
                      <Route path="/civic-ar" element={<CivicAR />} />
                      <Route path="/timelapse" element={<CivicTimeLapse />} />
                      <Route path="/green-scope" element={<GreenScope />} />
                      <Route path="/sos" element={<CivicSOS />} />
                    </Route>

                    {/* 404 catch-all */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <Toaster />
                </SOSProvider>
                </SoundScopeProvider>
                </PRADAutoDetectionProvider>
              </LocationProvider>
            </AuthProvider>
          </BrowserRouter>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
