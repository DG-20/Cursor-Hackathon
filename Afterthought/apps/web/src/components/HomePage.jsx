import { useAuth } from '../context/AuthContext';
import AppHeader from './AppHeader';
import Hero from '../pages/Hero';
import Landing from '../pages/Landing';

/**
 * Home route (/): when logged out show Hero; when logged in show main record page (Landing).
 * Sign-in and sign-out both redirect here.
 */
export default function HomePage() {
  const { user } = useAuth();

  if (user) {
    return (
      <>
        <AppHeader />
        <Landing />
      </>
    );
  }
  return <Hero />;
}
