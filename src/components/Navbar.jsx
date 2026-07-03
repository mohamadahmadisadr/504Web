import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  BookOpen, 
  Trophy, 
  User, 
  LogOut,
  GraduationCap,
  Brain
} from 'lucide-react';
import { cn, formatScore } from '../lib/utils';

const Navbar = () => {
  const { user, userProfile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { path: '/lessons', label: 'Lessons', icon: BookOpen, protected: true },
    { path: '/learn', label: 'Learn', icon: GraduationCap, protected: true },
    { path: '/leitner', label: 'Leitner Box', icon: Brain, protected: true },
    { path: '/ranking', label: 'Ranking', icon: Trophy, protected: true },
    { path: '/profile', label: 'Profile', icon: User, protected: true },
  ];

  const isActivePath = (path) => {
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="shadow-sm fixed top-0 left-0 right-0 z-50" style={{ background: 'var(--tg-theme-header-bg-color, var(--tg-theme-bg-color, #ffffff))', borderBottom: '1px solid var(--tg-theme-secondary-bg-color, #e5e7eb)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link 
            to="/lessons" 
            className="flex items-center space-x-2 text-primary-600 font-bold text-xl"
          >
            <BookOpen className="w-8 h-8" />
            <span className="hidden sm:block">504 Words</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map(({ path, label, icon: Icon, protected: isProtected }) => {
              if (isProtected && !user) return null;
              
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActivePath(path)
                      ? "text-primary-600 bg-primary-50"
                      : "text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <>
                {/* Score Display */}
                {userProfile && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold text-gray-700">
                      {formatScore(userProfile.totalScore)}
                    </span>
                  </div>
                )}
                
                {/* Profile Link */}
                <Link 
                  to="/profile" 
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors"
                >
                  {userProfile?.photoURL ? (
                    <img 
                      src={userProfile.photoURL} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <User className="w-8 h-8 p-2 bg-gray-100 rounded-full" />
                  )}
                  <span className="font-medium">
                    {userProfile?.displayName || user.email?.split('@')[0]}
                  </span>
                </Link>
              </>
            ) : null}
          </div>

          {/* Mobile area */}
          <div className="md:hidden flex items-center space-x-3">
            {user ? (
              <>
                {/* Score Display */}
                {userProfile && (
                  <div className="flex items-center space-x-2 text-sm">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span className="font-semibold text-gray-700">
                      {formatScore(userProfile.totalScore)}
                    </span>
                  </div>
                )}
                
                {/* Profile Button */}
                <Link
                  to="/profile"
                  className={cn(
                    "flex items-center space-x-2 px-3 py-2 rounded-md transition-colors",
                    isActivePath('/profile')
                      ? "text-primary-600 bg-primary-50"
                      : "text-gray-700 hover:text-primary-600 hover:bg-gray-50"
                  )}
                >
                  {userProfile?.photoURL ? (
                    <img 
                      src={userProfile.photoURL} 
                      alt="Profile" 
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <User className="w-8 h-8 p-1 bg-gray-100 rounded-full" />
                  )}
                  <span className="text-sm font-medium">Profile</span>
                </Link>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
