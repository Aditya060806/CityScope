import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export const AuthForgotPassword: React.FC = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await resetPassword(email);
      setIsSubmitted(true);
      toast({
        title: 'Reset link sent',
        description: 'Check your email for a secure password reset link.',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not send password reset email';
      setError(message);
      toast({
        title: 'Reset request failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#d5d6d9] px-6 py-10 sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.62),transparent_50%)]" />
      <div className="relative z-10 mx-auto w-full max-w-lg animate-fade-in-up">
        <Link
          to="/auth"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 transition-colors hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Link>

        <Card className="border border-zinc-300/80 bg-white/95 shadow-2xl shadow-zinc-900/10">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl font-black tracking-tight text-zinc-900">Reset Password</CardTitle>
            <p className="text-sm text-zinc-600">
              Enter your account email and we will send you a secure reset link.
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50">
                <AlertDescription className="text-sm text-red-800">{error}</AlertDescription>
              </Alert>
            )}

            {isSubmitted ? (
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
                A password reset link has been sent to <span className="font-semibold">{email}</span>.
                Open the link in your email to continue.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email" className="text-sm font-medium text-zinc-700">
                    Email address
                  </Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      id="reset-email"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      style={{ paddingLeft: '44px', paddingRight: '12px' }}
                      className="h-11 border-zinc-300 bg-white focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  className="h-11 w-full bg-zinc-900 text-white hover:bg-black"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending Link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>
            )}

            <p className="mt-5 text-xs text-zinc-500">
              If the email exists, you will receive instructions shortly.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
