import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { AlertProvider } from '@/context/AlertContext';
import { FilterProvider } from '@/context/FilterContext';

export const MainLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <AlertProvider>
      <FilterProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
          <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/10 via-transparent to-transparent pointer-events-none" />
          
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          />
          
          <Header collapsed={sidebarCollapsed} />
          
          <main
            className={`pt-16 transition-all duration-300 ${
              sidebarCollapsed ? 'ml-16' : 'ml-60'
            }`}
          >
            <div className="p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </FilterProvider>
    </AlertProvider>
  );
};
