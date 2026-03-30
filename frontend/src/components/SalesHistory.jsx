import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { FiEye, FiDownload } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import Receipt from './Receipt';
import { formatDateTime } from '../utils/dateHelper';
import { useLanguage } from '../context/LanguageContext';

const SalesHistory = () => {
  let language;
  try {
    language = useLanguage();
  } catch (error) {
    console.error('LanguageContext not found. Using default English.');
    language = { t: (key) => key };
  }
  const { t } = language;
  const safeT = typeof t === 'function' ? t : (key) => key;

  const [transactions, setTransactions] = useState([]);
  const [filterDate, setFilterDate] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async (date = '') => {
    try {
      const url = date ? `/transactions?date=${date}` : '/transactions';
      const res = await api.get(url);
      setTransactions(res.data);
    } catch (error) {
      toast.error(safeT('failedToLoadTransactions') || 'Failed to load transactions');
    }
  };

  const handleFilter = () => fetchTransactions(filterDate);

  const exportToExcel = () => {
    if (transactions.length === 0) {
      toast.error(safeT('noData') || 'No data');
      return;
    }

    const data = transactions.map(t => ({
      [safeT('transactionId') || 'ID']: t.id,
      [safeT('date') || 'Date']: formatDateTime(t.created_at),
      [safeT('items') || 'Items']: t.items?.length || 0,
      [safeT('total') || 'Total']: t.total,
      [safeT('payment') || 'Payment']: t.payment_method === 'cash' ? (safeT('cash') || 'Cash') : (safeT('card') || 'Card'),
      [safeT('cashierName') || 'Cashier']: t.cashier_name,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    XLSX.writeFile(wb, `sales_${new Date().toISOString().slice(0,10)}.xlsx`);
    toast.success(safeT('exportSuccess') || 'Exported successfully');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{safeT('salesHistory') || 'Sales History'}</h1>
        <button onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2">
          <FiDownload /> {safeT('exportToExcel') || 'Export to Excel'}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="input-label dark:text-gray-300">{safeT('filterByDate') || 'Filter by Date'}</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
          />
        </div>
        <button onClick={handleFilter} className="btn-primary px-6">{safeT('apply') || 'Apply'}</button>
        {filterDate && (
          <button onClick={() => { setFilterDate(''); fetchTransactions(); }} className="btn-outline dark:bg-gray-700 dark:text-white dark:border-gray-600 px-6">{safeT('clear') || 'Clear'}</button>
        )}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {safeT('transactionId') || 'ID'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {safeT('date') || 'Date'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {safeT('items') || 'Items'}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {safeT('total') || 'Total'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {safeT('payment') || 'Payment'}
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  {safeT('actions') || 'Actions'}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map(t => (
                <tr key={t.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">#{t.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {formatDateTime(t.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {t.items?.length || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-green-600 dark:text-green-400 font-semibold">
                    ${t.total.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {t.payment_method === 'cash' ? (safeT('cash') || 'Cash') : (safeT('card') || 'Card')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <button
                      onClick={() => { setSelectedTransaction(t); setShowReceipt(true); }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 inline-flex items-center gap-1"
                    >
                      <FiEye size={16} /> {safeT('view') || 'View'}
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                    {safeT('noData') || 'No transactions'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showReceipt && selectedTransaction && (
        <Receipt transaction={selectedTransaction} onClose={() => setShowReceipt(false)} />
      )}
    </div>
  );
};

export default SalesHistory;