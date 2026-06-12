export type UserRole = 'gatekeeper' | 'operator' | 'maintenance' | 'safety' | 'finance' | 'director';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  permissions: string[];
  avatar?: string;
}

export type VehicleStatus = 'pending' | 'weighing' | 'unloading' | 'completed';

export interface VehicleRecord {
  id: string;
  plateNumber: string;
  driverName: string;
  source: string;
  wasteType: string;
  weight: number;
  arrivalTime: string;
  unloadingArea: string;
  status: VehicleStatus;
  fermentationDays?: number;
  recommendedFurnaceOrder?: number;
}

export type EquipmentStatus = 'normal' | 'warning' | 'alarm';

export interface IncineratorData {
  id: string;
  name: string;
  temperature: number;
  pressure: number;
  oxygenContent: number;
  load: number;
  steamFlow: number;
  powerGeneration: number;
  status: EquipmentStatus;
  timestamp: string;
}

export interface FlueGasData {
  id: string;
  timestamp: string;
  so2: number;
  nox: number;
  dust: number;
  co: number;
  hcl: number;
  isStandard: boolean;
}

export type InventoryStatus = 'normal' | 'low' | 'critical';

export interface ChemicalInventory {
  id: string;
  name: string;
  currentStock: number;
  safeStock: number;
  unit: string;
  lastPurchaseDate: string;
  consumptionRate: number;
  status: InventoryStatus;
}

export type PurchaseStatus = 'pending' | 'approved1' | 'approved2' | 'approved3' | 'rejected' | 'completed';

export interface ApprovalRecord {
  level: number;
  approver: string;
  comment: string;
  time: string;
}

export interface PurchaseRequest {
  id: string;
  chemicalId: string;
  chemicalName: string;
  quantity: number;
  estimatedCost: number;
  applicant: string;
  applyTime: string;
  status: PurchaseStatus;
  approvals: ApprovalRecord[];
}

export type WorkOrderType = 'inspection' | 'repair' | 'maintenance';
export type WorkOrderPriority = 'low' | 'medium' | 'high' | 'urgent';
export type WorkOrderStatus = 'pending' | 'accepted' | 'processing' | 'completed';

export interface WorkOrder {
  id: string;
  equipmentId: string;
  equipmentName: string;
  type: WorkOrderType;
  priority: WorkOrderPriority;
  description: string;
  reporter: string;
  assignee: string;
  status: WorkOrderStatus;
  createTime: string;
  acceptTime?: string;
  completeTime?: string;
  escalationTime?: string;
  isEscalated: boolean;
}

export type AlertType = 'temperature' | 'pressure' | 'emission' | 'equipment' | 'inventory';
export type AlertLevel = 'info' | 'warning' | 'critical';

export interface Alert {
  id: string;
  type: AlertType;
  level: AlertLevel;
  message: string;
  source: string;
  timestamp: string;
  confirmed: boolean;
  confirmedBy?: string;
  confirmedTime?: string;
  escalated: boolean;
  escalationTime?: string;
}

export interface SlagData {
  id: string;
  timestamp: string;
  totalSlag: number;
  metalContent: number;
  metalRecovery: number;
  sortingEfficiency: number;
  stockQuantity: number;
}

export interface LeachateData {
  id: string;
  timestamp: string;
  inletLevel: number;
  outletLevel: number;
  treatmentRate: number;
  cod: number;
  nh3n: number;
  ph: number;
  isStandard: boolean;
  backupProcessActive: boolean;
}

export interface DashboardData {
  incineratorLoad: number;
  totalPowerGeneration: number;
  powerGenerationTarget: number;
  emissionComplianceRate: number;
  equipmentAvailability: number;
  chemicalConsumption: { name: string; value: number }[];
  todayVehicles: number;
  todayWasteWeight: number;
  pendingAlerts: number;
  criticalAlerts: number;
}

export const roleNames: Record<UserRole, string> = {
  gatekeeper: '入场值班员',
  operator: '运行值长',
  maintenance: '维修工',
  safety: '安环部',
  finance: '财务',
  director: '厂长',
};

export const rolePermissions: Record<UserRole, string[]> = {
  gatekeeper: ['vehicle:view', 'vehicle:create', 'vehicle:update'],
  operator: ['vehicle:view', 'incinerator:view', 'incinerator:control', 'fluegas:view', 'slag:view', 'leachate:view', 'alert:confirm'],
  maintenance: ['workorder:view', 'workorder:accept', 'workorder:complete', 'workorder:create'],
  safety: ['fluegas:view', 'fluegas:export', 'slag:view', 'leachate:view', 'alert:confirm', 'rectification:manage'],
  finance: ['chemical:view', 'purchase:view', 'purchase:approve1', 'report:export', 'cost:view'],
  director: ['*'],
};
