'use client';

import { useAuth } from './authContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '@/app/components/LoadingSpinner';

export function withAuth(Component, { requireAdmin = false } = {}) {
  return function ProtectedComponent(props) {
    const router = useRouter();
    const { isAuthenticated, isAdmin, loading } = useAuth();

    useEffect(() => {
      if (!loading) {
        if (!isAuthenticated) {
          router.push('/login');
        } else if (requireAdmin && !isAdmin) {
          router.push('/user');
        }
      }
    }, [isAuthenticated, isAdmin, loading, router]);

    if (loading) {
      return <LoadingSpinner text="Loading..." />;
    }

    if (!isAuthenticated) {
      return null;
    }

    if (requireAdmin && !isAdmin) {
      return null;
    }

    return <Component {...props} />;
  };
}
