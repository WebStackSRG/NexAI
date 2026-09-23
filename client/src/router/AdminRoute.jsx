export function AdminRoute({ children }) {
  // In Step 1, pass through; in Step 2, will check user.role === 'admin'
  return children;
}
