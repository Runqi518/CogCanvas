import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CanvasPage from './pages/CanvasPage';
import WorkflowPage from './pages/WorkflowPage';
import NodeEditorPage from './pages/NodeEditorPage';
import './index.css';

const router = createHashRouter([
  { path: '/', element: <HomePage /> },
  { path: '/canvas/:id', element: <CanvasPage /> },
  { path: '/canvas/:projectId/node/:nodeId/edit', element: <NodeEditorPage /> },
  { path: '/workflow', element: <WorkflowPage /> },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);
