import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { logout, updateUser } from '../store/authSlice';
import { api } from '../services/api';
import { User as UserIcon, Star, Key, Receipt, Activity, Clock, ShieldCheck, Flame, Award, TrendingUp, Trophy } from 'lucide-react';
import { getLevelInfo, ALL_BADGES } from '../utils/gamificationUtils';
import type { ITransaction, IGig, IRental } from '../../../Shared/src/types';

export const Profile: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [myGigs, setMyGigs] = useState<IGig[]>([]);
  const [myRentals, setMyRentals] = useState<IRental[]>([]);

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  const fetchProfileData = async () => {
    try {
      const txRes = await api.get('/transactions');
      setTransactions(txRes.data);

      const gigsRes = await api.get('/gigs?status=all');
      // Filter gigs posted by me
      setMyGigs(gigsRes.data.filter((g: any) => g.posterId?._id === user?.id || g.posterId === user?.id));

      const rentalsRes = await api.get('/rentals?status=all');
      setMyRentals(rentalsRes.data.filter((r: any) => r.ownerId?._id === user?.id || r.ownerId === user?.id));
    } catch (err) {
      console.error('Failed to fetch profile history logs', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError(null);
    setPwSuccess(false);

    try {
      await api.post('/auth/change-password', { oldPassword, newPassword });
      setPwSuccess(true);
      setOldPassword('');
      setNewPassword('');
    } catch (err: any) {
      setPwError(err.response?.data?.message || 'Failed to update password');
    }
  };

  const handleOptInToggle = async () => {
    try {
      const newStatus = !user?.leaderboardOptIn;
      const res = await api.patch('/auth/opt-in', { optIn: newStatus });
      dispatch(updateUser(res.data.user));
    } catch (err) {
      console.error('Failed to toggle opt-in status', err);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Overview Card */}
      <div className="glass-panel p-8 rounded-2xl flex flex-col md:flex-row items-center md:items-start justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
          <div className="p-4 bg-blue-600/10 text-blue-400 rounded-full border border-blue-500/20">
            <UserIcon className="w-12 h-12" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">{user.name}</h1>
            <p className="text-slate-400 text-sm mt-1">{user.college}</p>
            <p className="text-slate-500 text-xs mt-0.5">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-8">
          <div className="text-center bg-slate-900/40 px-5 py-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Average Rating</span>
            <div className="flex items-center justify-center text-lg font-bold text-yellow-500 mt-1">
              <Star className="w-4 h-4 mr-1 fill-yellow-500 stroke-yellow-500" />
              {user.ratingAvg > 0 ? user.ratingAvg : 'N/A'}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">{user.ratingCount} reviews</span>
          </div>
          <div className="text-center bg-slate-900/40 px-5 py-3 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Account Role</span>
            <span className="text-sm font-bold text-blue-400 mt-1.5 block capitalize">{user.role}</span>
            <span className="text-[10px] text-slate-400 block mt-0.5 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-green-400 mr-1" /> Verified
            </span>
          </div>
        </div>
      </div>

      {/* Gamification Dashboard */}
      {(() => {
        const levelInfo = getLevelInfo(user.xp || 0);
        const userBadges = user.badges || [];
        return (
          <div className="glass-panel p-8 rounded-2xl">
            <div className="flex items-center space-x-2 mb-6">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <h2 className="text-lg font-bold text-white">Gamification Progress</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Level & XP */}
              <div className="md:col-span-2 space-y-4">
                <div className="flex justify-between items-end">
                  <div>
                    <span className="text-sm text-slate-400">Current Level</span>
                    <div className="text-2xl font-bold text-purple-400 mt-1 flex items-center">
                      <span className="mr-2 text-3xl">{levelInfo.current.icon}</span> {levelInfo.current.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400">Next: {levelInfo.next.name}</span>
                    <div className="text-sm font-bold text-slate-200 mt-1">{user.xp || 0} / {levelInfo.next.minXp} XP</div>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-3 mb-4 overflow-hidden border border-slate-700">
                  <div className="bg-gradient-to-r from-purple-600 to-blue-500 h-3 rounded-full transition-all duration-1000" style={{ width: `${levelInfo.progressPercent}%` }}></div>
                </div>
              </div>

              {/* Streak */}
              <div className="flex flex-col items-center justify-center bg-slate-900/40 p-4 rounded-xl border border-slate-800">
                <Flame className={`w-10 h-10 ${user.streak > 0 ? 'text-orange-500' : 'text-slate-600'}`} />
                <span className="text-xl font-bold text-white mt-2">{user.streak || 0} Day{user.streak !== 1 && 's'}</span>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mt-1">Current Streak</span>
              </div>
            </div>

            {/* Badges Section */}
            <div className="mt-8 border-t border-slate-800 pt-6">
              <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center">
                <Award className="w-4 h-4 mr-2 text-yellow-400" /> Earned Badges ({userBadges.length}/{ALL_BADGES.length})
              </h3>
              <div className="flex flex-wrap gap-3">
                {ALL_BADGES.map(badge => {
                  const earned = userBadges.includes(badge.id);
                  return (
                    <div 
                      key={badge.id} 
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg border ${
                        earned 
                          ? 'bg-slate-800/80 border-slate-700 text-white' 
                          : 'bg-slate-900/40 border-slate-800/50 text-slate-500 opacity-50 grayscale'
                      }`}
                      title={badge.description}
                    >
                      <span className="text-lg">{badge.icon}</span>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold">{badge.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: History Logs & Ledger */}
        <div className="lg:col-span-2 space-y-8">
          {/* Active Bookings ledger */}
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center space-x-2 mb-4">
              <Receipt className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-white">Transaction Logs</h2>
            </div>
            {transactions.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No transaction logs recorded. Start renting items or posting tasks to see listings here.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-slate-800">
                  <thead>
                    <tr className="text-slate-400 uppercase font-semibold">
                      <th className="py-3 px-2">Type</th>
                      <th className="py-3 px-2">Listing</th>
                      <th className="py-3 px-2">Partner</th>
                      <th className="py-3 px-2">Amount</th>
                      <th className="py-3 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 text-slate-200">
                    {transactions.map((tx) => {
                      const isBuyer = tx.buyerId._id === user?.id || tx.buyerId === user?.id;
                      const partner = isBuyer ? tx.sellerId : tx.buyerId;
                      const title = tx.type === 'gig' ? tx.gigId?.title : tx.rentalId?.title;

                      return (
                        <tr key={tx._id} className="hover:bg-slate-800/10 cursor-pointer" onClick={() => navigate(tx.type === 'gig' ? `/gig/${tx.gigId?._id}` : `/rental/${tx.rentalId?._id}`)}>
                          <td className="py-3 px-2 capitalize font-semibold text-slate-400">{tx.type}</td>
                          <td className="py-3 px-2 font-bold max-w-[150px] truncate">{title || 'Item Detail'}</td>
                          <td className="py-3 px-2">{partner?.name || 'Student'}</td>
                          <td className="py-3 px-2 font-bold text-blue-400">₹{tx.amount}</td>
                          <td className="py-3 px-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                              tx.status === 'completed' 
                                ? 'bg-green-900/30 text-green-400 border border-green-500/20' 
                                : tx.status === 'held_in_escrow'
                                ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-500/20'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {tx.status.replace(/_/g, ' ')}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* User Listings tabs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="font-bold text-white text-sm mb-3">My Gigs Postings</h3>
              {myGigs.length === 0 ? (
                <p className="text-xs text-slate-500">No gigs posted yet.</p>
              ) : (
                <div className="space-y-2">
                  {myGigs.map((g) => (
                    <div key={g._id} onClick={() => navigate(`/gig/${g._id}`)} className="p-3 bg-slate-900/30 hover:bg-slate-900/60 rounded-lg cursor-pointer border border-slate-850 flex justify-between items-center transition">
                      <span className="text-xs font-semibold text-slate-200 truncate pr-2">{g.title}</span>
                      <span className="text-[10px] text-blue-400 font-bold">₹{g.price}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-panel p-6 rounded-2xl">
              <h3 className="font-bold text-white text-sm mb-3">My Rental Gear</h3>
              {myRentals.length === 0 ? (
                <p className="text-xs text-slate-500">No gear listed yet.</p>
              ) : (
                <div className="space-y-2">
                  {myRentals.map((r) => (
                    <div key={r._id} onClick={() => navigate(`/rental/${r._id}`)} className="p-3 bg-slate-900/30 hover:bg-slate-900/60 rounded-lg cursor-pointer border border-slate-850 flex justify-between items-center transition">
                      <span className="text-xs font-semibold text-slate-200 truncate pr-2">{r.title}</span>
                      <span className="text-[10px] text-blue-400 font-bold">₹{r.pricePerDay}/d</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Settings */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center space-x-2 mb-4">
              <Key className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-white">Security Settings</h2>
            </div>
            
            {pwSuccess && (
              <div className="p-3 mb-4 rounded-lg bg-green-950/30 border border-green-500/30 text-green-400 text-xs text-center">
                Password updated successfully!
              </div>
            )}
            {pwError && (
              <div className="p-3 mb-4 rounded-lg bg-red-950/30 border border-red-500/30 text-red-400 text-xs text-center">
                {pwError}
              </div>
            )}

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label htmlFor="old-pass" className="block text-[10px] font-semibold text-slate-400 uppercase">Old Password</label>
                <input
                  id="old-pass"
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="new-pass" className="block text-[10px] font-semibold text-slate-400 uppercase">New Password</label>
                <input
                  id="new-pass"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 block w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition"
              >
                Change Password
              </button>
            </form>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <div className="flex items-center space-x-2 mb-4">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <h2 className="text-lg font-bold text-white">Leaderboard Settings</h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Choose whether you want to appear on the public campus leaderboard. Your ranking is based on a composite Reputation Score (rating, badges, and streaks).
            </p>
            <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-lg border border-slate-800">
              <div>
                <p className="text-sm font-semibold text-slate-200">Public Visibility</p>
                <p className="text-[10px] text-slate-500">{user.leaderboardOptIn ? 'You are currently visible on the leaderboard.' : 'You are hidden from the leaderboard.'}</p>
              </div>
              <button
                onClick={handleOptInToggle}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${user.leaderboardOptIn ? 'bg-indigo-500' : 'bg-slate-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${user.leaderboardOptIn ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
