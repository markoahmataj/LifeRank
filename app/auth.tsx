// app/auth.tsx
// Route for the sign-in screen. Wires the AuthScreen to the AuthProvider.

import { AuthScreen } from '@/src/screens/AuthScreen';
import { useAuth } from '@/src/auth/AuthProvider';

export default function AuthRoute() {
  const { signInWithGoogle, signInWithApple } = useAuth();

  return <AuthScreen onGoogle={signInWithGoogle} onApple={signInWithApple} />;
}
