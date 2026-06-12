import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatNumber = (num: number | null | undefined, decimals: number = 2): string => {
  if (num === null || num === undefined || isNaN(Number(num))) return '-';
  return Number(num).toFixed(decimals);
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    return format(d, 'yyyy-MM-dd HH:mm:ss', { locale: zhCN });
  } catch (e) {
    return '-';
  }
};

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    return format(d, 'yyyy-MM-dd', { locale: zhCN });
  } catch (e) {
    return '-';
  }
};

export const formatTime = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '-';
    return format(d, 'HH:mm:ss', { locale: zhCN });
  } catch (e) {
    return '-';
  }
};

export const formatLargeNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(2) + '万';
  }
  return num.toString();
};

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    normal: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    alarm: 'text-red-400 bg-red-500/10 border-red-500/20',
    low: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    critical: 'text-red-400 bg-red-500/10 border-red-500/20',
    pending: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    weighing: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
    unloading: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    completed: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    accepted: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    processing: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    approved1: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    approved2: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    approved3: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rejected: 'text-red-400 bg-red-500/10 border-red-500/20',
  };
  return colors[status] || 'text-gray-400 bg-gray-500/10 border-gray-500/20';
};

export const getStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    normal: '正常',
    warning: '警告',
    alarm: '告警',
    low: '库存偏低',
    critical: '库存危急',
    pending: '待处理',
    weighing: '称重中',
    unloading: '卸料中',
    completed: '已完成',
    accepted: '已接单',
    processing: '处理中',
    approved1: '一级审批通过',
    approved2: '二级审批通过',
    approved3: '三级审批通过',
    rejected: '已拒绝',
    info: '信息',
  };
  return texts[status] || status;
};

export const getPriorityColor = (priority: string): string => {
  const colors: Record<string, string> = {
    low: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
    medium: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    high: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    urgent: 'text-red-400 bg-red-500/10 border-red-500/20',
  };
  return colors[priority] || colors.low;
};

export const getPriorityText = (priority: string): string => {
  const texts: Record<string, string> = {
    low: '低',
    medium: '中',
    high: '高',
    urgent: '紧急',
  };
  return texts[priority] || priority;
};

export const getAlertLevelColor = (level: string): string => {
  const colors: Record<string, string> = {
    info: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    warning: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    critical: 'text-red-400 bg-red-500/10 border-red-500/20 animate-pulse',
  };
  return colors[level] || colors.info;
};

export const getAlertLevelText = (level: string): string => {
  const texts: Record<string, string> = {
    info: '信息',
    warning: '警告',
    critical: '严重',
  };
  return texts[level] || level;
};

export const getTypeText = (type: string): string => {
  const texts: Record<string, string> = {
    inspection: '巡检',
    repair: '维修',
    maintenance: '保养',
    temperature: '温度',
    pressure: '压力',
    emission: '排放',
    equipment: '设备',
    inventory: '库存',
  };
  return texts[type] || type;
};

export const getWorkOrderTypeText = (type: string): string => {
  const texts: Record<string, string> = {
    inspection: '巡检',
    repair: '维修',
    maintenance: '保养',
  };
  return texts[type] || type;
};
