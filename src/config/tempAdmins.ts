// Temporary admin storage for newly created accounts
// This file is used during initial setup and can be removed after permanent admins are configured

let tempAdmins: Set<string> = new Set();

export function addTempAdmin(uid: string): void {
  tempAdmins.add(uid);
  // Store in localStorage for persistence across page reloads
  const stored = JSON.parse(localStorage.getItem('tempAdmins') || '[]');
  stored.push(uid);
  localStorage.setItem('tempAdmins', JSON.stringify([...new Set(stored)]));
}

export function isTempAdmin(uid: string): boolean {
  // Check memory first
  if (tempAdmins.has(uid)) return true;
  
  // Check localStorage
  const stored = JSON.parse(localStorage.getItem('tempAdmins') || '[]');
  return stored.includes(uid);
}

export function removeTempAdmin(uid: string): void {
  tempAdmins.delete(uid);
  const stored = JSON.parse(localStorage.getItem('tempAdmins') || '[]');
  const filtered = stored.filter((id: string) => id !== uid);
  localStorage.setItem('tempAdmins', JSON.stringify(filtered));
}

export function clearTempAdmins(): void {
  tempAdmins.clear();
  localStorage.removeItem('tempAdmins');
}

// Initialize from localStorage on module load
try {
  const stored = JSON.parse(localStorage.getItem('tempAdmins') || '[]');
  tempAdmins = new Set(stored);
} catch (error) {
  console.warn('Failed to load temp admins from localStorage:', error);
  tempAdmins = new Set();
}
