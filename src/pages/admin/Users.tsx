import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "../../components/Modal";
import { fetchApi } from "../../lib/api";
import toast from "react-hot-toast";

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ nik: "", name: "", email: "", password: "", role: "COURIER", defaultLocationId: "" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [usersRes, locsRes] = await Promise.all([fetchApi("/api/users"), fetchApi("/api/locations")]);
      const usersData = await usersRes.json();
      const locsData = await locsRes.json();
      setUsers(Array.isArray(usersData) ? usersData : []);
      setLocations(Array.isArray(locsData) ? locsData : []);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success("User created");
        setIsModalOpen(false);
        setFormData({ nik: "", name: "", email: "", password: "", role: "COURIER", defaultLocationId: "" });
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create user");
      }
    } catch { toast.error("Error creating user"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this user?")) return;
    try {
      await fetchApi(`/api/users/${id}`, { method: "DELETE" });
      fetchData();
    } catch {
      toast.error("Delete failed");
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-4 lg:p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Users</h1>
          <p className="text-slate-500 text-sm mt-1">Manage system access and roles</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#800000] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow hover:bg-[#600000] flex items-center">
          <Plus size={16} className="mr-2" /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 sticky top-0 shadow-[0_1px_0_0_#e2e8f0]">
              <tr>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase">NIK / Name</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase">Email</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase">Role</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase">Location</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50">
                  <td className="p-4">
                    <div className="font-bold text-slate-800">{u.name}</div>
                    <div className="text-xs text-slate-500">{u.nik}</div>
                  </td>
                  <td className="p-4 text-slate-600">{u.email}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">{u.role}</span>
                  </td>
                  <td className="p-4 text-slate-600">{u.defaultLocation?.name || '-'}</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-600 transition"><Trash2 size={16}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add User">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">NIK</label>
              <input required value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
            <input required type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-2 border rounded-lg" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role</label>
              <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-2 border rounded-lg">
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="COURIER">Courier</option>
                <option value="RECEIVER">Receiver</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Default Location</label>
              <select required value={formData.defaultLocationId} onChange={e => setFormData({...formData, defaultLocationId: e.target.value})} className="w-full p-2 border rounded-lg">
                <option value="">Select location...</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-[#800000] text-white p-3 rounded-lg font-bold hover:bg-[#600000] transition">Create User</button>
        </form>
      </Modal>
    </div>
  );
}
