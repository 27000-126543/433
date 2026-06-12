import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, CheckCircle, XCircle, Clock, Package, DollarSign, Users, ChevronRight, FileText } from 'lucide-react';
import { DataTable } from '@/components/common/DataTable';
import { StatusBadge } from '@/components/common/StatusBadge';
import { usePermission } from '@/hooks/usePermission';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/mock/api';
import { formatDateTime, formatNumber } from '@/utils/format';
import { PurchaseRequest, ChemicalInventory } from '@/types';

export const PurchasePage: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const [purchaseRequests, setPurchaseRequests] = useState<PurchaseRequest[]>([]);
  const [chemicals, setChemicals] = useState<ChemicalInventory[]>([]);
  const [activeTab, setActiveTab] = useState<'inventory' | 'purchase'>('inventory');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [newRequest, setNewRequest] = useState({
    chemicalId: '',
    quantity: 0,
    estimatedCost: 0,
  });

  useEffect(() => {
    const loadData = async () => {
      const [requests, inventory] = await Promise.all([
        api.getPurchaseRequests(),
        api.getChemicalInventory(),
      ]);
      setPurchaseRequests(requests);
      setChemicals(inventory);
    };
    loadData();
  }, []);

  const lowStockChemicals = chemicals.filter((c) => c.status !== 'normal');
  const pendingRequests = purchaseRequests.filter((r) => r.status !== 'completed' && r.status !== 'rejected');

  const getApprovalLevel = (status: PurchaseRequest['status']) => {
    if (status === 'pending') return 0;
    if (status === 'approved1') return 1;
    if (status === 'approved2') return 2;
    if (status === 'approved3') return 3;
    return -1;
  };

  const getApprovalStatusText = (status: PurchaseRequest['status']) => {
    const map: Record<string, string> = {
      pending: '待一级审批',
      approved1: '待二级审批',
      approved2: '待三级审批',
      approved3: '审批完成',
      rejected: '已拒绝',
      completed: '已完成',
    };
    return map[status] || status;
  };

  const canApprove = (request: PurchaseRequest) => {
    if (!user) return false;
    const level = getApprovalLevel(request.status);
    if (level === -1) return false;
    
    if (level === 0 && hasPermission('purchase:approve1')) return true;
    if (level === 1 && hasPermission('purchase:approve1')) return true;
    if (level === 2 && hasPermission('purchase:approve1')) return true;
    return false;
  };

  const handleCreateRequest = async () => {
    if (!newRequest.chemicalId || !newRequest.quantity) {
      alert('请填写完整信息');
      return;
    }
    if (!user) return;
    
    const chemical = chemicals.find((c) => c.id === newRequest.chemicalId);
    const result = await api.createPurchaseRequest({
      chemicalId: newRequest.chemicalId,
      chemicalName: chemical?.name || '',
      quantity: newRequest.quantity,
      estimatedCost: newRequest.estimatedCost,
      applicant: user.name,
      applyTime: new Date().toISOString(),
    });
    
    if (result) {
      setPurchaseRequests((prev) => [result, ...prev]);
      setShowCreateModal(false);
      setNewRequest({ chemicalId: '', quantity: 0, estimatedCost: 0 });
      alert('采购申请已提交');
    }
  };

  const handleApprove = async (approved: boolean) => {
    if (!selectedRequest || !user) return;
    
    const level = getApprovalLevel(selectedRequest.status) + 1;
    const result = await api.approvePurchase(
      selectedRequest.id,
      level,
      approvalComment || (approved ? '同意' : '拒绝'),
      user.id
    );
    
    if (result) {
      setPurchaseRequests((prev) => prev.map((r) => (r.id === selectedRequest.id ? result : r)));
      setShowApproveModal(false);
      setSelectedRequest(null);
      setApprovalComment('');
      alert(approved ? '审批通过' : '已拒绝');
    }
  };

  const openApproveModal = (request: PurchaseRequest) => {
    setSelectedRequest(request);
    setShowApproveModal(true);
  };

  const inventoryColumns = [
    {
      key: 'name',
      header: '药剂名称',
      render: (record: ChemicalInventory) => (
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-slate-400" />
          <span className="text-white">{record.name}</span>
        </div>
      ),
    },
    {
      key: 'currentStock',
      header: '当前库存',
      render: (record: ChemicalInventory) => (
        <div>
          <p className="text-white font-mono">{record.currentStock} {record.unit}</p>
          <p className="text-xs text-slate-500">安全库存：{record.safeStock} {record.unit}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: '库存状态',
      render: (record: ChemicalInventory) => (
        <StatusBadge
          status={record.status === 'normal' ? 'normal' : record.status === 'low' ? 'warning' : 'alarm'}
          text={record.status === 'normal' ? '正常' : record.status === 'low' ? '偏低' : '危急'}
        />
      ),
    },
    {
      key: 'consumptionRate',
      header: '消耗速率',
      render: (record: ChemicalInventory) => (
        <span className="text-slate-300">{record.consumptionRate} {record.unit}/天</span>
      ),
    },
    {
      key: 'daysLeft',
      header: '可用天数',
      render: (record: ChemicalInventory) => {
        const days = Math.round(record.currentStock / record.consumptionRate);
        return (
          <span className={days < 10 ? 'text-red-400' : days < 20 ? 'text-amber-400' : 'text-emerald-400'}>
            约 {days} 天
          </span>
        );
      },
    },
    {
      key: 'lastPurchaseDate',
      header: '上次采购',
      render: (record: ChemicalInventory) => <span className="text-slate-500 text-sm">{record.lastPurchaseDate}</span>,
    },
    {
      key: 'action',
      header: '操作',
      render: (record: ChemicalInventory) =>
        record.status !== 'normal' && hasPermission('purchase:view') ? (
          <button
            onClick={() => {
              setNewRequest({
                chemicalId: record.id,
                quantity: record.safeStock * 2,
                estimatedCost: record.safeStock * 2 * 600,
              });
              setShowCreateModal(true);
            }}
            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
          >
            申请采购
          </button>
        ) : null,
    },
  ];

  const purchaseColumns = [
    {
      key: 'chemicalName',
      header: '药剂名称',
      render: (record: PurchaseRequest) => (
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-slate-400" />
          <span className="text-white">{record.chemicalName}</span>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: '采购数量',
      render: (record: PurchaseRequest) => <span className="text-white font-mono">{record.quantity} 吨</span>,
    },
    {
      key: 'estimatedCost',
      header: '预估金额',
      render: (record: PurchaseRequest) => (
        <div>
          <p className="text-white font-mono">¥{formatNumber(record.estimatedCost, 0)}</p>
        </div>
      ),
    },
    {
      key: 'applicant',
      header: '申请人',
      render: (record: PurchaseRequest) => (
        <div className="flex items-center gap-2">
          <Users className="w-3 h-3 text-slate-500" />
          <span className="text-slate-300 text-sm">{record.applicant}</span>
        </div>
      ),
    },
    {
      key: 'applyTime',
      header: '申请时间',
      render: (record: PurchaseRequest) => <span className="text-slate-500 text-xs">{formatDateTime(record.applyTime)}</span>,
    },
    {
      key: 'approvalProgress',
      header: '审批进度',
      render: (record: PurchaseRequest) => {
        const currentLevel = getApprovalLevel(record.status);
        return (
          <div className="flex items-center gap-1">
            {['运营主管', '设备经理', '总经理'].map((name, index) => (
              <React.Fragment key={index}>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    index < currentLevel
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : index === currentLevel
                      ? 'bg-blue-500/20 text-blue-400 animate-pulse'
                      : 'bg-slate-700 text-slate-500'
                  }`}
                >
                  {index < currentLevel ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </div>
                {index < 2 && (
                  <ChevronRight className={`w-4 h-4 ${index < currentLevel ? 'text-emerald-400' : 'text-slate-600'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        );
      },
    },
    {
      key: 'status',
      header: '状态',
      render: (record: PurchaseRequest) => (
        <StatusBadge
          status={record.status === 'rejected' ? 'alarm' : record.status === 'completed' || record.status === 'approved3' ? 'normal' : 'warning'}
          text={getApprovalStatusText(record.status)}
        />
      ),
    },
    {
      key: 'action',
      header: '操作',
      render: (record: PurchaseRequest) => (
        <div className="flex items-center gap-2">
          {canApprove(record) && (
            <button
              onClick={() => openApproveModal(record)}
              className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white text-xs rounded transition-colors"
            >
              审批
            </button>
          )}
          <button className="px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded transition-colors">
            详情
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">采购审批管理</h1>
          <p className="text-sm text-slate-400 mt-1">药剂库存管理、采购申请、多级审批流程</p>
        </div>
        {hasPermission('purchase:view') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            新建采购申请
          </button>
        )}
      </div>

      {lowStockChemicals.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 animate-pulse" />
            <div>
              <p className="text-sm font-medium text-amber-400">库存预警提醒</p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                当前有 {lowStockChemicals.length} 种药剂库存低于安全线，请及时采购补充
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Package className="w-4 h-4 text-blue-400" />
            </div>
            <span className="text-sm text-slate-400">药剂种类</span>
          </div>
          <p className="text-3xl font-bold font-mono text-white">{chemicals.length}</p>
        </div>
        <div className="p-4 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-amber-500/20 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-sm text-slate-400">库存预警</span>
          </div>
          <p className="text-3xl font-bold font-mono text-amber-400">{lowStockChemicals.length}</p>
        </div>
        <div className="p-4 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-cyan-500/20 rounded-lg">
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <span className="text-sm text-slate-400">待审批</span>
          </div>
          <p className="text-3xl font-bold font-mono text-cyan-400">{pendingRequests.length}</p>
        </div>
        <div className="p-4 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <span className="text-sm text-slate-400">本月采购额</span>
          </div>
          <p className="text-3xl font-bold font-mono text-emerald-400">
            ¥{formatNumber(purchaseRequests.reduce((s, r) => s + (r.status === 'completed' ? r.estimatedCost : 0), 0), 0)}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('inventory')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'inventory'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-800/50 text-slate-400 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4 inline mr-2" />
          药剂库存
        </button>
        <button
          onClick={() => setActiveTab('purchase')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'purchase'
              ? 'bg-blue-500 text-white'
              : 'bg-slate-800/50 text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          采购审批
        </button>
      </div>

      {activeTab === 'inventory' ? (
        <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-4">药剂库存列表</h3>
          <DataTable
            columns={inventoryColumns}
            data={chemicals}
            loading={!chemicals.length}
            emptyText="暂无药剂数据"
          />
        </div>
      ) : (
        <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-base font-semibold text-white mb-4">采购申请列表</h3>
          <DataTable
            columns={purchaseColumns}
            data={purchaseRequests}
            loading={!purchaseRequests.length}
            emptyText="暂无采购申请"
          />
        </div>
      )}

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">新建采购申请</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">选择药剂</label>
                <select
                  value={newRequest.chemicalId}
                  onChange={(e) => {
                    const chemical = chemicals.find((c) => c.id === e.target.value);
                    setNewRequest((prev) => ({
                      ...prev,
                      chemicalId: e.target.value,
                      quantity: chemical ? chemical.safeStock * 2 : 0,
                      estimatedCost: chemical ? chemical.safeStock * 2 * 600 : 0,
                    }));
                  }}
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">请选择药剂</option>
                  {chemicals.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (当前库存：{c.currentStock} {c.unit})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">采购数量（吨）</label>
                <input
                  type="number"
                  value={newRequest.quantity}
                  onChange={(e) =>
                    setNewRequest((prev) => ({
                      ...prev,
                      quantity: Number(e.target.value),
                      estimatedCost: Number(e.target.value) * 600,
                    }))
                  }
                  className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">预估金额</label>
                <input
                  type="text"
                  value={`¥${formatNumber(newRequest.estimatedCost, 0)}`}
                  disabled
                  className="w-full px-4 py-2 bg-slate-900/30 border border-slate-700 rounded-lg text-slate-400"
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
                onClick={handleCreateRequest}
                className="flex-1 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                提交申请
              </button>
            </div>
          </div>
        </div>
      )}

      {showApproveModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-white mb-4">审批采购申请</h3>
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">药剂名称</span>
                <span className="text-white font-medium">{selectedRequest.chemicalName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">采购数量</span>
                <span className="text-white font-mono">{selectedRequest.quantity} 吨</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">预估金额</span>
                <span className="text-white font-mono">¥{formatNumber(selectedRequest.estimatedCost, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">申请人</span>
                <span className="text-white">{selectedRequest.applicant}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">当前审批级别</span>
                <span className="text-blue-400">
                  第 {getApprovalLevel(selectedRequest.status) + 1} 级
                </span>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">审批意见</label>
              <textarea
                value={approvalComment}
                onChange={(e) => setApprovalComment(e.target.value)}
                placeholder="请输入审批意见（可选）"
                rows={3}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => handleApprove(false)}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                拒绝
              </button>
              <button
                onClick={() => handleApprove(true)}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                通过
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
