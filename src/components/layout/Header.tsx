import React, { useState, useEffect } from 'react';
import { Bell, Clock, LogOut, Calendar, Download, Filter } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/context/AlertContext';
import { useFilter } from '@/context/FilterContext';
import { AlertBanner } from '@/components/common/AlertBanner';
import { formatDateTime, formatDate } from '@/utils/format';
import { api } from '@/mock/api';
import { generateMonthlyReport, generateComplianceReport, downloadCSV } from '@/utils/reportGenerator';

interface HeaderProps {
  collapsed: boolean;
}

export const Header: React.FC<HeaderProps> = ({ collapsed }) => {
  const { user, logout } = useAuth();
  const { alerts, unconfirmedCount, criticalCount, loadAlerts } = useAlert();
  const { selectedShift, selectedDate, setSelectedShift, setSelectedDate } = useFilter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadAlerts();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [loadAlerts]);

  const handleExport = async (type: 'monthly' | 'compliance') => {
    try {
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const filterInfo = {
        shift: selectedShift === 'all' ? '全部班次' : selectedShift === 'day' ? '白班' : '夜班',
        date: selectedDate || '全部日期',
      };

      if (type === 'monthly') {
        const data = await generateMonthlyReport(monthStr, filterInfo);
        const fileName = `月度运营分析报告_${monthStr}.csv`;
        downloadCSV(data.csvContent, fileName);
      } else {
        const data = await generateComplianceReport(monthStr, filterInfo);
        const fileName = `环保合规明细_${monthStr}.csv`;
        downloadCSV(data.csvContent, fileName);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请稍后重试');
    }
  };

  const unconfirmedAlerts = alerts.filter((a) => !a.confirmed).slice(0, 5);

  return (
    <header
      className={`fixed top-0 right-0 h-16 bg-slate-900/95 backdrop-blur border-b border-slate-700/50 z-30 transition-all duration-300 ${
        collapsed ? 'left-16' : 'left-60'
      }`}
    >
      <div className="h-full flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Calendar className="w-4 h-4" />
            <span className="text-sm">{formatDateTime(currentTime).split(' ')[0]}</span>
            <Clock className="w-4 h-4 ml-2" />
            <span className="text-sm font-mono">{formatDateTime(currentTime).split(' ')[1]}</span>
          </div>

          <div className="flex items-center gap-2 ml-6">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as any)}
              className="bg-slate-800 text-slate-300 text-sm rounded-lg px-3 py-1.5 border border-slate-600 focus:outline-none focus:border-blue-500"
            >
              <option value="all">全部班次</option>
              <option value="day">白班 (8:00-20:00)</option>
              <option value="night">夜班 (20:00-8:00)</option>
            </select>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-800 text-slate-300 text-sm rounded-lg px-3 py-1.5 border border-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <button
              onClick={() => handleExport('monthly')}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>月度报告</span>
            </button>
          </div>

          <div className="relative group">
            <button
              onClick={() => handleExport('compliance')}
              className="flex items-center gap-2 px-3 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>环保明细</span>
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unconfirmedCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
                  {unconfirmedCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-96 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-slate-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-white">告警通知</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded">
                        {criticalCount} 条严重
                      </span>
                      <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded">
                        {unconfirmedCount} 条未处理
                      </span>
                    </div>
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto p-3">
                  {unconfirmedAlerts.length > 0 ? (
                    unconfirmedAlerts.map((alert) => (
                      <AlertBanner key={alert.id} alert={alert} />
                    ))
                  ) : (
                    <div className="text-center py-8 text-slate-400">
                      <Bell className="w-12 h-12 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">暂无未处理告警</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-8 bg-slate-700" />

          <button
            onClick={logout}
            className="flex items-center gap-2 px-3 py-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>退出</span>
          </button>
        </div>
      </div>
    </header>
  );
};
