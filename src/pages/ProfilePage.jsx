import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Mail, 
  Trophy, 
  BookOpen, 
  Calendar,
  Star,
  Target,
  Edit,
  Award,
  X
} from 'lucide-react';
import { formatScore, formatDate, calculateProgress } from '../lib/utils';
import { toast } from 'react-hot-toast';

const ProfilePage = () => {
  const { user, userProfile, logout, updateUserProfile, resetPassword } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);

  // Update displayName when userProfile changes
  useEffect(() => {
    setDisplayName(userProfile?.displayName || '');
  }, [userProfile]);

  const handleSaveProfile = async () => {
    if (!displayName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    try {
      setIsUpdating(true);
      await updateUserProfile(displayName.trim());
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      await resetPassword(user.email);
      setShowPasswordReset(false);
    } catch (error) {
      console.error('Error sending password reset:', error);
    }
  };

  const completedLessons = userProfile?.completedLessons?.length || 0;
  const totalLessons = 42;
  const progress = calculateProgress(completedLessons, totalLessons);
  const joinDate = userProfile?.createdAt?.toDate ? 
    formatDate(userProfile.createdAt.toDate()) : 
    formatDate(new Date());

  const achievements = [
    {
      id: 'first_lesson',
      name: 'First Steps',
      description: 'Complete your first lesson',
      icon: BookOpen,
      unlocked: completedLessons >= 1,
      color: 'text-blue-500'
    },
    {
      id: 'five_lessons',
      name: 'Getting Started',
      description: 'Complete 5 lessons',
      icon: Target,
      unlocked: completedLessons >= 5,
      color: 'text-green-500'
    },
    {
      id: 'ten_lessons',
      name: 'Dedicated Learner',
      description: 'Complete 10 lessons',
      icon: Star,
      unlocked: completedLessons >= 10,
      color: 'text-purple-500'
    },
    {
      id: 'half_complete',
      name: 'Halfway There',
      description: 'Complete 21 lessons',
      icon: Trophy,
      unlocked: completedLessons >= 21,
      color: 'text-yellow-500'
    },
    {
      id: 'all_lessons',
      name: 'Master Learner',
      description: 'Complete all 42 lessons',
      icon: Award,
      unlocked: completedLessons >= 42,
      color: 'text-red-500'
    }
  ];

  const stats = [
    {
      label: 'Total Score',
      value: formatScore(userProfile?.totalScore || 0),
      icon: Trophy,
      color: 'text-yellow-500'
    },
    {
      label: 'Lessons Completed',
      value: `${completedLessons}/${totalLessons}`,
      icon: BookOpen,
      color: 'text-blue-500'
    },
    {
      label: 'Current Lesson',
      value: userProfile?.currentLesson || 1,
      icon: Target,
      color: 'text-green-500'
    },
    {
      label: 'Progress',
      value: `${progress}%`,
      icon: Star,
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
          {/* Clean header without gradient */}
          <div className="bg-gray-50 px-4 sm:px-6 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-100 rounded-full flex items-center justify-center overflow-hidden">
                    {userProfile?.photoURL ? (
                      <img 
                        src={userProfile.photoURL} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 sm:w-10 sm:h-10 text-primary-600" />
                    )}
                  </div>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    {isEditing ? (
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="border border-gray-300 rounded-md px-3 py-1 text-sm w-full sm:w-auto"
                          placeholder="Your name"
                          disabled={isUpdating}
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={handleSaveProfile}
                            disabled={isUpdating}
                            className="btn btn-primary btn-sm disabled:opacity-50"
                          >
                            {isUpdating ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => {
                              setIsEditing(false);
                              setDisplayName(userProfile?.displayName || '');
                            }}
                            disabled={isUpdating}
                            className="btn btn-outline btn-sm disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                          {userProfile?.displayName || user?.email?.split('@')[0] || 'User'}
                        </h1>
                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-gray-500 hover:text-gray-700"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-sm text-gray-600">
                    <div className="flex items-center space-x-1">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{user?.email}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {joinDate}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="px-4 sm:px-6 py-4 border-t border-gray-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Learning Progress</span>
              <span className="text-sm text-gray-600">{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{completedLessons} completed</span>
              <span>{totalLessons - completedLessons} remaining</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Stats */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h2>
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mx-auto mb-2">
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                      {stat.value}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity - Only show if there's data */}
            {userProfile?.completedLessons && userProfile.completedLessons.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-3">
                  {userProfile.completedLessons.slice(-5).reverse().map((lessonNum, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Completed Lesson {lessonNum}
                        </p>
                        <p className="text-xs text-gray-500">Recently</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Achievements and Account */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Achievements</h2>
              <div className="space-y-3">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                      achievement.unlocked 
                        ? 'bg-green-50 border border-green-200' 
                        : 'bg-gray-50 border border-gray-200 opacity-60'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      achievement.unlocked ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                      <achievement.icon className={`w-4 h-4 ${
                        achievement.unlocked ? achievement.color : 'text-gray-400'
                      }`} />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className={`font-medium text-xs sm:text-sm ${
                        achievement.unlocked ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {achievement.name}
                      </h3>
                      <p className={`text-xs ${
                        achievement.unlocked ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {achievement.description}
                      </p>
                    </div>
                    
                    {achievement.unlocked && (
                      <div className="text-green-500">
                        <Star className="w-4 h-4 fill-current" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Account Actions - Simplified */}
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Account</h2>
              <div className="space-y-2">
                <button 
                  onClick={() => setShowPasswordReset(true)}
                  className="w-full text-left px-3 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-md border border-gray-200"
                >
                  Change Password
                </button>
                <button 
                  onClick={logout}
                  className="w-full text-left px-3 py-3 text-sm text-red-600 hover:bg-red-50 rounded-md border border-red-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Password Reset Modal */}
        {showPasswordReset && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Reset Password</h3>
                <button
                  onClick={() => setShowPasswordReset(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <p className="text-sm text-gray-600 mb-4">
                We'll send a password reset link to your email address: <strong>{user?.email}</strong>
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handlePasswordReset}
                  className="btn btn-primary flex-1"
                >
                  Send Reset Email
                </button>
                <button
                  onClick={() => setShowPasswordReset(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
