import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import { FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';

const Reports = () => {
  const { t } = useLanguage();
  const [cashiers, setCashiers] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [filters, setFilters] = useState({ startDate: '', endDate: '', cashierId: 'all' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCashiers();
    fetchPerformance();
  }, []);

  const fetchCashiers = async () => {
    try {
      const res = await api.get('/admin/users');
      setCashiers(res.data.filter(u => u.role === 'cashier'));
    } catch (error) {
      toast.error(t('failedToLoadCashiers'));
    }
  };

  const fetchPerformance = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.cashierId && filters.cashierId !== 'all') params.append('cashierId', filters.cashierId);
      const res = await api.get(`/admin/cashier-performance?${params.toString()}`);
      setPerformance(res.data);
    } catch (error) {
      toast.error(t('failedToLoadStats'));
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
  const applyFilters = () => fetchPerformance();

  const exportToExcel = () => {
    if (performance.length === 0) return toast.error(t('noData'));
    const data = performance.map(p => ({
      [t('cashierName')]: p.name,
      [t('transactions')]: p.transactions,
      [t('totalSales')]: p.total_sales.toFixed(2),
      [t('avgOrder')]: p.avg_order.toFixed(2),
      [t('lastSale')]: p.last_sale ? new Date(p.last_sale).toLocaleString() : 'N/A'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Performance');
    XLSX.writeFile(wb, `performance_${new Date().toISOString().slice(0,10)}.xlsx`);
    toast.success(t('exportSuccess'));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('reports')}</h1>
        <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
          <FiDownload /> {t('exportToExcel')}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="input-label dark:text-gray-300">{t('startDate')}</label>
            <input 
              type="date" 
              name="startDate" 
              value={filters.startDate} 
              onChange={handleFilterChange} 
              className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" 
            />
          </div>
          <div>
            <label className="input-label dark:text-gray-300">{t('endDate')}</label>
            <input 
              type="date" 
              name="endDate" 
              value={filters.endDate} 
              onChange={handleFilterChange} 
              className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" 
            />
          </div>
          <div>
            <label className="input-label dark:text-gray-300">{t('cashier')}</label>
            <select 
              name="cashierId" 
              value={filters.cashierId} 
              onChange={handleFilterChange} 
              className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
            >
              <option value="all">{t('allCashiers')}</option>
              {cashiers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <button onClick={applyFilters} className="btn-primary w-full py-2">{t('apply')}</button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('cashierName')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('transactions')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('totalSales')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('avgOrder')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('lastSale')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-900 dark:text-white">{t('loading')}</td></tr>
              ) : performance.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-8 text-gray-500 dark:text-gray-400">{t('noData')}</td></tr>
              ) : (
                performance.map(p => (
                  <tr key={p.id}>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{p.name}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{p.transactions}</td>
                    <td className="px-6 py-4 text-green-600 dark:text-green-400 font-semibold">${p.total_sales.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">${p.avg_order.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">{p.last_sale ? new Date(p.last_sale).toLocaleString() : '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;