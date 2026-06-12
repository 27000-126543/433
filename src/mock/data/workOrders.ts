import { WorkOrder } from '@/types';
import { format, subHours, subDays } from 'date-fns';

const equipments = [
  '1号焚烧炉排', '2号引风机', '3号除尘器', '1号余热锅炉', '2号汽轮机',
  '3号发电机', '1号烟气净化塔', '2号渗滤液泵', '3号循环水泵', '1号炉排减速机',
];

const types: WorkOrder['type'][] = ['inspection', 'repair', 'maintenance'];
const priorities: WorkOrder['priority'][] = ['low', 'medium', 'high', 'urgent'];
const statuses: WorkOrder['status'][] = ['pending', 'accepted', 'processing', 'completed'];
const reporters = ['运行值长-李明', '安环部-王芳', '入场值班-张磊', '巡检员-刘强'];
const assignees = ['维修一班-赵刚', '维修二班-孙伟', '维修三班-周明', '维修四班-吴健'];

export const generateWorkOrder = (id: number): WorkOrder => {
  const now = new Date();
  const hoursAgo = Math.floor(Math.random() * 48);
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const priority = priorities[Math.floor(Math.random() * priorities.length)];
  const createTime = subHours(now, hoursAgo);
  const isEscalated = status === 'pending' && hoursAgo > 2 && priority !== 'low';
  
  return {
    id: `wo-${id}`,
    equipmentId: `eq-${id % 10}`,
    equipmentName: equipments[id % equipments.length],
    type: types[id % types.length],
    priority,
    description: getDescription(equipments[id % equipments.length], types[id % types.length]),
    reporter: reporters[id % reporters.length],
    assignee: assignees[id % assignees.length],
    status,
    createTime: format(createTime, 'yyyy-MM-dd HH:mm:ss'),
    acceptTime: status !== 'pending' ? format(subHours(createTime, Math.floor(Math.random() * 2)), 'yyyy-MM-dd HH:mm:ss') : undefined,
    completeTime: status === 'completed' ? format(subHours(createTime, Math.floor(Math.random() * 10)), 'yyyy-MM-dd HH:mm:ss') : undefined,
    escalationTime: isEscalated ? format(subHours(createTime, 2), 'yyyy-MM-dd HH:mm:ss') : undefined,
    isEscalated,
  };
};

const getDescription = (equipment: string, type: string) => {
  const descriptions: Record<string, string[]> = {
    inspection: [
      `对${equipment}进行例行巡检，检查运行状态`,
      `检查${equipment}的温度、压力参数`,
      `${equipment}外观检查和清洁`,
    ],
    repair: [
      `${equipment}出现异常噪音，需要检修`,
      `${equipment}温度异常偏高，故障排查`,
      `${equipment}振动超标，需要紧固`,
    ],
    maintenance: [
      `${equipment}定期保养，更换润滑油`,
      `${equipment}滤芯更换和清洁`,
      `${equipment}易损件检查更换`,
    ],
  };
  const list = descriptions[type] || descriptions.inspection;
  return list[Math.floor(Math.random() * list.length)];
};

export const mockWorkOrders: WorkOrder[] = Array.from({ length: 30 }, (_, i) => generateWorkOrder(i));

export const mockEquipmentStatus = () => {
  return {
    total: 56,
    normal: 48,
    warning: 5,
    fault: 3,
    availability: 92.8,
  };
};
