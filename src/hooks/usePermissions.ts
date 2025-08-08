import { useAuth } from '../contexts/AuthContext';
import { hasPermission, canDelete, getAdminRole } from '../config/adminUsers';

export function usePermissions() {
  const { user } = useAuth();
  const uid = user?.uid;

  return {
    // Check specific permissions
    canCreate: uid ? hasPermission(uid, 'create') : false,
    canRead: uid ? hasPermission(uid, 'read') : false,
    canUpdate: uid ? hasPermission(uid, 'update') : false,
    canDelete: uid ? canDelete(uid) : false,
    
    // General permission checker
    hasPermission: (action: 'create' | 'read' | 'update' | 'delete') => 
      uid ? hasPermission(uid, action) : false,
    
    // Role information
    role: uid ? getAdminRole(uid) : null,
    isPrimaryAdmin: uid ? getAdminRole(uid) === 'primary' : false,
    isSecondaryAdmin: uid ? getAdminRole(uid) === 'secondary' : false,
  };
}
