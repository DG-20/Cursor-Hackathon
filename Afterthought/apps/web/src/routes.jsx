import { createBrowserRouter, Navigate } from 'react-router';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './components/HomePage';
import Hero from './pages/Hero';
import SignIn from './pages/SignIn.tsx';
import SignUp from './pages/SignUp';
import Loading from './pages/Loading';
import ResultsList from './pages/ResultsList';
import Journal from './pages/Journal';

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
    ],
  },
  {
    path: '/landing',
    Component: Landing,
  },
  {
    path: '/loading',
    Component: Loading,
  },
  {
    path: '/results/list',
    Component: ResultsList,
  },
  {
    path: '/signup',
    Component: SignUp,
  },
  {
    path: '/signin',
    Component: SignIn,
  },
  {
    path: '/journal',
    Component: Journal,
  }

  //   {
  //     path: '/results/kanban',
  //     Component: ResultsKanban,
  //   },
  //   {
  //     path: '/results/mindmap',
  //     Component: ResultsMindMap,
  //   },
  //   {
  //     path: '/journal',
  //     Component: Journal,
  //   },
  //   {
  //     path: '*',
  //     Component: NotFound,
  //   },
]);
