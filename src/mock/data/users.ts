import { User, rolePermissions } from '@/types';

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'director',
    name: '张厂长',
    role: 'director',
    permissions: rolePermissions.director,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=director',
  },
  {
    id: '2',
    username: 'operator',
    name: '李值长',
    role: 'operator',
    permissions: rolePermissions.operator,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=operator',
  },
  {
    id: '3',
    username: 'gatekeeper',
    name: '王值班',
    role: 'gatekeeper',
    permissions: rolePermissions.gatekeeper,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=gatekeeper',
  },
  {
    id: '4',
    username: 'maintenance',
    name: '赵维修',
    role: 'maintenance',
    permissions: rolePermissions.maintenance,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=maintenance',
  },
  {
    id: '5',
    username: 'safety',
    name: '刘安环',
    role: 'safety',
    permissions: rolePermissions.safety,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=safety',
  },
  {
    id: '6',
    username: 'finance',
    name: '陈财务',
    role: 'finance',
    permissions: rolePermissions.finance,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=finance',
  },
];

export const login = (username: string, password: string): User | null => {
  if (password === '123456') {
    return mockUsers.find((u) => u.username === username) || null;
  }
  return null;
};
