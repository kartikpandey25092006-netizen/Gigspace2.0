import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store, type RootState } from './store';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Browse } from './pages/Browse';
import { ListingDetail } from './pages/ListingDetail';
import { Chat } from './pages/Chat';
import { Profile } from './pages/Profile';
import { Leaderboard } from './pages/Leaderboard';
import { Admin } from './pages/Admin';
import { initSocketConnection, disconnectSocket } from './services/socket';
import { api } from './services/api';
import { updateUser } from './store/authSlice';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// Guard route to restrict to logged-in students
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Guard route to restrict to Admins
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useSelector((state: RootState) => state.auth);
  return user && user.role === 'admin' ? <>{children}</> : <Navigate to="/" replace />;
};

const VerificationBanner: React.FC = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const [showModal, setShowModal] = useState(false);
  const [collegeEmail, setCollegeEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  if (!user || user.isVerified) return null;

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.post('/auth/link-college-email', { collegeEmail });
      setCollegeEmail(res.data.collegeEmail || collegeEmail);
      setOtpSent(true);
      setMessage('OTP sent. Check your VIT inbox.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const res = await api.post('/auth/verify-otp', { collegeEmail, otp });
      dispatch(updateUser(res.data.user));
      setShowModal(false);
      setOtp('');
      setOtpSent(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="border-b border-amber-400/15 bg-amber-400/[0.12] px-4 py-2.5 text-sm text-amber-200">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <span>Link your VIT email to start posting listings and using chat.</span>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="rounded-md bg-amber-200 px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-amber-100"
          >
            Verify VIT Email
          </button>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-white">Verify your VIT email</h2>
            <p className="text-sm text-slate-400 mt-2">Use your @vitstudent.ac.in or @vit.ac.in address to unlock posting and chat.</p>

            {error && <div className="mt-4 p-3 rounded bg-red-950/30 border border-red-500/30 text-red-300 text-sm">{error}</div>}
            {message && <div className="mt-4 p-3 rounded bg-green-950/30 border border-green-500/30 text-green-300 text-sm">{message}</div>}

            <form onSubmit={otpSent ? verifyOtp : sendOtp} className="mt-5 space-y-4">
              <div>
                <label htmlFor="vit-email" className="block text-xs font-semibold text-slate-400 uppercase">VIT Email</label>
                <input
                  id="vit-email"
                  type="email"
                  required
                  disabled={otpSent}
                  value={collegeEmail}
                  onChange={(e) => setCollegeEmail(e.target.value)}
                  placeholder="you@vitstudent.ac.in"
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70"
                />
              </div>

              {otpSent && (
                <div>
                  <label htmlFor="vit-otp" className="block text-xs font-semibold text-slate-400 uppercase">OTP</label>
                  <input
                    id="vit-otp"
                    type="text"
                    required
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded transition"
                >
                  Later
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded transition disabled:opacity-50"
                >
                  {otpSent ? 'Verify OTP' : 'Send OTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

const AppContent: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);

  // Initialize socket when user logs in
  useEffect(() => {
    if (user) {
      initSocketConnection(user.id);
    } else {
      disconnectSocket();
    }
    return () => {
      disconnectSocket();
    };
  }, [user]);

  return (
    <Router>
      <div className="flex min-h-screen flex-col bg-black text-zinc-100">
        <Navbar />
        <VerificationBanner />
        <main className="flex-1">
          <Routes>
            {/* Onboarding route */}
            <Route path="/login" element={<Login />} />

            {/* Guarded platform routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Browse />
                </ProtectedRoute>
              }
            />
            <Route
              path="/gig/:id"
              element={
                <ProtectedRoute>
                  <ListingDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/rental/:id"
              element={
                <ProtectedRoute>
                  <ListingDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <Leaderboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <Admin />
                </AdminRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export const App: React.FC = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
