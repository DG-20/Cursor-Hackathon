import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

/**
 * Shared header: Sign in link when logged out, or first name + Sign out when logged in.
 * Sign out sends user back to landing.
 */
export default function AppHeader() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate('/');
    window.location.reload();
  };

  return (
    <header
      className="absolute top-0 left-0 right-0 z-10 flex justify-end items-center px-6 py-4"
      style={{ color: 'var(--clarity-text-secondary)' }}
    >
      {user ? (
        <div className="flex items-center gap-3 text-sm">
          <span className="font-medium">
            {user.first_name || user.email?.split('@')[0] || 'You'}
          </span>
          <button type="button" onClick={handleSignOut} className="hover:underline">
            Sign out
          </button>
        </div>
      ) : (
        <Link
          to="/sign-in"
          className="text-sm font-medium hover:underline"
        >
          Sign in
        </Link>
      )}
    </header>
  );
}
