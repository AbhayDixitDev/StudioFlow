import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import { Button, Input } from '@audio-sep/ui';

export default function Register() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [validationError, setValidationError] = useState('');
  const { register, isLoading, error } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo = new URLSearchParams(location.search).get('redirect') || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    try {
      await register(displayName, email, password);
      navigate(redirectTo, { replace: true });
    } catch {
      // error is set in store
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)]">
      <div className="w-full max-w-sm p-6 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
        <h1 className="text-2xl font-bold text-center mb-6 text-[var(--text-primary)]">Create Account</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Display Name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
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
          <Input
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />

          {(validationError || error) && (
            <p className="text-red-500 text-sm">{validationError || error}</p>
          )}

          <Button type="submit" className="w-full" loading={isLoading}>
            Register
          </Button>
        </form>

        <p className="text-center mt-4 text-sm text-[var(--text-secondary)]">
          Already have an account?{' '}
          <Link to={`/login${location.search}`} className="text-violet-400 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
