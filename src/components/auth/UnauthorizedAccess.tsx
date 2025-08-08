import React from 'react';
import { Shield, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function UnauthorizedAccess() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 px-4">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-red-600 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">Access Denied</h2>
            <p className="mt-2 text-sm text-gray-600">
              You don't have permission to access the admin panel
            </p>
          </div>

          <div className="mt-8 space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="text-sm text-red-800">
                <p className="font-medium">Your account is not authorized for admin access.</p>
                <p className="mt-1">Contact the system administrator if you believe this is an error.</p>
              </div>
            </div>

            {user && (
              <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
                <div className="text-sm text-gray-600">
                  <p><strong>Logged in as:</strong> {user.email}</p>
                  <p><strong>User ID:</strong> <code className="text-xs bg-gray-200 px-1 rounded">{user.uid}</code></p>
                </div>
              </div>
            )}

            <div className="text-center">
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                All access attempts are logged and monitored.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
