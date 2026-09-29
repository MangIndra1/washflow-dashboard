import { RouterProvider } from 'react-router';
import { AuthProvider } from '@/features/auth/AuthContext';
import { router } from '@/app/router';

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}
