import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, Clock, CheckCircle, Wrench, Search, Filter, QrCode, AlertCircle, ArrowUpCircle, User } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/mock/api';
import { formatDateTime, getPriorityColor, getPriorityText, getWorkOrderTypeText } from '@/utils/format';
import { WorkOrder } from '@/types';

export const EquipmentPage: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [equipmentStatus, setEquipmentStatus] = useState<any>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newOrder, setNewOrder] = useState({
    equipmentName: '',
    type: 'repair' as WorkOrder['type'],
    priority: 'medium' as WorkOrder['priority'],
    description: '',
  });

  useEffect(() => {
    const loadData = async () => {
      const [orders, status] = await Promise.all([
        api.getWorkOrders(),
        api.getEquipmentStatus(),
      ]);
      setWorkOrders(orders);
      setEquipmentStatus(status);
    };
    loadData();
  }, []);

  const filteredOrders = workOrders.filter((order) => {
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && order.priority !== priorityFilter) return false;
    if (searchText && !order.equipmentName.includes(searchText) && !order.description.includes(searchText)) return false;
    return true;
  });

  const handleAcceptOrder = async (orderId: string) => {
    if (!user) return;
    const result = await api.acceptWorkOrder(orderId);
    if (result) {
      setWorkOrders((prev) => prev.map((o) => (o.id === orderId ? result : o)));
      alert('工单已接单');
    }
  };

  const handleCompleteOrder = async (orderId: string) => {
    const result = await api.completeWorkOrder(orderId);
    if (result) {
      setWorkOrders((prev) => prev.map((o) => (o.id === orderId ? result : o)));
      alert('工单已完成');
    }
  };

  const handleEscalate = (orderId: string) => {
    if (confirm('确定要将此工单升级至设备部长吗？')) {
      alert('工单已升级至设备部长');
    }
  };

  const handleCreateOrder = async () => {
    if (!newOrder.equipmentName || !newOrder.description) {
      alert('请填写完整信息');
      return;
    }
    if (!user) return;
    const result = await api.createWorkOrder({
      equipmentId: `eq-${Date.now()}`,
      equipmentName: newOrder.equipmentName,
      type: newOrder.type,
      priority: newOrder.priority,
      description: newOrder.description,
      reporter: user.name,
      assignee: '待分配',
      createTime: new Date().toISOString(),
    });
    if (result) {
      setWorkOrders((prev) => [result, ...prev]);
      setShowCreateModal(false);
      setNewOrder({ equipmentName: '', type: 'repair', priority: 'medium', description: '' });
      alert('工单创建成功');
    }
  };

  const pendingCount = workOrders.filter((o) => o.status === 'pending').length;
  const escalatedCount = workOrders.filter((o) => o.isEscalated).length;
  const todayCount = workOrders.filter((o) => o.createTime.startsWith(new Date().toISOString().split('T')[0])).length;

  const columns = [
    {
      key: 'equipmentName',
      header: '设备名称',
      render: (record: WorkOrder) => (
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-slate-400" />
          <span className="text-white">{record.equipmentName}</span>
        </div>
      ),
    },
    {
      key: 'type',
      header: '类型',
      render: (record: WorkOrder) => (
        <span className="text-sm text-slate-300">{getWorkOrderTypeText(record.type)}</span>
      ),
    },
    {
      key: 'priority',
      header: '优先级',
      render: (record: WorkOrder) => (
        <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(record.priority)}`}>
          {getPriorityText(record.priority)}
        </span>
      ),
    },
    {
      key: 'description',
      header: '问题描述',
      render: (record: WorkOrder) => <span className="text-sm text-slate-400">{record.description}</span>,
    },
    {
      key: 'reporter',
      header: '报修人',
      render: (record: WorkOrder) => (
        <div className="flex items-center gap-2">
          <User className="w-3 h-3 text-slate-500" />
          <span className="text-sm text-slate-300">{record.reporter}</span>
        </div>
      ),
    },
    {
      key: 'assignee',
      header: '处理班组',
      render: (record: WorkOrder) => <span className="text-sm text-slate-300">{record.assignee}</span>,
    },
    {
      key: 'status',
      header: '状态',
      render: (record: WorkOrder) => (
        <div className="flex items-center gap-2">
          <StatusBadge
            status={record.status === 'completed' ? 'normal' : record.status === 'pending' ? 'warning' : 'normal'}
            text={record.status === 'pending' ? '待接单' : record.status === 'accepted' ? '处理中' : record.status === 'processing' ? '维修中' : '已完成'}
          />
          {record.isEscalated && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500/20 text-red-400 text-[10px] rounded">
              <ArrowUpCircle className="w-3 h-3" />
              已升级
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'createTime',
      header: '创建时间',
      render: (record: WorkOrder) => <span className="text-xs text-slate-500">{formatDateTime(record.createTime)}</span>,
    },
    {
      key: 'action',
      header: '操作',
      render: (record: WorkOrder) => (
        <div className="flex items-center gap-2">
          {hasPermission('workorder:accept') && record.status === 'pending' && (
            <button
              onClick={() => handleAcceptOrder(record.id)}
              className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
            >
              接单
            </button>
          )}
          {hasPermission('workorder:complete') && (record.status === 'accepted' || record.status === 'processing') && (
            <button
              onClick={() => handleCompleteOrder(record.id)}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded transition-colors"
            >
              完成
            </button>
          )}
          {record.status === 'pending' && record.isEscalated && hasPermission('workorder:view') && (
            <button
              onClick={() => handleEscalate(record.id)}
              className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs rounded transition-colors"
            >
              再次升级
            </button>
          )}
          {record.status === 'pending' && !record.isEscalated && (
            <span className="text-xs text-slate-500">
              2小时后自动升级
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">设备运维管理</h1>
          <p className="text-sm text-slate-400 mt-1">工单管理、巡检计划、设备状态监控</p>
        </div>
        <div className="flex items-center gap-3">
          {hasPermission('workorder:create') && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              报修工单
            </button>
          )}
          <button className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2">
            <QrCode className="w-4 h-4" />
            扫码巡检
          </button>
        </div>
      </div>

      {escalatedCount > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
            <div>
              <p className="text-sm font-medium text-red-400">工单升级提醒</p>
              <p className="text-xs text-red-400/70 mt-0.5">
                当前有 {escalatedCount} 条工单超过2小时未接单，已自动升级至设备部长
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Wrench className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-sm text-slate-400">设备总数</span>
          </div>
          <p className="text-3xl font-bold font-mono text-white">{equipmentStatus?.total || 0}</p>
        </div>
        <div className="p-4 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-sm text-slate-400">正常运行</span>
          </div>
          <p className="text-3xl font-bold font-mono text-emerald-400">{equipmentStatus?.normal || 0}</p>
        </div>
        <div className="p-4 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-sm text-slate-400">待处理工单</span>
          </div>
          <p className="text-3xl font-bold font-mono text-amber-400">{pendingCount}</p>
        </div>
        <div className="p-4 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-sm text-slate-400">设备完好率</span>
          </div>
          <p className="text-3xl font-bold font-mono text-cyan-400">{equipmentStatus?.availability || 0}%</p>
        </div>
      </div>

      <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          <h3 className="text-base font-semibold text-white">工单列表</h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索设备或描述..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9 pr-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-slate-500" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">全部状态</option>
                <option value="pending">待接单</option>
                <option value="accepted">处理中</option>
                <option value="processing">维修中</option>
                <option value="completed">已完成</option>
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">全部优先级</option>
                <option value="low">低</option>
                <option value="medium">中</option>
                <option value="high">高</option>
                <option value="urgent">紧急</option>
              </select>
            </div>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredOrders}
          loading={!workOrders.length}
          emptyText="暂无工单记录"
          onRowClick={(record) => console.log('查看工单详情', record)}
        />
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">创建报修工单</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">设备名称</label>
                <input
                  type="text"
                  value={newOrder.equipmentName}
                  onChange={(e) => setNewOrder((prev) => ({ ...prev, equipmentName: e.target.value }))}
                  placeholder="请输入设备名称"
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">工单类型</label>
                  <select
                    value={newOrder.type}
                    onChange={(e) => setNewOrder((prev) => ({ ...prev, type: e.target.value as WorkOrder['type'] }))}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="repair">维修</option>
                    <option value="inspection">巡检</option>
                    <option value="maintenance">保养</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">优先级</label>
                  <select
                    value={newOrder.priority}
                    onChange={(e) => setNewOrder((prev) => ({ ...prev, priority: e.target.value as WorkOrder['priority'] }))}
                    className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="urgent">紧急</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">问题描述</label>
                <textarea
                  value={newOrder.description}
                  onChange={(e) => setNewOrder((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="请详细描述设备故障情况"
                  rows={3}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreateOrder}
                className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                提交工单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
