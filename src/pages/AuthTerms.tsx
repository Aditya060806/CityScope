import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const AuthTerms: React.FC = () => {
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
            <CardTitle className="text-3xl font-black tracking-tight text-zinc-900">Terms of Service</CardTitle>
            <p className="text-sm text-zinc-600">Effective date: March 26, 2026</p>
          </CardHeader>
          <CardContent className="space-y-6 text-sm leading-relaxed text-zinc-700">
            <section>
              <h2 className="mb-2 text-lg font-bold text-zinc-900">1. Platform Use</h2>
              <p>
                CityScope helps citizens report issues, track public improvements, and collaborate with communities.
                You agree to use the platform lawfully and avoid fraudulent, abusive, or harmful submissions.
              </p>
            </section>
            <section>
              <h2 className="mb-2 text-lg font-bold text-zinc-900">2. Account Responsibilities</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account and for activities performed
                under your credentials. Keep profile and contact information accurate for service reliability.
              </p>
            </section>
            <section>
              <h2 className="mb-2 text-lg font-bold text-zinc-900">3. User Content and Reports</h2>
              <p>
                Reports, comments, and uploads remain your responsibility. By submitting content, you grant CityScope
                permission to process and display it for civic engagement, moderation, and analytics functions.
              </p>
            </section>
            <section>
              <h2 className="mb-2 text-lg font-bold text-zinc-900">4. Moderation and Safety</h2>
              <p>
                CityScope may remove content or restrict accounts when misuse, harassment, misinformation, or policy
                violations are detected. Repeated abuse may lead to permanent suspension.
              </p>
            </section>
            <section>
              <h2 className="mb-2 text-lg font-bold text-zinc-900">5. Service Availability</h2>
              <p>
                We continuously improve reliability but do not guarantee uninterrupted service in all regions or
                circumstances. Planned maintenance and emergency updates may affect availability.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
