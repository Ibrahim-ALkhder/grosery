import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useLanguage } from '../../context/LanguageContext';
import { FiDollarSign, FiShoppingBag, FiUsers, FiAlertCircle, FiCalendar, FiTrendingUp, FiBell } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    todaySales: 0,
    todayTransactions: 0,
    monthSales: 0,
    totalTransactions: 0,
    totalCashiers: 0,
    topCashier: null,
    lowStock: 0
  });
  const [topCashiers, setTopCashiers] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [statsRes, topRes, recentRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/top-cashiers?period=month'),
        api.get('/admin/recent-transactions?limit=5')
      ]);
      setStats(statsRes.data);
      setTopCashiers(topRes.data);
      setRecentTransactions(recentRes.data);
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-900 dark:text-white">{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('adminDashboard')}</h1>
        <button
          onClick={() => navigate('/admin/notifications')}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 hover:from-blue-700 hover:to-indigo-700 transition"
        >
          <FiBell size={18} /> {t('sendNotification')}
        </button>
      </div>

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
            <FiCalendar size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('monthSales')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.monthSales.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FiUsers size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{t('totalCashiers')}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalCashiers}</p>
          </div>
        </div>
      </div>

      {stats.topCashier && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
            <FiTrendingUp className="text-blue-600 dark:text-blue-400" /> {t('topCashierToday')}
          </h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stats.topCashier.cashier_name}</p>
              <p className="text-gray-600 dark:text-gray-400">{t('transactions')}: {stats.topCashier.transactions}</p>
              <p className="text-gray-600 dark:text-gray-400">{t('totalSales')}: ${stats.topCashier.total?.toFixed(2)}</p>
            </div>
            <Link to="/admin/cashiers" className="btn-outline dark:bg-gray-700 dark:text-white dark:border-gray-600 text-sm">{t('viewAll')}</Link>
          </div>
        </div>
      )}

      {stats.lowStock > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <FiAlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0" size={24} />
          <p className="text-red-800 dark:text-red-300">
            <span className="font-bold">{stats.lowStock}</span> {t('lowStockProducts')}
            <Link to="/inventory" className="underline ml-2 text-red-800 dark:text-red-300">{t('viewAll')}</Link>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('topCashiersMonth')}</h2>
          {topCashiers.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">{t('cashierName')}</th>
                  <th className="py-2 text-right text-sm font-medium text-gray-500 dark:text-gray-400">{t('totalSales')}</th>
                  <th className="py-2 text-right text-sm font-medium text-gray-500 dark:text-gray-400">{t('transactions')}</th>
                </tr>
              </thead>
              <tbody>
                {topCashiers.map((c, idx) => (
                  <tr key={idx}>
                    <td className="py-2 text-gray-900 dark:text-white">{c.cashier_name}</td>
                    <td className="py-2 text-right text-green-600 dark:text-green-400 font-semibold">${c.total?.toFixed(2)}</td>
                    <td className="py-2 text-right text-gray-900 dark:text-white">{c.transactions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">{t('noData')}</p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('recentTransactions')}</h2>
          {recentTransactions.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">{t('transactionId')}</th>
                  <th className="py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">{t('cashierName')}</th>
                  <th className="py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-400">{t('date')}</th>
                  <th className="py-2 text-right text-sm font-medium text-gray-500 dark:text-gray-400">{t('total')}</th>
                </tr>
              </thead>
              <tbody>
                {recentTransactions.map(t => (
                  <tr key={t.id}>
                    <td className="py-2 text-gray-900 dark:text-white">#{t.id}</td>
                    <td className="py-2 text-gray-900 dark:text-white">{t.cashier_name}</td>
                    <td className="py-2 text-gray-900 dark:text-white">{new Date(t.created_at).toLocaleDateString()}</td>
                    <td className="py-2 text-right text-green-600 dark:text-green-400 font-semibold">${t.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-gray-500 dark:text-gray-400">{t('noData')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;