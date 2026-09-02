import React from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { ScanLine, Home, LogOut, Package } from "lucide-react";

export default function MobileLayout() {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const onLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="flex flex-col h-[100dvh] bg-slate-50 w-full overflow-hidden select-none [-webkit-tap-highlight-color:transparent] antialiased">
      <header className="bg-[#800000] text-white px-5 pb-4 pt-[max(env(safe-area-inset-top),1rem)] flex justify-between items-center shadow-md shrink-0">
        <div className="flex items-center">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mr-3">
            <Package size={18} className="text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none tracking-tight">DAGSAP</h1>
            <p className="text-[10px] text-white/70 uppercase tracking-widest mt-1 font-bold">Field Ops</p>
          </div>
        </div>
        <button onClick={onLogout} className="text-white/70 hover:text-white transition-colors bg-white/10 p-2 rounded-full">
          <LogOut size={18} />
        </button>
      </header>
      
      <main className="flex-1 overflow-y-auto p-5 relative z-0 overscroll-y-contain">
        <Outlet />
      </main>

      <nav className="bg-white border-t border-slate-200 flex justify-between items-center px-8 py-2 shrink-0 pb-[env(safe-area-inset-bottom)] relative z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <Link 
          to="/m" 
          className={`flex flex-col items-center p-2 transition-colors w-16 ${location.pathname === '/m' ? 'text-[#800000]' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Home size={22} className={location.pathname === '/m' ? 'fill-current' : ''} />
          <span className="text-[10px] mt-1 font-bold">Home</span>
        </Link>
        
        <Link 
          to="/m/scan" 
          className="relative -top-6 transform transition-transform hover:scale-105 active:scale-95"
        >
          <div className="bg-[#800000] text-white p-4 rounded-full shadow-[0_8px_16px_rgba(128,0,0,0.3)] border-4 border-slate-50 flex items-center justify-center">
            <ScanLine size={28} />
          </div>
        </Link>
        
        {/* Placeholder for symmetry */}
        <div className="w-16 flex flex-col items-center p-2 opacity-0 pointer-events-none">
          <Home size={22} />
          <span className="text-[10px] mt-1 font-bold">Spacer</span>
        </div>
      </nav>
    </div>
  );
}
