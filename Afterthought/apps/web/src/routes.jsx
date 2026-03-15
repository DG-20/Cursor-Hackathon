import { createBrowserRouter, Navigate } from 'react-router';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './components/HomePage';
import Hero from './pages/Hero';
import SignIn from './pages/SignIn.tsx';
import SignUp from './pages/SignUp';
import Loading from './pages/Loading';
import ResultsList from './pages/ResultsList';
import MindMap from './pages/MindMap';

export const router = createBrowserRouter([
  { path: '/', Component: HomePage },
  { path: '/sign-in', Component: SignIn },
  { path: '/signup', Component: SignUp },
  { path: '/landing', element: <Navigate to="/" replace /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/loading', Component: Loading },
      { path: '/results/list', Component: ResultsList },
      { path: '/results/mindmap', Component: MindMap },
    ],
  },
]);
