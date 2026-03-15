import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';
import ProtectedLayout from './ProtectedLayout';

/**
 * Wraps routes that require login. Redirects to /sign-in if not logged in.
 * Waits for auth state to be restored from storage before redirecting.
 */
export default function ProtectedRoute() {
  const { isLoggedIn, isReady } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isReady && !isLoggedIn) {
      navigate('/sign-in', { replace: true });
    }
  }, [isReady, isLoggedIn, navigate]);

  if (!isReady || !isLoggedIn) {
    return null;
  }

  return <ProtectedLayout />;
}
