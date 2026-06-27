import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from '@/components/ui/button';
import { Compass, Home } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="page-container flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-xl clay-card p-10 text-center bg-white/90">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-[#1E40AF]">
          <Compass className="h-8 w-8" />
        </div>
        <h1 className="text-5xl font-black text-[#0B1121] mb-3">404</h1>
        <p className="text-xl text-slate-600 mb-8">This route does not exist in CityScope.</p>
        <Button asChild className="btn-royal">
          <a href="/" className="inline-flex items-center gap-2">
            <Home className="h-4 w-4" />
            Return Home
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
