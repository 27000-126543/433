import React, { useState, useEffect } from 'react';
import {
  Flame,
  Zap,
  Wind,
  Wrench,
  Truck,
  Package,
  Activity,
  Leaf,
} from 'lucide-react';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { AlertMarquee } from '@/components/dashboard/AlertMarquee';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { GaugeChart } from '@/components/charts/GaugeChart';
import { useAlert } from '@/context/AlertContext';
import { useRealtimeData } from '@/hooks/useRealtimeData';
import { api } from '@/mock/api';
import { DashboardData } from '@/types';
import { formatNumber } from '@/utils/format';
import { emissionStandards } from '@/mock/data/flueGas';

export const DashboardPage: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [incineratorHistory, setIncineratorHistory] = useState<any[]>([]);
  const [flueGasHistory, setFlueGasHistory] = useState<any[]>([]);
  const [powerData, setPowerData] = useState<{ hours: string[]; actual: number[]; target: number[] }>({ hours: [], actual: [], target: [] });
  const [chemicalData, setChemicalData] = useState<{ days: string[]; lime: number[]; activatedCarbon: number[] }>({ days: [], lime: [], activatedCarbon: [] });
  const [loading, setLoading] = useState(true);
  const { alerts } = useAlert();
  const { incinerators, flueGas, isConnected } = useRealtimeData(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dashboard, history, flueGasHist, power, chemical] = await Promise.all([
          api.getDashboardData(),
          api.getIncineratorHistory(),
          api.getFlueGasHistory(),
          api.getPowerGeneration(),
          api.getChemicalConsumption(),
        ]);
        setDashboardData(dashboard);
        setIncineratorHistory(history);
        setFlueGasHistory(flueGasHist);
        setPowerData(power);
        setChemicalData(chemical);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-120px)]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">加载数据中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">运营总览</h1>
          <p className="text-sm text-slate-400 mt-1">实时监控全厂运营状态</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
            {isConnected ? '实时连接' : '连接断开'}
          </span>
        </div>
      </div>

      <AlertMarquee alerts={alerts} />

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <MetricCard
          title="焚烧线负荷"
          value={dashboardData.incineratorLoad}
          unit="%"
          icon={Flame}
          color="amber"
          delay={100}
        />
        <MetricCard
          title="总发电量"
          value={formatNumber(dashboardData.totalPowerGeneration / 1000, 1)}
          unit="MW"
          icon={Zap}
          color="blue"
          delay={200}
          trend={{ value: 5.2, isUp: true }}
        />
        <MetricCard
          title="排放达标率"
          value={dashboardData.emissionComplianceRate}
          unit="%"
          icon={Leaf}
          color="green"
          delay={300}
        />
        <MetricCard
          title="设备完好率"
          value={dashboardData.equipmentAvailability}
          unit="%"
          icon={Wrench}
          color="purple"
          delay={400}
        />
        <MetricCard
          title="今日入场车辆"
          value={dashboardData.todayVehicles}
          unit="辆"
          icon={Truck}
          color="cyan"
          delay={500}
        />
        <MetricCard
          title="今日接收垃圾"
          value={dashboardData.todayWasteWeight}
          unit="吨"
          icon={Package}
          color="amber"
          delay={600}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">焚烧炉温度趋势</h3>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Activity className="w-4 h-4" />
              最近5分钟
            </div>
          </div>
          <LineChart
            data={incineratorHistory}
            series={[
              { key: 'temp1', name: '1号炉温度', color: '#EF4444' },
              { key: 'temp2', name: '2号炉温度', color: '#F59E0B' },
              { key: 'temp3', name: '3号炉温度', color: '#10B981' },
            ]}
            yAxisName="°C"
            height={280}
            markLines={[
              { yAxis: 1000, label: '上限 1000°C', color: '#EF4444' },
              { yAxis: 850, label: '基准 850°C', color: '#10B981' },
            ]}
          />
        </div>

        <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-4">焚烧炉运行状态</h3>
          <div className="space-y-4">
            {incinerators.map((inc, index) => (
              <div key={inc.id} className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/30">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-white">{inc.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    inc.status === 'normal' ? 'bg-emerald-500/20 text-emerald-400' :
                    inc.status === 'warning' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-red-500/20 text-red-400 animate-pulse'
                  }`}>
                    {inc.status === 'normal' ? '正常' : inc.status === 'warning' ? '警告' : '告警'}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold font-mono text-orange-400">{Math.round(inc.temperature)}</p>
                    <p className="text-[10px] text-slate-500">温度 °C</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold font-mono text-blue-400">{inc.pressure.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-500">压力 MPa</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold font-mono text-emerald-400">{Math.round(inc.load)}</p>
                    <p className="text-[10px] text-slate-500">负荷 %</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-4">烟气排放趋势</h3>
          <LineChart
            data={flueGasHistory}
            series={[
              { key: 'so2', name: 'SO2', color: '#10B981' },
              { key: 'nox', name: 'NOx', color: '#F59E0B' },
              { key: 'dust', name: '粉尘', color: '#0EA5E9' },
            ]}
            yAxisName="mg/m³"
            height={280}
            markLines={[
              { yAxis: emissionStandards.so2, label: 'SO2限值', color: '#10B981' },
            ]}
          />
        </div>

        <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-4">发电量对比</h3>
          <BarChart
            xData={powerData.hours}
            series={[
              { name: '实际发电量', data: powerData.actual, color: '#0EA5E9' },
              { name: '目标发电量', data: powerData.target, color: '#F59E0B', type: 'line' },
            ]}
            yAxisName="kWh"
            height={280}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-2">1号焚烧炉负荷</h3>
          <GaugeChart
            value={incinerators[0]?.load || dashboardData.incineratorLoad}
            max={100}
            title="负荷率"
            unit="%"
            warningThreshold={85}
            dangerThreshold={95}
            height={200}
          />
        </div>

        <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-2">烟气达标率</h3>
          <GaugeChart
            value={dashboardData.emissionComplianceRate}
            max={100}
            title="达标率"
            unit="%"
            warningThreshold={95}
            dangerThreshold={90}
            height={200}
          />
        </div>

        <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-2">设备完好率</h3>
          <GaugeChart
            value={dashboardData.equipmentAvailability}
            max={100}
            title="完好率"
            unit="%"
            warningThreshold={90}
            dangerThreshold={85}
            height={200}
          />
        </div>
      </div>

      <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-base font-semibold text-white mb-4">药剂消耗趋势</h3>
        <LineChart
          data={chemicalData.days.map((day, idx) => ({
            time: day,
            lime: chemicalData.lime[idx],
            carbon: chemicalData.activatedCarbon[idx],
          }))}
          series={[
            { key: 'lime', name: '石灰', color: '#0EA5E9' },
            { key: 'carbon', name: '活性炭', color: '#10B981' },
          ]}
          yAxisName="吨/日"
          height={250}
        />
      </div>

      {flueGas && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'SO₂', value: flueGas.so2, unit: 'mg/m³', max: emissionStandards.so2, color: 'emerald' },
            { label: 'NOx', value: flueGas.nox, unit: 'mg/m³', max: emissionStandards.nox, color: 'amber' },
            { label: '粉尘', value: flueGas.dust, unit: 'mg/m³', max: emissionStandards.dust, color: 'blue' },
            { label: 'CO', value: flueGas.co, unit: 'mg/m³', max: emissionStandards.co, color: 'purple' },
            { label: 'HCl', value: flueGas.hcl, unit: 'mg/m³', max: emissionStandards.hcl, color: 'cyan' },
          ].map((item, idx) => (
            <div key={idx} className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-400">{item.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  item.value <= item.max ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                }`}>
                  {item.value <= item.max ? '达标' : '超标'}
                </span>
              </div>
              <p className={`text-2xl font-bold font-mono ${
                item.value <= item.max ? 'text-white' : 'text-red-400'
              }`}>
                {item.value.toFixed(1)}
              </p>
              <p className="text-xs text-slate-500 mt-1">限值: {item.max} {item.unit}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
