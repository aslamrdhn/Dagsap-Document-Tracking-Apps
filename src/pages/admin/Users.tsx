import React, { useState, useEffect } from "react";
import { Plus, Trash2, Search, Edit2 } from "lucide-react";
import { Modal } from "../../components/Modal";
import { fetchApi } from "../../lib/api";
import toast from "react-hot-toast";

export default function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
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

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ nik: "", name: "", email: "", password: "", role: "COURIER", defaultLocationId: "" });
    setIsModalOpen(true);
  };

  const openEditModal = (u: any) => {
    setIsEditMode(true);
    setEditingId(u.id);
    setFormData({ 
      nik: u.nik, 
      name: u.name, 
      email: u.email || "", 
      password: "", // leave blank unless updating
      role: u.role, 
      defaultLocationId: u.defaultLocationId || "" 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditMode ? `/api/users/${editingId}` : "/api/users";
      const method = isEditMode ? "PUT" : "POST";
      
      // If edit mode and password is empty, omit it so we don't overwrite with empty string
      const payload = { ...formData };
      if (isEditMode && !payload.password) {
        delete (payload as any).password;
      }

      const res = await fetchApi(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        toast.success(isEditMode ? "User updated" : "User created");
        setIsModalOpen(false);
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || (isEditMode ? "Update failed" : "Creation failed"));
      }
    } catch { toast.error("Error saving user"); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${name}"?`)) return;
    try {
      const res = await fetchApi(`/api/users/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("User deleted");
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to delete user");
      }
    } catch {
      toast.error("Network error during delete");
    }
  };

  if (loading) return <div className="p-8 text-[#888888] font-medium">Loading users interface...</div>;

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto h-full flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-[#111111] tracking-tight">System Users</h1>
          <p className="text-[#666666] text-sm mt-1 font-medium">Manage access controls, couriers, and administrators.</p>
        </div>
        <button 
          onClick={openCreateModal} 
          className="bg-[#111111] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center hover:bg-[#333333] transition-colors"
        >
          <Plus size={16} className="mr-2" /> Register User
        </button>
      </div>

      <div className="bg-white border border-[#E5E5E4] rounded-xl shadow-sm flex flex-col overflow-hidden flex-1">
        
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[#E5E5E4] bg-[#F7F7F5] flex justify-between items-center shrink-0">
          <div className="flex items-center bg-white border border-[#E5E5E4] rounded-md px-3 py-1.5 w-64 focus-within:border-[#111111] transition-colors">
            <Search size={14} className="text-[#A0A0A0] mr-2" />
            <input type="text" placeholder="Search by NIK or Name..." className="bg-transparent border-none outline-none text-xs text-[#111111] w-full font-medium" />
          </div>
          <div className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">{users.length} Active Accounts</div>
        </div>

        <div className="overflow-auto flex-1 bg-white">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-white sticky top-0 z-10 shadow-[0_1px_0_0_#E5E5E4]">
              <tr>
                <th className="p-4 text-[10px] font-bold text-[#666666] uppercase tracking-[0.15em] border-b border-[#E5E5E4]">Identity</th>
                <th className="p-4 text-[10px] font-bold text-[#666666] uppercase tracking-[0.15em] border-b border-[#E5E5E4]">Contact</th>
                <th className="p-4 text-[10px] font-bold text-[#666666] uppercase tracking-[0.15em] border-b border-[#E5E5E4]">Role</th>
                <th className="p-4 text-[10px] font-bold text-[#666666] uppercase tracking-[0.15em] border-b border-[#E5E5E4]">Node Assignment</th>
                <th className="p-4 text-[10px] font-bold text-[#666666] uppercase tracking-[0.15em] border-b border-[#E5E5E4] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E4] text-sm">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-[#F9F9F8] transition-colors group">
                  <td className="p-4">
                    <div className="font-extrabold text-[#111111] leading-none mb-1">{u.name}</div>
                    <div className="text-[10px] font-mono text-[#888888]">{u.nik}</div>
                  </td>
                  <td className="p-4 text-[#555555] font-medium text-xs">{u.email}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-1 bg-[#F0F0F0] border border-[#E5E5E4] text-[#555555] rounded-md text-[10px] font-extrabold uppercase tracking-wider">
                      {u.role.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-[#555555] font-medium text-xs">{u.defaultLocation?.name || <span className="text-[#A0A0A0] italic">Unassigned</span>}</td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openEditModal(u)}
                        className="p-1.5 text-[#888888] hover:text-[#111111] hover:bg-[#E5E5E4] rounded transition-colors"
                        title="Edit User"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => handleDelete(u.id, u.name)} 
                        className="p-1.5 text-[#888888] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded transition-colors"
                        title="Delete User"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Edit User Account" : "Register New User"}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#666666] uppercase tracking-widest mb-1.5">Employee NIK</label>
              <input required value={formData.nik} onChange={e => setFormData({...formData, nik: e.target.value})} className="w-full p-2.5 border border-[#E5E5E4] rounded-lg text-sm bg-white font-mono text-[#111111] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] outline-none transition-all" placeholder="e.g. 10023" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#666666] uppercase tracking-widest mb-1.5">Full Name</label>
              <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2.5 border border-[#E5E5E4] rounded-lg text-sm bg-white font-medium text-[#111111] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] outline-none transition-all" placeholder="John Doe" />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#666666] uppercase tracking-widest mb-1.5">Email Address</label>
            <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2.5 border border-[#E5E5E4] rounded-lg text-sm bg-white font-medium text-[#111111] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] outline-none transition-all" placeholder="user@company.com" />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#666666] uppercase tracking-widest mb-1.5">{isEditMode ? "New Password (Optional)" : "Initial Password"}</label>
            <input required={!isEditMode} type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full p-2.5 border border-[#E5E5E4] rounded-lg text-sm bg-white font-medium text-[#111111] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] outline-none transition-all" placeholder={isEditMode ? "Leave blank to keep current" : "••••••••"} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-[#666666] uppercase tracking-widest mb-1.5">System Role</label>
              <select required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-2.5 border border-[#E5E5E4] rounded-lg text-sm bg-white font-medium text-[#111111] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] outline-none transition-all">
                <option value="SUPER_ADMIN">Super Admin</option>
                <option value="ADMIN">Admin</option>
                <option value="COURIER">Courier (Driver)</option>
                <option value="RECEIVER">Receiver (Staff)</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-[#666666] uppercase tracking-widest mb-1.5">Node Assignment</label>
              <select required value={formData.defaultLocationId} onChange={e => setFormData({...formData, defaultLocationId: e.target.value})} className="w-full p-2.5 border border-[#E5E5E4] rounded-lg text-sm bg-white font-medium text-[#111111] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] outline-none transition-all">
                <option value="">Select location...</option>
                {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" className="w-full bg-[#111111] text-white p-3.5 rounded-lg font-bold shadow-md hover:bg-[#333333] transition-colors mt-2">
            {isEditMode ? "Save Changes" : "Create Account"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
