import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps routes that require login. Redirects to / (landing) if not logged in.
 * Waits for auth state to be restored from storage before redirecting.
 */
export default function ProtectedRoute() {
  const { isLoggedIn, isReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isReady && !isLoggedIn) {
      navigate('/', { replace: true });
    }
  }, [isReady, isLoggedIn, navigate]);

  if (!isReady || !isLoggedIn) {
    return null;
  }

  return <Outlet />;
}
