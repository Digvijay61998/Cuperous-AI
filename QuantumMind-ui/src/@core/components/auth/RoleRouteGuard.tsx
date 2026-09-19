// ** React Imports
import { ReactNode, useEffect } from 'react';

// ** Next Imports
import { useRouter } from 'next/router';

// ** Store
import { useSelector } from 'react-redux';
import { RootState } from 'src/store';

// ** Helpers
import { canAccessPath } from 'src/helper/Access';
import { homeRouteForRole } from 'src/utils/role-tabs';

// ** Spinner
import Spinner from 'src/@core/components/spinner';

/**
 * Redirects a logged-in user away from routes their role may not access
 * (e.g. an agent hitting /bots, or an org admin hitting /super-admin). Backend
 * APIs stay the source of truth; this only prevents rendering a page the role
 * shouldn't reach by typing the URL directly.
 */
const RoleRouteGuard = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const role = useSelector(
    (state: RootState) => (state.user as any)?.userData?.role,
  );

  const allowed = !role || canAccessPath(role, router.pathname);

  useEffect(() => {
    if (!router.isReady) return;
    if (role && !canAccessPath(role, router.pathname)) {
      router.replace(homeRouteForRole(role));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router.isReady, router.pathname, role]);

  if (role && !allowed) {
    return <Spinner sx={{ height: '100%' }} />;
  }

  return <>{children}</>;
};

export default RoleRouteGuard;
