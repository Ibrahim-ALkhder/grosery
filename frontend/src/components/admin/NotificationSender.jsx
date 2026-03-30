import React, { useState } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { FiSend } from 'react-icons/fi';

const NotificationSender = ({ onSent }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isSuperAdmin = user?.username === 'admin1';
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetRole, setTargetRole] = useState('cashiers');
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error(t('fillRequiredFields'));
      return;
    }
    setSending(true);
    try {
      const res = await api.post('/notifications/send', { title, message, targetRole });
      toast.success(t('notificationSent', { count: res.data.recipientsCount }));
      setTitle('');
      setMessage('');
      setTargetRole('cashiers');
      if (onSent) onSent();
    } catch (error) {
      toast.error(error.response?.data?.error || t('sendFailed'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
      <h2 className="text-lg font-semibold mb-4 dark:text-white flex items-center gap-2">
        <FiSend /> {t('sendNotification')}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="input-label">{t('notificationTitle')}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            placeholder={t('notificationTitle')}
            required
          />
        </div>
        <div>
          <label className="input-label">{t('notificationMessage')}</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="input-field"
            rows="3"
            placeholder={t('notificationMessage')}
            required
          />
        </div>
        <div>
          <label className="input-label">{t('sendTo')}</label>
          <select
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="input-field"
          >
            <option value="cashiers">{t('cashiersOnly')}</option>
            {isSuperAdmin && (
              <>
                <option value="admins">{t('adminsOnly')}</option>
                <option value="all">{t('allUsers')}</option>
              </>
            )}
          </select>
        </div>
        <button
          type="submit"
          disabled={sending}
          className="btn-primary w-full py-2 disabled:opacity-50"
        >
          {sending ? t('processing') : t('sendNotification')}
        </button>
      </form>
    </div>
  );
};

export default NotificationSender;