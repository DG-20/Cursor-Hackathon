import { createBrowserRouter, Navigate } from 'react-router';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './components/HomePage';
import SignIn from './pages/SignIn.tsx';
import SignUp from './pages/SignUp';
import Loading from './pages/Loading';
import ResultsList from './pages/ResultsList';
import MindMap from './pages/MindMap';
import Journal from './pages/Journal';
import Landing from './pages/Hero';
import History from './pages/History';

export const router = createBrowserRouter([
  { path: '/', Component: HomePage },
  { path: '/sign-in', Component: SignIn },
  { path: '/signin', Component: SignIn },
  { path: '/signup', Component: SignUp },
  { path: '/landing', element: <Navigate to="/" replace /> },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/loading', Component: Loading },
      { path: '/results/list', Component: ResultsList },
      { path: '/results/mindmap', Component: MindMap },
      { path: '/journal', Component: Journal },
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
  },
  {
    path: '/history',
    Component: History,
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
