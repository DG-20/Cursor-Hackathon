import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { signUp, signIn, getMe } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function SignIn() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [firstName, setFirstName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null); // { user, session } after sign in/up
  const [meResult, setMeResult] = useState(null);
  const { setAuth, user, signOut } = useAuth();
  const navigate = useNavigate();

  const clearState = () => {
    setError(null);
    setMessage(null);
  };

  const handleSignOut = () => {
    signOut();
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearState();
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Password and confirm password do not match');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const data = await signUp({ email, password, confirm_password: confirmPassword, first_name: firstName });
        setMessage(data.message || 'Signed up.');
        if (data.user && data.session) {
          setAuth(data.user, data.session);
          setSession({ user: data.user, session: data.session });
          navigate('/');
          window.location.reload();
          return;
        }
        if (data.session) setSession({ user: data.user, session: data.session });
        else setSession(data.user ? { user: data.user, session: null } : null);
      } else {
        const data = await signIn(email, password);
        setMessage('Signed in.');
        setAuth(data.user, data.session);
        setSession({ user: data.user, session: data.session });
        navigate('/');
        window.location.reload();
      }
    } catch (err) {
      setError(err.message || 'Request failed');
      setSession(null);
    } finally {
      setLoading(false);
    }
  };

  const handleTestMe = async () => {
    if (!session?.session?.access_token) {
      setError('Sign in first to get a token, then click "Test /me".');
      return;
    }
    clearState();
    setLoading(true);
    try {
      const data = await getMe(session.session.access_token);
      setMeResult(data);
      setMessage('GET /api/auth/me succeeded.');
    } catch (err) {
      setError(err.message || 'GET /me failed');
      setMeResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Link to="/" className="text-sm text-zinc-400 hover:text-white">
            ← Back to app
          </Link>
          {user && (
            <button
              type="button"
              onClick={handleSignOut}
              className="text-sm text-zinc-400 hover:text-white"
            >
              Sign out
            </button>
          )}
        </div>
        <h1 className="text-2xl font-semibold mb-2">Sign in</h1>
        <p className="text-zinc-400 text-sm mb-6">
          Sign up or sign in to continue. Passwords are hashed by Supabase (never stored plaintext).
        </p>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => { setMode('signin'); clearState(); setSession(null); setMeResult(null); }}
            className={`px-3 py-1.5 rounded text-sm ${mode === 'signin' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300'}`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode('signup'); clearState(); setSession(null); setMeResult(null); }}
            className={`px-3 py-1.5 rounded text-sm ${mode === 'signup' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-300'}`}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 mb-6">
          {mode === 'signup' && (
            <div>
              <label className="block text-sm text-zinc-400 mb-1">First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white placeholder-zinc-500"
                placeholder="Alex"
                required
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white placeholder-zinc-500"
              placeholder="you@example.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-zinc-400 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white placeholder-zinc-500"
              placeholder={mode === 'signup' ? 'min 6 characters' : '••••••••'}
              required
              minLength={mode === 'signup' ? 6 : undefined}
            />
          </div>
          {mode === 'signup' && (
            <div>
              <label className="block text-sm text-zinc-400 mb-1">Confirm password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-white placeholder-zinc-500"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-medium py-2 rounded hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? '…' : mode === 'signup' ? 'Sign up' : 'Sign in'}
          </button>
        </form>

        {error && <div className="mb-4 p-3 bg-red-950/50 border border-red-800 rounded text-red-200 text-sm">{error}</div>}
        {message && <div className="mb-4 p-3 bg-emerald-950/50 border border-emerald-800 rounded text-emerald-200 text-sm">{message}</div>}

        {session?.user && (
          <div className="mb-4 p-3 bg-zinc-900 border border-zinc-700 rounded text-sm">
            <div className="text-zinc-400 mb-1">User</div>
            <pre className="text-xs overflow-auto">{JSON.stringify(session.user, null, 2)}</pre>
            {session.session && (
              <>
                <div className="text-zinc-400 mt-2 mb-1">Session (access_token truncated)</div>
                <pre className="text-xs overflow-auto">
                  {JSON.stringify({ ...session.session, access_token: session.session.access_token?.slice(0, 20) + '…' }, null, 2)}
                </pre>
              </>
            )}
          </div>
        )}

        <div className="border-t border-zinc-800 pt-4">
          <button
            type="button"
            onClick={handleTestMe}
            disabled={loading || !session?.session?.access_token}
            className="px-4 py-2 bg-zinc-700 text-white rounded text-sm hover:bg-zinc-600 disabled:opacity-50"
          >
            Test GET /api/auth/me
          </button>
          <p className="text-zinc-500 text-xs mt-2">Sends Bearer token to confirm endpoint.</p>
          {meResult && (
            <div className="mt-3 p-3 bg-zinc-900 border border-zinc-700 rounded text-sm">
              <pre className="text-xs overflow-auto">{JSON.stringify(meResult, null, 2)}</pre>
            </div>
          )}
        </div>

        <p className="mt-6 text-zinc-500 text-xs">
          Backend: {API_BASE}/api/auth/signup, signin, me
        </p>
      </div>
    </div>
  );
}
