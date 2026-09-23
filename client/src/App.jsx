import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastViewport } from './components/ui/Toast';
import { CommandPalette } from './features/command-palette';

export default function App() {
  return (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <ToastViewport />
      <CommandPalette />
    </ErrorBoundary>
  );
}
