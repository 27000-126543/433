import React, { useState, useEffect, useMemo } from 'react';
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
import { useFilter, matchFilter } from '@/context/FilterContext';
import { api } from '@/mock/api';
import { DashboardData } from '@/types';
import { formatNumber } from '@/utils/format';
import { emissionStandards } from '@/mock/data/flueGas';

export const DashboardPage: React.FC = () => {
  const [rawDashboardData, setRawDashboardData] = useState<DashboardData | null>(null);
  const [rawIncineratorHistory, setRawIncineratorHistory] = useState<any[]>([]);
  const [rawFlueGasHistory, setRawFlueGasHistory] = useState<any[]>([]);
  const [rawPowerData, setRawPowerData] = useState<{ hours: string[]; actual: number[]; target: number[]; timestamps: string[] }>({ hours: [], actual: [], target: [], timestamps: [] });
  const [rawChemicalData, setRawChemicalData] = useState<{ days: string[]; lime: number[]; activatedCarbon: number[]; timestamps: string[] }>({ days: [], lime: [], activatedCarbon: [], timestamps: [] });
  const [rawVehicles, setRawVehicles] = useState<any[]>([]);
  const [rawWorkOrders, setRawWorkOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { alerts } = useAlert();
  const { incinerators, flueGas, isConnected } = useRealtimeData(true);
  const { selectedShift, selectedDate } = useFilter();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [dashboard, history, flueGasHist, power, chemical, vehicles, workOrders] = await Promise.all([
          api.getDashboardData(),
          api.getIncineratorHistory(),
          api.getFlueGasHistory(),
          api.getPowerGeneration(),
          api.getChemicalConsumption(),
          api.getVehicles(),
          api.getWorkOrders(),
        ]);
        setRawDashboardData(dashboard);
        setRawIncineratorHistory(history);
        setRawFlueGasHistory(flueGasHist);
        setRawPowerData(power);
        setRawChemicalData(chemical);
        setRawVehicles(vehicles);
        setRawWorkOrders(workOrders);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filterLabel = useMemo(() => {
    const parts: string[] = [];
    if (selectedShift !== 'all') parts.push(selectedShift === 'day' ? '白班' : '夜班');
    if (selectedDate) parts.push(selectedDate);
    return parts.length > 0 ? parts.join(' · ') : '全量数据';
  }, [selectedShift, selectedDate]);

  const getTimeField = (item: any): string => {
    return item.timestamp || item.time || item.arrivalTime || item.createTime || '';
  };

  const filteredIncineratorHistory = useMemo(() => {
    if (selectedShift === 'all' && !selectedDate) return rawIncineratorHistory;
    return rawIncineratorHistory.filter(item => matchFilter(getTimeField(item), selectedShift, selectedDate));
  }, [rawIncineratorHistory, selectedShift, selectedDate]);

  const filteredFlueGasHistory = useMemo(() => {
    if (selectedShift === 'all' && !selectedDate) return rawFlueGasHistory;
    return rawFlueGasHistory.filter(item => matchFilter(getTimeField(item), selectedShift, selectedDate));
  }, [rawFlueGasHistory, selectedShift, selectedDate]);

  const filteredPowerData = useMemo(() => {
    if (selectedShift === 'all' && !selectedDate) return rawPowerData;
    const timestamps = rawPowerData.timestamps || [];
    const indices: number[] = [];
    timestamps.forEach((ts, idx) => {
      if (matchFilter(ts, selectedShift, selectedDate)) {
        indices.push(idx);
      }
    });
    return {
      hours: indices.map(i => rawPowerData.hours[i]),
      actual: indices.map(i => rawPowerData.actual[i]),
      target: indices.map(i => rawPowerData.target[i]),
      timestamps: indices.map(i => timestamps[i]),
    };
  }, [rawPowerData, selectedShift, selectedDate]);

  const filteredChemicalData = useMemo(() => {
    if (selectedShift === 'all' && !selectedDate) return rawChemicalData;
    const timestamps = rawChemicalData.timestamps || [];
    const indices: number[] = [];
    timestamps.forEach((ts, idx) => {
      if (matchFilter(ts, selectedShift, selectedDate)) {
        indices.push(idx);
      }
    });
    return {
      days: indices.map(i => rawChemicalData.days[i]),
      lime: indices.map(i => rawChemicalData.lime[i]),
      activatedCarbon: indices.map(i => rawChemicalData.activatedCarbon[i]),
      timestamps: indices.map(i => timestamps[i]),
    };
  }, [rawChemicalData, selectedShift, selectedDate]);

  const filteredVehicles = useMemo(() => {
    if (selectedShift === 'all' && !selectedDate) return rawVehicles;
    return rawVehicles.filter(v => matchFilter(getTimeField(v), selectedShift, selectedDate));
  }, [rawVehicles, selectedShift, selectedDate]);

  const hasFilter = selectedShift !== 'all' || selectedDate;

  const computedDashboardData = useMemo(() => {
    if (!rawDashboardData) return null;
    const isFiltered = hasFilter;
    
    let todayVehicles = rawDashboardData.todayVehicles;
    let todayWasteWeight = rawDashboardData.todayWasteWeight;
    let incineratorLoad = rawDashboardData.incineratorLoad;
    let equipmentAvailability = rawDashboardData.equipmentAvailability;
    let emissionComplianceRate = rawDashboardData.emissionComplianceRate;
    let totalPowerGeneration = rawDashboardData.totalPowerGeneration;

    if (isFiltered) {
      todayVehicles = filteredVehicles.length;
      todayWasteWeight = filteredVehicles.reduce((sum, v) => sum + (v.weight || 0), 0);
      todayWasteWeight = Math.round(todayWasteWeight);
      
      if (filteredIncineratorHistory.length > 0) {
        const loads = filteredIncineratorHistory.map(i => {
          if (typeof i.load1 === 'number' && typeof i.load2 === 'number' && typeof i.load3 === 'number') {
            return (i.load1 + i.load2 + i.load3) / 3;
          }
          return i.load || 0;
        });
        if (loads.length > 0) {
          incineratorLoad = Math.round(loads.reduce((a, b) => a + b, 0) / loads.length);
        }
      }
      
      if (filteredPowerData.actual.length > 0) {
        totalPowerGeneration = filteredPowerData.actual.reduce((a, b) => a + b, 0);
      } else {
        totalPowerGeneration = 0;
      }
      
      if (filteredFlueGasHistory.length > 0) {
        const compliant = filteredFlueGasHistory.filter(f => f.isStandard).length;
        emissionComplianceRate = Math.round((compliant / filteredFlueGasHistory.length) * 1000) / 10;
      } else {
        emissionComplianceRate = 0;
      }
      
      const relevantWorkOrders = rawWorkOrders.filter(w => matchFilter(getTimeField(w), selectedShift, selectedDate));
      if (relevantWorkOrders.length > 0) {
        const completed = relevantWorkOrders.filter(w => w.status === 'completed').length;
        equipmentAvailability = Math.round((completed / relevantWorkOrders.length) * 1000) / 10;
        equipmentAvailability = Math.max(85, Math.min(100, equipmentAvailability));
      }
    }

    return {
      ...rawDashboardData,
      incineratorLoad,
      totalPowerGeneration,
      emissionComplianceRate,
      equipmentAvailability,
      todayVehicles,
      todayWasteWeight,
    };
  }, [rawDashboardData, filteredVehicles, filteredIncineratorHistory, filteredPowerData, filteredFlueGasHistory, rawWorkOrders, selectedShift, selectedDate, hasFilter]);

  const dashboardData = computedDashboardData;

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
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-slate-400">实时监控全厂运营状态</p>
            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
              {filterLabel}
            </span>
          </div>
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
          title="入场车辆"
          value={dashboardData.todayVehicles}
          unit="辆"
          icon={Truck}
          color="cyan"
          delay={500}
        />
        <MetricCard
          title="接收垃圾"
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
              {filteredIncineratorHistory.length > 0 ? `${filteredIncineratorHistory.length} 条记录` : '暂无数据'}
            </div>
          </div>
          <LineChart
            data={filteredIncineratorHistory}
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">烟气排放趋势</h3>
            <span className="text-xs text-slate-400">{filteredFlueGasHistory.length} 条记录</span>
          </div>
          <LineChart
            data={filteredFlueGasHistory}
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">发电量对比</h3>
            <span className="text-xs text-slate-400">{filteredPowerData.hours.length} 个时段</span>
          </div>
          <BarChart
            xData={filteredPowerData.hours}
            series={[
              { name: '实际发电量', data: filteredPowerData.actual, color: '#0EA5E9' },
              { name: '目标发电量', data: filteredPowerData.target, color: '#F59E0B', type: 'line' },
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">药剂消耗趋势</h3>
          <span className="text-xs text-slate-400">{filteredChemicalData.days.length} 天数据</span>
        </div>
        <LineChart
          data={filteredChemicalData.days.map((day, idx) => ({
            time: day,
            lime: filteredChemicalData.lime[idx],
            carbon: filteredChemicalData.activatedCarbon[idx],
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
