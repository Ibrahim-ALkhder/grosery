import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { LanguageProvider } from './context/LanguageContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CashierScreen from './components/CashierScreen';
import ProductManagement from './components/ProductManagement';
import InventoryManagement from './components/InventoryManagement';
import SalesHistory from './components/SalesHistory';
import AdminDashboard from './components/admin/AdminDashboard';
import CashierManagement from './components/admin/CashierManagement';
import Reports from './components/admin/Reports';
import NotificationPage from './pages/NotificationPage';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <NotificationProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <Layout>
                        <Routes>
                          <Route path="/" element={<Navigate to="/cashier" replace />} />
                          <Route path="/dashboard" element={<Dashboard />} />
                          <Route path="/cashier" element={<CashierScreen />} />
                          <Route path="/products" element={<ProductManagement />} />
                          <Route path="/inventory" element={<InventoryManagement />} />
                          <Route path="/sales" element={<SalesHistory />} />
                          <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                          <Route path="/admin/cashiers" element={<AdminRoute><CashierManagement /></AdminRoute>} />
                          <Route path="/admin/reports" element={<AdminRoute><Reports /></AdminRoute>} />
                          <Route path="/admin/notifications" element={<AdminRoute><NotificationPage /></AdminRoute>} />
                        </Routes>
                      </Layout>
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </Router>
            <Toaster 
              position="top-left"
              toastOptions={{
                duration: 3000,
                style: {
                  background: '#363636',
                  color: '#fff',
                  borderRadius: '12px',
                },
              }}
            />
          </NotificationProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;