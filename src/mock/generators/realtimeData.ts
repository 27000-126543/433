import { generateIncineratorData } from '../data/incinerator';
import { generateFlueGasData } from '../data/flueGas';
import { generateSlagData, generateLeachateData } from '../data/slagLeachate';
import { generateAlert } from '../data/alerts';
import { IncineratorData, FlueGasData, SlagData, LeachateData, Alert } from '@/types';

export interface RealtimeData {
  incinerators: IncineratorData[];
  flueGas: FlueGasData;
  slag: SlagData;
  leachate: LeachateData;
  newAlert?: Alert;
}

let alertCounter = 100;

export const generateRealtimeData = (): RealtimeData => {
  const shouldGenerateAlert = Math.random() < 0.15;
  
  return {
    incinerators: generateIncineratorData(),
    flueGas: generateFlueGasData(),
    slag: generateSlagData(),
    leachate: generateLeachateData(),
    newAlert: shouldGenerateAlert ? generateAlert(alertCounter++) : undefined,
  };
};

export const useRealtimeGenerator = (callback: (data: RealtimeData) => void, interval: number = 5000) => {
  let timer: ReturnType<typeof setInterval> | null = null;

  const start = () => {
    if (timer) return;
    timer = setInterval(() => {
      const data = generateRealtimeData();
      callback(data);
    }, interval);
  };

  const stop = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  };

  return { start, stop };
};
