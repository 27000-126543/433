import { SlagData, LeachateData } from '@/types';
import { format } from 'date-fns';

export const generateSlagData = (): SlagData => {
  const now = new Date();
  return {
    id: `slag-${Date.now()}`,
    timestamp: format(now, 'yyyy-MM-dd HH:mm:ss'),
    totalSlag: 80 + Math.random() * 20,
    metalContent: 3 + Math.random() * 2,
    metalRecovery: 95 + Math.random() * 3,
    sortingEfficiency: 88 + Math.random() * 8,
    stockQuantity: 150 + Math.random() * 50,
  };
};

export const generateLeachateData = (): LeachateData => {
  const now = new Date();
  const hasAnomaly = Math.random() < 0.1;
  return {
    id: `leach-${Date.now()}`,
    timestamp: format(now, 'yyyy-MM-dd HH:mm:ss'),
    inletLevel: 70 + Math.random() * 20,
    outletLevel: 40 + Math.random() * 20,
    treatmentRate: 85 + Math.random() * 10,
    cod: hasAnomaly ? 1200 : 600 + Math.random() * 300,
    nh3n: hasAnomaly ? 35 : 15 + Math.random() * 10,
    ph: 6.5 + Math.random() * 1.5,
    isStandard: !hasAnomaly,
    backupProcessActive: hasAnomaly,
  };
};

export const mockSlagHistory = (count: number = 24) => {
  const data = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    data.push({
      time: format(time, 'HH:00'),
      totalSlag: 75 + Math.random() * 25,
      metalRecovery: 94 + Math.random() * 4,
      sortingEfficiency: 86 + Math.random() * 10,
    });
  }
  return data;
};

export const mockLeachateHistory = (count: number = 24) => {
  const data = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    data.push({
      time: format(time, 'HH:00'),
      inletLevel: 65 + Math.random() * 25,
      outletLevel: 35 + Math.random() * 25,
      treatmentRate: 82 + Math.random() * 13,
      cod: 550 + Math.random() * 350,
      nh3n: 12 + Math.random() * 13,
    });
  }
  return data;
};

export const leachateStandards = {
  cod: 1000,
  nh3n: 25,
  phMin: 6,
  phMax: 9,
};
