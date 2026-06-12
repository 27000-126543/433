import React, { useState, useEffect } from 'react';
import { AlertTriangle, Settings, TrendingUp, Droplets, Gauge, Recycle, Zap, Activity, RefreshCw, Bell } from 'lucide-react';
import { LineChart } from '@/components/charts/LineChart';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { useAlert } from '@/context/AlertContext';
import { usePermission } from '@/hooks/usePermission';
import { api } from '@/mock/api';
import { formatDateTime, formatNumber } from '@/utils/format';
import { leachateStandards } from '@/mock/data/slagLeachate';

export const SlagLeachatePage: React.FC = () => {
  const { slag, leachate, isConnected } = useRealtimeData(true);
  const { addAlert } = useAlert();
  const { hasPermission } = usePermission();
  const [slagHistory, setSlagHistory] = useState<any[]>([]);
  const [leachateHistory, setLeachateHistory] = useState<any[]>([]);
  const [sortingParam, setSortingParam] = useState(50);
  const [activeTab, setActiveTab] = useState<'slag' | 'leachate'>('slag');

  useEffect(() => {
    const loadData = async () => {
      const [slagData, leachateData] = await Promise.all([
        api.getSlagHistory(),
        api.getLeachateHistory(),
      ]);
      setSlagHistory(slagData);
      setLeachateHistory(leachateData);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (leachate && leachate.backupProcessActive) {
      addAlert({
        id: `alert-leach-${Date.now()}`,
        type: 'equipment',
        level: 'warning',
        message: '渗滤液处理系统异常，已自动启动备用工艺',
        source: '渗滤液处理系统',
        timestamp: new Date().toISOString(),
        confirmed: false,
        escalated: false,
      });
    }
  }, [leachate?.backupProcessActive, addAlert]);

  const handleAdjustSortingParam = (delta: number) => {
    const newValue = Math.max(0, Math.min(100, sortingParam + delta));
    setSortingParam(newValue);
    alert(`分选参数已调整为 ${newValue}%`);
  };

  const handleAutoAdjust = () => {
    if (slag) {
      const metalContent = slag.metalContent;
      const newParam = Math.round(metalContent * 15);
      setSortingParam(Math.min(100, Math.max(30, newParam)));
      alert(`已根据金属含量自动调整分选参数至 ${Math.min(100, Math.max(30, newParam))}%`);
    }
  };

  const handleNotifyOperator = () => {
    alert('已通知渗滤液处理员前往现场处理');
  };

  const slagIndicators = [
    { label: '总炉渣量', value: slag?.totalSlag || 0, unit: 't/h', color: 'text-orange-400', icon: <Recycle className="w-4 h-4" /> },
    { label: '金属含量', value: slag?.metalContent || 0, unit: '%', color: 'text-amber-400', icon: <Zap className="w-4 h-4" />, decimals: 2 },
    { label: '金属回收率', value: slag?.metalRecovery || 0, unit: '%', color: 'text-emerald-400', icon: <TrendingUp className="w-4 h-4" />, decimals: 1 },
    { label: '分选效率', value: slag?.sortingEfficiency || 0, unit: '%', color: 'text-blue-400', icon: <Activity className="w-4 h-4" />, decimals: 1 },
  ];

  const leachateIndicators = [
    { label: '进水液位', value: leachate?.inletLevel || 0, unit: '%', color: 'text-blue-400', icon: <Droplets className="w-4 h-4" />, decimals: 0 },
    { label: '出水液位', value: leachate?.outletLevel || 0, unit: '%', color: 'text-cyan-400', icon: <Droplets className="w-4 h-4" />, decimals: 0 },
    { label: '处理速率', value: leachate?.treatmentRate || 0, unit: 't/h', color: 'text-emerald-400', icon: <Gauge className="w-4 h-4" />, decimals: 0 },
    { label: 'pH值', value: leachate?.ph || 0, unit: '', color: 'text-purple-400', icon: <Activity className="w-4 h-4" />, decimals: 1 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">炉渣渗滤液处置</h1>
          <p className="text-sm text-slate-400 mt-1">炉渣分选、金属回收、渗滤液处理系统监控</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            {isConnected ? '实时监测' : '连接中断'}
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('slag')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'slag'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-800/50 text-slate-400 hover:text-white'
          }`}
        >
          <Recycle className="w-4 h-4 inline mr-2" />
          炉渣分选系统
        </button>
        <button
          onClick={() => setActiveTab('leachate')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'leachate'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-800/50 text-slate-400 hover:text-white'
          }`}
        >
          <Droplets className="w-4 h-4 inline mr-2" />
          渗滤液处理系统
        </button>
      </div>

      {activeTab === 'slag' ? (
        <>
          {slag && slag.metalContent > 4.5 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-amber-400">金属含量偏高</p>
                    <p className="text-xs text-amber-400/70 mt-0.5">检测到炉渣金属含量较高，建议调高分选强度</p>
                  </div>
                </div>
                <button
                  onClick={handleAutoAdjust}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg transition-colors"
                >
                  自动调整参数
                </button>
              </div>
            </div>
          )}

          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-base font-semibold text-white mb-4">炉渣分选实时数据</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {slagIndicators.map((indicator, index) => (
                <div key={index} className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={indicator.color}>{indicator.icon}</span>
                    <span className="text-sm text-slate-400">{indicator.label}</span>
                  </div>
                  <p className={`text-2xl font-bold font-mono ${indicator.color}`}>
                    {formatNumber(indicator.value, indicator.decimals || 0)}
                    <span className="text-sm text-slate-500 ml-1">{indicator.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-base font-semibold text-white mb-4">24小时炉渣处理趋势</h3>
              <LineChart
                data={slagHistory}
                series={[
                  { key: 'totalSlag', name: '炉渣产量', color: '#F97316' },
                  { key: 'sortingEfficiency', name: '分选效率', color: '#3B82F6' },
                ]}
                yAxisName="t/h / %"
                height={300}
              />
            </div>

            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-base font-semibold text-white mb-4">分选参数控制</h3>
              <div className="mb-6">
                <GaugeChart
                  value={sortingParam}
                  max={100}
                  title="分选强度"
                  unit="%"
                  warningThreshold={70}
                  dangerThreshold={85}
                  height={180}
                />
              </div>
              
              {hasPermission('incinerator:control') && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">当前参数</span>
                    <span className="text-lg font-bold font-mono text-blue-400">{sortingParam}%</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAdjustSortingParam(-5)}
                      className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                    >
                      -5%
                    </button>
                    <button
                      onClick={() => handleAdjustSortingParam(5)}
                      className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                    >
                      +5%
                    </button>
                  </div>
                  <button
                    onClick={handleAutoAdjust}
                    className="w-full py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    智能调节
                  </button>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-slate-700/50">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-slate-400">金属回收库存</span>
                  <span className="text-white font-mono">{slag?.stockQuantity?.toFixed(0) || 0} 吨</span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all"
                    style={{ width: `${Math.min(((slag?.stockQuantity || 0) / 300) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">库容使用率 {Math.round(((slag?.stockQuantity || 0) / 300) * 100)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-base font-semibold text-white mb-4">分选系统状态</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">破碎机</span>
                  <StatusBadge status="normal" text="运行正常" />
                </div>
                <p className="text-lg font-mono text-white">2.4 <span className="text-xs text-slate-500">MW</span></p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">磁选机</span>
                  <StatusBadge status="normal" text="运行正常" />
                </div>
                <p className="text-lg font-mono text-white">98.5 <span className="text-xs text-slate-500">%</span></p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">风选机</span>
                  <StatusBadge status="warning" text="需维护" />
                </div>
                <p className="text-lg font-mono text-white">1.2 <span className="text-xs text-slate-500">MW</span></p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">输送机</span>
                  <StatusBadge status="normal" text="运行正常" />
                </div>
                <p className="text-lg font-mono text-white">45 <span className="text-xs text-slate-500">Hz</span></p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          {leachate && !leachate.isStandard && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                  <div>
                    <p className="text-sm font-medium text-red-400">出水指标异常</p>
                    <p className="text-xs text-red-400/70 mt-0.5">
                      检测到渗滤液出水指标超标，已自动启动备用处理工艺
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleNotifyOperator}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  通知处理员
                </button>
              </div>
            </div>
          )}

          {leachate?.backupProcessActive && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-amber-400 animate-spin" />
                <div>
                  <p className="text-sm font-medium text-amber-400">备用工艺运行中</p>
                  <p className="text-xs text-amber-400/70 mt-0.5">主处理工艺维护中，备用工艺已接管，处理效率约80%</p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-base font-semibold text-white mb-4">渗滤液处理实时数据</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {leachateIndicators.map((indicator, index) => (
                <div key={index} className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={indicator.color}>{indicator.icon}</span>
                    <span className="text-sm text-slate-400">{indicator.label}</span>
                  </div>
                  <p className={`text-2xl font-bold font-mono ${indicator.color}`}>
                    {formatNumber(indicator.value, indicator.decimals || 0)}
                    <span className="text-sm text-slate-500 ml-1">{indicator.unit}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-base font-semibold text-white mb-4">出水指标趋势</h3>
              <div className="flex gap-2 mb-4">
                <button className="px-3 py-1.5 bg-red-500/20 text-red-400 text-sm rounded-lg">COD</button>
                <button className="px-3 py-1.5 text-slate-400 hover:text-white text-sm rounded-lg">氨氮</button>
                <button className="px-3 py-1.5 text-slate-400 hover:text-white text-sm rounded-lg">pH</button>
              </div>
              <LineChart
                data={leachateHistory}
                series={[
                  { key: 'cod', name: 'COD', color: '#EF4444' },
                ]}
                yAxisName="mg/L"
                height={300}
                markLines={[
                  { yAxis: leachateStandards.cod, label: '排放标准', color: '#EF4444' },
                ]}
              />
            </div>

            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-base font-semibold text-white mb-4">水质指标详情</h3>
              <div className="space-y-4">
                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">COD</span>
                    <span className={`text-sm font-mono ${
                      (leachate?.cod || 0) > leachateStandards.cod ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {leachate?.cod?.toFixed(0) || 0} mg/L
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (leachate?.cod || 0) > leachateStandards.cod ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(((leachate?.cod || 0) / leachateStandards.cod) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">标准：≤ {leachateStandards.cod} mg/L</p>
                </div>

                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">氨氮</span>
                    <span className={`text-sm font-mono ${
                      (leachate?.nh3n || 0) > leachateStandards.nh3n ? 'text-red-400' : 'text-emerald-400'
                    }`}>
                      {leachate?.nh3n?.toFixed(1) || 0} mg/L
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        (leachate?.nh3n || 0) > leachateStandards.nh3n ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(((leachate?.nh3n || 0) / leachateStandards.nh3n) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">标准：≤ {leachateStandards.nh3n} mg/L</p>
                </div>

                <div className="p-3 bg-slate-900/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-slate-400">pH值</span>
                    <span className="text-sm font-mono text-purple-400">
                      {leachate?.ph?.toFixed(1) || 0}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${Math.min(((leachate?.ph || 0) / 10) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">标准：{leachateStandards.phMin} - {leachateStandards.phMax}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
            <h3 className="text-base font-semibold text-white mb-4">处理工艺状态</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">调节池</span>
                  <StatusBadge status={leachate?.backupProcessActive ? 'warning' : 'normal'} text={leachate?.backupProcessActive ? '检修中' : '运行正常'} />
                </div>
                <p className="text-lg font-mono text-white">75 <span className="text-xs text-slate-500">%</span></p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">厌氧罐</span>
                  <StatusBadge status={leachate?.backupProcessActive ? 'normal' : 'warning'} text={leachate?.backupProcessActive ? '运行正常' : '检修中'} />
                </div>
                <p className="text-lg font-mono text-white">35 <span className="text-xs text-slate-500">°C</span></p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">MBR膜</span>
                  <StatusBadge status="normal" text="运行正常" />
                </div>
                <p className="text-lg font-mono text-white">-0.8 <span className="text-xs text-slate-500">Bar</span></p>
              </div>
              <div className="p-4 bg-slate-900/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-400">反渗透</span>
                  <StatusBadge status="normal" text="运行正常" />
                </div>
                <p className="text-lg font-mono text-white">75 <span className="text-xs text-slate-500">%</span></p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
