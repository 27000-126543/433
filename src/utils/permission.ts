import { UserRole, rolePermissions } from '@/types';

export const checkPermission = (userRole: UserRole, permission: string): boolean => {
  const permissions = rolePermissions[userRole];
  if (permissions.includes('*')) return true;
  return permissions.includes(permission);
};

export const getRoutePermissions = (route: string): string[] => {
  const routePermissions: Record<string, string[]> = {
    '/dashboard': ['dashboard:view'],
    '/waste-management': ['vehicle:view'],
    '/incineration': ['incinerator:view'],
    '/flue-gas': ['fluegas:view'],
    '/slag-leachate': ['slag:view', 'leachate:view'],
    '/equipment': ['workorder:view'],
    '/system': ['system:manage'],
  };
  return routePermissions[route] || [];
};

export const canAccessRoute = (userRole: UserRole | undefined, route: string): boolean => {
  if (!userRole) return false;
  
  const publicRoutes = ['/login', '/404'];
  if (publicRoutes.includes(route)) return true;
  
  if (userRole === 'director') return true;
  
  const routeRoleMap: Record<string, UserRole[]> = {
    '/dashboard': ['gatekeeper', 'operator', 'maintenance', 'safety', 'finance', 'director'],
    '/waste-management': ['gatekeeper', 'operator', 'director'],
    '/incineration': ['operator', 'safety', 'director'],
    '/flue-gas': ['operator', 'safety', 'finance', 'director'],
    '/slag-leachate': ['operator', 'safety', 'director'],
    '/equipment': ['maintenance', 'operator', 'director'],
    '/purchase': ['finance', 'director'],
    '/system': ['director'],
  };
  
  const allowedRoles = routeRoleMap[route];
  return allowedRoles ? allowedRoles.includes(userRole) : false;
};
