import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, AlertCircle } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import { ROUTES } from '@/constants/routes';
import styles from './Auth.module.scss';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const navigate = useNavigate();

  const { register, googleLogin, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (isAuthenticated) {
      navigate(ROUTES.CHAT, { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');

    if (!email || !password) {
      setLocalError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters long');
      return;
    }

    const result = await register({ email, password });
    if (result.success) {
      navigate(ROUTES.CHAT, { replace: true });
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    if (credentialResponse.credential) {
      const result = await googleLogin(credentialResponse.credential);
      if (result.success) {
        navigate(ROUTES.CHAT, { replace: true });
      }
    }
  };

  const errorMessage = localError || error;

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {errorMessage && (
        <div className={styles.errorMessage} role="alert">
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}

      <Input
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leftIcon={<Mail size={18} />}
        required
        autoComplete="email"
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftIcon={<Lock size={18} />}
        hint="Minimum 8 characters"
        required
        autoComplete="new-password"
      />

      <Button type="submit" variant="primary" fullWidth loading={isLoading}>
        Create Account (100 Free Credits)
      </Button>

      {googleClientId && (
        <>
          <div className={styles.divider}>or</div>
          <div className={styles.googleWrapper}>
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setLocalError('Google Sign-In failed')}
              useOneTap={false}
              theme="outline"
              shape="rectangular"
              text="signup_with"
            />
          </div>
        </>
      )}

      <div className={styles.switchText}>
        Already have an account? <Link to={ROUTES.LOGIN}>Sign in</Link>
      </div>
    </form>
  );
}
