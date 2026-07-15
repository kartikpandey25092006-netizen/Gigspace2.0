import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { logout } from '../store/authSlice';
import { api } from '../services/api';
import { getSocket } from '../services/socket';
import { Bell, MessageSquare, User as UserIcon, LogOut, Shield, Trophy } from 'lucide-react';
import type { INotification } from '../../../Shared/src/types';

export const Navbar: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!user) return;

    // Fetch initial notifications
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data);
      } catch (err) {
        console.error('Failed to load notifications', err);
      }
    };
    fetchNotifications();

    // Listen for socket notifications
    const socket = getSocket();
    if (socket) {
      socket.on('notification', (newNotif: INotification) => {
        setNotifications((prev) => [newNotif, ...prev]);
      });
    }

    return () => {
      if (socket) {
        socket.off('notification');
      }
    };
  }, [user]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 border-b border-white/[0.08] bg-black/75 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-[15px] font-semibold tracking-[-0.03em] text-white">
              Campus Gigs & Rentals
            </Link>
            <div className="hidden md:ml-10 md:flex items-center gap-6">
              <Link
                to="/"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  location.pathname === '/' ? 'text-white' : 'text-[#8E8E93] hover:text-white'
                }`}
              >
                Browse
              </Link>
              <Link
                to="/chat"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  location.pathname === '/chat' ? 'text-white' : 'text-[#8E8E93] hover:text-white'
                }`}
              >
                Chat
              </Link>
              <Link
                to="/profile"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  location.pathname === '/profile' ? 'text-white' : 'text-[#8E8E93] hover:text-white'
                }`}
              >
                My Portal
              </Link>
              <Link
                to="/leaderboard"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  location.pathname === '/leaderboard' ? 'text-white' : 'text-[#8E8E93] hover:text-white'
                }`}
              >
                <Trophy className={`w-4 h-4 mr-1 ${location.pathname === '/leaderboard' ? 'text-white' : 'text-[#8E8E93]'}`} />
                Leaderboard
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    location.pathname === '/admin' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  <Shield className="w-4 h-4 mr-1 text-indigo-400" />
                  Admin
                </Link>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Notification Menu */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative rounded-full p-2 text-[#8E8E93] transition hover:bg-white/[0.08] hover:text-white"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 block h-2 w-2 rounded-full bg-[#0A84FF] ring-2 ring-black" />
                )}
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-lg shadow-xl py-2 z-50 glass-panel">
                  <div className="px-4 py-2 border-b border-slate-800 flex justify-between items-center">
                    <span className="font-semibold text-sm text-slate-200">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-slate-500">
                        No notifications yet
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => {
                            if (!n.read) markRead(n._id);
                            setIsOpen(false);
                            if (n.payload.referenceType === 'gig') navigate(`/gig/${n.payload.referenceId}`);
                            if (n.payload.referenceType === 'rental') navigate(`/rental/${n.payload.referenceId}`);
                            if (n.payload.referenceType === 'chat') navigate(`/chat`);
                          }}
                          className={`px-4 py-3 border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer transition ${
                            !n.read ? 'bg-blue-900/10' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <p className="text-xs font-semibold text-slate-200">{n.payload.title}</p>
                            {!n.read && (
                              <span className="h-1.5 w-1.5 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{n.payload.message}</p>
                          <span className="text-[10px] text-slate-500 mt-2 block">
                            {new Date(n.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center space-x-2 border-l border-white/[0.08] pl-4">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-medium text-zinc-200">{user.name}</p>
                <p className="text-[10px] text-[#8E8E93]">{user.college || 'VIT'}</p>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="rounded-full border border-white/[0.08] bg-white/[0.05] p-2 text-zinc-300 transition hover:bg-white/[0.1] hover:text-white"
              >
                <UserIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="rounded-full p-2 text-[#8E8E93] transition hover:bg-white/[0.08] hover:text-white"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};
