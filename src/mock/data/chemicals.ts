import { ChemicalInventory, PurchaseRequest } from '@/types';
import { format, subDays } from 'date-fns';

export const mockChemicals: ChemicalInventory[] = [
  {
    id: 'c-1',
    name: '石灰',
    currentStock: 8.5,
    safeStock: 10,
    unit: '吨',
    lastPurchaseDate: format(subDays(new Date(), 15), 'yyyy-MM-dd'),
    consumptionRate: 0.8,
    status: 'low',
  },
  {
    id: 'c-2',
    name: '活性炭',
    currentStock: 2.1,
    safeStock: 3,
    unit: '吨',
    lastPurchaseDate: format(subDays(new Date(), 20), 'yyyy-MM-dd'),
    consumptionRate: 0.15,
    status: 'low',
  },
  {
    id: 'c-3',
    name: '尿素',
    currentStock: 5.8,
    safeStock: 4,
    unit: '吨',
    lastPurchaseDate: format(subDays(new Date(), 10), 'yyyy-MM-dd'),
    consumptionRate: 0.3,
    status: 'normal',
  },
  {
    id: 'c-4',
    name: '碱液',
    currentStock: 12.5,
    safeStock: 10,
    unit: '吨',
    lastPurchaseDate: format(subDays(new Date(), 8), 'yyyy-MM-dd'),
    consumptionRate: 0.5,
    status: 'normal',
  },
];

export const mockPurchaseRequests: PurchaseRequest[] = [
  {
    id: 'pr-1',
    chemicalId: 'c-1',
    chemicalName: '石灰',
    quantity: 20,
    estimatedCost: 12000,
    applicant: '运营主管-李明',
    applyTime: format(subDays(new Date(), 1), 'yyyy-MM-dd HH:mm:ss'),
    status: 'approved1',
    approvals: [
      {
        level: 1,
        approver: '运营主管-李明',
        comment: '库存偏低，同意采购',
        time: format(subDays(new Date(), 1), 'yyyy-MM-dd HH:mm:ss'),
      },
    ],
  },
  {
    id: 'pr-2',
    chemicalId: 'c-2',
    chemicalName: '活性炭',
    quantity: 5,
    estimatedCost: 25000,
    applicant: '运营主管-李明',
    applyTime: format(subDays(new Date(), 2), 'yyyy-MM-dd HH:mm:ss'),
    status: 'approved2',
    approvals: [
      {
        level: 1,
        approver: '运营主管-李明',
        comment: '需要补充',
        time: format(subDays(new Date(), 2), 'yyyy-MM-dd HH:mm:ss'),
      },
      {
        level: 2,
        approver: '设备经理-王强',
        comment: '同意采购',
        time: format(subDays(new Date(), 1), 'yyyy-MM-dd HH:mm:ss'),
      },
    ],
  },
  {
    id: 'pr-3',
    chemicalId: 'c-3',
    chemicalName: '尿素',
    quantity: 10,
    estimatedCost: 8000,
    applicant: '运营主管-李明',
    applyTime: format(subDays(new Date(), 3), 'yyyy-MM-dd HH:mm:ss'),
    status: 'pending',
    approvals: [],
  },
  {
    id: 'pr-4',
    chemicalId: 'c-4',
    chemicalName: '碱液',
    quantity: 15,
    estimatedCost: 9000,
    applicant: '运营主管-李明',
    applyTime: format(subDays(new Date(), 5), 'yyyy-MM-dd HH:mm:ss'),
    status: 'completed',
    approvals: [
      {
        level: 1,
        approver: '运营主管-李明',
        comment: '同意',
        time: format(subDays(new Date(), 5), 'yyyy-MM-dd HH:mm:ss'),
      },
      {
        level: 2,
        approver: '设备经理-王强',
        comment: '同意',
        time: format(subDays(new Date(), 4), 'yyyy-MM-dd HH:mm:ss'),
      },
      {
        level: 3,
        approver: '总经理-张伟',
        comment: '批准采购',
        time: format(subDays(new Date(), 3), 'yyyy-MM-dd HH:mm:ss'),
      },
    ],
  },
];

export const mockChemicalConsumption = () => {
  const days = [];
  const lime = [];
  const activatedCarbon = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 86400000);
    days.push(format(time, 'MM-dd'));
    lime.push(15 + Math.random() * 5);
    activatedCarbon.push(2 + Math.random() * 1);
  }
  return { days, lime, activatedCarbon };
};
