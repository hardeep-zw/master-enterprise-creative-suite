import React, { useEffect } from 'react';
import LegalPage from '@web/features/marketing/components/LegalPage.js';
import PricingPage from '@web/features/billing/components/PricingPage.js';
import LandingPage from '@web/features/marketing/components/LandingPage.js';
import { GenerationLoader } from '@web/shared/components/GenerationLoader.js';
import { BrandSetup } from '../features/brand-guidelines/components/BrandSetup.js';
import type { BrandGuidelines } from '@shared-types/brand.js';
import { getAppDestination, isPublicRoute, normalizePath } from '@web/lib/navigation.js';

export interface AppRouterProps {
  currentPath: string;
  navigateTo: (path: string, options?: { replace?: boolean }) => void;
  user: any;
  loading: boolean;
  isInitialDataLoading: boolean;
  brandSetupComplete: boolean;
  credits: number;
  setCredits: React.Dispatch<React.SetStateAction<number>>;
  authError: string | null;
  setAuthError: (error: string | null) => void;
  login: () => Promise<void>;
  loginWithEmail: (e: string, p: string) => Promise<void>;
  registerWithEmail: (e: string, p: string) => Promise<void>;
  handleLogout: () => Promise<void>;
  handleBrandSetupComplete: (guidelines: BrandGuidelines, assets: any[]) => Promise<void>;
  children: React.ReactNode;
}

export const AppRouter: React.FC<AppRouterProps> = ({
  currentPath,
  navigateTo,
  user,
  loading,
  isInitialDataLoading,
  brandSetupComplete,
  credits,
  setCredits,
  authError,
  setAuthError,
  login,
  loginWithEmail,
  registerWithEmail,
  handleLogout,
  handleBrandSetupComplete,
  children
}) => {
  // Canonical Destination Handler for all "Enter the Product" actions
  const handleEnterProduct = () => {
    const destination = getAppDestination(user, brandSetupComplete);
    navigateTo(destination);
  };

  // Centralized Authentication and Onboarding Routing Guard Authority
  useEffect(() => {
    // 1. While auth state or initial cloud data is resolving, NEVER redirect prematurely
    if (loading || (user && isInitialDataLoading)) {
      return;
    }

    const { pathname } = normalizePath(currentPath);

    // 2. Unauthenticated User Guard
    if (!user) {
      if (!isPublicRoute(pathname)) {
        // Attempting to access protected route -> replaceState to /login (no history loop)
        navigateTo('/login', { replace: true });
      }
      return;
    }

    // 3. Authenticated User Guard
    if (user) {
      // Public pages /pricing and /legal remain fully accessible to authenticated users!
      if (pathname === '/pricing' || pathname.startsWith('/legal')) {
        return;
      }

      const destination = getAppDestination(user, brandSetupComplete);

      // A. Visiting landing page ("/") or login ("/login") when authenticated -> Forward into product
      if (pathname === '/' || pathname === '/login') {
        navigateTo(destination, { replace: true });
        return;
      }

      // B. Visiting /brand-init when brand setup is ALREADY complete -> Forward to /workspace
      if (pathname === '/brand-init' && brandSetupComplete) {
        navigateTo('/workspace', { replace: true });
        return;
      }

      // C. Visiting /workspace or /history when brand setup is NOT complete -> Forward to /brand-init
      if ((pathname === '/workspace' || pathname.startsWith('/history/')) && !brandSetupComplete && !isInitialDataLoading) {
        const cached = localStorage.getItem('brandSetupComplete');
        if (cached !== 'true') {
          navigateTo('/brand-init', { replace: true });
          return;
        }
      }
    }
  }, [user?.uid, loading, isInitialDataLoading, brandSetupComplete, currentPath, navigateTo]);

  const { pathname } = normalizePath(currentPath);

  if (pathname.startsWith('/legal')) {
    return (
      <LegalPage 
        onOpenWorkspace={handleEnterProduct}
        onLogin={handleEnterProduct}
        navigateTo={navigateTo}
        user={user}
        brandSetupComplete={brandSetupComplete}
      />
    );
  }

  if (pathname === '/pricing') {
    return (
      <PricingPage 
        onOpenWorkspace={handleEnterProduct}
        onLogin={handleEnterProduct}
        navigateTo={navigateTo}
        user={user}
        brandSetupComplete={brandSetupComplete}
        credits={credits}
        setCredits={setCredits}
      />
    );
  }

  if (pathname === '/') {
    return (
      <LandingPage 
        navigateTo={navigateTo}
        onOpenWorkspace={handleEnterProduct}
        onLogin={handleEnterProduct}
      />
    );
  }

  // Prevent flashing login or brand-init during auth loading or initial workspace data hydration
  if (loading || (user && isInitialDataLoading)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-white dark:bg-slate-950 text-slate-900 dark:text-white">
        <GenerationLoader title="Loading Creative Suite..." subtitle="Authenticating workspace and brand parameters" />
      </div>
    );
  }

  if (pathname === '/login' || pathname === '/brand-init' || !brandSetupComplete) {
    return (
      <BrandSetup 
        user={user}
        loading={loading}
        login={login}
        loginWithEmail={loginWithEmail}
        registerWithEmail={registerWithEmail}
        logout={handleLogout}
        authError={authError}
        setAuthError={setAuthError}
        currentPath={user && !brandSetupComplete ? '/brand-init' : pathname}
        navigateTo={navigateTo}
        onComplete={handleBrandSetupComplete} 
      />
    );
  }

  return <>{children}</>;
};

export default AppRouter;
