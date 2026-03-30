import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import NotificationSender from '../components/admin/NotificationSender';

const NotificationPage = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto py-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
      >
        <FiArrowLeft /> Back
      </button>
      <NotificationSender onSent={() => {}} />
    </div>
  );
};

export default NotificationPage;