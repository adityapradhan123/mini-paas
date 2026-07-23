import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { signup } from '../api';
import { useAuth } from '../AuthContext';

function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await signup(email, password);
      loginUser(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.16),_transparent_24%)] p-4">
      <div className="w-full max-w-md rounded-[30px] border border-border/70 bg-bg-secondary/80 p-8 shadow-[0_25px_70px_rgba(15,23,42,0.16)] backdrop-blur-xl">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">Create account</p>
          <h1 className="mt-2 text-3xl font-bold text-text-primary">Join Mini PaaS</h1>
          <p className="mt-2 text-sm text-text-secondary">Start deploying your apps with a premium experience.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="rounded-2xl border border-border/70 bg-bg-primary/70 px-3 py-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border-0 bg-transparent text-sm text-text-primary outline-none"
            />
          </div>

          <div className="rounded-2xl border border-border/70 bg-bg-primary/70 px-3 py-2">
            <label className="mb-1 block text-xs font-medium uppercase tracking-[0.2em] text-text-secondary">Password</label>
            <div className="flex items-center gap-2">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Minimum 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border-0 bg-transparent text-sm text-text-primary outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="text-sm text-text-secondary transition hover:text-accent"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:-translate-y-0.5 hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Signing up...' : 'Create account'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-accent transition hover:opacity-80">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;