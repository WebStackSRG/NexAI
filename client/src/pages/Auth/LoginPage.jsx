import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes';
import styles from './Auth.module.scss';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Temporary mock navigation for Step 1
    setTimeout(() => {
      setLoading(false);
      navigate(ROUTES.CHAT);
    }, 400);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <Input
        label="Email Address"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        leftIcon={<Mail size={18} />}
        required
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        leftIcon={<Lock size={18} />}
        required
      />

      <Button type="submit" variant="primary" fullWidth loading={loading}>
        Sign In
      </Button>

      <div className={styles.switchText}>
        Don&apos;t have an account? <Link to={ROUTES.REGISTER}>Sign up</Link>
      </div>
    </form>
  );
}
