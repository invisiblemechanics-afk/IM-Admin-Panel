// Admin role types
export type AdminRole = 'primary' | 'secondary';

// Authorized admin users with their roles
export const AUTHORIZED_ADMINS: Record<string, AdminRole> = {
  'Aayx2gnj7yRakyRP0FjzZ78PkKd2': 'primary',   // Primary Admin - Full access
  'YkPeEILGa0V4KxqGGtpk23td7uh1': 'secondary', // Secondary Admin - No delete access
};

// Check if a user UID is authorized for admin access
export function isAuthorizedAdmin(uid: string | undefined): boolean {
  if (!uid) return false;
  return uid in AUTHORIZED_ADMINS;
}

// Get admin role for a user
export function getAdminRole(uid: string): AdminRole | null {
  return AUTHORIZED_ADMINS[uid] || null;
}

// Get admin role display name
export function getAdminRoleDisplayName(uid: string): string {
  const role = getAdminRole(uid);
  switch (role) {
    case 'primary':
      return 'Primary Admin';
    case 'secondary':
      return 'Secondary Admin';
    default:
      return 'Admin';
  }
}

// Check if user has permission to delete
export function canDelete(uid: string): boolean {
  const role = getAdminRole(uid);
  return role === 'primary'; // Only primary admins can delete
}

// Check if user has permission for specific actions
export function hasPermission(uid: string, action: 'create' | 'read' | 'update' | 'delete'): boolean {
  if (!isAuthorizedAdmin(uid)) return false;
  
  const role = getAdminRole(uid);
  
  switch (action) {
    case 'create':
    case 'read':
    case 'update':
      return true; // All admin roles can create, read, and update
    case 'delete':
      return role === 'primary'; // Only primary admins can delete
    default:
      return false;
  }
}
