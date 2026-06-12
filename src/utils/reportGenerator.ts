import { api } from '@/mock/api';
import { formatDateTime, formatNumber } from './format';
import { matchFilter, ShiftType } from '@/context/FilterContext';

export const escapeCSV = (value: string | number): string => {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const downloadCSV = (content: string, filename: string) => {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export interface FilterInfo {
  shift: string;
  date: string;
}

const parseFilterInfo = (filterInfo: FilterInfo): { shift: ShiftType; date: string } => {
  let shift: ShiftType = 'all';
  if (filterInfo.shift === '白班') shift = 'day';
  else if (filterInfo.shift === '夜班') shift = 'night';
  
  const date = filterInfo.date === '全部日期' ? '' : filterInfo.date;
  
  return { shift, date };
};

const getTimeField = (item: any): string => {
  return item.timestamp || item.time || item.arrivalTime || item.createTime || '';
};

export const generateMonthlyReport = async (
  month: string,
  filterInfo: FilterInfo
): Promise<{ csvContent: string; summary: any }> => {
  const lines: string[] = [];
  const { shift, date } = parseFilterInfo(filterInfo);
  const hasFilter = shift !== 'all' || date;

  lines.push('大型垃圾焚烧发电厂 - 月度运营分析报告');
  lines.push(`月份,${month}`);
  lines.push(`生成时间,${formatDateTime(new Date().toISOString())}`);
  lines.push(`筛选班次,${filterInfo.shift}`);
  lines.push(`筛选日期,${filterInfo.date}`);
  lines.push('');

  try {
    const allVehicles = await api.getVehicles();
    const allIncinerators = await api.getIncinerators();
    const allWorkOrders = await api.getWorkOrders();
    const incineratorHistory = await api.getIncineratorHistory();
    const chemicals = await api.getChemicals();
    const allFlueGasList = await api.getFlueGasHistory();
    const allAlerts = await api.getAlerts();
    
    const vehicles = hasFilter 
      ? allVehicles.filter(v => matchFilter(getTimeField(v), shift, date))
      : allVehicles;
    const workOrders = hasFilter
      ? allWorkOrders.filter(w => matchFilter(getTimeField(w), shift, date))
      : allWorkOrders;
    const filteredHistory = hasFilter
      ? incineratorHistory.filter(h => matchFilter(getTimeField(h), shift, date))
      : incineratorHistory;
    const flueGasList = hasFilter
      ? allFlueGasList.filter(fg => matchFilter(getTimeField(fg), shift, date))
      : allFlueGasList;
    const alerts = hasFilter
      ? allAlerts.filter(a => matchFilter(getTimeField(a), shift, date))
      : allAlerts;
    
    const emissionStandards = {
      so2: 100,
      nox: 300,
      dust: 30,
      co: 100,
      hcl: 60
    };

    const envExceedRecords: any[] = [];
    flueGasList.forEach(fg => {
      if (fg.so2 > emissionStandards.so2) envExceedRecords.push({ time: fg.timestamp, type: 'SO2', value: fg.so2, standard: emissionStandards.so2 });
      if (fg.nox > emissionStandards.nox) envExceedRecords.push({ time: fg.timestamp, type: 'NOx', value: fg.nox, standard: emissionStandards.nox });
      if (fg.dust > emissionStandards.dust) envExceedRecords.push({ time: fg.timestamp, type: '粉尘', value: fg.dust, standard: emissionStandards.dust });
      if (fg.co > emissionStandards.co) envExceedRecords.push({ time: fg.timestamp, type: 'CO', value: fg.co, standard: emissionStandards.co });
      if (fg.hcl > emissionStandards.hcl) envExceedRecords.push({ time: fg.timestamp, type: 'HCl', value: fg.hcl, standard: emissionStandards.hcl });
    });

    const envComplianceRate = flueGasList.length > 0
      ? Math.round(((flueGasList.length - envExceedRecords.filter(r => r).length / 5) / flueGasList.length) * 1000) / 10
      : 100;

    const envAlerts = alerts.filter(a => a.type === 'emission');
    
    const incinerators = filteredHistory.length > 0 
      ? filteredHistory.map((h: any, idx: number) => ({
          ...allIncinerators[idx % allIncinerators.length],
          load: typeof h.load1 === 'number' ? (h.load1 + h.load2 + h.load3) / 3 : h.load,
          temperature: typeof h.temp1 === 'number' ? (h.temp1 + h.temp2 + h.temp3) / 3 : undefined,
        }))
      : allIncinerators;

    const totalWaste = vehicles.reduce((sum, v) => sum + (v.weight || 0), 0);
    const totalPower = incinerators.reduce((sum, i) => sum + (i.powerGeneration || 0), 0);
    const avgLoad = incinerators.length > 0 
      ? incinerators.reduce((sum, i) => sum + (i.load || 0), 0) / incinerators.length 
      : 0;
    const completedOrders = workOrders.filter(w => w.status === 'completed').length;
    const equipmentRate = workOrders.length > 0 
      ? Math.round((completedOrders / workOrders.length) * 1000) / 10 
      : 100;

    lines.push('=== 一、关键指标汇总 ===');
    lines.push('指标名称,数值,单位');
    lines.push(`垃圾总处理量,${formatNumber(totalWaste, 1)},吨`);
    lines.push(`总发电量,${formatNumber(totalPower / 1000, 2)},MWh`);
    lines.push(`平均焚烧线负荷,${formatNumber(avgLoad, 1)},%`);
    lines.push(`设备完好率,${formatNumber(equipmentRate, 1)},%`);
    lines.push(`完成工单数量,${completedOrders},单`);
    lines.push(`烟气排放合规率,${formatNumber(Math.min(envComplianceRate, 100), 2)},%`);
    lines.push(`超标记录数量,${envExceedRecords.length},条`);
    lines.push(`环保告警数量,${envAlerts.length},条`);
    lines.push('');

    lines.push('=== 二、焚烧炉运行数据 ===');
    lines.push('焚烧炉名称,温度(℃),压力(MPa),负荷(%),发电量(MWh),状态');
    incinerators.forEach(inc => {
      lines.push([
        inc.name,
        formatNumber(inc.temperature, 0),
        formatNumber(inc.pressure, 2),
        formatNumber(inc.load, 1),
        formatNumber((inc.powerGeneration || 0) / 1000, 2),
        inc.status === 'normal' ? '运行中' : inc.status === 'warning' ? '警告' : '告警'
      ].map(escapeCSV).join(','));
    });
    lines.push('');

    lines.push('=== 三、药剂库存与消耗 ===');
    lines.push('药剂名称,当前库存,安全库存,单位,消耗速率(天),可用天数,状态');
    chemicals.forEach(chem => {
      const daysLeft = Math.round(chem.currentStock / chem.consumptionRate);
      const statusText = chem.status === 'normal' ? '正常' : chem.status === 'low' ? '偏低' : '危急';
      lines.push([
        chem.name,
        formatNumber(chem.currentStock, 0),
        formatNumber(chem.safeStock, 0),
        chem.unit,
        formatNumber(chem.consumptionRate, 2),
        daysLeft,
        statusText
      ].map(escapeCSV).join(','));
    });
    lines.push('');

    lines.push('=== 四、车辆入场记录 ===');
    lines.push('车牌号,司机,来源,垃圾类型,重量(吨),到达时间,卸料区域');
    vehicles.slice(0, 50).forEach(v => {
      lines.push([
        v.plateNumber,
        v.driverName,
        v.source,
        v.wasteType,
        formatNumber(v.weight || 0, 1),
        formatDateTime(v.arrivalTime),
        v.unloadingArea || '-'
      ].map(escapeCSV).join(','));
    });
    lines.push('');

    lines.push('=== 五、设备运维工单 ===');
    lines.push('设备名称,类型,优先级,问题描述,报修人,处理班组,状态,创建时间');
    workOrders.forEach(w => {
      const typeText = w.type === 'repair' ? '故障维修' : w.type === 'inspection' ? '巡检' : w.type === 'maintenance' ? '定期维护' : '其他';
      const priorityText = w.priority === 'urgent' ? '紧急' : w.priority === 'high' ? '高' : w.priority === 'medium' ? '中' : '低';
      const statusText = w.status === 'pending' ? '待接单' : w.status === 'accepted' ? '处理中' : w.status === 'processing' ? '维修中' : '已完成';
      lines.push([
        w.equipmentName,
        typeText,
        priorityText,
        w.description,
        w.reporter,
        w.assignee,
        statusText,
        formatDateTime(w.createTime)
      ].map(escapeCSV).join(','));
    });
    lines.push('');

    lines.push('=== 六、环保合规摘要 ===');
    lines.push('指标名称,数值,单位');
    lines.push(`烟气检测次数,${flueGasList.length},次`);
    lines.push(`排放合规率,${formatNumber(Math.min(envComplianceRate, 100), 2)},%`);
    lines.push(`超标记录数,${envExceedRecords.length},条`);
    lines.push(`环保告警数,${envAlerts.length},条`);
    lines.push('');

    lines.push('=== 七、超标记录清单 ===');
    if (envExceedRecords.length > 0) {
      lines.push('时间,污染物类型,实测值(mg/m³),标准限值(mg/m³),超标倍数');
      envExceedRecords.slice(0, 10).forEach(r => {
        const multiple = Math.round((r.value / r.standard) * 100) / 100;
        lines.push([
          formatDateTime(r.time),
          r.type,
          formatNumber(r.value, 2),
          r.standard,
          formatNumber(multiple, 2)
        ].map(escapeCSV).join(','));
      });
    } else {
      lines.push('本周期内无超标记录');
    }
    lines.push('');

    lines.push('=== 八、环保合规结论 ===');
    lines.push(envExceedRecords.length === 0
      ? '本周期内各项环保指标全部达标，运营合规'
      : `本周期内共发现${envExceedRecords.length}条超标记录，需重点关注整改`);
    lines.push('');

    const summary = {
      type: 'monthly',
      month,
      filterInfo,
      keyMetrics: {
        vehicleCount: vehicles.length,
        wasteWeight: vehicles.reduce((s, v) => s + (v.weight || 0), 0),
        incineratorCount: incinerators.length,
        workOrderCount: workOrders.length,
        completedOrders: workOrders.filter(w => w.status === 'completed').length,
        chemicalCount: chemicals.length,
        flueGasTests: flueGasList.length,
        exceedCount: envExceedRecords.length,
        complianceRate: formatNumber(Math.min(envComplianceRate, 100), 2),
        envAlerts: envAlerts.length,
      },
      exceedRecords: envExceedRecords.slice(0, 10),
      conclusion: envExceedRecords.length === 0
        ? '本周期内各项环保指标全部达标，运营合规'
        : `本周期内共发现${envExceedRecords.length}条超标记录，需重点关注整改`,
      records: {
        vehicles: vehicles.length,
        incineratorHistory: incinerators.length,
        workOrders: workOrders.length,
      }
    };

    return {
      csvContent: lines.join('\n'),
      summary
    };
  } catch (error) {
    console.error('Error fetching report data:', error);
    lines.push('数据获取异常');
    return {
      csvContent: lines.join('\n'),
      summary: {
        type: 'monthly',
        month,
        filterInfo,
        keyMetrics: {},
        records: {}
      }
    };
  }
};

export const generateComplianceReport = async (
  month: string,
  filterInfo: FilterInfo
): Promise<{ csvContent: string; summary: any }> => {
  const lines: string[] = [];
  const { shift, date } = parseFilterInfo(filterInfo);
  const hasFilter = shift !== 'all' || date;

  lines.push('大型垃圾焚烧发电厂 - 环保合规明细报告');
  lines.push(`月份,${month}`);
  lines.push(`生成时间,${formatDateTime(new Date().toISOString())}`);
  lines.push(`筛选班次,${filterInfo.shift}`);
  lines.push(`筛选日期,${filterInfo.date}`);
  lines.push('');

  let summary: any = {
    type: 'compliance',
    month,
    filterInfo,
    keyMetrics: {},
    exceedRecords: [],
    envAlertsCount: 0,
    conclusion: '',
    records: {},
  };

  try {
    const allFlueGasList = await api.getFlueGasHistory();
    const allAlerts = await api.getAlerts();
    const allLeachateList = await api.getLeachateHistory();
    
    const flueGasList = hasFilter
      ? allFlueGasList.filter(fg => matchFilter(getTimeField(fg), shift, date))
      : allFlueGasList;
    const alerts = hasFilter
      ? allAlerts.filter(a => matchFilter(getTimeField(a), shift, date))
      : allAlerts;
    const leachateList = hasFilter
      ? allLeachateList.filter(l => matchFilter(getTimeField(l), shift, date))
      : allLeachateList;

    const emissionStandards = {
      so2: 100,
      nox: 300,
      dust: 30,
      co: 100,
      hcl: 60
    };

    const exceedRecords: any[] = [];
    flueGasList.forEach(fg => {
      if (fg.so2 > emissionStandards.so2) exceedRecords.push({ time: fg.timestamp, type: 'SO2', value: fg.so2, standard: emissionStandards.so2 });
      if (fg.nox > emissionStandards.nox) exceedRecords.push({ time: fg.timestamp, type: 'NOx', value: fg.nox, standard: emissionStandards.nox });
      if (fg.dust > emissionStandards.dust) exceedRecords.push({ time: fg.timestamp, type: '粉尘', value: fg.dust, standard: emissionStandards.dust });
      if (fg.co > emissionStandards.co) exceedRecords.push({ time: fg.timestamp, type: 'CO', value: fg.co, standard: emissionStandards.co });
      if (fg.hcl > emissionStandards.hcl) exceedRecords.push({ time: fg.timestamp, type: 'HCl', value: fg.hcl, standard: emissionStandards.hcl });
    });

    const complianceRate = flueGasList.length > 0
      ? Math.round(((flueGasList.length - exceedRecords.filter(r => r).length / 5) / flueGasList.length) * 1000) / 10
      : 100;

    const envAlerts = alerts.filter(a => a.type === 'emission');

    summary = {
      ...summary,
      keyMetrics: {
        flueGasTests: flueGasList.length,
        exceedCount: exceedRecords.length,
        complianceRate: formatNumber(Math.min(complianceRate, 100), 2),
        envAlerts: envAlerts.length,
        leachateTests: leachateList.length,
      },
      exceedRecords: exceedRecords.slice(0, 10),
      envAlertsCount: envAlerts.length,
      conclusion: exceedRecords.length === 0 ? '本周期内各项环保指标全部达标，运营合规' : `本周期内共发现${exceedRecords.length}条超标记录，需重点关注整改`,
      records: {
        flueGasList: flueGasList.length,
        envAlerts: envAlerts.length,
        leachateList: leachateList.length,
      }
    };

    lines.push('=== 一、环保达标总体情况 ===');
    lines.push('指标名称,数值');
    lines.push(`烟气排放检测总次数,${flueGasList.length}`);
    lines.push(`超标记录次数,${exceedRecords.length}`);
    lines.push(`环保合规率,${formatNumber(Math.min(complianceRate, 100), 2)}%`);
    lines.push(`环保相关告警数,${envAlerts.length}`);
    lines.push('');

    lines.push('=== 二、排放标准限值 ===');
    lines.push('污染物,限值(mg/m³)');
    lines.push(`二氧化硫(SO2),${emissionStandards.so2}`);
    lines.push(`氮氧化物(NOx),${emissionStandards.nox}`);
    lines.push(`粉尘,${emissionStandards.dust}`);
    lines.push(`一氧化碳(CO),${emissionStandards.co}`);
    lines.push(`氯化氢(HCl),${emissionStandards.hcl}`);
    lines.push('');

    lines.push('=== 三、烟气排放明细 ===');
    lines.push('时间,SO2(mg/m³),NOx(mg/m³),粉尘(mg/m³),CO(mg/m³),HCl(mg/m³),达标状态');
    flueGasList.slice(0, 200).forEach(fg => {
      lines.push([
        formatDateTime(fg.timestamp),
        formatNumber(fg.so2, 2),
        formatNumber(fg.nox, 2),
        formatNumber(fg.dust, 2),
        formatNumber(fg.co, 2),
        formatNumber(fg.hcl, 2),
        fg.isStandard ? '达标' : '超标'
      ].map(escapeCSV).join(','));
    });
    lines.push('');

    lines.push('=== 四、超标记录 ===');
    if (exceedRecords.length > 0) {
      lines.push('时间,污染物类型,实测值(mg/m³),标准限值(mg/m³),超标倍数');
      exceedRecords.forEach(r => {
        const multiple = Math.round((r.value / r.standard) * 100) / 100;
        lines.push([
          formatDateTime(r.time),
          r.type,
          formatNumber(r.value, 2),
          r.standard,
          formatNumber(multiple, 2)
        ].map(escapeCSV).join(','));
      });
    } else {
      lines.push('本周期内无超标记录');
    }
    lines.push('');

    lines.push('=== 五、环保告警记录 ===');
    if (envAlerts.length > 0) {
      lines.push('时间,告警级别,告警内容,确认状态');
      envAlerts.forEach(a => {
        const levelText = a.level === 'critical' ? '严重' : a.level === 'warning' ? '警告' : '提示';
        lines.push([
          formatDateTime(a.timestamp),
          levelText,
          a.message,
          a.confirmed ? '已确认' : '未确认'
        ].map(escapeCSV).join(','));
      });
    } else {
      lines.push('本周期内无环保告警');
    }
    lines.push('');

    lines.push('=== 六、渗滤液处理出水指标 ===');
    if (leachateList.length > 0) {
      lines.push('时间,COD(mg/L),氨氮(mg/L),pH值,达标状态');
      leachateList.slice(0, 100).forEach(l => {
        lines.push([
          formatDateTime(l.timestamp),
          formatNumber(l.cod, 2),
          formatNumber(l.nh3n, 2),
          formatNumber(l.ph, 2),
          l.isStandard ? '达标' : '超标'
        ].map(escapeCSV).join(','));
      });
    } else {
      lines.push('暂无渗滤液数据');
    }
  } catch (error) {
    console.error('Error fetching compliance data:', error);
    lines.push('数据获取异常');
  }

  return {
    csvContent: lines.join('\n'),
    summary
  };
};
