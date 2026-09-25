import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { router } from './router';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ToastViewport } from './components/ui/Toast';
import { useAuthStore } from './store/authStore';

export default function App() {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const content = (
    <ErrorBoundary>
      <RouterProvider router={router} />
      <ToastViewport />
    </ErrorBoundary>
  );

  if (googleClientId) {
    return (
      <GoogleOAuthProvider clientId={googleClientId}>
        {content}
      </GoogleOAuthProvider>
    );
  }

  return content;
}
