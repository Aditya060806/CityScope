import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const AuthPrivacy: React.FC = () => {
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
            <CardTitle className="text-3xl font-black tracking-tight text-zinc-900">Privacy Policy</CardTitle>
            <p className="text-sm text-zinc-600">Effective date: March 26, 2026</p>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-relaxed text-zinc-700">
            <section>
              <h2 className="mb-2 text-lg font-bold text-zinc-900">1. Data We Collect</h2>
              <p>
                We collect account information, report content, optional location details, and interaction metadata to
                operate civic reporting and community features.
              </p>
            </section>
            <section>
              <h2 className="mb-2 text-lg font-bold text-zinc-900">2. How Data Is Used</h2>
              <p>
                Data is used to authenticate accounts, process issue reports, improve service quality, and provide
                relevant civic insights. We do not sell personal data to third parties.
              </p>
            </section>
            <section>
              <h2 className="mb-2 text-lg font-bold text-zinc-900">3. Data Sharing</h2>
              <p>
                We share only the minimum necessary data with infrastructure providers and civic workflow components.
                Public report visibility may expose report details according to platform settings.
              </p>
            </section>
            <section>
              <h2 className="mb-2 text-lg font-bold text-zinc-900">4. Security</h2>
              <p>
                We use authentication controls and access restrictions to protect user information. No platform can
                guarantee absolute security, but we apply reasonable safeguards and monitoring.
              </p>
            </section>
            <section>
              <h2 className="mb-2 text-lg font-bold text-zinc-900">5. Your Choices</h2>
              <p>
                You can update profile information, request account support, and manage communication preferences.
                Contact support through the Help page for privacy-related requests.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
