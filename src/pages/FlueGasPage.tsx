import React, { useState, useEffect } from 'react';
import { AlertTriangle, Download, RefreshCw, CloudRain, Wind, Thermometer, AlertCircle, CheckCircle, Lock, Unlock } from 'lucide-react';
import { LineChart } from '@/components/charts/LineChart';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useAlert } from '@/context/AlertContext';
import { usePermission } from '@/hooks/usePermission';
import { api } from '@/mock/api';
import { formatDateTime, formatNumber } from '@/utils/format';
import { emissionStandards } from '@/mock/data/flueGas';

export const FlueGasPage: React.FC = () => {
  const { flueGas, isConnected } = useRealtimeData(true);
  const { alerts, addAlert } = useAlert();
  const { hasPermission } = usePermission();
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [selectedPollutant, setSelectedPollutant] = useState('so2');
  const [chemicals, setChemicals] = useState<any[]>([]);
  const [equipmentLocked, setEquipmentLocked] = useState(false);
  const [lastUploadTime, setLastUploadTime] = useState(new Date());

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

  useEffect(() => {
    if (flueGas && !flueGas.isStandard && !equipmentLocked) {
      setEquipmentLocked(true);
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

  const handleUnlockEquipment = () => {
    if (confirm('确认排放已达标，要解锁相关设备吗？')) {
      setEquipmentLocked(false);
      alert('设备已解锁，恢复正常运行');
    }
  };

  const handleExport = async (type: 'monthly' | 'compliance') => {
    const result = await api.exportReport(type, { period: '2025-01' });
    alert(`已生成${type === 'monthly' ? '月度运营分析报告' : '环保合规明细'}，时间：${result.generatedAt}`);
  };

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

      {flueGas && !flueGas.isStandard && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
              <div>
                <p className="text-sm font-medium text-red-400">排放超标告警</p>
                <p className="text-xs text-red-400/70 mt-0.5">检测到烟气排放超过国家标准，已自动启动应急程序并锁定相关设备</p>
              </div>
            </div>
            {hasPermission('rectification:manage') && equipmentLocked && (
              <button
                onClick={handleUnlockEquipment}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
              >
                <Unlock className="w-4 h-4" />
                复核解锁
              </button>
            )}
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
              onClick={() => handleExport('compliance')}
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
                  onClick={() => handleExport('compliance')}
                  className="p-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm"
                >
                  <Download className="w-4 h-4 mx-auto mb-1" />
                  环保合规明细
                </button>
                <button
                  onClick={() => handleExport('monthly')}
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
    </div>
  );
};
