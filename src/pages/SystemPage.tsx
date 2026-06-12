import React, { useState } from 'react';
import { Users, Shield, Settings, Download, Bell, ChevronRight, User, Lock, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { api } from '@/mock/api';
import { roleNames } from '@/types';

export const SystemPage: React.FC = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermission();
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'rules' | 'logs'>('users');

  const handleExportReport = async (type: 'monthly' | 'compliance') => {
    const result = await api.exportReport(type, { period: '2025-01' });
    alert(`已生成${type === 'monthly' ? '月度运营分析报告' : '环保合规明细'}，时间：${result.generatedAt}`);
  };

  const handleUpdateApprovalRule = () => {
    if (confirm('确定要更新审批规则吗？')) {
      alert('审批规则已更新');
    }
  };

  const menuItems = [
    { key: 'users', label: '用户管理', icon: <Users className="w-5 h-5" /> },
    { key: 'roles', label: '角色权限', icon: <Shield className="w-5 h-5" /> },
    { key: 'rules', label: '审批规则', icon: <Settings className="w-5 h-5" /> },
    { key: 'logs', label: '操作日志', icon: <Clock className="w-5 h-5" /> },
  ];

  const users = [
    { id: '1', name: '张伟', username: 'zhangwei', role: 'director', status: 'active', lastLogin: '2025-01-15 09:30' },
    { id: '2', name: '李明', username: 'liming', role: 'operator', status: 'active', lastLogin: '2025-01-15 08:00' },
    { id: '3', name: '王芳', username: 'wangfang', role: 'safety', status: 'active', lastLogin: '2025-01-14 14:20' },
    { id: '4', name: '赵刚', username: 'zhaogang', role: 'maintenance', status: 'active', lastLogin: '2025-01-15 07:30' },
    { id: '5', name: '张磊', username: 'zhanglei', role: 'gatekeeper', status: 'active', lastLogin: '2025-01-15 06:00' },
    { id: '6', name: '刘静', username: 'liujing', role: 'finance', status: 'active', lastLogin: '2025-01-14 16:45' },
  ];

  const roles = Object.entries(roleNames).map(([key, name]) => ({
    key,
    name,
    userCount: users.filter(u => u.role === key).length,
  }));

  const approvalRules = [
    { id: 1, name: '采购审批-一级', description: '运营主管审批采购申请', level: 1, role: 'operator', enabled: true },
    { id: 2, name: '采购审批-二级', description: '设备经理审批采购申请', level: 2, role: 'operator', enabled: true },
    { id: 3, name: '采购审批-三级', description: '总经理审批采购申请', level: 3, role: 'director', enabled: true },
    { id: 4, name: '告警升级-15分钟', description: '告警15分钟未确认升级至厂长', threshold: 15, unit: '分钟', enabled: true },
    { id: 5, name: '工单升级-2小时', description: '工单2小时未接单升级至设备部长', threshold: 2, unit: '小时', enabled: true },
  ];

  const logs = [
    { id: 1, user: '李明', action: '调整1号焚烧炉负荷', detail: '负荷从75%调整至85%', time: '2025-01-15 10:30:15', ip: '192.168.1.101' },
    { id: 2, user: '王芳', action: '确认烟气超标告警', detail: 'SO2超标告警已确认处理', time: '2025-01-15 09:45:22', ip: '192.168.1.102' },
    { id: 3, user: '赵刚', action: '完成维修工单', detail: '2号引风机轴承更换完成', time: '2025-01-15 09:20:08', ip: '192.168.1.103' },
    { id: 4, user: '张伟', action: '审批采购申请', detail: '石灰采购申请已批准', time: '2025-01-15 08:50:33', ip: '192.168.1.100' },
    { id: 5, user: '张磊', action: '登记车辆入场', detail: '车牌京A12345 垃圾称重12.5吨', time: '2025-01-15 08:15:47', ip: '192.168.1.104' },
    { id: 6, user: '系统', action: '自动生成采购建议', detail: '活性炭库存低于安全线', time: '2025-01-15 07:00:00', ip: '127.0.0.1' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">系统管理</h1>
          <p className="text-sm text-slate-400 mt-1">用户管理、权限配置、审批规则设置</p>
        </div>
        {hasPermission('report:export') && (
          <div className="flex gap-3">
            <button
              onClick={() => handleExportReport('monthly')}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              月度报告
            </button>
            <button
              onClick={() => handleExportReport('compliance')}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              环保明细
            </button>
          </div>
        )}
      </div>

      {user?.role === 'director' && (
        <div className="bg-gradient-to-r from-blue-500/10 to-emerald-500/10 border border-blue-500/30 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm font-medium text-blue-400">厂长专属</p>
                <p className="text-xs text-blue-400/70 mt-0.5">您可以调整审批规则和系统配置</p>
              </div>
            </div>
            <button
              onClick={handleUpdateApprovalRule}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-lg transition-colors"
            >
              调整审批规则
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-4">
            <div className="space-y-1">
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setActiveTab(item.key as any)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.key
                      ? 'bg-blue-500/20 text-blue-400'
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <span className="text-sm font-medium">{item.label}</span>
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4" />
              当前用户
            </h4>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="text-white font-medium">{user?.name}</p>
                <p className="text-xs text-slate-400">{roleNames[user?.role || 'gatekeeper']}</p>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-700/50 space-y-2">
              <p className="text-xs text-slate-500 flex items-center justify-between">
                <span>用户名</span>
                <span className="text-slate-400">{user?.username}</span>
              </p>
              <p className="text-xs text-slate-500 flex items-center justify-between">
                <span>用户ID</span>
                <span className="text-slate-400 font-mono">{user?.id}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeTab === 'users' && (
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-base font-semibold text-white mb-4">用户列表</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">用户信息</th>
                      <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">用户名</th>
                      <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">角色</th>
                      <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">状态</th>
                      <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">最后登录</th>
                      <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white text-sm font-bold">
                              {u.name.charAt(0)}
                            </div>
                            <span className="text-white text-sm">{u.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-400 font-mono">{u.username}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                            {roleNames[u.role as keyof typeof roleNames]}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-400" />
                            正常
                          </span>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500">{u.lastLogin}</td>
                        <td className="py-3 px-4">
                          <button className="text-xs text-blue-400 hover:text-blue-300">编辑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'roles' && (
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-base font-semibold text-white mb-4">角色权限配置</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roles.map((role) => (
                  <div key={role.key} className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                          <Shield className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{role.name}</p>
                          <p className="text-xs text-slate-500">{role.userCount} 个用户</p>
                        </div>
                      </div>
                      <button className="text-xs text-blue-400 hover:text-blue-300">配置权限</button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span key={i} className="px-2 py-0.5 bg-slate-700/50 text-slate-400 text-[10px] rounded">
                          权限{i + 1}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'rules' && (
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-base font-semibold text-white mb-4">审批规则配置</h3>
              <div className="space-y-4">
                {approvalRules.map((rule) => (
                  <div key={rule.id} className="p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">{rule.name}</p>
                        <p className="text-xs text-slate-500 mt-1">{rule.description}</p>
                        {'threshold' in rule && (
                          <p className="text-xs text-blue-400 mt-2">
                            阈值：{rule.threshold} {rule.unit}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 text-xs rounded ${
                          rule.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'
                        }`}>
                          {rule.enabled ? '已启用' : '已禁用'}
                        </span>
                        {hasPermission('*') && (
                          <button className="text-xs text-blue-400 hover:text-blue-300">
                            编辑
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="bg-slate-800/30 backdrop-blur border border-slate-700/50 rounded-xl p-5">
              <h3 className="text-base font-semibold text-white mb-4">操作日志</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">操作人</th>
                      <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">操作</th>
                      <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">详情</th>
                      <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">时间</th>
                      <th className="text-left py-3 px-4 text-xs text-slate-500 font-medium">IP地址</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <User className="w-3 h-3 text-slate-500" />
                            <span className="text-white text-sm">{log.user}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-300">{log.action}</td>
                        <td className="py-3 px-4 text-sm text-slate-400">{log.detail}</td>
                        <td className="py-3 px-4 text-xs text-slate-500">{log.time}</td>
                        <td className="py-3 px-4 text-xs text-slate-500 font-mono">{log.ip}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
