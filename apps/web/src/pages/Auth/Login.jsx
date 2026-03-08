import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { Button, Input } from '@audio-sep/ui';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = new URLSearchParams(location.search).get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate(redirectTo, { replace: true });
    } catch {
      // error is set in store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)]">
      <div className="w-full max-w-sm p-6 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
        <h1 className="text-2xl font-bold text-center mb-6 text-[var(--text-primary)]">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <Button type="submit" className="w-full" loading={isLoading}>
            Login
          </Button>
        </form>

        <p className="text-center mt-4 text-sm text-[var(--text-secondary)]">
          Don&apos;t have an account?{' '}
          <Link to={`/register${location.search}`} className="text-violet-400 hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
