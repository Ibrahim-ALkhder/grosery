import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import NotificationBell from './NotificationBell';
import { 
  FiHome, FiShoppingCart, FiPackage, FiList, FiBarChart2, 
  FiSun, FiMoon, FiMenu, FiX, FiLogOut, FiUser, FiSettings,
  FiUsers, FiPieChart, FiGlobe
} from 'react-icons/fi';

const Layout = ({ children }) => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user, logout, isAdmin } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: '/dashboard', label: t('dashboard'), icon: FiHome },
    { path: '/cashier', label: t('cashier'), icon: FiShoppingCart },
    { path: '/products', label: t('products'), icon: FiPackage },
    { path: '/inventory', label: t('inventory'), icon: FiList },
    { path: '/sales', label: t('sales'), icon: FiBarChart2 },
  ];

  const adminNavItems = [
    { path: '/admin', label: t('adminDashboard'), icon: FiHome },
    { path: '/admin/cashiers', label: t('cashiers'), icon: FiUsers },
    { path: '/admin/reports', label: t('reports'), icon: FiPieChart },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100 dark:bg-gray-900 transition-colors duration-200" dir={language === 'ar' ? 'rtl' : 'ltr'}>
      {/* الشريط العلوي - ثابت اللون */}
      <header style={{ background: 'linear-gradient(135deg, #1E4FA3 0%, #2D6CDF 100%)' }} className="text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <FiUser size={18} />
              </div>
              <span className="ml-2 text-sm hidden md:block">{user?.name}</span>
            </div>

            <div className="flex items-center gap-2">
              <FiShoppingCart size={24} />
              <span className="text-xl font-bold">{t('appName')}</span>
            </div>

            <div className="flex items-center gap-3">
              <NotificationBell />
              <button className="p-2 rounded-lg hover:bg-white/10 transition">
                <FiSettings size={20} />
              </button>
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg hover:bg-white/10 transition"
                title={darkMode ? 'Light mode' : 'Dark mode'}
              >
                {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
              </button>
              <button
                onClick={toggleLanguage}
                className="p-2 rounded-lg hover:bg-white/10 transition flex items-center gap-1"
                title={language === 'en' ? 'العربية' : 'English'}
              >
                <FiGlobe size={20} />
                <span className="text-sm font-medium">{language === 'en' ? 'عربي' : 'EN'}</span>
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg hover:bg-white/10 transition"
                title={t('logout')}
              >
                <FiLogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* شريط التنقل لسطح المكتب */}
      <nav className="hidden lg:block bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 py-2">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
            {isAdmin() && adminNavItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* زر القائمة للجوال */}
      <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
        >
          {mobileMenuOpen ? <FiX size={20} /> : <FiMenu size={20} />}
          <span>Menu</span>
        </button>
      </div>

      {/* القائمة المنسدلة للجوال */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
          {isAdmin() && adminNavItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* المحتوى الرئيسي */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>

      {/* تذييل الصفحة */}
      <footer className="border-t border-gray-200 dark:border-gray-700 mt-auto py-4 text-center text-sm text-gray-500 dark:text-gray-400">
        <div className="max-w-7xl mx-auto px-4">
          © 2024 {t('appName')}. {t('allRightsReserved')}
        </div>
      </footer>
    </div>
  );
};

export default Layout;