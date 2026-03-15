import { createBrowserRouter } from 'react-router';
import Landing from './pages/Landing';
import Loading from './pages/Loading';
import ResultsList from './pages/ResultsList';
import Hero from './pages/Hero';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import Journal from './pages/Journal';

export const router = createBrowserRouter([
  {
    path: '/',
    Component: Hero,
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