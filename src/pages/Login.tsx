import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('admin@dagsap.com');
  const [password, setPassword] = useState('admin123');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }
        login(data.token, data.user);
        if (['SUPER_ADMIN', 'ADMIN'].includes(data.user.role)) {
          navigate('/admin');
        } else {
          navigate('/m');
        }
      } else {
        toast.error(data.error || 'Login failed');
      }
    } catch (err) {
      toast.error('Network error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="bg-white p-2 rounded-xl inline-block mb-4">
            <img
              src="/logo-light.png"
              alt="DAGSAP Logo"
              className="w-48 max-w-full object-contain drop-shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                document.getElementById('login-fallback')!.style.display = 'flex';
              }}
            />
          </div>
          <div
            id="login-fallback"
            className="hidden flex-col items-center justify-center w-full h-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg mb-4 text-center p-4"
          >
            <p className="text-sm font-bold text-gray-500">Logo belum diupload</p>
            <p className="text-xs text-gray-400 mt-1">
              Upload gambar ke folder <b>public</b> dengan nama <b>logo-light.png</b>
            </p>
          </div>
          <h1 className="text-xl font-bold text-gray-800 leading-tight">
            Dagsap Document Tracking System
          </h1>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Email / NIK
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#800000] focus:outline-none text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-[#800000] focus:outline-none text-sm transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#800000] text-white font-bold p-3.5 rounded-xl hover:bg-[#600000] transition active:scale-[0.98] shadow-md shadow-[#800000]/20 text-sm"
          >
            Sign In / Masuk
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center mb-2">
            Akun Percobaan (1-Klik)
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setEmail('admin@dagsap.com');
                setPassword('admin123');
              }}
              className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-left transition-colors"
            >
              <div className="text-[11px] font-bold text-gray-800">Super Admin</div>
              <div className="text-[9px] text-gray-500">Web Dashboard</div>
            </button>
            <button
              type="button"
              onClick={() => {
                setEmail('courier@dagsap.com');
                setPassword('courier123');
              }}
              className="p-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-left transition-colors"
            >
              <div className="text-[11px] font-bold text-gray-800">Kurir Driver</div>
              <div className="text-[9px] text-gray-500">Mobile Scanner</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
