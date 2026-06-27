import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, LifeBuoy, Mail, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const helpItems = [
  {
    icon: LifeBuoy,
    title: 'Account Access',
    body: 'Use Forgot Password to recover access quickly. If you no longer have email access, contact support with account details.',
  },
  {
    icon: ShieldCheck,
    title: 'Security Questions',
    body: 'For suspicious sign-ins or security concerns, reset your password immediately and review recent account activity.',
  },
  {
    icon: Mail,
    title: 'Support Contact',
    body: 'Send detailed issue notes to support@cityscope.app. Include steps to reproduce and screenshots when possible.',
  },
];

export const AuthHelp: React.FC = () => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#d5d6d9] px-6 py-10 sm:px-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.62),transparent_50%)]" />
      <div className="relative z-10 mx-auto w-full max-w-3xl animate-fade-in-up">
        <Link
          to="/auth"
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-zinc-700 transition-colors hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Auth
        </Link>

        <Card className="border border-zinc-300/80 bg-white/95 shadow-2xl shadow-zinc-900/10">
          <CardHeader className="space-y-2">
            <CardTitle className="text-3xl font-black tracking-tight text-zinc-900">Help and Support</CardTitle>
            <p className="text-sm text-zinc-600">
              Need help signing in or managing your account? Use the actions below.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {helpItems.map((item) => (
              <div key={item.title} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-zinc-700" />
                  <h2 className="text-sm font-bold uppercase tracking-wide text-zinc-900">{item.title}</h2>
                </div>
                <p className="text-sm text-zinc-700 leading-relaxed">{item.body}</p>
              </div>
            ))}

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/auth/forgot-password"
                className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-black"
              >
                Forgot Password
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
              <a
                href="mailto:support@cityscope.app"
                className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-50"
              >
                Email Support
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
