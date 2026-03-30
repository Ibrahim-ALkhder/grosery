import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useLanguage } from '../context/LanguageContext';
import { FiDollarSign, FiShoppingBag, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';

const Dashboard = () => {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    todaySales: 0,
    todayTransactions: 0,
    bestSellers: [],
    lowStock: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await api.get('/dashboard');
      setStats(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-900 dark:text-white">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400">
            <FiDollarSign size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('todaySales')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.todaySales.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center text-green-600 dark:text-green-400">
            <FiShoppingBag size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('todayTransactions')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.todayTransactions}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center text-purple-600 dark:text-purple-400">
            <FiTrendingUp size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('topProducts')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.bestSellers.length}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center text-red-600 dark:text-red-400">
            <FiAlertCircle size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('lowStock')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.lowStock.length}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('topProducts')}</h2>
          {stats.bestSellers.length > 0 ? (
            <ul className="space-y-2">
              {stats.bestSellers.map((item, idx) => (
                <li key={idx} className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>{item.product_name}</span>
                  <span className="font-medium text-green-600 dark:text-green-400">{item.total_sold} {t('sold')}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">{t('noData')}</p>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('lowStockProducts')}</h2>
          {stats.lowStock.length > 0 ? (
            <ul className="space-y-2">
              {stats.lowStock.map(p => (
                <li key={p.id} className="flex justify-between text-gray-700 dark:text-gray-300">
                  <span>{p.name}</span>
                  <span className="text-red-600 dark:text-red-400 font-medium">{p.stock} {t('left')}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">{t('noData')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;