import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { logout } from '../store/authSlice';
import { api } from '../services/api';
import { User as UserIcon, Star, Key, Receipt, Activity, Clock, ShieldCheck } from 'lucide-react';
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
                          <td className="py-3 px-2 font-bold text-blue-400">${tx.amount}</td>
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
                      <span className="text-[10px] text-blue-400 font-bold">${g.price}</span>
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
                      <span className="text-[10px] text-blue-400 font-bold">${r.pricePerDay}/d</span>
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
        </div>

      </div>
    </div>
  );
};
