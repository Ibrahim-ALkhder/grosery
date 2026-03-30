import React, { useRef } from 'react';
import { FiPrinter, FiX } from 'react-icons/fi';
import { formatDateTime } from '../utils/dateHelper';
import { useLanguage } from '../context/LanguageContext';

const Receipt = ({ transaction, onClose }) => {
  let language;
  try {
    language = useLanguage();
  } catch (error) {
    console.error('LanguageContext not found in Receipt. Using default.');
    language = { t: (key) => key };
  }
  const { t } = language;

  const receiptRef = useRef();

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>${t('receipt') || 'Receipt'} #${transaction.id}</title>
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
              <h2>${t('storeName') || 'Grocery Store'}</h2>
              <p>${formatDateTime(transaction.created_at)}</p>
              <p>${t('receipt') || 'Receipt'} #${transaction.id}</p>
              <p>${t('cashier') || 'Cashier'}: ${transaction.cashier_name}</p>
            </div>
            <div class="items">
              ${transaction.items.map(item => `
                <div class="item">
                  <span>${item.product_name} x${item.quantity}</span>
                  <span>$${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              `).join('')}
            </div>
            <div class="total">
              <div class="item"><span>${t('subtotal') || 'Subtotal'}</span><span>$${(transaction.total + transaction.discount - transaction.tax).toFixed(2)}</span></div>
              ${transaction.discount > 0 ? `<div class="item"><span>${t('discount') || 'Discount'}</span><span>-$${transaction.discount.toFixed(2)}</span></div>` : ''}
              ${transaction.tax > 0 ? `<div class="item"><span>${t('tax') || 'Tax'}</span><span>$${transaction.tax.toFixed(2)}</span></div>` : ''}
              <div class="item"><span>${t('total') || 'Total'}</span><span>$${transaction.total.toFixed(2)}</span></div>
            </div>
            <div style="text-align: center; margin-top: 30px;">${t('thankYou') || 'Thank you!'}</div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{t('receipt') || 'Receipt'} #{transaction.id}</h2>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300">
            <FiX size={24} />
          </button>
        </div>
        <div ref={receiptRef} className="p-6 font-mono text-sm text-gray-900 dark:text-white">
          <div className="text-center mb-4">
            <h3 className="text-lg font-bold">{t('storeName') || 'Grocery Store'}</h3>
            <p className="text-gray-600 dark:text-gray-400">{formatDateTime(transaction.created_at)}</p>
          </div>
          <div className="space-y-2 mb-4">
            {transaction.items.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span>{item.product_name} x{item.quantity}</span>
                <span>${(item.price * item.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
            <div className="flex justify-between">
              <span>{t('subtotal') || 'Subtotal'}</span>
              <span>${(transaction.total + transaction.discount - transaction.tax).toFixed(2)}</span>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between">
                <span>{t('discount') || 'Discount'}</span>
                <span>-${transaction.discount.toFixed(2)}</span>
              </div>
            )}
            {transaction.tax > 0 && (
              <div className="flex justify-between">
                <span>{t('tax') || 'Tax'}</span>
                <span>${transaction.tax.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg mt-2">
              <span>{t('total') || 'Total'}</span>
              <span className="text-blue-600 dark:text-blue-400">${transaction.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button onClick={handlePrint} className="btn-primary flex-1">
            <FiPrinter className="inline mr-2" /> {t('printReceipt') || 'Print'}
          </button>
          <button onClick={onClose} className="btn-outline dark:bg-gray-700 dark:text-white dark:border-gray-600 flex-1">{t('close') || 'Close'}</button>
        </div>
      </div>
    </div>
  );
};

export default Receipt;