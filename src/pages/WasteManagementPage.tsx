import React, { useState, useEffect } from 'react';
import { Plus, QrCode, Truck, Scale, MapPin, Calendar, Search, Filter, ArrowRight, Sparkles } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { VehicleRecord } from '@/types';
import { api } from '@/mock/api';
import { formatDateTime } from '@/utils/format';
import { usePermission } from '@/hooks/usePermission';

export const WasteManagementPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<VehicleRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const { hasPermission } = usePermission();

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const data = await api.getVehicleRecords();
      setVehicles(data);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter((v) => {
    const matchesSearch = v.plateNumber.includes(searchText) || v.driverName.includes(searchText) || v.source.includes(searchText);
    const matchesStatus = statusFilter === 'all' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const columns = [
    {
      key: 'plateNumber',
      header: '车牌号',
      render: (row: VehicleRecord) => (
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-blue-400" />
          <span className="font-medium text-white">{row.plateNumber}</span>
        </div>
      ),
    },
    { key: 'driverName', header: '司机' },
    { key: 'source', header: '来源' },
    { key: 'wasteType', header: '垃圾类型' },
    {
      key: 'weight',
      header: '重量',
      render: (row: VehicleRecord) => (
        <div className="flex items-center gap-1">
          <Scale className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-mono">{row.weight} 吨</span>
        </div>
      ),
    },
    {
      key: 'unloadingArea',
      header: '卸料区域',
      render: (row: VehicleRecord) => (
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
          <span>{row.unloadingArea}</span>
        </div>
      ),
    },
    {
      key: 'fermentationDays',
      header: '发酵天数',
      render: (row: VehicleRecord) => (
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-amber-400" />
          <span>{row.fermentationDays} 天</span>
        </div>
      ),
    },
    {
      key: 'recommendedFurnaceOrder',
      header: '入炉顺序',
      render: (row: VehicleRecord) => (
        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-medium">
          第 {row.recommendedFurnaceOrder} 位
        </span>
      ),
    },
    {
      key: 'arrivalTime',
      header: '入场时间',
      render: (row: VehicleRecord) => formatDateTime(row.arrivalTime),
    },
    {
      key: 'status',
      header: '状态',
      render: (row: VehicleRecord) => <StatusBadge status={row.status} />,
    },
  ];

  const recommendedAreas = ['A区-1号坑', 'A区-2号坑', 'B区-3号坑'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">垃圾入场管理</h1>
          <p className="text-sm text-slate-400 mt-1">车辆登记、称重记录、智能卸料推荐</p>
        </div>
        {hasPermission('vehicle:create') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            登记入场
          </button>
        )}
      </div>

      <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="搜索车牌号、司机、来源..."
              className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900/50 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">全部状态</option>
              <option value="pending">待称重</option>
              <option value="weighing">称重中</option>
              <option value="unloading">卸料中</option>
              <option value="completed">已完成</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredVehicles}
          loading={loading}
          rowKey="id"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">智能卸料推荐</h3>
              <p className="text-xs text-slate-400">基于库存和发酵周期</p>
            </div>
          </div>
          <div className="space-y-3">
            {recommendedAreas.map((area, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-white">{area}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-emerald-400">
                  <span>推荐</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <QrCode className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">扫码入场</h3>
              <p className="text-xs text-slate-400">扫描车辆二维码快速登记</p>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-4 flex items-center justify-center">
            <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
              <QrCode className="w-24 h-24 text-slate-800" />
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-3">扫描二维码完成车辆信息录入</p>
        </div>

        <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <Truck className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">今日统计</h3>
              <p className="text-xs text-slate-400">入场车辆及垃圾重量</p>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">入场车辆</span>
              <span className="text-2xl font-bold text-white font-mono">15 辆</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">总重量</span>
              <span className="text-2xl font-bold text-emerald-400 font-mono">328.5 吨</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-400">待处理</span>
              <span className="text-xl font-bold text-amber-400 font-mono">3 辆</span>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-semibold text-white mb-4">车辆入场登记</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">车牌号</label>
                  <input
                    type="text"
                    placeholder="请输入车牌号"
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">司机姓名</label>
                  <input
                    type="text"
                    placeholder="请输入司机姓名"
                    className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">垃圾来源</label>
                  <select className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500">
                    <option>朝阳区垃圾站</option>
                    <option>海淀区清运队</option>
                    <option>丰台区转运站</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">垃圾类型</label>
                  <select className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500">
                    <option>生活垃圾</option>
                    <option>厨余垃圾</option>
                    <option>可燃垃圾</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">重量（吨）</label>
                <input
                  type="number"
                  placeholder="自动称重"
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-colors"
              >
                确认登记
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
