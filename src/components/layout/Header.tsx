import React, { useState, useEffect } from 'react';
import { Bell, Clock, LogOut, Calendar, Download, Filter, X, FileText, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAlert } from '@/context/AlertContext';
import { useFilter } from '@/context/FilterContext';
import { AlertBanner } from '@/components/common/AlertBanner';
import { formatDateTime, formatDate, formatNumber } from '@/utils/format';
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
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [pendingExport, setPendingExport] = useState<{ type: 'monthly' | 'compliance'; fileName: string } | null>(null);

  useEffect(() => {
    loadAlerts();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [loadAlerts]);

  const openPreview = async (type: 'monthly' | 'compliance') => {
    setPreviewLoading(true);
    setShowPreviewModal(true);
    try {
      const now = new Date();
      const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const filterInfo = {
        shift: selectedShift === 'all' ? '全部班次' : selectedShift === 'day' ? '白班' : '夜班',
        date: selectedDate || '全部日期',
      };
      
      const datePart = selectedDate ? `_${selectedDate}` : '';
      const shiftPart = selectedShift !== 'all' ? `_${filterInfo.shift}` : '';
      const fileName = type === 'monthly'
        ? `月度运营分析报告_${monthStr}${datePart}${shiftPart}.csv`
        : `环保合规明细_${monthStr}${datePart}${shiftPart}.csv`;

      const data = type === 'monthly'
        ? await generateMonthlyReport(monthStr, filterInfo)
        : await generateComplianceReport(monthStr, filterInfo);

      setPreviewData(data);
      setPendingExport({ type, fileName });
    } catch (error) {
      console.error('Preview failed:', error);
    } finally {
      setPreviewLoading(false);
    }
  };

  const confirmDownload = () => {
    if (pendingExport && previewData) {
      downloadCSV(previewData.csvContent, pendingExport.fileName);
    }
    setShowPreviewModal(false);
    setPreviewData(null);
    setPendingExport(null);
  };

  const closePreview = () => {
    setShowPreviewModal(false);
    setPreviewData(null);
    setPendingExport(null);
  };

  const unconfirmedAlerts = alerts.filter((a) => !a.confirmed).slice(0, 5);

  return (
    <>
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
              onClick={() => openPreview('monthly')}
              className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>月度报告</span>
            </button>
          </div>

          <div className="relative group">
            <button
              onClick={() => openPreview('compliance')}
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

    {showPreviewModal && (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-blue-500/30">
                <FileText className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">报表预览</h2>
                <p className="text-xs text-slate-400">
                  {pendingExport?.type === 'monthly' ? '月度运营分析报告' : '环保合规明细报告'}
                </p>
              </div>
            </div>
            <button
              onClick={closePreview}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {previewLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-10 h-10 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                <span className="ml-3 text-slate-400">正在生成预览...</span>
              </div>
            ) : previewData?.summary ? (
              <>
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">筛选条件</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">月份</p>
                      <p className="text-sm font-medium text-white">{previewData.summary.month}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">班次</p>
                      <p className="text-sm font-medium text-white">{previewData.summary.filterInfo?.shift}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500 mb-1">日期范围</p>
                      <p className="text-sm font-medium text-white">{previewData.summary.filterInfo?.date}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">记录数量</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.entries(previewData.summary.records || {}).map(([key, val]) => (
                      <div key={key} className="text-center">
                        <p className="text-2xl font-bold font-mono text-blue-400">{String(val)}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {key === 'vehicles' ? '车辆' :
                           key === 'incineratorHistory' ? '焚烧记录' :
                           key === 'workOrders' ? '运维工单' :
                           key === 'flueGasList' ? '烟气检测' :
                           key === 'envAlerts' ? '环保告警' :
                           key === 'leachateList' ? '渗滤液数据' : key}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                  <h3 className="text-sm font-medium text-slate-300 mb-3">关键指标汇总</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {previewData.summary.type === 'monthly' ? (
                      <>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">入场车辆</p>
                          <p className="text-base font-mono font-bold text-white">{previewData.summary.keyMetrics?.vehicleCount || 0} 辆</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">接收垃圾</p>
                          <p className="text-base font-mono font-bold text-white">{formatNumber(previewData.summary.keyMetrics?.wasteWeight || 0, 0)} 吨</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">运维工单</p>
                          <p className="text-base font-mono font-bold text-white">{previewData.summary.keyMetrics?.workOrderCount || 0} 单</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">已完成</p>
                          <p className="text-base font-mono font-bold text-emerald-400">{previewData.summary.keyMetrics?.completedOrders || 0} 单</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">排放合规率</p>
                          <p className={`text-base font-mono font-bold ${
                            parseFloat(previewData.summary.keyMetrics?.complianceRate || 0) >= 99
                              ? 'text-emerald-400'
                              : parseFloat(previewData.summary.keyMetrics?.complianceRate || 0) >= 95
                                ? 'text-amber-400'
                                : 'text-red-400'
                          }`}>
                            {previewData.summary.keyMetrics?.complianceRate || 0}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">超标记录</p>
                          <p className={`text-base font-mono font-bold ${
                            (previewData.summary.keyMetrics?.exceedCount || 0) > 0 ? 'text-red-400' : 'text-emerald-400'
                          }`}>
                            {previewData.summary.keyMetrics?.exceedCount || 0} 条
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">环保告警</p>
                          <p className={`text-base font-mono font-bold ${
                            (previewData.summary.keyMetrics?.envAlerts || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {previewData.summary.keyMetrics?.envAlerts || 0} 条
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">烟气检测</p>
                          <p className="text-base font-mono font-bold text-white">{previewData.summary.keyMetrics?.flueGasTests || 0} 次</p>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">烟气检测次数</p>
                          <p className="text-base font-mono font-bold text-white">{previewData.summary.keyMetrics?.flueGasTests || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">环保合规率</p>
                          <p className={`text-base font-mono font-bold ${
                            parseFloat(previewData.summary.keyMetrics?.complianceRate || 0) >= 99
                              ? 'text-emerald-400'
                              : parseFloat(previewData.summary.keyMetrics?.complianceRate || 0) >= 95
                                ? 'text-amber-400'
                                : 'text-red-400'
                          }`}>
                            {previewData.summary.keyMetrics?.complianceRate || 0}%
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">超标记录</p>
                          <p className={`text-base font-mono font-bold ${
                            (previewData.summary.keyMetrics?.exceedCount || 0) > 0 ? 'text-red-400' : 'text-emerald-400'
                          }`}>
                            {previewData.summary.keyMetrics?.exceedCount || 0} 条
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">环保告警</p>
                          <p className={`text-base font-mono font-bold ${
                            (previewData.summary.envAlertsCount || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {previewData.summary.envAlertsCount || 0} 条
                          </p>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {previewData.summary.exceedRecords?.length > 0 && (
                  <div className="bg-red-500/10 rounded-xl p-4 border border-red-500/30">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <h3 className="text-sm font-medium text-red-400">超标清单（前10条）</h3>
                    </div>
                    <div className="space-y-2">
                      {previewData.summary.exceedRecords.map((r: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs bg-slate-900/50 px-3 py-2 rounded-lg">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] font-medium">{r.type}</span>
                            <span className="text-slate-400">{formatDateTime(r.time)}</span>
                          </div>
                          <span className="font-mono">
                            <span className="text-red-400">{formatNumber(r.value, 1)}</span>
                            <span className="text-slate-500"> / {r.standard} mg/m³</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`rounded-xl p-4 border ${
                  (previewData.summary.keyMetrics?.exceedCount || 0) > 0
                    ? 'bg-amber-500/10 border-amber-500/30'
                    : 'bg-emerald-500/10 border-emerald-500/30'
                }`}>
                  <div className="flex items-start gap-2">
                    {(previewData.summary.keyMetrics?.exceedCount || 0) > 0
                      ? <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                      : <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                    }
                    <div>
                      <h3 className={`text-sm font-medium mb-1 ${
                        (previewData.summary.keyMetrics?.exceedCount || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {previewData.summary.type === 'compliance' ? '环保合规结论' : '运营汇总结论'}
                      </h3>
                      <p className="text-sm text-slate-300">
                        {previewData.summary.conclusion || '数据已生成，可直接下载使用'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-700/50 bg-slate-800/30">
            <button
              onClick={closePreview}
              disabled={previewLoading}
              className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              取消
            </button>
            <button
              onClick={confirmDownload}
              disabled={previewLoading || !previewData}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>确认下载</span>
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
