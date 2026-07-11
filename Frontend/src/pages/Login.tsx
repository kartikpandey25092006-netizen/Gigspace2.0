import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Navigate } from 'react-router-dom';
import type { RootState } from '../store';
import { setCredentials } from '../store/authSlice';
import { api } from '../services/api';
import { initSocketConnection } from '../services/socket';
import { GraduationCap, ArrowRight, UserPlus, LogIn, Loader2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [college, setCollege] = useState('');

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Sign In logic
        const response = await api.post('/auth/login', { email, password });
        const { user: loggedInUser, accessToken, refreshToken } = response.data;
        
        dispatch(setCredentials({ user: loggedInUser, accessToken, refreshToken }));
        initSocketConnection(loggedInUser.id);
        navigate('/');
      } else {
        // Register logic
        if (!email.toLowerCase().endsWith('.edu')) {
          throw new Error('Must sign up with a valid college email address ending in .edu');
        }

        const response = await api.post('/auth/signup', { name, email, password, college });
        const { user: registeredUser, accessToken, refreshToken } = response.data;

        dispatch(setCredentials({ user: registeredUser, accessToken, refreshToken }));
        initSocketConnection(registeredUser.id);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'An unexpected authentication error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 glass-panel p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        {/* Decorative ambient gradient backdrop */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />

        <div className="text-center relative">
          <div className="flex justify-center">
            <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20">
              <GraduationCap className="w-10 h-10" />
            </div>
          </div>
          <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
            {isLogin ? 'Sign in to Campus Gigs' : 'Join the Marketplace'}
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            {isLogin ? 'Welcome back! Log in with your college credentials.' : 'Post student gigs, rent/borrow gear, and collaborate.'}
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label htmlFor="name-input" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Full Name</label>
                  <input
                    id="name-input"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Alice Johnson"
                    className="mt-1 block w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
                <div>
                  <label htmlFor="college-input" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">College / University</label>
                  <input
                    id="college-input"
                    type="text"
                    required
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    placeholder="State University"
                    className="mt-1 block w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </>
            )}

            <div>
              <label htmlFor="email-input" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">College Email (.edu)</label>
              <input
                id="email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@college.edu"
                className="mt-1 block w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label htmlFor="password-input" className="block text-xs font-semibold text-slate-400 uppercase tracking-wide">Password</label>
              <input
                id="password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 block w-full px-4 py-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : isLogin ? (
                <>
                  Sign In <LogIn className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Register Account <UserPlus className="w-4 h-4 ml-2" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-2">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium inline-flex items-center"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
