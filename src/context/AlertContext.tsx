import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Alert } from '@/types';
import { api } from '@/mock/api';

interface AlertContextType {
  alerts: Alert[];
  addAlert: (alert: Alert) => void;
  confirmAlert: (alertId: string, userId: string) => Promise<void>;
  loadAlerts: () => Promise<void>;
  unconfirmedCount: number;
  criticalCount: number;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);

  const loadAlerts = useCallback(async () => {
    const data = await api.getAlerts();
    setAlerts(data);
  }, []);

  const addAlert = useCallback((alert: Alert) => {
    setAlerts((prev) => [alert, ...prev].slice(0, 100));
  }, []);

  const confirmAlert = useCallback(async (alertId: string, userId: string) => {
    await api.confirmAlert(alertId, userId);
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId ? { ...a, confirmed: true, confirmedBy: userId } : a
      )
    );
  }, []);

  const unconfirmedCount = alerts.filter((a) => !a.confirmed).length;
  const criticalCount = alerts.filter((a) => !a.confirmed && a.level === 'critical').length;

  return (
    <AlertContext.Provider value={{ alerts, addAlert, confirmAlert, loadAlerts, unconfirmedCount, criticalCount }}>
      {children}
    </AlertContext.Provider>
  );
};

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
