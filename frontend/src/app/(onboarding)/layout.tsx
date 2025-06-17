'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { checkApiHealth } from '@/lib/api';
import { MaintenancePage } from '@/components/maintenance/maintenance-page';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isApiHealthy, setIsApiHealthy] = useState<boolean | null>(null);

  // Check API health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const healthy = await checkApiHealth();
        setIsApiHealthy(healthy);
      } catch (error) {
        console.error('Failed to check API health:', error);
        setIsApiHealthy(false);
      }
    };

    checkHealth();
  }, []);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth');
    }
  }, [user, loading, router]);

  // Show loading state
  if (loading || isApiHealthy === null) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show maintenance page if API is not healthy
  if (!isApiHealthy) {
    return <MaintenancePage />;
  }

  // Show auth loading if user is not loaded yet
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Render full-screen onboarding layout without sidebar
  return (
    <div className="min-h-screen w-full bg-background">
      {children}
    </div>
  );
}
