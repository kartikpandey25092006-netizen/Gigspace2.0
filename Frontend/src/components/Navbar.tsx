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
    <nav className="atelier-nav sticky top-0 z-50 border-b backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="atelier-display text-[25px] tracking-[-0.04em]">
              gigspace<span className="text-[#ff6a1f]">.</span>
            </Link>
            <div className="hidden md:ml-10 md:flex items-center gap-6">
              <Link
                to="/"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  location.pathname === '/' ? 'atelier-active' : 'atelier-muted hover:text-black'
                }`}
              >
                Browse
              </Link>
              <Link
                to="/chat"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  location.pathname === '/chat' ? 'atelier-active' : 'atelier-muted hover:text-black'
                }`}
              >
                Chat
              </Link>
              <Link
                to="/profile"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  location.pathname === '/profile' ? 'atelier-active' : 'atelier-muted hover:text-black'
                }`}
              >
                My Portal
              </Link>
              <Link
                to="/leaderboard"
                className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                  location.pathname === '/leaderboard' ? 'atelier-active' : 'atelier-muted hover:text-black'
                }`}
              >
                <Trophy className={`w-4 h-4 mr-1 ${location.pathname === '/leaderboard' ? 'text-black' : 'text-[#737373]'}`} />
                Leaderboard
              </Link>
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium ${
                    location.pathname === '/admin' ? 'atelier-active border-b-2 border-black' : 'atelier-muted hover:text-black'
                  }`}
                >
                  <Shield className="w-4 h-4 mr-1" />
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
                className="atelier-icon-button relative rounded-full p-2 atelier-muted transition hover:text-black"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute right-1.5 top-1.5 block h-2 w-2 rounded-full bg-[#ff6a1f] ring-2 ring-[#e4dfd9]" />
                )}
              </button>

              {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[#c7c7c7] rounded-xl shadow-[0_6px_27px_rgba(0,0,0,.07)] py-2 z-50">
                  <div className="px-4 py-2 border-b border-[#c7c7c7] flex justify-between items-center">
                    <span className="font-semibold text-sm text-[#050505]">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllRead}
                        className="text-xs text-[#050505] underline font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-[#737373]">
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
                          className={`px-4 py-3 border-b border-[#e4dfd9] hover:bg-[#e4dfd9]/50 cursor-pointer transition ${
                            !n.read ? 'bg-[#e4dfd9]/70' : ''
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <p className="text-xs font-semibold text-[#050505]">{n.payload.title}</p>
                            {!n.read && (
                              <span className="h-1.5 w-1.5 bg-[#ff6a1f] rounded-full" />
                            )}
                          </div>
                          <p className="text-xs text-[#737373] mt-1">{n.payload.message}</p>
                          <span className="text-[10px] text-[#999694] mt-2 block">
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
            <div className="flex items-center space-x-2 border-l border-[#c7c7c7] pl-4">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-medium text-[#050505]">{user.name}</p>
                <p className="text-[10px] text-[#737373]">{user.college || 'VIT'}</p>
              </div>
              <button
                onClick={() => navigate('/profile')}
                className="atelier-icon-button rounded-full border border-[#c7c7c7] bg-white p-2 text-[#050505] transition"
              >
                <UserIcon className="w-5 h-5" />
              </button>
              <button
                onClick={handleLogout}
                className="atelier-icon-button rounded-full p-2 text-[#737373] transition hover:text-black"
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
