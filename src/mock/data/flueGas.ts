import { FlueGasData } from '@/types';
import { format } from 'date-fns';

export const generateFlueGasData = (): FlueGasData => {
  const now = new Date();
  const hasExceed = Math.random() < 0.05;
  return {
    id: `fg-${Date.now()}`,
    timestamp: format(now, 'yyyy-MM-dd HH:mm:ss'),
    so2: hasExceed ? 120 : 30 + Math.random() * 40,
    nox: hasExceed ? 350 : 150 + Math.random() * 100,
    dust: hasExceed ? 40 : 5 + Math.random() * 15,
    co: hasExceed ? 120 : 20 + Math.random() * 50,
    hcl: hasExceed ? 70 : 20 + Math.random() * 30,
    isStandard: !hasExceed,
  };
};

export const mockFlueGasHistory = (count: number = 60) => {
  const data = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 5000);
    const hasExceed = Math.random() < 0.03;
    const so2 = hasExceed ? 115 : 35 + Math.random() * 35;
    const nox = hasExceed ? 320 : 160 + Math.random() * 90;
    const dust = hasExceed ? 35 : 6 + Math.random() * 12;
    const co = hasExceed ? 110 : 25 + Math.random() * 45;
    const hcl = hasExceed ? 65 : 22 + Math.random() * 28;
    const isStandard = !hasExceed;
    data.push({
      time: format(time, 'HH:mm:ss'),
      timestamp: format(time, 'yyyy-MM-dd\'T\'HH:mm:ss'),
      so2,
      nox,
      dust,
      co,
      hcl,
      isStandard,
    });
  }
  return data;
};

export const emissionStandards = {
  so2: 100,
  nox: 300,
  dust: 30,
  co: 100,
  hcl: 60,
};
