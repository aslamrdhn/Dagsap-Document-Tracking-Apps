import React, { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Modal } from "../../components/Modal";
import { fetchApi } from "../../lib/api";
import toast from "react-hot-toast";

export default function Locations() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ code: "", name: "", type: "OFFICE" });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const res = await fetchApi("/api/locations");
      const data = await res.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch {
      toast.error("Failed to load locations");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success("Location created");
        setIsModalOpen(false);
        setFormData({ code: "", name: "", type: "OFFICE" });
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || "Failed to create location");
      }
    } catch { toast.error("Error creating location"); }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="p-4 lg:p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Locations</h1>
          <p className="text-slate-500 text-sm mt-1">Manage physical locations and transit points</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-[#800000] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow hover:bg-[#600000] flex items-center">
          <Plus size={16} className="mr-2" /> Add Location
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 sticky top-0 shadow-[0_1px_0_0_#e2e8f0]">
              <tr>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase">Code</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase">Name</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase">Type</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {locations.map(loc => (
                <tr key={loc.id} className="hover:bg-slate-50">
                  <td className="p-4 font-mono font-bold text-[#800000]">{loc.code}</td>
                  <td className="p-4 font-medium">{loc.name}</td>
                  <td className="p-4">
                    <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">{loc.type}</span>
                  </td>
                  <td className="p-4 text-right text-green-600 text-xs font-bold">{loc.active ? "ACTIVE" : "INACTIVE"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Location">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Code</label>
            <input required maxLength={5} value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className="w-full p-2 border rounded-lg uppercase" placeholder="e.g. TR01" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name</label>
            <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-lg" placeholder="Location Name" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
            <select required value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} className="w-full p-2 border rounded-lg">
              <option value="OFFICE">Office</option>
              <option value="TRANSIT">Transit</option>
              <option value="PLANT">Plant</option>
            </select>
          </div>
          <button type="submit" className="w-full bg-[#800000] text-white p-3 rounded-lg font-bold">Save Location</button>
        </form>
      </Modal>
    </div>
  );
}
