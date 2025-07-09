import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userService } from '../services/firebaseService';
import { 
  Trophy, 
  Medal, 
  Crown, 
  Star,
  User,
  TrendingUp,
  Award
} from 'lucide-react';
import { formatScore, cn } from '../lib/utils';
import LoadingSpinner from '../components/LoadingSpinner';

const RankingPage = () => {
  const { userProfile, user } = useAuth();
  const [topUsers, setTopUsers] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRankingData();
  }, [userProfile]);

  const fetchRankingData = async () => {
    try {
      setLoading(true);
      const [users, rank] = await Promise.all([
        userService.getTopUsers(100),
        userProfile ? userService.getUserRank(user.uid, userProfile.totalScore) : Promise.resolve(null)
      ]);
      
      setTopUsers(users);
      setUserRank(rank);
    } catch (error) {
      console.error('Error fetching ranking data:', error);
      setError('Failed to load rankings');
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <Trophy className="w-5 h-5 text-gray-500" />;
    }
  };

  const getRankColor = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-100 to-gray-50 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-amber-100 to-amber-50 border-amber-200';
      default:
        return 'bg-white border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-xl mb-4">{error}</div>
          <button 
            onClick={fetchRankingData}
            className="btn btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <Trophy className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-gray-900">Leaderboard</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            See how you rank against other learners in mastering the 504 essential words
          </p>
        </div>

        {/* User's Current Rank */}
        {userProfile && userRank && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  {userProfile.photoURL ? (
                    <img 
                      src={userProfile.photoURL} 
                      alt="Your avatar" 
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <User className="w-6 h-6 text-primary-600" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Your Rank</h3>
                  <p className="text-sm text-gray-600">
                    {userProfile.displayName || 'You'}
                  </p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-primary-600" />
                  <span className="text-2xl font-bold text-primary-600">#{userRank}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {formatScore(userProfile.totalScore)} points
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Podium */}
        {topUsers.length >= 3 && (
          <div className="mb-8">
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto">
              {/* 2nd Place */}
              <div className="order-1 text-center">
                <div className="bg-gray-100 rounded-t-lg p-4 pt-8">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                    {topUsers[1].photoURL ? (
                      <img 
                        src={topUsers[1].photoURL} 
                        alt={topUsers[1].displayName} 
                        className="w-14 h-14 rounded-full"
                      />
                    ) : (
                      <User className="w-8 h-8 text-gray-600" />
                    )}
                  </div>
                  <Medal className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {topUsers[1].displayName || 'Anonymous'}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {formatScore(topUsers[1].totalScore)}
                  </p>
                </div>
                <div className="bg-gray-300 h-20 rounded-b-lg flex items-end justify-center pb-2">
                  <span className="text-2xl font-bold text-gray-600">2</span>
                </div>
              </div>

              {/* 1st Place */}
              <div className="order-2 text-center">
                <div className="bg-yellow-100 rounded-t-lg p-4 pt-6">
                  <div className="w-20 h-20 bg-yellow-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                    {topUsers[0].photoURL ? (
                      <img 
                        src={topUsers[0].photoURL} 
                        alt={topUsers[0].displayName} 
                        className="w-18 h-18 rounded-full"
                      />
                    ) : (
                      <User className="w-10 h-10 text-yellow-600" />
                    )}
                  </div>
                  <Crown className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                  <h3 className="font-bold text-gray-900 truncate">
                    {topUsers[0].displayName || 'Anonymous'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {formatScore(topUsers[0].totalScore)}
                  </p>
                </div>
                <div className="bg-yellow-400 h-32 rounded-b-lg flex items-end justify-center pb-2">
                  <span className="text-3xl font-bold text-yellow-800">1</span>
                </div>
              </div>

              {/* 3rd Place */}
              <div className="order-3 text-center">
                <div className="bg-amber-100 rounded-t-lg p-4 pt-8">
                  <div className="w-16 h-16 bg-amber-200 rounded-full mx-auto mb-3 flex items-center justify-center">
                    {topUsers[2].photoURL ? (
                      <img 
                        src={topUsers[2].photoURL} 
                        alt={topUsers[2].displayName} 
                        className="w-14 h-14 rounded-full"
                      />
                    ) : (
                      <User className="w-8 h-8 text-amber-600" />
                    )}
                  </div>
                  <Medal className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 text-sm truncate">
                    {topUsers[2].displayName || 'Anonymous'}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {formatScore(topUsers[2].totalScore)}
                  </p>
                </div>
                <div className="bg-amber-500 h-16 rounded-b-lg flex items-end justify-center pb-2">
                  <span className="text-2xl font-bold text-amber-800">3</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Full Rankings List */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Learners</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {topUsers.map((userItem) => {
              const isCurrentUser = user && userItem.id === user.uid;
              
              return (
                <div
                  key={userItem.id}
                  className={cn(
                    "px-6 py-4 flex items-center justify-between transition-colors",
                    isCurrentUser && "bg-primary-50 border-l-4 border-primary-500",
                    getRankColor(userItem.rank)
                  )}
                >
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-8 h-8">
                      {getRankIcon(userItem.rank)}
                    </div>
                    
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                      {userItem.photoURL ? (
                        <img 
                          src={userItem.photoURL} 
                          alt={userItem.displayName} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    
                    <div>
                      <h3 className={cn(
                        "font-medium",
                        isCurrentUser ? "text-primary-900" : "text-gray-900"
                      )}>
                        {userItem.displayName || 'Anonymous'}
                        {isCurrentUser && <span className="text-primary-600 ml-1">(You)</span>}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {userItem.completedLessons?.length || 0} lessons completed
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={cn(
                      "text-lg font-bold",
                      userItem.rank <= 3 ? "text-yellow-600" : 
                      isCurrentUser ? "text-primary-600" : "text-gray-900"
                    )}>
                      #{userItem.rank}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatScore(userItem.totalScore)} pts
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          
          {topUsers.length === 0 && (
            <div className="px-6 py-12 text-center text-gray-500">
              <Award className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No rankings available yet.</p>
              <p className="text-sm mt-1">Be the first to start learning!</p>
            </div>
          )}
        </div>

        {/* Achievement Badges */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Achievement Levels
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
              <Crown className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <h4 className="font-medium text-yellow-800">Word Master</h4>
              <p className="text-sm text-yellow-600">10,000+ points</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-50 border border-blue-200">
              <Star className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <h4 className="font-medium text-blue-800">Vocabulary Expert</h4>
              <p className="text-sm text-blue-600">5,000+ points</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
              <Award className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <h4 className="font-medium text-green-800">Word Learner</h4>
              <p className="text-sm text-green-600">1,000+ points</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RankingPage;
