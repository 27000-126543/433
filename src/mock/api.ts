import { User, VehicleRecord, IncineratorData, FlueGasData, ChemicalInventory, PurchaseRequest, WorkOrder, Alert, DashboardData, SlagData, LeachateData } from '@/types';
import { login as mockLogin, mockUsers } from './data/users';
import { mockVehicles, generateVehicleRecord } from './data/vehicles';
import { generateIncineratorData, mockIncineratorHistory, mockPowerGeneration } from './data/incinerator';
import { mockFlueGasHistory, emissionStandards } from './data/flueGas';
import { mockChemicals, mockPurchaseRequests, mockChemicalConsumption } from './data/chemicals';
import { mockWorkOrders, mockEquipmentStatus } from './data/workOrders';
import { mockAlerts, mockDashboardAlerts } from './data/alerts';
import { mockSlagHistory, mockLeachateHistory, generateSlagData, generateLeachateData, leachateStandards } from './data/slagLeachate';
import { format } from 'date-fns';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  login: async (username: string, password: string): Promise<User | null> => {
    await delay(500);
    return mockLogin(username, password);
  },

  getCurrentUser: async (): Promise<User | null> => {
    await delay(200);
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  },

  getVehicleRecords: async (): Promise<VehicleRecord[]> => {
    await delay(300);
    return [...mockVehicles];
  },

  createVehicleRecord: async (data: Omit<VehicleRecord, 'id'>): Promise<VehicleRecord> => {
    await delay(500);
    const newRecord: VehicleRecord = {
      ...data,
      id: `v-${Date.now()}`,
    };
    mockVehicles.unshift(newRecord);
    return newRecord;
  },

  getIncineratorRealtime: async (): Promise<IncineratorData[]> => {
    await delay(200);
    return generateIncineratorData();
  },

  getIncineratorHistory: async (): Promise<any[]> => {
    await delay(300);
    return mockIncineratorHistory(60);
  },

  getPowerGeneration: async () => {
    await delay(300);
    return mockPowerGeneration();
  },

  getFlueGasHistory: async (): Promise<any[]> => {
    await delay(300);
    return mockFlueGasHistory(60);
  },

  getEmissionStandards: async () => {
    return emissionStandards;
  },

  getChemicalInventory: async (): Promise<ChemicalInventory[]> => {
    await delay(300);
    return [...mockChemicals];
  },

  getPurchaseRequests: async (): Promise<PurchaseRequest[]> => {
    await delay(300);
    return [...mockPurchaseRequests];
  },

  createPurchaseRequest: async (data: Omit<PurchaseRequest, 'id' | 'approvals' | 'status'>): Promise<PurchaseRequest> => {
    await delay(500);
    const newRequest: PurchaseRequest = {
      ...data,
      id: `pr-${Date.now()}`,
      status: 'pending',
      approvals: [],
    };
    mockPurchaseRequests.unshift(newRequest);
    return newRequest;
  },

  approvePurchase: async (requestId: string, level: number, comment: string, userId: string): Promise<PurchaseRequest | null> => {
    await delay(500);
    const request = mockPurchaseRequests.find((r) => r.id === requestId);
    if (!request) return null;

    const user = mockUsers.find((u) => u.id === userId);
    const approval = {
      level,
      approver: user?.name || '未知',
      comment,
      time: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
    };
    request.approvals.push(approval);

    if (level === 1) request.status = 'approved1';
    else if (level === 2) request.status = 'approved2';
    else if (level === 3) request.status = 'approved3';

    return request;
  },

  getWorkOrders: async (): Promise<WorkOrder[]> => {
    await delay(300);
    return [...mockWorkOrders];
  },

  createWorkOrder: async (data: Omit<WorkOrder, 'id' | 'status' | 'isEscalated'>): Promise<WorkOrder> => {
    await delay(500);
    const newOrder: WorkOrder = {
      ...data,
      id: `wo-${Date.now()}`,
      status: 'pending',
      isEscalated: false,
    };
    mockWorkOrders.unshift(newOrder);
    return newOrder;
  },

  acceptWorkOrder: async (orderId: string): Promise<WorkOrder | null> => {
    await delay(500);
    const order = mockWorkOrders.find((o) => o.id === orderId);
    if (!order) return null;
    order.status = 'accepted';
    order.acceptTime = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    return order;
  },

  completeWorkOrder: async (orderId: string): Promise<WorkOrder | null> => {
    await delay(500);
    const order = mockWorkOrders.find((o) => o.id === orderId);
    if (!order) return null;
    order.status = 'completed';
    order.completeTime = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    return order;
  },

  getEquipmentStatus: async () => {
    await delay(200);
    return mockEquipmentStatus();
  },

  getAlerts: async (): Promise<Alert[]> => {
    await delay(300);
    return [...mockAlerts];
  },

  confirmAlert: async (alertId: string, userId: string): Promise<Alert | null> => {
    await delay(300);
    const alert = mockAlerts.find((a) => a.id === alertId);
    if (!alert) return null;
    const user = mockUsers.find((u) => u.id === userId);
    alert.confirmed = true;
    alert.confirmedBy = user?.name || '未知';
    alert.confirmedTime = format(new Date(), 'yyyy-MM-dd HH:mm:ss');
    return alert;
  },

  getDashboardData: async (): Promise<DashboardData> => {
    await delay(500);
    const incinerators = generateIncineratorData();
    const alerts = mockDashboardAlerts();
    const equipment = mockEquipmentStatus();
    const chemicals = mockChemicalConsumption();
    
    const totalPower = incinerators.reduce((sum, inc) => sum + inc.powerGeneration, 0);
    
    return {
      incineratorLoad: Math.round(incinerators.reduce((sum, inc) => sum + inc.load, 0) / incinerators.length),
      totalPowerGeneration: totalPower,
      powerGenerationTarget: 36000,
      emissionComplianceRate: 98.5,
      equipmentAvailability: equipment.availability,
      chemicalConsumption: [
        { name: '石灰', value: Math.round(chemicals.lime[chemicals.lime.length - 1]) },
        { name: '活性炭', value: Math.round(chemicals.activatedCarbon[chemicals.activatedCarbon.length - 1] * 10) / 10 },
        { name: '尿素', value: 3 },
        { name: '碱液', value: 5 },
      ],
      todayVehicles: mockVehicles.filter((v) => v.arrivalTime.startsWith(format(new Date(), 'yyyy-MM-dd'))).length || 15,
      todayWasteWeight: Math.round(mockVehicles.reduce((sum, v) => sum + v.weight, 0) * 0.8),
      pendingAlerts: alerts.pending,
      criticalAlerts: alerts.critical,
    };
  },

  getSlagData: async (): Promise<SlagData> => {
    await delay(200);
    return generateSlagData();
  },

  getLeachateData: async (): Promise<LeachateData> => {
    await delay(200);
    return generateLeachateData();
  },

  getSlagHistory: async () => {
    await delay(300);
    return mockSlagHistory(24);
  },

  getLeachateHistory: async () => {
    await delay(300);
    return mockLeachateHistory(24);
  },

  getLeachateStandards: async () => {
    return leachateStandards;
  },

  getChemicalConsumption: async () => {
    await delay(300);
    return mockChemicalConsumption();
  },

  exportReport: async (type: 'monthly' | 'compliance', params: any) => {
    await delay(1000);
    const now = new Date();
    return {
      type,
      period: params.period || format(now, 'yyyy-MM'),
      generatedAt: format(now, 'yyyy-MM-dd HH:mm:ss'),
      data: `This is ${type} report data for ${params.period}`,
    };
  },
};
