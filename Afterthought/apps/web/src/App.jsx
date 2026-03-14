import { RouterProvider } from 'react-router';
import { SessionProvider } from './context/SessionContext';
import { router } from './routes';

export default function App() {
  return (
    <SessionProvider>
      <RouterProvider router={router} />
    </SessionProvider>
  );
}
