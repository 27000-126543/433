import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download, RefreshCw, CloudRain, Wind, Thermometer, AlertCircle, CheckCircle, Lock, Unlock, X, FileText } from 'lucide-react';
import { LineChart } from '@/components/charts/LineChart';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useAlert } from '@/context/AlertContext';
import { usePermission } from '@/hooks/usePermission';
import { useFilter } from '@/context/FilterContext';
import { api } from '@/mock/api';
import { formatDateTime, formatNumber } from '@/utils/format';
import { emissionStandards } from '@/mock/data/flueGas';
import { generateComplianceReport, generateMonthlyReport, downloadCSV } from '@/utils/reportGenerator';

export const FlueGasPage: React.FC = () => {
  const { flueGas, isConnected } = useRealtimeData(true);
  const { alerts, addAlert } = useAlert();
  const { hasPermission } = usePermission();
  const { selectedShift, selectedDate } = useFilter();
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [selectedPollutant, setSelectedPollutant] = useState('so2');
  const [chemicals, setChemicals] = useState<any[]>([]);
  const [equipmentLocked, setEquipmentLocked] = useState(false);
  const [lastUploadTime, setLastUploadTime] = useState(new Date());
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rectificationNotice, setRectificationNotice] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [pendingExport, setPendingExport] = useState<{ type: 'monthly' | 'compliance'; fileName: string } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const [history, inventory] = await Promise.all([
        api.getFlueGasHistory(),
        api.getChemicalInventory(),
      ]);
      setHistoryData(history);
      setChemicals(inventory);
    };
    loadData();

    const uploadInterval = setInterval(() => {
      setLastUploadTime(new Date());
    }, 5000);

    return () => clearInterval(uploadInterval);
  }, []);

  const handleOpenReview = () => {
    setShowReviewModal(true);
  };

  const allPollutantsStandard = () => {
    if (!flueGas) return false;
    return (
      flueGas.so2 <= emissionStandards.so2 &&
      flueGas.nox <= emissionStandards.nox &&
      flueGas.dust <= emissionStandards.dust &&
      flueGas.co <= emissionStandards.co &&
      flueGas.hcl <= emissionStandards.hcl
    );
  };

  const handleConfirmUnlock = () => {
    if (!allPollutantsStandard()) {
      alert('当前排放指标仍有超标项，无法解锁设备！请继续处理直至全部达标。');
      return;
    }
    if (confirm('确认所有排放指标均已达标，解锁相关设备？')) {
      setEquipmentLocked(false);
      setRectificationNotice(null);
      setShowReviewModal(false);
      alert('设备已解锁，恢复正常运行');
    }
  };

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

  useEffect(() => {
    if (flueGas && !flueGas.isStandard && !equipmentLocked) {
      setEquipmentLocked(true);
      setRectificationNotice({
        id: `rect-${Date.now()}`,
        title: '烟气排放超标整改通知',
        content: '检测到烟气排放超过国家标准，相关设备已自动锁定。请立即排查原因并采取整改措施，整改完成后申请复核解锁。',
        createTime: new Date().toISOString(),
        status: 'pending',
      });
      addAlert({
        id: `alert-${Date.now()}`,
        type: 'emission',
        level: 'critical',
        message: '烟气排放超标，相关设备已自动锁定，请立即处理并复核',
        source: '烟气净化系统',
        timestamp: new Date().toISOString(),
        confirmed: false,
        escalated: false,
      });
    }
  }, [flueGas, equipmentLocked, addAlert]);

  const pollutants = [
    { key: 'so2', name: 'SO₂', unit: 'mg/m³', color: '#EF4444', standard: emissionStandards.so2 },
    { key: 'nox', name: 'NOx', unit: 'mg/m³', color: '#F59E0B', standard: emissionStandards.nox },
    { key: 'dust', name: '粉尘', unit: 'mg/m³', color: '#8B5CF6', standard: emissionStandards.dust },
    { key: 'co', name: 'CO', unit: 'mg/m³', color: '#3B82F6', standard: emissionStandards.co },
    { key: 'hcl', name: 'HCl', unit: 'mg/m³', color: '#10B981', standard: emissionStandards.hcl },
  ];

  const getCurrentValue = (key: string) => {
    if (!flueGas) return 0;
    return (flueGas as any)[key] || 0;
  };

  const isExceeded = (key: string) => {
    const pollutant = pollutants.find(p => p.key === key);
    if (!pollutant) return false;
    return getCurrentValue(key) > pollutant.standard;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">烟气处理监管</h1>
          <p className="text-sm text-slate-400 mt-1">烟气排放实时监测、净化药剂管理、环保数据上传</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            {isConnected ? '实时监测' : '连接中断'}
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-cyan-500/20 text-cyan-400">
            <RefreshCw className="w-3 h-3 animate-spin" />
            5秒上传
          </span>
          {equipmentLocked && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400 animate-pulse">
              <Lock className="w-3 h-3" />
              设备已锁定
            </span>
          )}
        </div>
      </div>

      {equipmentLocked && rectificationNotice && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <FileText className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-amber-400">{rectificationNotice.title}</p>
                  <StatusBadge status="warning" text="整改中" />
                </div>
                <p className="text-xs text-amber-400/70">{rectificationNotice.content}</p>
                <p className="text-[10px] text-amber-400/50 mt-2">
                  生成时间：{formatDateTime(rectificationNotice.createTime)}
                </p>
              </div>
            </div>
            {hasPermission('rectification:manage') && (
              <button
                onClick={handleOpenReview}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
              >
                <Unlock className="w-4 h-4" />
                复核解锁
              </button>
            )}
          </div>
        </div>
      )}

      {flueGas && !flueGas.isStandard && !equipmentLocked && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
            <div>
              <p className="text-sm font-medium text-red-400">排放超标告警</p>
              <p className="text-xs text-red-400/70 mt-0.5">检测到烟气排放超过国家标准，请及时处理</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">实时排放数据</h3>
          <span className="text-xs text-slate-500">
            最近上传：{formatDateTime(lastUploadTime.toISOString())}
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {pollutants.map((pollutant) => {
            const value = getCurrentValue(pollutant.key);
            const exceeded = isExceeded(pollutant.key);
            const percentage = (value / pollutant.standard) * 100;
            return (
              <div
                key={pollutant.key}
                className={`p-4 rounded-xl transition-all ${
                  exceeded
                    ? 'bg-red-500/10 border border-red-500/30 animate-pulse'
                    : 'bg-slate-900/50 border border-slate-700/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">{pollutant.name}</span>
                  {exceeded ? (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <p className={`text-2xl font-bold font-mono ${
                  exceeded ? 'text-red-400' : 'text-white'
                }`}>
                  {formatNumber(value, 1)}
                  <span className="text-xs text-slate-500 ml-1">{pollutant.unit}</span>
                </p>
                <div className="mt-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500">占标率</span>
                    <span className={exceeded ? 'text-red-400' : 'text-slate-400'}>
                      {Math.round(percentage)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percentage > 100 ? 'bg-red-500' :
                        percentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    标准：{pollutant.standard} {pollutant.unit}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-4">排放趋势分析</h3>
          <div className="flex gap-2 mb-4 flex-wrap">
            {pollutants.map((p) => (
              <button
                key={p.key}
                onClick={() => setSelectedPollutant(p.key)}
                className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                  selectedPollutant === p.key
                    ? 'text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
                style={selectedPollutant === p.key ? { backgroundColor: `${p.color}30`, color: p.color } : {}}
              >
                {p.name}
              </button>
            ))}
          </div>
          <LineChart
            data={historyData}
            series={[
              {
                key: selectedPollutant,
                name: pollutants.find(p => p.key === selectedPollutant)?.name || '',
                color: pollutants.find(p => p.key === selectedPollutant)?.color || '#3B82F6',
              },
            ]}
            yAxisName={pollutants.find(p => p.key === selectedPollutant)?.unit || 'mg/m³'}
            height={300}
            markLines={[
              {
                yAxis: pollutants.find(p => p.key === selectedPollutant)?.standard || 100,
                label: '排放标准',
                color: '#EF4444',
              },
            ]}
          />
        </div>

        <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-4">净化系统状态</h3>
          <div className="space-y-4">
            <div>
              <GaugeChart
                value={flueGas?.isStandard ? 98.5 : 75}
                max={100}
                title="净化效率"
                unit="%"
                warningThreshold={85}
                dangerThreshold={70}
                height={160}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CloudRain className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-slate-400">喷淋系统</span>
                </div>
                <StatusBadge status="normal" text="运行正常" />
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Wind className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-400">活性炭喷射</span>
                </div>
                <StatusBadge status="normal" text="运行正常" />
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Thermometer className="w-4 h-4 text-orange-400" />
                  <span className="text-xs text-slate-400">脱硝系统</span>
                </div>
                <StatusBadge status="normal" text="运行正常" />
              </div>
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <AlertCircle className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-slate-400">布袋除尘</span>
                </div>
                <StatusBadge status="warning" text="压差偏高" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">净化药剂库存</h3>
            <button
              onClick={() => openPreview('compliance')}
              className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-3 h-3" />
              导出明细
            </button>
          </div>
          <div className="space-y-3">
            {chemicals.map((chemical) => {
              const percentage = (chemical.currentStock / chemical.safeStock) * 100;
              return (
                <div key={chemical.id} className="p-3 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{chemical.name}</span>
                      <StatusBadge
                        status={chemical.status}
                        text={chemical.status === 'normal' ? '库存正常' : chemical.status === 'low' ? '库存偏低' : '库存危急'}
                      />
                    </div>
                    <span className="text-sm font-mono text-white">
                      {chemical.currentStock} {chemical.unit}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percentage > 100 ? 'bg-emerald-500' :
                        percentage > 50 ? 'bg-amber-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>安全库存：{chemical.safeStock} {chemical.unit}</span>
                    <span>消耗速率：{chemical.consumptionRate} {chemical.unit}/天</span>
                  </div>
                  {chemical.status !== 'normal' && (
                    <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      预计可用 {Math.round(chemical.currentStock / chemical.consumptionRate)} 天，建议采购
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-4">环保数据上传</h3>
          <div className="space-y-4">
            <div className="p-4 bg-slate-900/50 rounded-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">监管平台连接</span>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  已连接
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-500">上传频率</p>
                  <p className="text-sm font-mono text-white">5秒/次</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">今日上传</p>
                  <p className="text-sm font-mono text-white">17,280 次</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">成功率</p>
                  <p className="text-sm font-mono text-emerald-400">99.98%</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">本月达标率</p>
                  <p className="text-sm font-mono text-emerald-400">98.5%</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-900/50 rounded-xl">
              <p className="text-sm text-slate-400 mb-3">快速操作</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => openPreview('compliance')}
                  className="p-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm"
                >
                  <Download className="w-4 h-4 mx-auto mb-1" />
                  环保合规明细
                </button>
                <button
                  onClick={() => openPreview('monthly')}
                  className="p-3 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg transition-colors text-sm"
                >
                  <Download className="w-4 h-4 mx-auto mb-1" />
                  月度运营报告
                </button>
              </div>
            </div>

            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-400 font-medium">整改通知</p>
                  <p className="text-xs text-amber-400/70 mt-1">
                    本月共有 2 次超标记录，需在 3 个工作日内提交整改报告至环保监管部门。
                  </p>
                  <button className="mt-2 text-xs text-amber-400 hover:text-amber-300 underline">
                    查看整改详情 →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
                    <div className="grid grid-cols-2 gap-3">
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

                  {previewData.summary.type === 'compliance' && previewData.summary.exceedRecords?.length > 0 && (
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
                    previewData.summary.type === 'compliance'
                      ? (previewData.summary.keyMetrics?.exceedCount || 0) > 0
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : 'bg-emerald-500/10 border-emerald-500/30'
                      : 'bg-blue-500/10 border-blue-500/30'
                  }`}>
                    <div className="flex items-start gap-2">
                      {previewData.summary.type === 'compliance' ? (
                        (previewData.summary.keyMetrics?.exceedCount || 0) > 0
                          ? <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                          : <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      ) : <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />}
                      <div>
                        <h3 className={`text-sm font-medium mb-1 ${
                          previewData.summary.type === 'compliance'
                            ? (previewData.summary.keyMetrics?.exceedCount || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
                            : 'text-blue-400'
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

      {showReviewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">排放复核解锁</h3>
              <button
                onClick={() => setShowReviewModal(false)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-400 mb-2">复核说明</p>
                <p className="text-xs text-slate-500">
                  请确认所有烟气排放指标均已达标后，方可解锁设备。如仍有超标项，设备将继续锁定，整改通知继续有效。
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-400">实时排放指标复核</p>
                {pollutants.map((pollutant) => {
                  const value = getCurrentValue(pollutant.key);
                  const exceeded = isExceeded(pollutant.key);
                  return (
                    <div
                      key={pollutant.key}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        exceeded ? 'bg-red-500/10 border border-red-500/30' : 'bg-emerald-500/10 border border-emerald-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {exceeded ? (
                          <AlertCircle className="w-4 h-4 text-red-400" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-emerald-400" />
                        )}
                        <span className={exceeded ? 'text-red-400' : 'text-emerald-400'}>
                          {pollutant.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className={`font-mono font-medium ${exceeded ? 'text-red-400' : 'text-white'}`}>
                          {formatNumber(value, 1)}
                          <span className="text-xs text-slate-500 ml-1">{pollutant.unit}</span>
                        </p>
                        <p className="text-[10px] text-slate-500">
                          标准：{pollutant.standard} {pollutant.unit}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={`p-3 rounded-lg ${
                allPollutantsStandard() 
                  ? 'bg-emerald-500/10 border border-emerald-500/30' 
                  : 'bg-red-500/10 border border-red-500/30'
              }`}>
                <div className="flex items-center gap-2">
                  {allPollutantsStandard() ? (
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-400" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${
                      allPollutantsStandard() ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {allPollutantsStandard() ? '全部达标，可以解锁' : '仍有超标项，暂不可解锁'}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {allPollutantsStandard() 
                        ? '所有排放指标均符合国家标准，可解除设备锁定' 
                        : '请继续整改直至所有指标达标后再申请复核'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirmUnlock}
                disabled={!allPollutantsStandard()}
                className={`flex-1 py-2 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                  allPollutantsStandard()
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                    : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Unlock className="w-4 h-4" />
                确认解锁
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
