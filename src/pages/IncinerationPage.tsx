import React, { useState, useEffect } from 'react';
import { AlertTriangle, Settings, Zap, Activity, Thermometer, Gauge, Wind } from 'lucide-react';
import { LineChart } from '@/components/charts/LineChart';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { api } from '@/mock/api';
import { useAlert } from '@/context/AlertContext';
import { formatDateTime, formatNumber } from '@/utils/format';
import { usePermission } from '@/hooks/usePermission';

export const IncinerationPage: React.FC = () => {
  const { incinerators, flueGas, isConnected } = useRealtimeData(true);
  const { alerts, criticalCount } = useAlert();
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [powerData, setPowerData] = useState<{ hours: string[]; actual: number[]; target: number[] }>({ hours: [], actual: [], target: [] });
  const [selectedFurnace, setSelectedFurnace] = useState(0);
  const [loadTarget, setLoadTarget] = useState(80);
  const { hasPermission } = usePermission();

  useEffect(() => {
    const loadData = async () => {
      const [history, power] = await Promise.all([
        api.getIncineratorHistory(),
        api.getPowerGeneration(),
      ]);
      setHistoryData(history);
      setPowerData(power);
    };
    loadData();
  }, []);

  const handleEmergencyStop = (furnaceId: string) => {
    if (confirm('确定要执行紧急停炉操作吗？')) {
      alert(`已触发 ${furnaceId} 紧急停炉程序`);
    }
  };

  const handleLoadAdjust = (delta: number) => {
    const newTarget = Math.max(50, Math.min(100, loadTarget + delta));
    setLoadTarget(newTarget);
    alert(`已将发电负荷目标调整为 ${newTarget}%`);
  };

  const unconfirmedCriticalAlerts = alerts.filter((a) => !a.confirmed && a.level === 'critical').slice(0, 3);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">焚烧发电监控</h1>
          <p className="text-sm text-slate-400 mt-1">焚烧炉运行状态、发电负荷实时监控</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            {isConnected ? '实时数据' : '连接中断'}
          </span>
          {criticalCount > 0 && (
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-400 animate-pulse">
              <AlertTriangle className="w-3 h-3" />
              {criticalCount} 条严重告警
            </span>
          )}
        </div>
      </div>

      {unconfirmedCriticalAlerts.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
            <span className="text-sm font-medium text-red-400">待处理严重告警</span>
          </div>
          <div className="space-y-2">
            {unconfirmedCriticalAlerts.map((alert) => (
              <div key={alert.id} className="flex items-center justify-between p-3 bg-red-500/5 rounded-lg">
                <div>
                  <p className="text-sm text-red-300">{alert.message}</p>
                  <p className="text-xs text-red-400/70 mt-0.5">{alert.source} · {formatDateTime(alert.timestamp)}</p>
                </div>
                <button
                  onClick={() => {}}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-colors"
                >
                  立即处理
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {incinerators.map((inc, index) => (
          <div
            key={inc.id}
            className={`bg-slate-800/30 backdrop-blur border rounded-xl p-5 transition-all cursor-pointer ${
              selectedFurnace === index
                ? 'border-blue-500/50 ring-2 ring-blue-500/20'
                : 'border-slate-700/50 hover:border-slate-600'
            } ${inc.status === 'alarm' ? 'animate-pulse' : ''}`}
            onClick={() => setSelectedFurnace(index)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${
                  inc.status === 'normal' ? 'bg-emerald-500/20' :
                  inc.status === 'warning' ? 'bg-amber-500/20' : 'bg-red-500/20'
                }`}>
                  <Thermometer className={`w-5 h-5 ${
                    inc.status === 'normal' ? 'text-emerald-400' :
                    inc.status === 'warning' ? 'text-amber-400' : 'text-red-400'
                  }`} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{inc.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    inc.status === 'normal' ? 'bg-emerald-500/20 text-emerald-400' :
                    inc.status === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {inc.status === 'normal' ? '运行正常' : inc.status === 'warning' ? '预警' : '告警'}
                  </span>
                </div>
              </div>
              {hasPermission('incinerator:control') && inc.status === 'alarm' && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEmergencyStop(inc.name);
                  }}
                  className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-xs rounded-lg transition-colors"
                >
                  紧急停炉
                </button>
              )}
            </div>

            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                <p className="text-lg font-bold font-mono text-orange-400">{Math.round(inc.temperature)}</p>
                <p className="text-[10px] text-slate-500">温度 °C</p>
              </div>
              <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                <p className="text-lg font-bold font-mono text-blue-400">{inc.pressure.toFixed(2)}</p>
                <p className="text-[10px] text-slate-500">压力 MPa</p>
              </div>
              <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                <p className="text-lg font-bold font-mono text-emerald-400">{inc.oxygenContent.toFixed(1)}</p>
                <p className="text-[10px] text-slate-500">含氧量 %</p>
              </div>
              <div className="text-center p-2 bg-slate-900/50 rounded-lg">
                <p className="text-lg font-bold font-mono text-purple-400">{Math.round(inc.load)}</p>
                <p className="text-[10px] text-slate-500">负荷 %</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg">
                <Activity className="w-4 h-4 text-cyan-400" />
                <div>
                  <p className="text-xs text-slate-500">蒸汽流量</p>
                  <p className="text-sm font-mono text-cyan-400">{inc.steamFlow.toFixed(1)} t/h</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg">
                <Zap className="w-4 h-4 text-amber-400" />
                <div>
                  <p className="text-xs text-slate-500">发电量</p>
                  <p className="text-sm font-mono text-amber-400">{formatNumber(inc.powerGeneration / 1000, 1)} MW</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-4">温度压力趋势</h3>
          <div className="flex gap-4 mb-4">
            <button className="px-3 py-1.5 bg-blue-500/20 text-blue-400 text-sm rounded-lg">温度</button>
            <button className="px-3 py-1.5 text-slate-400 hover:text-white text-sm rounded-lg transition-colors">压力</button>
            <button className="px-3 py-1.5 text-slate-400 hover:text-white text-sm rounded-lg transition-colors">负荷</button>
          </div>
          <LineChart
            data={historyData}
            series={[
              { key: `temp${selectedFurnace + 1}`, name: `${incinerators[selectedFurnace]?.name || '1号炉'}温度`, color: '#EF4444' },
            ]}
            yAxisName="°C"
            height={300}
            markLines={[
              { yAxis: 1000, label: '上限 1000°C', color: '#EF4444' },
              { yAxis: 850, label: '基准 850°C', color: '#10B981' },
            ]}
          />
        </div>

        <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-4">发电负荷控制</h3>
          <GaugeChart
            value={incinerators[selectedFurnace]?.load || 75}
            max={100}
            title="当前负荷"
            unit="%"
            warningThreshold={85}
            dangerThreshold={95}
            height={180}
          />
          
          {hasPermission('incinerator:control') && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">目标负荷</span>
                <span className="text-lg font-bold font-mono text-blue-400">{loadTarget}%</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleLoadAdjust(-5)}
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                >
                  -5%
                </button>
                <button
                  onClick={() => handleLoadAdjust(5)}
                  className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
                >
                  +5%
                </button>
              </div>
              <button className="w-full mt-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                <Settings className="w-4 h-4" />
                应用调节指令
              </button>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-slate-700/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">电网调度指令</span>
              <span className="text-emerald-400 font-medium">{loadTarget}% 负荷</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-slate-400">当前发电量</span>
              <span className="text-white font-mono">{formatNumber(incinerators.reduce((s, i) => s + i.powerGeneration, 0) / 1000, 1)} MW</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-slate-400">超额预警</span>
              <span className="text-emerald-400">正常范围</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-base font-semibold text-white mb-4">24小时发电量</h3>
        <div className="grid grid-cols-3 gap-6 mb-4">
          <div className="p-4 bg-slate-900/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-amber-400" />
              <span className="text-sm text-slate-400">今日累计发电</span>
            </div>
            <p className="text-3xl font-bold font-mono text-white">
              {formatNumber(powerData.actual.reduce((a, b) => a + b, 0) / 1000, 1)}
              <span className="text-lg text-slate-400 ml-1">MWh</span>
            </p>
          </div>
          <div className="p-4 bg-slate-900/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Gauge className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-slate-400">目标发电量</span>
            </div>
            <p className="text-3xl font-bold font-mono text-blue-400">
              {formatNumber(powerData.target.reduce((a, b) => a + b, 0) / 1000, 1)}
              <span className="text-lg text-slate-400 ml-1">MWh</span>
            </p>
          </div>
          <div className="p-4 bg-slate-900/50 rounded-xl">
            <div className="flex items-center gap-2 mb-2">
              <Wind className="w-5 h-5 text-emerald-400" />
              <span className="text-sm text-slate-400">完成率</span>
            </div>
            <p className="text-3xl font-bold font-mono text-emerald-400">
              {Math.round((powerData.actual.reduce((a, b) => a + b, 0) / powerData.target.reduce((a, b) => a + b, 0)) * 100)}
              <span className="text-lg text-slate-400 ml-1">%</span>
            </p>
          </div>
        </div>
        <LineChart
          data={powerData.hours.map((h, i) => ({
            time: h,
            actual: powerData.actual[i],
            target: powerData.target[i],
          }))}
          series={[
            { key: 'actual', name: '实际发电量', color: '#0EA5E9' },
            { key: 'target', name: '目标发电量', color: '#F59E0B' },
          ]}
          yAxisName="kWh"
          height={250}
        />
      </div>
    </div>
  );
};
