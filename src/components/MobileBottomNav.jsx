import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BookOpen, GraduationCap, Trophy, Brain, User } from 'lucide-react';

const navItems = [
  { path: '/lessons',  label: 'Lessons',  icon: BookOpen },
  { path: '/learn',    label: 'Learn',    icon: GraduationCap },
  { path: '/leitner',  label: 'Leitner',  icon: Brain },
  { path: '/ranking',  label: 'Ranking',  icon: Trophy },
  { path: '/profile',  label: 'Profile',  icon: User },
];

const MobileBottomNav = () => {
  const location = useLocation();

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-area-pb"
      style={{
        background: 'var(--tg-theme-bg-color, #ffffff)',
        borderTop: '1px solid var(--tg-theme-secondary-bg-color, #e5e7eb)',
      }}
    >
      <div className="flex items-stretch">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = isActive(path);
          return (
            <Link
              key={path}
              to={path}
              className="relative flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all duration-150 active:scale-95"
              style={{
                color: active
                  ? 'var(--tg-theme-button-color, #3390ec)'
                  : 'var(--tg-theme-hint-color, #707579)',
                minHeight: 56,
              }}
            >
              <Icon
                className="transition-all duration-150"
                style={{
                  width: active ? 26 : 22,
                  height: active ? 26 : 22,
                  strokeWidth: active ? 2.2 : 1.8,
                }}
              />
              <span
                className="transition-all duration-150"
                style={{
                  fontSize: active ? '10px' : '9.5px',
                  fontWeight: active ? 600 : 400,
                  lineHeight: 1,
                }}
              >
                {label}
              </span>
              {active && (
                <div
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: 'var(--tg-theme-button-color, #3390ec)' }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
