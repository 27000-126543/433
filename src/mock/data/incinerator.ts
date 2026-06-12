import { IncineratorData } from '@/types';
import { format } from 'date-fns';

export const incineratorNames = ['1号焚烧炉', '2号焚烧炉', '3号焚烧炉'];

export const generateIncineratorData = (): IncineratorData[] => {
  const now = new Date();
  return incineratorNames.map((name, index) => {
    const baseTemp = 850 + Math.random() * 100;
    const basePressure = 1.0 + Math.random() * 0.5;
    const hasAlarm = Math.random() < 0.1;
    return {
      id: `inc-${index + 1}`,
      name,
      temperature: hasAlarm && index === 0 ? 1050 : baseTemp,
      pressure: hasAlarm && index === 1 ? 2.5 : basePressure,
      oxygenContent: 6 + Math.random() * 4,
      load: 70 + Math.random() * 25,
      steamFlow: 50 + Math.random() * 20,
      powerGeneration: 12000 + Math.random() * 5000,
      status: hasAlarm ? 'alarm' : Math.random() < 0.15 ? 'warning' : 'normal',
      timestamp: format(now, 'yyyy-MM-dd HH:mm:ss'),
    };
  });
};

export const mockIncineratorHistory = (count: number = 60) => {
  const data = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5000);
    data.push({
      time: format(time, 'HH:mm:ss'),
      temp1: 850 + Math.random() * 80,
      temp2: 860 + Math.random() * 70,
      temp3: 840 + Math.random() * 90,
      pressure1: 1.0 + Math.random() * 0.4,
      pressure2: 1.1 + Math.random() * 0.3,
      pressure3: 0.9 + Math.random() * 0.5,
      load1: 75 + Math.random() * 20,
      load2: 70 + Math.random() * 25,
      load3: 72 + Math.random() * 22,
    });
  }
  return data;
};

export const mockPowerGeneration = () => {
  const hours = [];
  const actual = [];
  const target = [];
  const now = new Date();
  for (let i = 23; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    hours.push(format(time, 'HH:00'));
    const base = 10000 + Math.random() * 6000;
    actual.push(Math.floor(base));
    target.push(12000);
  }
  return { hours, actual, target };
};
