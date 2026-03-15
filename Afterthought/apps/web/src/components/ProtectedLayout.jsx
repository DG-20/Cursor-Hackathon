import { Outlet } from 'react-router';
import AppHeader from './AppHeader';

/**
 * Layout for protected routes: shared header (name + sign out) + page content.
 */
export default function ProtectedLayout() {
  return (
    <>
      <AppHeader />
      <Outlet />
    </>
  );
}
