import { createBrowserRouter } from 'react-router';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Loading from './pages/Loading';
import ResultsList from './pages/ResultsList';
import SignIn from './pages/SignIn.jsx';

export const router = createBrowserRouter([
  { path: '/', Component: Landing },
  { path: '/sign-in', Component: SignIn },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/loading', Component: Loading },
      { path: '/results/list', Component: ResultsList },
    ],
  },
]);
