import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("admin@dagsap.com");
  const [password, setPassword] = useState("admin123");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.token, data.user);
        if (["SUPER_ADMIN", "ADMIN"].includes(data.user.role)) {
          navigate("/admin");
        } else {
          navigate("/m");
        }
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch (err) {
      toast.error("Network error");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm w-full bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-red-900">DAGSAP</h1>
          <p className="text-gray-500 text-sm mt-1">Document Tracking System</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email / NIK</label>
            <input type="text" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-900 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-900 focus:outline-none" />
          </div>
          <button type="submit" className="w-full bg-red-900 text-white font-medium p-3 rounded-lg hover:bg-red-950 transition-colors">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}