
import { NavLink, Outlet } from 'react-router-dom';
import { 
  FileQuestion, 
  Video, 
  Layers, 
  Settings,
  Tag,
  LogOut,
  User
} from 'lucide-react';
import ChapterSelector from './ChapterSelector';
import { useAuth } from '../../contexts/AuthContext';
import { getAdminRoleDisplayName } from '../../config/adminUsers';

const navigation = [
  { name: 'Diagnostic Questions', href: '/admin/diagnostic', icon: FileQuestion },
  { name: 'Practice Questions', href: '/admin/practice', icon: FileQuestion },
  { name: 'Test Questions', href: '/admin/test', icon: FileQuestion },
  { name: 'Chapter Videos', href: '/admin/videos', icon: Video },
  { name: 'Breakdowns', href: '/admin/breakdowns', icon: Layers },
  { name: 'Skill Tags', href: '/admin/skilltags', icon: Tag },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await logout();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Sidebar - Responsive Width with Fixed Height */}
        <div className="w-64 lg:w-72 xl:w-80 min-w-[256px] bg-white shadow-lg flex-shrink-0 h-full overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center px-6 py-4 border-b bg-white flex-shrink-0">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="ml-3 text-xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <div className="space-y-1 px-3">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.href}
                  >
                    {({ isActive }) => (
                      <div className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 group ${
                        isActive
                          ? 'text-blue-600 bg-blue-50 border border-blue-200 shadow-sm'
                          : 'text-gray-700 hover:text-gray-900 hover:shadow-sm'
                      }`}>
                        <Icon className={`w-5 h-5 mr-3 transition-colors ${
                          isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
                        }`} />
                        <span className="truncate">{item.name}</span>
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </nav>
          
          {/* User Profile & Logout */}
          <div className="border-t bg-gray-50 px-6 py-4 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {user?.email || 'Admin'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {user ? getAdminRoleDisplayName(user.uid) : 'Admin Panel v2.0'}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col">
          <main className="flex-1 overflow-y-auto">
            <div className="p-6 lg:p-8">
              <ChapterSelector />
              <div className="mt-6">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}