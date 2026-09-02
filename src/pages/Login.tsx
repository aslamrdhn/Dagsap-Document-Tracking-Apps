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
            <label className="block text-sm font-medium text-gray-700">Email / NIK</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-900 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-red-900 text-white font-medium p-3 rounded-lg hover:bg-red-950 transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
