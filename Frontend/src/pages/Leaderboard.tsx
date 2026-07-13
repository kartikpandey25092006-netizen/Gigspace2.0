import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { api } from '../services/api';
import { Trophy, Medal, Flame, Star, ShieldAlert } from 'lucide-react';
import { getLevelInfo } from '../utils/gamificationUtils';

interface LeaderboardUser {
  _id: string;
  name: string;
  college: string;
  xp: number;
  streak: number;
  badges: string[];
  ratingAvg: number;
  reputationScore: number;
}

export const Leaderboard: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.get('/gamification/leaderboard');
        setUsers(response.data.users || []);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    // Only fetch if the current user has opted in
    if (user?.leaderboardOptIn) {
      fetchLeaderboard();
    } else {
      setLoading(false);
    }
  }, [user?.leaderboardOptIn]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div className="text-center">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-3xl font-extrabold text-white">Campus Leaderboard</h1>
        <p className="text-slate-400 mt-2">Rankings are based on your Reputation Score (Rating, Badges, and Streaks).</p>
      </div>

      {!user?.leaderboardOptIn ? (
        <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <ShieldAlert className="w-16 h-16 text-slate-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">You are hidden</h2>
          <p className="text-slate-400 max-w-md mx-auto mb-6">
            The leaderboard is privacy-first. You must opt in to see how you rank against other students on campus.
          </p>
          <button 
            onClick={() => window.location.href = '/profile'}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition"
          >
            Go to Profile Settings to Opt In
          </button>
        </div>
      ) : (
        <div className="glass-panel rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="py-4 px-6 font-semibold text-slate-300">Rank</th>
                <th className="py-4 px-6 font-semibold text-slate-300">Student</th>
                <th className="py-4 px-6 font-semibold text-slate-300">Level</th>
                <th className="py-4 px-6 font-semibold text-slate-300 text-right">Rep Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {users.map((u, index) => {
                const levelInfo = getLevelInfo(u.xp || 0);
                return (
                  <tr key={u._id} className={`hover:bg-slate-800/30 transition-colors ${u._id === user?.id ? 'bg-indigo-900/20' : ''}`}>
                    <td className="py-4 px-6">
                      {index === 0 && <Medal className="w-6 h-6 text-yellow-400" />}
                      {index === 1 && <Medal className="w-6 h-6 text-gray-300" />}
                      {index === 2 && <Medal className="w-6 h-6 text-amber-600" />}
                      {index > 2 && <span className="text-slate-400 font-bold ml-2">#{index + 1}</span>}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center">
                        <div>
                          <div className="font-bold text-slate-200">
                            {u.name} {u._id === user?.id && <span className="text-xs text-indigo-400 ml-2">(You)</span>}
                          </div>
                          <div className="text-xs text-slate-500 flex items-center space-x-3 mt-1">
                            <span>{u.college}</span>
                            {u.streak > 0 && (
                              <span className="flex items-center text-orange-500" title={`${u.streak} day streak`}>
                                <Flame className="w-3 h-3 mr-0.5" /> {u.streak}
                              </span>
                            )}
                            {u.ratingAvg > 0 && (
                              <span className="flex items-center text-yellow-500">
                                <Star className="w-3 h-3 mr-0.5 fill-current" /> {u.ratingAvg}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center text-purple-400 font-semibold">
                        <span className="text-xl mr-2">{levelInfo.current.icon}</span>
                        {levelInfo.current.name}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-bold text-indigo-400 text-lg">
                      {u.reputationScore.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    Nobody has opted in yet! Be the first.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
