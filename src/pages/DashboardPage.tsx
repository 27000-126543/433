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
  X,
  Thermometer,
  Gauge,
  Droplet,
  AlertTriangle,
  CheckCircle,
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
  const [selectedIncineratorPoint, setSelectedIncineratorPoint] = useState<any>(null);
  const [selectedFlueGasPoint, setSelectedFlueGasPoint] = useState<any>(null);
  const [selectedPowerIdx, setSelectedPowerIdx] = useState<number | null>(null);
  const [selectedChemicalIdx, setSelectedChemicalIdx] = useState<number | null>(null);

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

  const baselineStats = useMemo(() => {
    if (!rawDashboardData) return null;

    let incineratorLoad = rawDashboardData.incineratorLoad;
    if (rawIncineratorHistory.length > 0) {
      const loads = rawIncineratorHistory.map(i => {
        if (typeof i.load1 === 'number' && typeof i.load2 === 'number' && typeof i.load3 === 'number') {
          return (i.load1 + i.load2 + i.load3) / 3;
        }
        return i.load || 0;
      });
      if (loads.length > 0) {
        incineratorLoad = Math.round(loads.reduce((a, b) => a + b, 0) / loads.length);
      }
    }

    let totalPowerGeneration = rawDashboardData.totalPowerGeneration;
    if (rawPowerData.actual.length > 0) {
      totalPowerGeneration = rawPowerData.actual.reduce((a, b) => a + b, 0);
    }

    let emissionComplianceRate = rawDashboardData.emissionComplianceRate;
    if (rawFlueGasHistory.length > 0) {
      const compliant = rawFlueGasHistory.filter(f => f.isStandard).length;
      emissionComplianceRate = Math.round((compliant / rawFlueGasHistory.length) * 1000) / 10;
    }

    const limeSum = rawChemicalData.lime.reduce((a, b) => a + b, 0);
    const carbonSum = rawChemicalData.activatedCarbon.reduce((a, b) => a + b, 0);

    return {
      incineratorLoad,
      totalPowerGeneration,
      emissionComplianceRate,
      equipmentAvailability: rawDashboardData.equipmentAvailability,
      todayVehicles: rawDashboardData.todayVehicles,
      todayWasteWeight: rawDashboardData.todayWasteWeight,
      chemicalLime: limeSum,
      chemicalCarbon: carbonSum,
    };
  }, [rawDashboardData, rawIncineratorHistory, rawFlueGasHistory, rawPowerData, rawChemicalData]);

  const calcFilteredStats = (
    incHist: any[],
    fgHist: any[],
    power: { actual: number[] },
    chem: { lime: number[]; activatedCarbon: number[] },
    vehicles: any[],
    workOrders: any[]
  ) => {
    let incineratorLoad: number | null = null;
    let totalPowerGeneration: number | null = null;
    let emissionComplianceRate: number | null = null;
    let equipmentAvailability: number | null = null;
    let todayVehicles: number | null = null;
    let todayWasteWeight: number | null = null;

    if (incHist.length > 0) {
      const loads = incHist.map(i => {
        if (typeof i.load1 === 'number' && typeof i.load2 === 'number' && typeof i.load3 === 'number') {
          return (i.load1 + i.load2 + i.load3) / 3;
        }
        return i.load || 0;
      });
      incineratorLoad = Math.round(loads.reduce((a, b) => a + b, 0) / loads.length);
    }

    if (power.actual.length > 0) {
      totalPowerGeneration = power.actual.reduce((a, b) => a + b, 0);
    } else {
      totalPowerGeneration = 0;
    }

    if (fgHist.length > 0) {
      const compliant = fgHist.filter(f => f.isStandard).length;
      emissionComplianceRate = Math.round((compliant / fgHist.length) * 1000) / 10;
    } else {
      emissionComplianceRate = 0;
    }

    if (hasFilter) {
      if (workOrders.length > 0) {
        const completed = workOrders.filter(w => w.status === 'completed').length;
        equipmentAvailability = Math.round((completed / workOrders.length) * 1000) / 10;
        equipmentAvailability = Math.max(85, Math.min(100, equipmentAvailability));
      }
    }

    if (hasFilter) {
      todayVehicles = vehicles.length;
      todayWasteWeight = Math.round(vehicles.reduce((sum, v) => sum + (v.weight || 0), 0));
    }

    const chemicalLime = chem.lime.reduce((a, b) => a + b, 0);
    const chemicalCarbon = chem.activatedCarbon.reduce((a, b) => a + b, 0);

    return {
      incineratorLoad,
      totalPowerGeneration,
      emissionComplianceRate,
      equipmentAvailability,
      todayVehicles,
      todayWasteWeight,
      chemicalLime,
      chemicalCarbon,
    };
  };

  const filteredWorkOrders = useMemo(() => {
    if (!hasFilter) return rawWorkOrders;
    return rawWorkOrders.filter(w => matchFilter(getTimeField(w), selectedShift, selectedDate));
  }, [rawWorkOrders, selectedShift, selectedDate, hasFilter, getTimeField]);

  const filteredStats = useMemo(() => {
    if (!rawDashboardData) return null;
    if (!hasFilter) return baselineStats;
    return calcFilteredStats(
      filteredIncineratorHistory,
      filteredFlueGasHistory,
      filteredPowerData,
      filteredChemicalData,
      filteredVehicles,
      filteredWorkOrders
    );
  }, [rawDashboardData, hasFilter, baselineStats, filteredIncineratorHistory, filteredFlueGasHistory,
      filteredPowerData, filteredChemicalData, filteredVehicles, filteredWorkOrders]);

  const calcDiff = (current: number | null | undefined, baseline: number | null | undefined) => {
    if (current === null || current === undefined || baseline === null || baseline === undefined || baseline === 0) {
      return null;
    }
    const diff = ((current - baseline) / baseline) * 100;
    return {
      value: Math.round(diff * 10) / 10,
      isUp: diff >= 0,
      abs: Math.round((current - baseline) * 100) / 100,
    };
  };

  const dashboardData = useMemo(() => {
    if (!filteredStats || !baselineStats || !rawDashboardData) return null;
    const stats = hasFilter ? filteredStats : baselineStats;
    return {
      ...rawDashboardData,
      incineratorLoad: stats.incineratorLoad ?? 0,
      totalPowerGeneration: stats.totalPowerGeneration ?? 0,
      emissionComplianceRate: stats.emissionComplianceRate ?? 0,
      equipmentAvailability: stats.equipmentAvailability ?? rawDashboardData.equipmentAvailability,
      todayVehicles: stats.todayVehicles ?? rawDashboardData.todayVehicles,
      todayWasteWeight: stats.todayWasteWeight ?? rawDashboardData.todayWasteWeight,
    };
  }, [filteredStats, baselineStats, rawDashboardData, hasFilter]);

  const dataAvailability = useMemo(() => ({
    incinerator: filteredIncineratorHistory.length > 0,
    flueGas: filteredFlueGasHistory.length > 0,
    power: filteredPowerData.actual.length > 0,
    chemical: filteredChemicalData.lime.length > 0,
  }), [filteredIncineratorHistory, filteredFlueGasHistory, filteredPowerData, filteredChemicalData]);

  if (loading || !dashboardData) {
    return (
      <>
        <div className="flex items-center justify-center h-[calc(100vh-120px)]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-400">加载数据中...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
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
          value={dataAvailability.incinerator ? dashboardData.incineratorLoad : 0}
          unit="%"
          icon={Flame}
          color="amber"
          delay={100}
          noData={hasFilter && !dataAvailability.incinerator}
          trend={hasFilter && baselineStats && filteredStats
            ? (() => {
                const d = calcDiff(filteredStats.incineratorLoad, baselineStats.incineratorLoad);
                return d ? { ...d, absUnit: '%', label: ' 较全量' } : undefined;
              })()
            : undefined}
        />
        <MetricCard
          title="总发电量"
          value={formatNumber(dashboardData.totalPowerGeneration / 1000, 1)}
          unit="MW"
          icon={Zap}
          color="blue"
          delay={200}
          noData={hasFilter && !dataAvailability.power}
          trend={hasFilter && baselineStats && filteredStats
            ? (() => {
                const d = calcDiff(filteredStats.totalPowerGeneration, baselineStats.totalPowerGeneration);
                return d ? { ...d, absUnit: 'MWh', absDiff: Math.round(d.abs / 1000 * 10) / 10, label: ' 较全量' } : undefined;
              })()
            : undefined}
        />
        <MetricCard
          title="排放达标率"
          value={dataAvailability.flueGas ? dashboardData.emissionComplianceRate : 0}
          unit="%"
          icon={Leaf}
          color="green"
          delay={300}
          noData={hasFilter && !dataAvailability.flueGas}
          trend={hasFilter && baselineStats && filteredStats
            ? (() => {
                const d = calcDiff(filteredStats.emissionComplianceRate, baselineStats.emissionComplianceRate);
                return d ? { ...d, absUnit: '%', label: ' 较全量' } : undefined;
              })()
            : undefined}
        />
        <MetricCard
          title="设备完好率"
          value={dashboardData.equipmentAvailability}
          unit="%"
          icon={Wrench}
          color="purple"
          delay={400}
          trend={hasFilter && baselineStats && filteredStats
            ? (() => {
                const d = calcDiff(filteredStats.equipmentAvailability, baselineStats.equipmentAvailability);
                return d ? { ...d, absUnit: '%', label: ' 较全量' } : undefined;
              })()
            : undefined}
        />
        <MetricCard
          title="入场车辆"
          value={dashboardData.todayVehicles}
          unit="辆"
          icon={Truck}
          color="cyan"
          delay={500}
          trend={hasFilter && baselineStats && filteredStats
            ? (() => {
                const d = calcDiff(filteredStats.todayVehicles, baselineStats.todayVehicles);
                return d ? { ...d, absUnit: '辆', label: ' 较全量' } : undefined;
              })()
            : undefined}
        />
        <MetricCard
          title="接收垃圾"
          value={dashboardData.todayWasteWeight}
          unit="吨"
          icon={Package}
          color="amber"
          delay={600}
          trend={hasFilter && baselineStats && filteredStats
            ? (() => {
                const d = calcDiff(filteredStats.todayWasteWeight, baselineStats.todayWasteWeight);
                return d ? { ...d, absUnit: '吨', label: ' 较全量' } : undefined;
              })()
            : undefined}
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
            onPointClick={(idx) => setSelectedIncineratorPoint(
              selectedIncineratorPoint?.index === idx ? null : filteredIncineratorHistory[idx]
                ? { ...filteredIncineratorHistory[idx], index: idx }
                : null
            )}
            selectedIndex={selectedIncineratorPoint?.index ?? null}
          />
          {selectedIncineratorPoint && (
            <div className="mt-4 p-4 bg-slate-900/60 rounded-xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-orange-400" />
                  <p className="text-sm font-medium text-white">
                    时段明细：{selectedIncineratorPoint.time}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedIncineratorPoint(null)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map(n => {
                  const temp = selectedIncineratorPoint[`temp${n}`];
                  const load = selectedIncineratorPoint[`load${n}`];
                  const pressure = selectedIncineratorPoint[`pressure${n}`];
                  const colors = ['text-red-400', 'text-amber-400', 'text-emerald-400'];
                  return (
                    <div key={n} className="p-3 bg-slate-800/50 rounded-lg">
                      <p className={`text-sm font-medium mb-2 ${colors[n-1]}`}>{n}号炉</p>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">温度</span>
                          <span className="text-white font-mono">{temp?.toFixed(1)}°C</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">负荷</span>
                          <span className="text-white font-mono">{load?.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-500">压力</span>
                          <span className="text-white font-mono">{pressure?.toFixed(2)}MPa</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
            onPointClick={(idx) => setSelectedFlueGasPoint(
              selectedFlueGasPoint?.index === idx ? null : filteredFlueGasHistory[idx]
                ? { ...filteredFlueGasHistory[idx], index: idx }
                : null
            )}
            selectedIndex={selectedFlueGasPoint?.index ?? null}
          />
          {selectedFlueGasPoint && (
            <div className="mt-4 p-4 bg-slate-900/60 rounded-xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Wind className="w-4 h-4 text-blue-400" />
                  <p className="text-sm font-medium text-white">
                    排放明细：{selectedFlueGasPoint.time || selectedFlueGasPoint.timestamp?.split('T')?.[1] || selectedFlueGasPoint.index}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedFlueGasPoint(null)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { name: 'SO2', val: selectedFlueGasPoint.so2, std: emissionStandards.so2, color: 'text-emerald-400' },
                  { name: 'NOx', val: selectedFlueGasPoint.nox, std: emissionStandards.nox, color: 'text-amber-400' },
                  { name: '粉尘', val: selectedFlueGasPoint.dust, std: emissionStandards.dust, color: 'text-blue-400' },
                  { name: 'CO', val: selectedFlueGasPoint.co, std: emissionStandards.co, color: 'text-purple-400' },
                  { name: 'HCl', val: selectedFlueGasPoint.hcl, std: emissionStandards.hcl, color: 'text-cyan-400' },
                  { name: '达标', val: selectedFlueGasPoint.isStandard ? '是' : '否', std: null, color: selectedFlueGasPoint.isStandard ? 'text-emerald-400' : 'text-red-400' },
                ].map(item => (
                  <div key={item.name} className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-500">{item.name}</span>
                      {item.std && (
                        item.val > item.std
                          ? <AlertTriangle className="w-3 h-3 text-red-400" />
                          : <CheckCircle className="w-3 h-3 text-emerald-400" />
                      )}
                    </div>
                    <p className={`text-lg font-mono font-bold ${item.color}`}>
                      {item.std ? `${(item.val as number)?.toFixed(1)}` : item.val}
                    </p>
                    {item.std && (
                      <p className="text-[10px] text-slate-500">限值 {item.std} mg/m³</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
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
            onPointClick={(idx, info) => setSelectedPowerIdx(selectedPowerIdx === idx ? null : idx)}
            selectedIndex={selectedPowerIdx}
          />
          {selectedPowerIdx !== null && (
            <div className="mt-4 p-4 bg-slate-900/60 rounded-xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-400" />
                  <p className="text-sm font-medium text-white">
                    发电汇总：{filteredPowerData.hours[selectedPowerIdx]}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPowerIdx(null)}
                  className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">实际发电量</p>
                  <p className="text-lg font-mono font-bold text-blue-400">
                    {formatNumber(filteredPowerData.actual[selectedPowerIdx] / 1000, 2)} MWh
                  </p>
                  <p className="text-[10px] text-slate-500">目标: {formatNumber(filteredPowerData.target[selectedPowerIdx] / 1000, 2)} MWh</p>
                </div>
                <div className="p-3 bg-slate-800/50 rounded-lg">
                  <p className="text-xs text-slate-500 mb-1">完成率</p>
                  <p className={`text-lg font-mono font-bold ${
                    filteredPowerData.actual[selectedPowerIdx] >= filteredPowerData.target[selectedPowerIdx]
                      ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {Math.round((filteredPowerData.actual[selectedPowerIdx] / filteredPowerData.target[selectedPowerIdx]) * 100)}%
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {filteredPowerData.actual[selectedPowerIdx] >= filteredPowerData.target[selectedPowerIdx]
                      ? '超额完成' : '未达目标'}
                  </p>
                </div>
              </div>
            </div>
          )}
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
          onPointClick={(idx) => setSelectedChemicalIdx(selectedChemicalIdx === idx ? null : idx)}
          selectedIndex={selectedChemicalIdx}
        />
        {selectedChemicalIdx !== null && (
          <div className="mt-4 p-4 bg-slate-900/60 rounded-xl border border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Droplet className="w-4 h-4 text-cyan-400" />
                <p className="text-sm font-medium text-white">
                  药剂汇总：{filteredChemicalData.days[selectedChemicalIdx]}
                </p>
              </div>
              <button
                onClick={() => setSelectedChemicalIdx(null)}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">石灰消耗</p>
                <p className="text-lg font-mono font-bold text-blue-400">
                  {formatNumber(filteredChemicalData.lime[selectedChemicalIdx], 2)} 吨
                </p>
                <p className="text-[10px] text-slate-500">
                  周期累计: {formatNumber(filteredChemicalData.lime.slice(0, selectedChemicalIdx + 1).reduce((a, b) => a + b, 0), 2)} 吨
                </p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="text-xs text-slate-500 mb-1">活性炭消耗</p>
                <p className="text-lg font-mono font-bold text-emerald-400">
                  {formatNumber(filteredChemicalData.activatedCarbon[selectedChemicalIdx], 2)} 吨
                </p>
                <p className="text-[10px] text-slate-500">
                  周期累计: {formatNumber(filteredChemicalData.activatedCarbon.slice(0, selectedChemicalIdx + 1).reduce((a, b) => a + b, 0), 2)} 吨
                </p>
              </div>
            </div>
          </div>
        )}
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
    </>
  );
};
