import React, { useState, useEffect, useRef } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { FiSearch, FiPlus, FiMinus, FiTrash2, FiX, FiCreditCard, FiDollarSign, FiPrinter } from 'react-icons/fi';

const getProductImage = (category, imageUrl) => {
  if (imageUrl) return `http://localhost:5000${imageUrl}`;
  const images = {
    'Dairy': 'https://images.unsplash.com/photo-1550583724-b2692b5b2b4f?w=200&h=200&fit=crop',
    'Bakery': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=200&h=200&fit=crop',
    'Beverages': 'https://images.unsplash.com/photo-1543253687-c931c8e01820?w=200&h=200&fit=crop',
    'Fruits': 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200&h=200&fit=crop',
    'Vegetables': 'https://images.unsplash.com/photo-1597362921503-75c3da9e4feb?w=200&h=200&fit=crop',
    'Meat': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200&h=200&fit=crop',
    'Snacks': 'https://images.unsplash.com/photo-1621939514649-280e2ee25f60?w=200&h=200&fit=crop',
    'Grains': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=200&h=200&fit=crop'
  };
  return images[category] || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&h=200&fit=crop';
};

const CashierScreen = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [taxRate, setTaxRate] = useState(15);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [cashGiven, setCashGiven] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState([]);
  const [lastTransaction, setLastTransaction] = useState(null);

  const searchInputRef = useRef(null);

  useEffect(() => {
    fetchAllProducts();
    searchInputRef.current?.focus();
  }, []);

  const fetchAllProducts = async () => {
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchProducts();
      } else {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchProducts = async () => {
    try {
      const res = await api.get(`/products?search=${searchQuery}`);
      const withImages = res.data.map(p => ({
        ...p,
        image: getProductImage(p.category, p.image_url)
      }));
      setSearchResults(withImages);
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const checkStock = (product, quantity = 1) => {
    if (product.stock <= 0) {
      toast.error(`${t('outOfStock')} ${product.name}`);
      return false;
    }
    const cartItem = cart.find(item => item.id === product.id);
    const currentQty = cartItem ? cartItem.quantity : 0;
    if (currentQty + quantity > product.stock) {
      toast.error(t('onlyAvailable', { stock: product.stock }) + ' ' + product.name);
      return false;
    }
    return true;
  };

  const addToCart = (product) => {
    if (!checkStock(product, 1)) return;
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success(t('added', { name: product.name }));
  };

  const updateQuantity = (id, delta) => {
    const item = cart.find(i => i.id === id);
    if (delta > 0 && !checkStock(item, delta)) return;
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
    toast.success(t('itemRemoved'));
  };

  const clearCart = () => {
    if (cart.length > 0 && window.confirm(t('clearCartConfirm'))) {
      setCart([]);
      setDiscount(0);
      setShowCheckout(false);
      setLastTransaction(null);
    }
  };

  const validateCartStock = () => {
    for (const item of cart) {
      if (item.quantity > item.stock) {
        toast.error(t('stockInsufficient', { name: item.name, stock: item.stock }));
        return false;
      }
    }
    return true;
  };

  const subtotal = cart.reduce((sum, item) => sum + item.selling_price * item.quantity, 0);
  const tax = (subtotal * taxRate) / 100;
  const total = subtotal - discount + tax;
  const change = cashGiven ? parseFloat(cashGiven) - total : 0;

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error(t('cartEmpty'));
    if (!validateCartStock()) return;
    if (paymentMethod === 'cash' && (!cashGiven || parseFloat(cashGiven) < total)) {
      return toast.error(t('insufficientCash'));
    }
    setLoading(true);
    try {
      const transaction = {
        cashier_id: user.id,
        cashier_name: user.name,
        items: cart.map(item => ({
          product_id: item.id,
          name: item.name,
          quantity: item.quantity,
          price: item.selling_price
        })),
        total,
        tax,
        discount,
        payment_method: paymentMethod,
        cash_given: paymentMethod === 'cash' ? parseFloat(cashGiven) : null,
        change_due: paymentMethod === 'cash' ? change : 0
      };
      const response = await api.post('/transactions', transaction);
      if (response.data.success) {
        toast.success(t('transactionCompleted'));
        setLastTransaction({ ...transaction, id: response.data.transactionId });
        clearCart();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || t('checkoutFailed'));
    } finally {
      setLoading(false);
    }
  };

  const printReceipt = () => {
    if (!lastTransaction) return;
    const tPrint = lastTransaction;
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${t('receipt')} #${tPrint.id}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 20px; }
            .receipt { max-width: 300px; margin: auto; }
            .header { text-align: center; margin-bottom: 20px; }
            .items { margin: 20px 0; }
            .item { display: flex; justify-content: space-between; }
            .total { font-weight: bold; border-top: 1px dashed #000; padding-top: 10px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>${t('storeName')}</h2>
              <p>${new Date().toLocaleString()}</p>
              <p>${t('receipt')} #${tPrint.id}</p>
              <p>${t('cashier')}: ${tPrint.cashier_name}</p>
            </div>
            <div class="items">
              ${tPrint.items.map(item => `
                <div class="item">
                  <span>${item.name} x${item.quantity}</span>
                  <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            <div class="total">
              <div class="item"><span>${t('subtotal')}</span><span>$${(tPrint.total + tPrint.discount - tPrint.tax).toFixed(2)}</span></div>
              ${tPrint.discount > 0 ? `<div class="item"><span>${t('discount')}</span><span>-$${tPrint.discount.toFixed(2)}</span></div>` : ''}
              ${tPrint.tax > 0 ? `<div class="item"><span>${t('tax')}</span><span>$${tPrint.tax.toFixed(2)}</span></div>` : ''}
              <div class="item"><span>${t('total')}</span><span>$${tPrint.total.toFixed(2)}</span></div>
            </div>
            <div style="text-align: center; margin-top: 30px;">${t('thankYou')}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const displayedProducts = searchResults.length > 0 ? searchResults : products;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* القسم الأيسر - المنتجات */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('searchProduct')}</h2>
          </div>
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={t('barcodeOrName')}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* شبكة المنتجات */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {displayedProducts.map(product => (
            <div
              key={product.id}
              onClick={() => product.stock > 0 && addToCart(product)}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-shadow p-4 border border-gray-100 dark:border-gray-700 relative ${
                product.stock === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              {product.stock === 0 && (
                <span className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">{t('outOfStock')}</span>
              )}
              <img src={product.image} alt={product.name} className="w-full h-32 object-cover rounded-lg mb-3" />
              <h3 className="font-medium text-gray-900 dark:text-white">{product.name}</h3>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">${product.selling_price}</p>
            </div>
          ))}
        </div>
      </div>

      {/* القسم الأيمن - السلة */}
      <div className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 sticky top-24">
          <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">{t('cart')}</h2>
          
          {cart.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">{t('cartEmpty')}</div>
          ) : (
            <>
              <div className="space-y-4 max-h-96 overflow-auto">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-3">
                    <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">${item.selling_price} x {item.quantity}</p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">${(item.selling_price * item.quantity).toFixed(2)}</p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-7 h-7 flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300"
                      >
                        <FiMinus size={14} />
                      </button>
                      <span className="w-6 text-center text-gray-900 dark:text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-7 h-7 flex items-center justify-center bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                      >
                        <FiPlus size={14} />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="w-7 h-7 flex items-center justify-center bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 ml-1"
                      >
                        <FiTrash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('subtotal')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('tax')}</span>
                  <span className="text-gray-900 dark:text-white">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900 dark:text-white">{t('total')}</span>
                  <span className="text-blue-600 dark:text-blue-400">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={clearCart} className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition">
                  <FiX className="inline mr-2" /> {t('clearCart')}
                </button>
                <button onClick={() => setShowCheckout(true)} className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition">
                  <FiCreditCard className="inline mr-2" /> {t('checkout')}
                </button>
              </div>
            </>
          )}
        </div>

        {lastTransaction && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
            <button onClick={printReceipt} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
              <FiPrinter size={18} /> {t('printLastReceipt')}
            </button>
          </div>
        )}
      </div>

      {/* نافذة الدفع */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('checkout')}</h2>
            <div className="text-center mb-6">
              <p className="text-gray-600 dark:text-gray-400">{t('total')}</p>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">${total.toFixed(2)}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="input-label dark:text-gray-300">{t('paymentMethod')}</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`py-3 rounded-lg font-medium transition ${
                      paymentMethod === 'cash' 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <FiDollarSign className="inline mr-1" /> {t('cash')}
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`py-3 rounded-lg font-medium transition ${
                      paymentMethod === 'card' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <FiCreditCard className="inline mr-1" /> {t('card')}
                  </button>
                </div>
              </div>

              {paymentMethod === 'cash' && (
                <div>
                  <label className="input-label dark:text-gray-300">{t('cashGiven')}</label>
                  <input
                    type="number"
                    min={total}
                    step="0.01"
                    value={cashGiven}
                    onChange={(e) => setCashGiven(e.target.value)}
                    className="input-field dark:bg-gray-700 dark:text-white dark:border-gray-600"
                    placeholder={t('enterAmount')}
                  />
                  {cashGiven && parseFloat(cashGiven) >= total && (
                    <p className="mt-2 text-green-600 dark:text-green-400 font-medium">{t('change')}: ${change.toFixed(2)}</p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-4">
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="btn-primary py-3 disabled:opacity-50"
                >
                  {loading ? t('processing') : t('completeSale')}
                </button>
                <button
                  onClick={() => setShowCheckout(false)}
                  className="btn-outline dark:bg-gray-700 dark:text-white dark:border-gray-600 py-3"
                >
                  {t('cancel')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CashierScreen;