
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import PermissionManager from '../shared/PermissionManager';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="flex h-screen overflow-hidden bg-background text-slate-900">
      <Sidebar isOpen={sidebarOpen} setIsOpen={setSidebarOpen} />
      <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
        <PermissionManager />
        <Navbar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="w-full px-4 py-8 mx-auto sm:px-6 lg:px-8 max-w-9xl">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
