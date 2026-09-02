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
          <div className="bg-white p-1 rounded-md mr-3 flex items-center justify-center">
            <img 
              src="/logo-dark.png" 
              alt="DAGSAP Logo" 
              className="h-8 object-contain" 
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                document.getElementById('mobile-fallback-logo')!.style.display = 'flex';
              }}
            />
          </div>
          <div id="mobile-fallback-logo" className="hidden items-center p-2 border border-dashed border-white/30 rounded bg-black/20 text-center">
            <p className="text-[9px] text-white/90">Upload <b>logo-dark.png</b><br/>to public folder</p>
          </div>
          <div>
            <h1 className="font-bold text-[13px] leading-tight tracking-tight">Dagsap Document<br/>Tracking System</h1>
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
