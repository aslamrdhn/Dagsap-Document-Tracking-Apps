import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogOut, LayoutDashboard, FileText, MapPin, Users, Search, Menu, X } from 'lucide-react';

export default function AdminLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  const getLinkClass = (path: string) => {
    const isActive =
      location.pathname === path || (path !== '/admin' && location.pathname.startsWith(path));
    return `flex items-center p-3 rounded-lg transition-colors ${
      isActive ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/5'
    }`;
  };

  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className="h-[100dvh] w-full bg-slate-50 flex font-sans overflow-hidden relative">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={closeSidebar} />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-[#800000] flex flex-col transition-transform duration-300 ease-in-out
        lg:static lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}
      >
        <div className="p-6 border-b border-white/10 flex flex-col items-center text-center relative">
          <div className="w-full flex justify-center mb-3">
            <div className="bg-white p-2 rounded-xl shadow-sm">
              <img
                src="/logo-dark.png"
                alt="DAGSAP Logo"
                className="h-10 lg:h-12 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  document.getElementById('admin-fallback-logo')!.style.display = 'block';
                }}
              />
            </div>
            <div
              id="admin-fallback-logo"
              className="hidden w-full p-2 border border-dashed border-white/30 rounded text-center bg-black/20"
            >
              <p className="text-[10px] text-white font-bold uppercase tracking-widest">
                Logo Missing
              </p>
              <p className="text-[9px] text-white/70 mt-1">
                Upload <b>logo-dark.png</b>
                <br />
                to public folder
              </p>
            </div>
          </div>
          <h2 className="text-white font-bold text-sm leading-tight tracking-wide">
            Dagsap Document Tracking System
          </h2>
          <button
            onClick={closeSidebar}
            className="lg:hidden absolute top-4 right-4 text-white/70 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          <Link to="/admin" className={getLinkClass('/admin')} onClick={closeSidebar}>
            <LayoutDashboard size={20} className="mr-3 shrink-0" />
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <Link
            to="/admin/documents"
            className={getLinkClass('/admin/documents')}
            onClick={closeSidebar}
          >
            <FileText size={20} className="mr-3 shrink-0" />
            <span className="text-sm font-medium">Documents</span>
          </Link>
          <Link
            to="/admin/locations"
            className={getLinkClass('/admin/locations')}
            onClick={closeSidebar}
          >
            <MapPin size={20} className="mr-3 shrink-0" />
            <span className="text-sm font-medium">Locations</span>
          </Link>
          {user?.role === 'SUPER_ADMIN' && (
            <Link to="/admin/users" className={getLinkClass('/admin/users')} onClick={closeSidebar}>
              <Users size={20} className="mr-3 shrink-0" />
              <span className="text-sm font-medium">Users</span>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-white/10 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 overflow-hidden pr-2">
              <div className="w-10 h-10 shrink-0 bg-white/20 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-white text-xs font-semibold truncate">
                  {user?.name || 'Admin'}
                </span>
                <span className="text-white/50 text-[10px] truncate">{user?.role}</span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="text-white/60 hover:text-white transition-colors shrink-0 p-2"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-slate-50 overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              className="lg:hidden text-slate-500 hover:text-[#800000] p-1 -ml-1"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>

            <div className="hidden lg:flex items-center bg-slate-100 rounded-full px-4 py-2 w-96 border border-slate-200">
              <Search size={16} className="text-slate-400 mr-3" />
              <input
                type="text"
                placeholder="Search Document ID..."
                className="bg-transparent border-none outline-none text-sm text-slate-700 w-full placeholder:text-slate-400"
              />
            </div>

            <span className="font-bold text-slate-800 lg:hidden">DAGSAP Admin</span>
          </div>

          <div className="flex items-center space-x-3 lg:space-x-6 shrink-0">
            <div className="hidden sm:flex items-center text-slate-600 space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium uppercase tracking-wider">Online</span>
            </div>
            <Link
              to="/admin/documents"
              className="bg-[#800000] hover:bg-[#600000] transition-colors text-white px-3 lg:px-4 py-2 rounded-lg text-sm font-semibold shadow-md flex items-center"
            >
              <span className="hidden sm:inline mr-1">+</span>
              <span className="sm:hidden">+</span>
              <span className="hidden sm:inline">Create Doc</span>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-x-hidden overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
