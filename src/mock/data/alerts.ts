import { Alert } from '@/types';
import { format, subMinutes } from 'date-fns';

const alertTypes: Alert['type'][] = ['temperature', 'pressure', 'emission', 'equipment', 'inventory'];
const levels: Alert['level'][] = ['info', 'warning', 'critical'];

const alertMessages: Record<Alert['type'], string[]> = {
  temperature: [
    '1号焚烧炉温度超过1000°C，请关注',
    '2号焚烧炉温度波动异常，建议检查',
    '余热锅炉出口温度偏高',
  ],
  pressure: [
    '1号炉膛压力异常升高',
    '2号引风机出口压力超标',
    '除尘器压差过大，需要清灰',
  ],
  emission: [
    'SO2排放浓度接近限值，请调整运行参数',
    'NOx排放超标，请检查脱硝系统',
    '粉尘排放瞬时超标，请确认',
  ],
  equipment: [
    '1号炉排减速机振动超标',
    '2号循环水泵轴承温度偏高',
    '3号引风机电流异常波动',
  ],
  inventory: [
    '石灰库存低于安全线，请及时采购',
    '活性炭库存不足3天用量',
    '尿素库存偏低，建议补充',
  ],
};

const sources = ['1号焚烧炉', '2号焚烧炉', '3号焚烧炉', '烟气净化系统', '渗滤液处理站', '药剂仓库'];

export const generateAlert = (id: number): Alert => {
  const now = new Date();
  const minutesAgo = Math.floor(Math.random() * 60);
  const type = alertTypes[Math.floor(Math.random() * alertTypes.length)];
  const level = levels[Math.floor(Math.random() * levels.length)];
  const messages = alertMessages[type];
  const confirmed = Math.random() < 0.6;
  const escalated = !confirmed && minutesAgo > 15 && level !== 'info';

  return {
    id: `alert-${id}`,
    type,
    level,
    message: messages[Math.floor(Math.random() * messages.length)],
    source: sources[Math.floor(Math.random() * sources.length)],
    timestamp: format(subMinutes(now, minutesAgo), 'yyyy-MM-dd HH:mm:ss'),
    confirmed,
    confirmedBy: confirmed ? '李值长' : undefined,
    confirmedTime: confirmed ? format(subMinutes(now, minutesAgo + Math.floor(Math.random() * 10)), 'yyyy-MM-dd HH:mm:ss') : undefined,
    escalated,
    escalationTime: escalated ? format(subMinutes(now, 15), 'yyyy-MM-dd HH:mm:ss') : undefined,
  };
};

export const mockAlerts: Alert[] = Array.from({ length: 15 }, (_, i) => generateAlert(i));

export const mockDashboardAlerts = () => {
  const critical = mockAlerts.filter((a) => a.level === 'critical' && !a.confirmed);
  const pending = mockAlerts.filter((a) => !a.confirmed);
  return {
    critical: critical.length,
    pending: pending.length,
    recent: mockAlerts.slice(0, 5),
  };
};
