'use client';

import { useAuth } from '@/components/AuthProvider';
import { isAdminUser } from '@/lib/admin';
import AdminDashboard from '@/components/admin/AdminDashboard';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminSettingsPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect non-admin users
    if (!isLoading && (!user || !isAdminUser(user))) {
      router.push('/settings/billing');
    }
  }, [user, isLoading, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything for non-admin users (they'll be redirected)
  if (!user || !isAdminUser(user)) {
    return null;
  }

  return <AdminDashboard />;
}
