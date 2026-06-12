import { useAuth } from '@/context/AuthContext';
import { checkPermission, canAccessRoute } from '@/utils/permission';
import { UserRole } from '@/types';

export const usePermission = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return checkPermission(user.role, permission);
  };

  const canAccess = (route: string): boolean => {
    if (!user) return false;
    return canAccessRoute(user.role, route);
  };

  const hasRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return { hasPermission, canAccess, hasRole };
};
