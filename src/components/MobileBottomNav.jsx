import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Home,
  BookOpen,
  GraduationCap,
  Trophy,
  Brain
} from 'lucide-react';
import { cn } from '../lib/utils';

const MobileBottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  // Don't show on auth pages
  if (location.pathname === '/login' || location.pathname === '/register') {
    return null;
  }

  const navItems = [
    { 
      path: '/', 
      label: 'Home', 
      icon: Home 
    },
    { 
      path: '/lessons', 
      label: 'Lessons', 
      icon: BookOpen, 
      protected: true 
    },
    { 
      path: '/learn', 
      label: 'Learn', 
      icon: GraduationCap, 
      protected: true 
    },
    { 
      path: '/leitner', 
      label: 'Leitner', 
      icon: Brain, 
      protected: true 
    },
    { 
      path: '/ranking', 
      label: 'Ranking', 
      icon: Trophy, 
      protected: true 
    }
  ];

  const isActivePath = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  // Filter items based on authentication
  const visibleItems = navItems.filter(item => {
    if (item.protected && !user) return false;
    return true;
  });

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-40 safe-area-pb">
      <div className="flex items-center justify-around px-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = isActivePath(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center justify-center py-3 px-2 min-w-0 flex-1 transition-all duration-200",
                isActive 
                  ? "text-primary-600 transform scale-105" 
                  : "text-gray-500 hover:text-gray-700 active:scale-95"
              )}
            >
              <div className={cn(
                "relative transition-all duration-200",
                isActive && "transform -translate-y-0.5"
              )}>
                <Icon className={cn(
                  "w-6 h-6 mb-1 transition-all duration-200",
                  isActive && "w-7 h-7"
                )} />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary-600 rounded-full"></div>
                )}
              </div>
              <span className={cn(
                "text-xs font-medium truncate transition-all duration-200",
                isActive && "font-semibold"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
