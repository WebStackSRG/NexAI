export function ProtectedRoute({ children }) {
  // In Step 1, pass through; in Step 2, will check authStore and redirect to /login
  return children;
}
