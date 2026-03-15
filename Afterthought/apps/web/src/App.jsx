import { RouterProvider } from 'react-router';
import { SessionProvider } from './context/SessionContext';
import { AuthProvider } from './context/AuthContext';
import { router } from './routes';

export default function App() {
  return (
    <AuthProvider>
      <SessionProvider>
        <RouterProvider router={router} />
      </SessionProvider>
    </AuthProvider>
  );
}
