import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { User, Languages, Sun, Moon, Bell, Search, Menu, LogOut } from 'lucide-react';

export default function Navbar({ toggleSidebar, onNavigate }) {
  const { user, logout } = useAuth();
  const { t, language, changeLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setProfileDropdownOpen(false);
    if (onNavigate) {
      onNavigate('home');
    }
  };

  // Dynamic user initials
  const nameParts = (user?.name || '').trim().split(/\s+/);
  const initials = nameParts.length > 1
    ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
    : nameParts[0][0]?.toUpperCase() || 'T';

  return (
    <header className="glass-panel h-16 border-b border-white/5 flex items-center justify-between px-4 sm:px-8 sticky top-0 z-20">
      
      {/* Greetings & Hamburger */}
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 mr-2 text-gray-450 hover:text-white rounded-xl hover:bg-white/5 lg:hidden cursor-pointer flex items-center justify-center shrink-0"
        >
          <Menu className="w-5.5 h-5.5" />
        </button>
        
        <div className="hidden sm:block text-left truncate mr-2">
          <span className="text-sm md:text-base font-semibold text-gray-400">
            Welcome back, <strong className="text-white">{user?.name || 'Tailor'}</strong>
          </span>
        </div>
      </div>

      {/* Tools */}
      <div className="flex items-center space-x-4">
        
        {/* Languages Switcher shortcut */}
        <div className="flex items-center space-x-2 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1.5">
          <Languages className="w-4.5 h-4.5 text-purple-400" />
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            className="bg-transparent text-sm text-gray-300 dark:text-gray-300 border-none focus:outline-none cursor-pointer pr-1 font-semibold"
          >
            <option value="en" className="bg-white dark:bg-gray-950 text-gray-800 dark:text-white">{t('english')}</option>
            <option value="hi" className="bg-white dark:bg-gray-950 text-gray-800 dark:text-white">{t('hindi')}</option>
            <option value="te" className="bg-white dark:bg-gray-950 text-gray-800 dark:text-white">{t('telugu')}</option>
          </select>
        </div>


        {/* Profile */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center space-x-3 border-l border-white/10 pl-4 cursor-pointer focus:outline-none group text-left"
            aria-expanded={profileDropdownOpen}
            aria-haspopup="true"
          >
            <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-purple-600/10 group-hover:scale-105 transition-transform duration-200 flex-shrink-0">
              {initials}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-bold text-gray-800 dark:text-white leading-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {user?.name || 'Tailor'}
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold capitalize leading-none mt-0.5">
                {user?.shop_name || user?.role || 'VastraSilai Tailor'}
              </div>
            </div>
          </button>

          {profileDropdownOpen && (
            <>
              {/* Backdrop to close dropdown on click outside */}
              <div
                className="fixed inset-0 z-30 cursor-default"
                onClick={() => setProfileDropdownOpen(false)}
              />
              {/* Dropdown Menu */}
              <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-gray-900 border border-gray-150 dark:border-white/10 rounded-xl shadow-xl py-3 z-40 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Profile Card Header Inside Dropdown */}
                <div className="flex items-center space-x-3 px-4 pb-3 border-b border-gray-100 dark:border-white/5">
                  <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-purple-600/10 flex-shrink-0">
                    {initials}
                  </div>
                  <div className="text-left min-w-0">
                    <div className="text-sm font-bold text-gray-800 dark:text-white leading-tight truncate">
                      {user?.name || 'Tailor'}
                    </div>
                    <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold capitalize leading-none mt-0.5 truncate">
                      {user?.role || 'Tailor'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 px-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-500/10 dark:hover:bg-red-500/15 transition cursor-pointer text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('logout')}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

      </div>

    </header>
  );
}
