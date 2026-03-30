import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import CashierScreen from './components/CashierScreen';
import ProductManagement from './components/ProductManagement';
import InventoryManagement from './components/InventoryManagement';
import SalesHistory from './components/SalesHistory';

// مكونات الإدارة
import AdminDashboard from './components/admin/AdminDashboard';
import CashierManagement from './components/admin/CashierManagement';
import Reports from './components/admin/Reports';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* المسارات المحمية (للكاشير والمدير) */}
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
                      
                      {/* مسارات الإدارة (للمدير فقط) */}
                      <Route path="/admin" element={
                        <AdminRoute>
                          <AdminDashboard />
                        </AdminRoute>
                      } />
                      <Route path="/admin/cashiers" element={
                        <AdminRoute>
                          <CashierManagement />
                        </AdminRoute>
                      } />
                      <Route path="/admin/reports" element={
                        <AdminRoute>
                          <Reports />
                        </AdminRoute>
                      } />
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
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;