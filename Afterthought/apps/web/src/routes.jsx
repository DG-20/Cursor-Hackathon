import { createBrowserRouter } from 'react-router';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Loading from './pages/Loading';
import ResultsList from './pages/ResultsList';
import SignIn from './pages/SignIn';
// import Loading from './screens/Loading';
// import ResultsList from './screens/ResultsList';
// import ResultsKanban from './screens/ResultsKanban';
// import ResultsMindMap from './screens/ResultsMindMap';
// import Journal from './screens/Journal';
// import NotFound from './screens/NotFound';

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