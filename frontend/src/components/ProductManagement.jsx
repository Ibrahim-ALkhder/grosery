import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';
import { FiEdit2, FiTrash2, FiPlus, FiSearch } from 'react-icons/fi';

const getProductImage = (category, imageUrl) => {
  if (imageUrl) return `http://localhost:5000${imageUrl}`;
  const images = {
    'Dairy': 'https://images.unsplash.com/photo-1550583724-b2692b5b2b4f?w=100&h=100&fit=crop',
    'Bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=100&h=100&fit=crop',
    'Beverages': 'https://images.unsplash.com/photo-1543253687-c931c8e01820?w=100&h=100&fit=crop',
    'Fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=100&h=100&fit=crop',
    'Vegetables': 'https://images.unsplash.com/photo-1597362921503-75c3da9e4feb?w=100&h=100&fit=crop',
    'Meat': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=100&h=100&fit=crop',
    'Snacks': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=100&h=100&fit=crop',
    'Grains': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=100&h=100&fit=crop'
  };
  return images[category] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=100&h=100&fit=crop';
};

const ProductManagement = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    name: '', barcode: '', category: '', selling_price: '', cost_price: '', stock: '', min_stock: '5'
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products');
      const withImages = res.data.map(p => ({
        ...p,
        image: getProductImage(p.category, p.image_url)
      }));
      setProducts(withImages);
    } catch (error) {
      toast.error(t('failedToLoadProducts'));
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      fetchProducts();
      return;
    }
    try {
      const res = await api.get(`/products?search=${search}`);
      const withImages = res.data.map(p => ({
        ...p,
        image: getProductImage(p.category, p.image_url)
      }));
      setProducts(withImages);
    } catch (error) {
      toast.error(t('searchFailed'));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', barcode: '', category: '', selling_price: '', cost_price: '', stock: '', min_stock: '5' });
    setEditingProduct(null);
    setImageFile(null);
    setImagePreview(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (imageFile) data.append('image', imageFile);

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success(t('productUpdated'));
      } else {
        await api.post('/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success(t('productAdded'));
      }
      setShowModal(false);
      resetForm();
      fetchProducts();
    } catch (error) {
      toast.error(editingProduct ? t('updateFailed') : t('addFailed'));
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      barcode: product.barcode,
      category: product.category || '',
      selling_price: product.selling_price,
      cost_price: product.cost_price,
      stock: product.stock,
      min_stock: product.min_stock
    });
    setImagePreview(product.image);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('confirmDelete'))) {
      try {
        await api.delete(`/products/${id}`);
        toast.success(t('productDeleted'));
        fetchProducts();
      } catch (error) {
        toast.error(t('deleteFailed'));
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('productManagement')}</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2"
        >
          <FiPlus /> {t('addProduct')}
        </button>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={t('searchByNameOrBarcode')}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button onClick={handleSearch} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t('search')}</button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('image')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('productName')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('barcode')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('sellingPrice')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('stock')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('category')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {products.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4">
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{p.name}</td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{p.barcode}</td>
                  <td className="px-6 py-4 text-green-600 dark:text-green-400 font-semibold">${p.selling_price}</td>
                  <td className="px-6 py-4 text-gray-900 dark:text-white">
                    <span className={p.stock === 0 ? 'text-red-600 dark:text-red-400 font-bold' : ''}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{p.category || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleEdit(p)} 
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        <FiEdit2 size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(p.id)} 
                        className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* نافذة إضافة/تعديل منتج */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
              {editingProduct ? t('editProduct') : t('addProduct')}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="input-label dark:text-gray-300">{t('productName')} *</label>
                  <input 
                    name="name" 
                    value={formData.name} 
                    onChange={(e) => setFormData({...formData, name: e.target.value})} 
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                    required 
                  />
                </div>
                <div>
                  <label className="input-label dark:text-gray-300">{t('barcode')} *</label>
                  <input 
                    name="barcode" 
                    value={formData.barcode} 
                    onChange={(e) => setFormData({...formData, barcode: e.target.value})} 
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                    required 
                    dir="ltr" 
                  />
                </div>
                <div>
                  <label className="input-label dark:text-gray-300">{t('category')}</label>
                  <input 
                    name="category" 
                    value={formData.category} 
                    onChange={(e) => setFormData({...formData, category: e.target.value})} 
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                  />
                </div>
                <div>
                  <label className="input-label dark:text-gray-300">{t('sellingPrice')} *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="selling_price" 
                    value={formData.selling_price} 
                    onChange={(e) => setFormData({...formData, selling_price: e.target.value})} 
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                    required 
                  />
                </div>
                <div>
                  <label className="input-label dark:text-gray-300">{t('costPrice')} *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    name="cost_price" 
                    value={formData.cost_price} 
                    onChange={(e) => setFormData({...formData, cost_price: e.target.value})} 
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                    required 
                  />
                </div>
                <div>
                  <label className="input-label dark:text-gray-300">{t('stock')} *</label>
                  <input 
                    type="number" 
                    name="stock" 
                    value={formData.stock} 
                    onChange={(e) => setFormData({...formData, stock: e.target.value})} 
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                    required 
                  />
                </div>
                <div>
                  <label className="input-label dark:text-gray-300">{t('minStock')} *</label>
                  <input 
                    type="number" 
                    name="min_stock" 
                    value={formData.min_stock} 
                    onChange={(e) => setFormData({...formData, min_stock: e.target.value})} 
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                    required 
                  />
                </div>
                <div className="col-span-2">
                  <label className="input-label dark:text-gray-300">{t('image')}</label>
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp" 
                    onChange={handleImageChange} 
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600" 
                  />
                  {imagePreview && (
                    <img src={imagePreview} alt="Preview" className="mt-2 w-20 h-20 object-cover rounded-lg" />
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="btn-primary flex-1">{t('save')}</button>
                <button type="button" onClick={() => setShowModal(false)} className="btn-outline dark:bg-gray-700 dark:text-white dark:border-gray-600 flex-1">{t('cancel')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;