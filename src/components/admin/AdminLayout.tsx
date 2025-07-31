import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { 
  FileQuestion, 
  BookOpen, 
  Video, 
  Layers, 
  Settings 
} from 'lucide-react';
import ChapterSelector from './ChapterSelector';

const navigation = [
  { name: 'Diagnostic Questions', href: '/admin/diagnostic', icon: FileQuestion },
  { name: 'Practice Questions', href: '/admin/practice', icon: FileQuestion },
  { name: 'Test Questions', href: '/admin/test', icon: FileQuestion },
  { name: 'Chapter Videos', href: '/admin/videos', icon: Video },
  { name: 'Breakdowns', href: '/admin/breakdowns', icon: Layers },
];

export default function AdminLayout() {

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar - Fixed Width */}
        <div className="w-64 min-w-[256px] max-w-[256px] bg-white shadow-lg flex-shrink-0">
          <div className="flex items-center px-6 py-4 border-b">
            <Settings className="w-8 h-8 text-blue-600" />
            <h1 className="ml-3 text-xl font-bold text-gray-900">Admin Panel</h1>
          </div>
          <nav className="mt-6">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) =>
                    `flex items-center px-6 py-3 text-sm font-medium hover:bg-gray-50 transition-colors ${
                      isActive
                        ? 'text-blue-600 bg-blue-50 border-r-2 border-blue-600'
                        : 'text-gray-700 hover:text-gray-900'
                    }`
                  }
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          <main className="p-8">
            <ChapterSelector />
            

            
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}