import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Trophy, Medal, Flame, Star } from 'lucide-react';
import { getLevelInfo } from '../utils/gamificationUtils';

interface LeaderboardUser {
  _id: string;
  name: string;
  college: string;
  xp: number;
  streak: number;
  badges: string[];
  ratingAvg: number;
}

export const Leaderboard: React.FC = () => {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await api.get('/gamification/leaderboard');
        setUsers(response.data);
      } catch (error) {
        console.error('Failed to fetch leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

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
        <p className="text-slate-400 mt-2">See who's hustling the hardest on campus.</p>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/50">
            <tr>
              <th className="py-4 px-6 font-semibold text-slate-300">Rank</th>
              <th className="py-4 px-6 font-semibold text-slate-300">Student</th>
              <th className="py-4 px-6 font-semibold text-slate-300">Level</th>
              <th className="py-4 px-6 font-semibold text-slate-300 text-right">XP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map((user, index) => {
              const levelInfo = getLevelInfo(user.xp || 0);
              return (
                <tr key={user._id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-6">
                    {index === 0 && <Medal className="w-6 h-6 text-yellow-400" />}
                    {index === 1 && <Medal className="w-6 h-6 text-gray-300" />}
                    {index === 2 && <Medal className="w-6 h-6 text-amber-600" />}
                    {index > 2 && <span className="text-slate-400 font-bold ml-2">#{index + 1}</span>}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center">
                      <div>
                        <div className="font-bold text-slate-200">{user.name}</div>
                        <div className="text-xs text-slate-500 flex items-center space-x-3 mt-1">
                          <span>{user.college}</span>
                          {user.streak > 0 && (
                            <span className="flex items-center text-orange-500" title={`${user.streak} day streak`}>
                              <Flame className="w-3 h-3 mr-0.5" /> {user.streak}
                            </span>
                          )}
                          {user.ratingAvg > 0 && (
                            <span className="flex items-center text-yellow-500">
                              <Star className="w-3 h-3 mr-0.5 fill-current" /> {user.ratingAvg}
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
                  <td className="py-4 px-6 text-right font-bold text-slate-200">
                    {user.xp || 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
