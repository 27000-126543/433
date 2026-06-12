import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  Flame,
  Wind,
  Factory,
  Wrench,
  Settings,
  ChevronLeft,
  ChevronRight,
  Package,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { canAccessRoute } from '@/utils/permission';
import { roleNames } from '@/types';
import { cn } from '@/lib/utils';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

interface MenuItem {
  path: string;
  label: string;
  icon: React.ElementType;
  roles?: string[];
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user } = useAuth();
  const location = useLocation();

  const menuItems: MenuItem[] = [
    { path: '/dashboard', label: '首页大屏', icon: LayoutDashboard },
    { path: '/waste-management', label: '垃圾入场管理', icon: Truck, roles: ['gatekeeper', 'operator', 'director'] },
    { path: '/incineration', label: '焚烧发电监控', icon: Flame, roles: ['operator', 'safety', 'director'] },
    { path: '/flue-gas', label: '烟气处理监管', icon: Wind, roles: ['operator', 'safety', 'finance', 'director'] },
    { path: '/slag-leachate', label: '炉渣渗滤液处置', icon: Factory, roles: ['operator', 'safety', 'director'] },
    { path: '/equipment', label: '设备运维管理', icon: Wrench, roles: ['maintenance', 'operator', 'director'] },
    { path: '/purchase', label: '采购审批管理', icon: Package, roles: ['finance', 'director'] },
    { path: '/system', label: '系统管理', icon: Settings, roles: ['director'] },
  ];

  const filteredItems = menuItems.filter(
    (item) => !item.roles || !user || item.roles.includes(user.role)
  );

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-full bg-slate-900/95 backdrop-blur border-r border-slate-700/50 transition-all duration-300 z-40',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className="flex flex-col h-full">
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700/50">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <Flame className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold text-white">智慧监管平台</h1>
                <p className="text-xs text-slate-400">垃圾焚烧发电</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center mx-auto">
              <Flame className="w-5 h-5 text-white" />
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 overflow-y-auto">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center gap-3 mx-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-200 group',
                  isActive
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
                )}
              >
                <Icon className={cn('w-5 h-5 flex-shrink-0 transition-transform', isActive && 'scale-110')} />
                {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                {!collapsed && isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {!collapsed && user && (
          <div className="p-4 border-t border-slate-700/50">
            <div className="flex items-center gap-3">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full border-2 border-slate-600"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-slate-400">{roleNames[user.role]}</p>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={onToggle}
          className="h-12 flex items-center justify-center border-t border-slate-700/50 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>
    </aside>
  );
};
