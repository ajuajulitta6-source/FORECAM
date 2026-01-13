
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { UserRole, UserPermission } from './types';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import KanbanBoard from './components/work-orders/KanbanBoard';
import AssetRegistry from './components/assets/AssetRegistry';
import InventoryList from './components/inventory/InventoryList';
import UserManagement from './components/admin/UserManagement';
import MaintenanceSchedule from './components/preventive-maintenance/MaintenanceSchedule';
import RequestsVendors from './components/requests-vendors/RequestsVendors';
import Organization from './components/organization/Organization';
import Reports from './components/reports/Reports';
import MessageCenter from './components/messages/MessageCenter';
import Settings from './components/settings/Settings';
import Login from './components/Login';
import ProtectedRoute from './components/shared/ProtectedRoute';
import { UserContext } from './context/UserContext';
import { DataProvider } from './context/DataContext';
import { User } from './types';
import { MOCK_USERS } from './constants';
import { supabase } from './lib/supabaseClient';

const App: React.FC = () => {
  // Simulating Auth State
  const [user, setUser] = useState<User | null>(null);

  // Load user from local storage logic (simulated)
  useEffect(() => {
    const storedUser = localStorage.getItem('cmms_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (email: string) => {
    let foundUser: User | null = null;

    // 1. Try fetching from Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('email', email)
          .single();
        
        if (data && !error) {
          foundUser = data as User;
        } else {
          console.warn("User not found in Supabase, checking mocks...");
        }
      } catch (err) {
        console.error("Supabase login error:", err);
      }
    }

    // 2. Fallback to Mock Data if no backend user found
    if (!foundUser) {
       foundUser = MOCK_USERS.find(u => u.email === email) || MOCK_USERS[0];
    }

    setUser(foundUser);
    localStorage.setItem('cmms_user', JSON.stringify(foundUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('cmms_user');
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('cmms_user', JSON.stringify(updatedUser));
    }
  };

  return (
    <UserContext.Provider value={{ user, login, logout, updateProfile }}>
      <DataProvider>
        <HashRouter>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route path="/" element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/work-orders" element={
              <ProtectedRoute>
                <Layout>
                  <KanbanBoard />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/preventive-maintenance" element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TECHNICIAN]}>
                <Layout>
                  <MaintenanceSchedule />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/requests-vendors" element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TECHNICIAN]}>
                 <Layout>
                    <RequestsVendors />
                 </Layout>
              </ProtectedRoute>
            } />

            <Route path="/assets" element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TECHNICIAN]}>
                <Layout>
                  <AssetRegistry />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/inventory" element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TECHNICIAN]}>
                <Layout>
                  <InventoryList />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Reports Route */}
            <Route path="/reports" element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TECHNICIAN]} requiredPermission={UserPermission.VIEW_ANALYTICS}>
                <Layout>
                  <Reports />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Messages Route */}
            <Route path="/messages" element={
              <ProtectedRoute requiredPermission={UserPermission.SEND_MESSAGES}>
                <Layout>
                  <MessageCenter />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Organization Route */}
            <Route path="/organization" element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.TECHNICIAN]}>
                <Layout>
                  <Organization />
                </Layout>
              </ProtectedRoute>
            } />

             {/* Users Route */}
            <Route path="/users" element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]} requiredPermission={UserPermission.MANAGE_TEAM}>
                <Layout>
                  <UserManagement />
                </Layout>
              </ProtectedRoute>
            } />

            {/* Settings Route */}
            <Route path="/settings" element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN]}>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </DataProvider>
    </UserContext.Provider>
  );
};

export default App;
