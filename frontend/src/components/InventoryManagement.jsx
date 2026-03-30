import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { FiPackage, FiAlertCircle, FiRefreshCw } from 'react-icons/fi';

const InventoryManagement = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [showRestock, setShowRestock] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [restockQty, setRestockQty] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/inventory');
      setProducts(res.data.products);
      setLowStock(res.data.lowStock);
    } catch (error) {
      toast.error(t('failedToLoad'));
    }
  };

  const handleRestock = async () => {
    if (!restockQty || restockQty <= 0) {
      toast.error(t('enterValidQuantity'));
      return;
    }
    try {
      await api.post('/inventory/restock', {
        productId: selectedProduct.id,
        quantity: parseInt(restockQty)
      });
      toast.success(t('restockSuccess'));
      setShowRestock(false);
      setRestockQty('');
      fetchInventory();
    } catch (error) {
      toast.error(t('restockFailed'));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('inventoryManagement')}</h1>

      {lowStock.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 flex items-center gap-3">
          <FiAlertCircle className="text-red-600 dark:text-red-400 flex-shrink-0" size={24} />
          <p className="text-red-800 dark:text-red-300">
            <span className="font-bold">{lowStock.length}</span> {t('lowStockAlert')}
          </p>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('productName')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('category')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('currentStock')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('minStock')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('status')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {products.map(p => {
                const isLow = p.stock <= p.min_stock;
                return (
                  <tr key={p.id} className={isLow ? 'bg-red-50 dark:bg-red-900/10' : ''}>
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{p.name}</td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{p.category || '—'}</td>
                    <td className="px-6 py-4 text-gray-900 dark:text-white">
                      <span className={p.stock === 0 ? 'text-red-600 dark:text-red-400 font-bold' : ''}>
                        {p.stock}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{p.min_stock}</td>
                    <td className="px-6 py-4">
                      {p.stock === 0 ? (
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 rounded-full text-xs font-medium">{t('outOfStock')}</span>
                      ) : isLow ? (
                        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 rounded-full text-xs font-medium">{t('lowStock')}</span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-full text-xs font-medium">{t('inStock')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => {
                          setSelectedProduct(p);
                          setShowRestock(true);
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
                      >
                        <FiRefreshCw size={16} /> {t('restock')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة إعادة التوريد - نفس التصميم مع كلاسات dark */}
      {showRestock && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">{t('restockProduct')}</h2>
            <p className="mb-4 text-gray-700 dark:text-gray-300">
              <span className="font-medium">{selectedProduct.name}</span><br />
              {t('currentStock')}: {selectedProduct.stock}
            </p>
            <div className="space-y-4">
              <div>
                <label className="input-label dark:text-gray-300">{t('quantityToAdd')}</label>
                <input
                  type="number"
                  min="1"
                  value={restockQty}
                  onChange={(e) => setRestockQty(e.target.value)}
                  className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button onClick={handleRestock} className="btn-primary flex-1">{t('confirm')}</button>
                <button onClick={() => setShowRestock(false)} className="btn-outline dark:bg-gray-700 dark:text-white dark:border-gray-600 flex-1">{t('cancel')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManagement;