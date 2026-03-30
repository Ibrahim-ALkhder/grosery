import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FiX, FiCalendar, FiDollarSign, FiShoppingBag } from 'react-icons/fi';
import { formatDateTime, formatDate } from '../../utils/dateHelper';

const CashierDetailsModal = ({ cashier, onClose }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('month'); // 'day', 'week', 'month'
  const [stats, setStats] = useState({
    totalSales: 0,
    totalTransactions: 0,
    avgOrder: 0,
    lastSale: null
  });

  useEffect(() => {
    fetchSales();
  }, [filter]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      let startDate = null;
      const now = new Date();
      
      if (filter === 'day') {
        startDate = now.toISOString().split('T')[0];
      } else if (filter === 'week') {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startDate = startOfWeek.toISOString().split('T')[0];
      } else if (filter === 'month') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startDate = startOfMonth.toISOString().split('T')[0];
      }

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      
      const res = await api.get(`/admin/users/${cashier.id}/sales?${params.toString()}`);
      setTransactions(res.data);

      // حساب الإحصائيات
      const total = res.data.reduce((sum, t) => sum + t.total, 0);
      const count = res.data.length;
      setStats({
        totalSales: total,
        totalTransactions: count,
        avgOrder: count > 0 ? total / count : 0,
        lastSale: res.data[0]?.created_at
      });
    } catch (error) {
      console.error('Failed to load sales:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Cashier Details: {cashier.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* معلومات الكاشير */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{cashier.email}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Username</p>
              <p className="font-medium">{cashier.username}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Phone</p>
              <p className="font-medium">{cashier.phone || '—'}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium capitalize">{cashier.role}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Status</p>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                cashier.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {cashier.status}
              </span>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-500">Member Since</p>
              <p className="font-medium">{formatDate(cashier.created_at)}</p>
            </div>
          </div>

          {/* إحصائيات المبيعات */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <FiDollarSign className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Sales</p>
                <p className="text-xl font-bold text-blue-600">${stats.totalSales.toFixed(2)}</p>
              </div>
            </div>
            <div className="bg-green-50 rounded-lg p-4 flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <FiShoppingBag className="text-green-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Transactions</p>
                <p className="text-xl font-bold text-green-600">{stats.totalTransactions}</p>
              </div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-full">
                <FiCalendar className="text-purple-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Order</p>
                <p className="text-xl font-bold text-purple-600">${stats.avgOrder.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* فلاتر المبيعات */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('day')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setFilter('week')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setFilter('month')}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filter === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'
              }`}
            >
              This Month
            </button>
          </div>

          {/* جدول المبيعات */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {loading ? (
              <div className="text-center py-8">Loading...</div>
            ) : (
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date & Time</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Items</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Total</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-gray-500">
                        No sales for this period
                      </td>
                    </tr>
                  ) : (
                    transactions.map(t => (
                      <tr key={t.id}>
                        <td className="px-4 py-2">#{t.id}</td>
                        <td className="px-4 py-2">{formatDateTime(t.created_at)}</td>
                        <td className="px-4 py-2">{t.items?.length || 0}</td>
                        <td className="px-4 py-2 text-green-600 font-semibold">${t.total.toFixed(2)}</td>
                        <td className="px-4 py-2 capitalize">{t.payment_method}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashierDetailsModal;