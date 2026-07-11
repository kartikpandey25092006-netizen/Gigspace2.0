import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { ShieldAlert, Users, Award, BookOpen, Activity, AlertOctagon, Trash2, HeartCrack } from 'lucide-react';

export const Admin: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [gigs, setGigs] = useState<any[]>([]);
  const [rentals, setRentals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAdminData = async () => {
    try {
      const metricsRes = await api.get('/admin/metrics');
      setMetrics(metricsRes.data);

      const usersRes = await api.get('/transactions'); // To extract user mappings, or list from seeds
      // We will perform API calls to fetch items
      const gigsRes = await api.get('/gigs?status=all');
      setGigs(gigsRes.data);

      const rentalsRes = await api.get('/rentals?status=all');
      setRentals(rentalsRes.data);

      // Fetch user lists. For simple mock lists, we grab unique buyers/sellers or a list of users
      // In our code, we can extract them from the listing models posters/owners
      const userMap = new Map<string, any>();
      gigsRes.data.forEach((g: any) => {
        if (g.posterId) userMap.set(g.posterId._id, g.posterId);
        if (g.acceptedById) userMap.set(g.acceptedById._id, g.acceptedById);
      });
      rentalsRes.data.forEach((r: any) => {
        if (r.ownerId) userMap.set(r.ownerId._id, r.ownerId);
      });
      setUsers(Array.from(userMap.values()));

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Delete student account? This action is irreversible.')) return;
    try {
      await api.delete(`/admin/user/${userId}`);
      alert('User deleted.');
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleModerateGig = async (gigId: string, action: string) => {
    if (!window.confirm(`Perform "${action}" moderation on this gig listing?`)) return;
    try {
      await api.post(`/admin/gig/${gigId}`, { action });
      alert('Gig listing moderated.');
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to moderate gig');
    }
  };

  const handleModerateRental = async (rentalId: string, action: string) => {
    if (!window.confirm(`Perform "${action}" moderation on this rental item?`)) return;
    try {
      await api.post(`/admin/rental/${rentalId}`, { action });
      alert('Rental item moderated.');
      fetchAdminData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to moderate rental item');
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500 font-medium">Loading admin panel metrics...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Alert Header */}
      <div className="glass-panel p-6 rounded-2xl flex items-center justify-between border-l-4 border-indigo-500 bg-indigo-950/10">
        <div className="flex items-center space-x-3">
          <ShieldAlert className="w-8 h-8 text-indigo-400" />
          <div>
            <h1 className="text-xl font-bold text-white">Administrator Command Center</h1>
            <p className="text-xs text-slate-400">Moderating student activities, listing compliance, and transactional escrows.</p>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      {metrics && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Total Students</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">{metrics.metrics.totalUsers}</span>
            </div>
            <Users className="w-8 h-8 text-blue-400/80" />
          </div>
          <div className="glass-panel p-5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Gigs Services</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">{metrics.metrics.totalGigs}</span>
            </div>
            <Activity className="w-8 h-8 text-emerald-400/80" />
          </div>
          <div className="glass-panel p-5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Rental Items</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">{metrics.metrics.totalRentals}</span>
            </div>
            <BookOpen className="w-8 h-8 text-indigo-400/80" />
          </div>
          <div className="glass-panel p-5 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-bold">Escrow volume</span>
              <span className="text-2xl font-extrabold text-white mt-1 block">${metrics.metrics.totalVolume}</span>
            </div>
            <Award className="w-8 h-8 text-yellow-500/80" />
          </div>
        </div>
      )}

      {/* Lists sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Users lists */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-sm mb-4 border-b border-slate-800 pb-2">Active Students</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {users.map((u) => (
                <div key={u._id} className="flex justify-between items-center bg-slate-900/30 p-3 rounded-lg border border-slate-850">
                  <div>
                    <p className="text-xs font-semibold text-slate-200">{u.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{u.email}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteUser(u._id)}
                    className="p-1.5 bg-red-950/20 text-red-400 border border-red-500/10 rounded hover:bg-red-950 hover:text-white transition"
                    title="Delete User"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Gigs List */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-sm mb-4 border-b border-slate-800 pb-2">Gigs Moderation</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {gigs.map((g) => (
                <div key={g._id} className="bg-slate-900/30 p-3 rounded-lg border border-slate-850 space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-slate-200 truncate max-w-[120px]">{g.title}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded capitalize bg-slate-850 text-slate-400">
                      {g.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800/40">
                    <span className="text-[10px] text-blue-400 font-bold">${g.price}</span>
                    <div className="flex gap-2">
                      {g.status === 'accepted' && (
                        <button
                          onClick={() => handleModerateGig(g._id, 'cancel')}
                          className="px-2 py-1 text-[9px] bg-yellow-950/20 text-yellow-400 border border-yellow-500/10 rounded hover:bg-yellow-950 transition"
                        >
                          Cancel Escrow
                        </button>
                      )}
                      <button
                        onClick={() => handleModerateGig(g._id, 'delete')}
                        className="p-1 bg-red-950/20 text-red-400 border border-red-500/10 rounded hover:bg-red-950 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rentals List */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-white text-sm mb-4 border-b border-slate-800 pb-2">Rentals Moderation</h3>
            <div className="space-y-4 max-h-[400px] overflow-y-auto">
              {rentals.map((r) => (
                <div key={r._id} className="bg-slate-900/30 p-3 rounded-lg border border-slate-850 space-y-2">
                  <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-slate-200 truncate max-w-[125px]">{r.title}</p>
                    <span className="text-[9px] px-1.5 py-0.5 rounded capitalize bg-slate-850 text-slate-400">
                      {r.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-slate-800/40">
                    <span className="text-[10px] text-blue-400 font-bold">${r.pricePerDay}/d</span>
                    <div className="flex gap-2">
                      {r.status === 'available' && (
                        <button
                          onClick={() => handleModerateRental(r._id, 'maintenance')}
                          className="px-2 py-1 text-[9px] bg-indigo-950/20 text-indigo-400 border border-indigo-500/10 rounded hover:bg-indigo-950 transition"
                        >
                          Put Maintenance
                        </button>
                      )}
                      <button
                        onClick={() => handleModerateRental(r._id, 'delete')}
                        className="p-1 bg-red-950/20 text-red-400 border border-red-500/10 rounded hover:bg-red-950 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
