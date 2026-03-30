import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { FiEdit2, FiTrash2, FiPlus, FiEye, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import CashierDetailsModal from './CashierDetailsModal';

const CashierManagement = () => {
  const { t } = useLanguage();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.username === 'admin1';
  const [cashiers, setCashiers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSelfDeleteModal, setShowSelfDeleteModal] = useState(false);
  const [targetForSelfDelete, setTargetForSelfDelete] = useState(null);
  const [deleteCredentials, setDeleteCredentials] = useState({ username: '', password: '' });
  const [selectedCashier, setSelectedCashier] = useState(null);
  const [editingCashier, setEditingCashier] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', username: '', password: '', phone: '', role: 'cashier', status: 'active'
  });

  useEffect(() => {
    fetchCashiers();
  }, []);

  const fetchCashiers = async () => {
    try {
      const res = await api.get('/admin/users');
      const performanceRes = await api.get('/admin/cashier-performance');
      const performanceMap = performanceRes.data.reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {});
      const combined = res.data.map(c => ({
        ...c,
        total_sales: performanceMap[c.id]?.total_sales || 0,
        transactions: performanceMap[c.id]?.transactions || 0,
        last_sale: performanceMap[c.id]?.last_sale
      }));
      // ترتيب تنازلي حسب إجمالي المبيعات
      combined.sort((a, b) => b.total_sales - a.total_sales);
      setCashiers(combined);
    } catch (error) {
      toast.error(t('failedToLoadCashiers'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', email: '', username: '', password: '', phone: '', role: 'cashier', status: 'active'
    });
    setEditingCashier(null);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCashier) {
        const data = { ...formData };
        if (!data.password) delete data.password;
        await api.put(`/admin/users/${editingCashier.id}`, data);
        toast.success(t('cashierUpdated'));
      } else {
        await api.post('/admin/users', formData);
        toast.success(t('cashierAdded'));
      }
      setShowModal(false);
      resetForm();
      fetchCashiers();
    } catch (error) {
      toast.error(error.response?.data?.error || (editingCashier ? t('updateFailed') : t('addFailed')));
    }
  };

  const handleEdit = (cashier) => {
    setEditingCashier(cashier);
    setFormData({
      name: cashier.name,
      email: cashier.email,
      username: cashier.username,
      password: '',
      phone: cashier.phone || '',
      role: cashier.role,
      status: cashier.status
    });
    setShowModal(true);
  };

  const handleDeleteClick = (cashier) => {
    if (cashier.username === 'admin1') {
      toast.error(t('cannotDeletePrimary'));
      return;
    }
    if (!isSuperAdmin && cashier.role === 'admin') {
      toast.error(t('cannotModifyAdmin'));
      return;
    }
    if (cashier.id === currentUser?.id) {
      setTargetForSelfDelete(cashier);
      setShowSelfDeleteModal(true);
      return;
    }
    if (window.confirm(t('confirmDelete'))) {
      performDelete(cashier.id);
    }
  };

  const performDelete = async (id) => {
    try {
      await api.delete(`/admin/users/${id}`);
      toast.success(t('cashierDeleted'));
      fetchCashiers();
    } catch (error) {
      toast.error(error.response?.data?.error || t('deleteFailed'));
    }
  };

  const handleSelfDeleteSubmit = async (e) => {
    e.preventDefault();
    if (!targetForSelfDelete) return;
    try {
      await api.post(`/admin/users/${targetForSelfDelete.id}/self-delete`, deleteCredentials);
      toast.success(t('accountDeleted'));
      localStorage.removeItem('pos_user');
      window.location.href = '/login';
    } catch (error) {
      toast.error(error.response?.data?.error || t('incorrectCredentials'));
    } finally {
      setShowSelfDeleteModal(false);
      setDeleteCredentials({ username: '', password: '' });
      setTargetForSelfDelete(null);
    }
  };

  const toggleStatus = async (cashier) => {
    if (cashier.username === 'admin1') {
      toast.error(t('cannotModifyPrimary'));
      return;
    }
    if (!isSuperAdmin && cashier.role === 'admin') {
      toast.error(t('cannotModifyAdmin'));
      return;
    }
    const newStatus = cashier.status === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/admin/users/${cashier.id}`, { ...cashier, status: newStatus });
      toast.success(t('statusChanged'));
      fetchCashiers();
    } catch (error) {
      toast.error(t('updateFailed'));
    }
  };

  const viewDetails = (cashier) => {
    setSelectedCashier(cashier);
    setShowDetailsModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('cashierManagement')}</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <FiPlus /> {t('addCashier')}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">#</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('fullName')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('email')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('role')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('totalSales')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('transactions')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('lastSale')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {cashiers.map((c, index) => {
                const isAdminUser = c.role === 'admin' && c.username !== 'admin1';
                const isSuperAdminUser = c.username === 'admin1';
                const canModify = isSuperAdmin || (!isAdminUser && c.role !== 'admin');
                return (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{index + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{c.name}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{c.email}</td>
                    <td className="px-6 py-4 capitalize text-gray-700 dark:text-gray-300">{c.role}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        c.status === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {c.status === 'active' ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-green-600 dark:text-green-400 font-semibold">${c.total_sales?.toFixed(2)}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{c.transactions}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                      {c.last_sale ? new Date(c.last_sale).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {canModify && !isSuperAdminUser && (
                          <button
                            onClick={() => toggleStatus(c)}
                            className={`p-1 rounded ${
                              c.status === 'active'
                                ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                            title={c.status === 'active' ? t('deactivate') : t('activate')}
                          >
                            {c.status === 'active' ? <FiToggleRight size={20} /> : <FiToggleLeft size={20} />}
                          </button>
                        )}
                        <button
                          onClick={() => viewDetails(c)}
                          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          title={t('viewDetails')}
                        >
                          <FiEye size={18} />
                        </button>
                        {canModify && !isSuperAdminUser && (
                          <button
                            onClick={() => handleEdit(c)}
                            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                            title={t('edit')}
                          >
                            <FiEdit2 size={18} />
                          </button>
                        )}
                        {canModify && !isSuperAdminUser && (
                          <button
                            onClick={() => handleDeleteClick(c)}
                            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/30"
                            title={t('delete')}
                          >
                            <FiTrash2 size={18} />
                          </button>
                        )}
                        {isSuperAdminUser && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 italic">{t('protectedAdmin')}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة إضافة/تعديل كاشير */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingCashier ? t('editCashier') : t('addCashier')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="input-label dark:text-gray-300">{t('fullName')} *</label>
                <input 
                  name="name" 
                  value={formData.name} 
                  onChange={handleInputChange} 
                  className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                  required 
                />
              </div>
              <div>
                <label className="input-label dark:text-gray-300">{t('email')} *</label>
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email} 
                  onChange={handleInputChange} 
                  className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                  required 
                />
              </div>
              <div>
                <label className="input-label dark:text-gray-300">{t('username')} *</label>
                <input 
                  name="username" 
                  value={formData.username} 
                  onChange={handleInputChange} 
                  className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                  required 
                  dir="ltr" 
                />
              </div>
              {!editingCashier && (
                <div>
                  <label className="input-label dark:text-gray-300">{t('password')} *</label>
                  <input 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleInputChange} 
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                    required 
                  />
                </div>
              )}
              <div>
                <label className="input-label dark:text-gray-300">{t('phone')}</label>
                <input 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleInputChange} 
                  className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                />
              </div>
              <div>
                <label className="input-label dark:text-gray-300">{t('role')}</label>
                <select 
                  name="role" 
                  value={formData.role} 
                  onChange={handleInputChange} 
                  className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="cashier">{t('cashier')}</option>
                  {isSuperAdmin && <option value="admin">{t('admin')}</option>}
                </select>
              </div>
              <div>
                <label className="input-label dark:text-gray-300">{t('status')}</label>
                <select 
                  name="status" 
                  value={formData.status} 
                  onChange={handleInputChange} 
                  className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                >
                  <option value="active">{t('active')}</option>
                  <option value="inactive">{t('inactive')}</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">{t('save')}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline dark:bg-gray-700 dark:text-white dark:border-gray-600 flex-1">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* نافذة تفاصيل الكاشير */}
      {showDetailsModal && selectedCashier && (
        <CashierDetailsModal cashier={selectedCashier} onClose={() => setShowDetailsModal(false)} />
      )}

      {/* نافذة الحذف الآمن للنفس */}
      {showSelfDeleteModal && targetForSelfDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('deleteAccount')}</h2>
            <p className="text-red-600 dark:text-red-400 mb-4 font-semibold">{t('selfDeleteWarning')}</p>
            <form onSubmit={handleSelfDeleteSubmit} className="space-y-4">
              <div>
                <label className="input-label dark:text-gray-300">{t('username')}</label>
                <input
                  type="text"
                  value={deleteCredentials.username}
                  onChange={(e) => setDeleteCredentials({ ...deleteCredentials, username: e.target.value })}
                  className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  required
                />
              </div>
              <div>
                <label className="input-label dark:text-gray-300">{t('password')}</label>
                <input
                  type="password"
                  value={deleteCredentials.password}
                  onChange={(e) => setDeleteCredentials({ ...deleteCredentials, password: e.target.value })}
                  className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-danger flex-1">{t('confirm')}</button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSelfDeleteModal(false);
                    setDeleteCredentials({ username: '', password: '' });
                    setTargetForSelfDelete(null);
                  }}
                  className="btn-outline dark:bg-gray-700 dark:text-white dark:border-gray-600 flex-1"
                >
                  {t('cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierManagement;