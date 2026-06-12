import { VehicleRecord } from '@/types';
import { format, subHours } from 'date-fns';

const sources = ['朝阳区垃圾站', '海淀区清运队', '丰台区转运站', '东城区环卫', '西城区清运', '通州区垃圾处理中心'];
const wasteTypes = ['生活垃圾', '厨余垃圾', '可燃垃圾', '混合垃圾'];
const unloadingAreas = ['A区-1号坑', 'A区-2号坑', 'B区-3号坑', 'B区-4号坑', 'C区-5号坑'];
const statuses: VehicleRecord['status'][] = ['pending', 'weighing', 'unloading', 'completed'];
const plates = ['京A12345', '京B67890', '京C11111', '京D22222', '京E33333', '京F44444', '京G55555', '京H66666', '京J77777', '京K88888'];
const drivers = ['张师傅', '李师傅', '王师傅', '刘师傅', '陈师傅', '杨师傅', '黄师傅', '周师傅', '吴师傅', '郑师傅'];

export const generateVehicleRecord = (id: number): VehicleRecord => {
  const now = new Date();
  const hoursAgo = Math.floor(Math.random() * 24);
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  return {
    id: `v-${id}`,
    plateNumber: plates[id % plates.length],
    driverName: drivers[id % drivers.length],
    source: sources[Math.floor(Math.random() * sources.length)],
    wasteType: wasteTypes[Math.floor(Math.random() * wasteTypes.length)],
    weight: Math.floor(Math.random() * 10) + 15,
    arrivalTime: format(subHours(now, hoursAgo), 'yyyy-MM-dd HH:mm:ss'),
    unloadingArea: unloadingAreas[Math.floor(Math.random() * unloadingAreas.length)],
    status,
    fermentationDays: Math.floor(Math.random() * 7) + 3,
    recommendedFurnaceOrder: Math.floor(Math.random() * 10) + 1,
  };
};

export const mockVehicles: VehicleRecord[] = Array.from({ length: 20 }, (_, i) => generateVehicleRecord(i));
