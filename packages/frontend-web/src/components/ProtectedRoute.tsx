'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading, loadUser, accessToken } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (accessToken && !isAuthenticated) {
        await loadUser();
      }
      setIsChecking(false);
    };

    checkAuth();
  }, [accessToken, isAuthenticated, loadUser]);

  useEffect(() => {
    if (!isChecking && !isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
  }, [isChecking, isLoading, isAuthenticated, router]);

  if (isChecking || isLoading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
