/**
 * Canonical Navigation Resolver for Writopedia AI
 *
 * Provides a single source of truth for resolving where a user should go
 * when an "enter the product" action is triggered (e.g. Platform, Open Workspace, Log In/Sign Up when already authenticated).
 *
 * STATE 1: Unauthenticated -> '/login'
 * STATE 2: Authenticated + brand setup incomplete -> '/brand-init'
 * STATE 3: Authenticated + brand setup complete -> '/workspace'
 */
export const getAppDestination = (user: any, brandSetupComplete: boolean): string => {
  if (!user) return '/login';
  if (!brandSetupComplete) return '/brand-init';
  return '/workspace';
};

/**
 * Normalizes an internal routing path.
 * Separates pathname from query string and hash anchor for deterministic route matching.
 */
export const normalizePath = (rawPath: string): { pathname: string; hash: string; search: string } => {
  if (!rawPath) {
    return { pathname: '/', hash: '', search: '' };
  }

  // Handle relative paths like '/legal#privacy' or '/pricing?plan=pro'
  const [pathAndQuery, ...hashParts] = rawPath.split('#');
  const hash = hashParts.length > 0 ? `#${hashParts.join('#')}` : '';
  const [pathname = '/', ...queryParts] = pathAndQuery.split('?');
  const search = queryParts.length > 0 ? `?${queryParts.join('?')}` : '';

  // Ensure leading slash and normalize root
  const cleanPathname = pathname.startsWith('/') ? pathname : `/${pathname}`;

  return {
    pathname: cleanPathname || '/',
    hash,
    search
  };
};

/**
 * Checks if a route is publicly accessible without authentication.
 */
export const isPublicRoute = (pathname: string): boolean => {
  const clean = pathname.split('#')[0].split('?')[0];
  return (
    clean === '/' ||
    clean === '/login' ||
    clean === '/pricing' ||
    clean.startsWith('/legal')
  );
};
