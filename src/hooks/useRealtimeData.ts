import { useState, useEffect, useCallback, useRef } from 'react';
import { useRealtimeGenerator, RealtimeData } from '@/mock/generators/realtimeData';
import { useAlert } from '@/context/AlertContext';
import { IncineratorData, FlueGasData, SlagData, LeachateData } from '@/types';

export const useRealtimeData = (enabled: boolean = true, interval: number = 5000) => {
  const [incinerators, setIncinerators] = useState<IncineratorData[]>([]);
  const [flueGas, setFlueGas] = useState<FlueGasData | null>(null);
  const [slag, setSlag] = useState<SlagData | null>(null);
  const [leachate, setLeachate] = useState<LeachateData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { addAlert } = useAlert();
  const isRunningRef = useRef(false);

  const handleData = useCallback(
    (data: RealtimeData) => {
      setIncinerators(data.incinerators);
      setFlueGas(data.flueGas);
      setSlag(data.slag);
      setLeachate(data.leachate);
      if (data.newAlert) {
        addAlert(data.newAlert);
      }
    },
    [addAlert]
  );

  const generatorRef = useRef(useRealtimeGenerator(handleData, interval));

  useEffect(() => {
    if (!enabled || isRunningRef.current) return;

    isRunningRef.current = true;
    setIsConnected(true);
    generatorRef.current.start();

    return () => {
      isRunningRef.current = false;
      setIsConnected(false);
      generatorRef.current.stop();
    };
  }, [enabled, interval]);

  return {
    incinerators,
    flueGas,
    slag,
    leachate,
    isConnected,
  };
};
