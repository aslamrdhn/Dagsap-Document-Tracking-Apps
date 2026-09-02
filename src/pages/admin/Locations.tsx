import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { fetchApi } from '../../lib/api';
import toast from 'react-hot-toast';

export default function Locations() {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ code: '', name: '', type: 'OFFICE' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetchApi('/api/locations');
      const data = await res.json();
      setLocations(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Failed to load locations');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ code: '', name: '', type: 'OFFICE' });
    setIsModalOpen(true);
  };

  const openEditModal = (loc: any) => {
    setIsEditMode(true);
    setEditingId(loc.id);
    setFormData({ code: loc.code, name: loc.name, type: loc.type });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the location "${name}"?`)) return;

    try {
      const res = await fetchApi(`/api/locations/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Location deleted successfully');
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to delete location');
      }
    } catch {
      toast.error('Error deleting location');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = isEditMode ? `/api/locations/${editingId}` : '/api/locations';
      const method = isEditMode ? 'PUT' : 'POST';

      const res = await fetchApi(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success(isEditMode ? 'Location updated' : 'Location created');
        setIsModalOpen(false);
        fetchData();
      } else {
        const error = await res.json();
        toast.error(error.error || (isEditMode ? 'Update failed' : 'Creation failed'));
      }
    } catch {
      toast.error('Error saving location');
    }
  };

  if (loading)
    return <div className="p-8 text-[#888888] font-medium">Loading locations interface...</div>;

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto h-full flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-[#111111] tracking-tight">
            Facilities & Transit Points
          </h1>
          <p className="text-[#666666] text-sm mt-1 font-medium">
            Manage operational nodes and physical branches.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-[#111111] text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-sm flex items-center hover:bg-[#333333] transition-colors"
        >
          <Plus size={16} className="mr-2" /> Add Location
        </button>
      </div>

      <div className="bg-white border border-[#E5E5E4] rounded-xl shadow-sm flex flex-col overflow-hidden flex-1">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-[#E5E5E4] bg-[#F7F7F5] flex justify-between items-center shrink-0">
          <div className="flex items-center bg-white border border-[#E5E5E4] rounded-md px-3 py-1.5 w-64 focus-within:border-[#111111] transition-colors">
            <Search size={14} className="text-[#A0A0A0] mr-2" />
            <input
              type="text"
              placeholder="Filter locations..."
              className="bg-transparent border-none outline-none text-xs text-[#111111] w-full font-medium"
            />
          </div>
          <div className="text-[10px] font-bold text-[#888888] uppercase tracking-widest">
            {locations.length} Locations
          </div>
        </div>

        <div className="overflow-auto flex-1 bg-white">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-white sticky top-0 z-10 shadow-[0_1px_0_0_#E5E5E4]">
              <tr>
                <th className="p-4 text-[10px] font-bold text-[#666666] uppercase tracking-[0.15em] border-b border-[#E5E5E4]">
                  Code
                </th>
                <th className="p-4 text-[10px] font-bold text-[#666666] uppercase tracking-[0.15em] border-b border-[#E5E5E4]">
                  Name
                </th>
                <th className="p-4 text-[10px] font-bold text-[#666666] uppercase tracking-[0.15em] border-b border-[#E5E5E4]">
                  Type
                </th>
                <th className="p-4 text-[10px] font-bold text-[#666666] uppercase tracking-[0.15em] border-b border-[#E5E5E4] text-center">
                  Status
                </th>
                <th className="p-4 text-[10px] font-bold text-[#666666] uppercase tracking-[0.15em] border-b border-[#E5E5E4] text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E5E4] text-sm">
              {locations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-[#A0A0A0] font-medium">
                    No locations found.
                  </td>
                </tr>
              ) : (
                locations.map((loc) => (
                  <tr key={loc.id} className="hover:bg-[#F9F9F8] transition-colors group">
                    <td className="p-4 font-mono font-bold text-[#111111]">{loc.code}</td>
                    <td className="p-4 font-medium text-[#444444]">{loc.name}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 bg-[#F0F0F0] border border-[#E5E5E4] text-[#555555] rounded-md text-[10px] font-extrabold uppercase tracking-wider">
                        {loc.type}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest ${loc.active ? 'text-[#10B981]' : 'text-[#EF4444]'}`}
                      >
                        {loc.active ? 'ACTIVE' : 'INACTIVE'}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(loc)}
                          className="p-1.5 text-[#888888] hover:text-[#111111] hover:bg-[#E5E5E4] rounded transition-colors"
                          title="Edit Location"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(loc.id, loc.name)}
                          className="p-1.5 text-[#888888] hover:text-[#EF4444] hover:bg-[#EF4444]/10 rounded transition-colors"
                          title="Delete Location"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={isEditMode ? 'Edit Location' : 'Add Location'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-bold text-[#666666] uppercase tracking-widest mb-1.5">
              Code
            </label>
            <input
              required
              maxLength={5}
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full p-2.5 border border-[#E5E5E4] rounded-lg text-sm bg-white font-mono uppercase text-[#111111] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] outline-none transition-all"
              placeholder="e.g. TR01"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#666666] uppercase tracking-widest mb-1.5">
              Name
            </label>
            <input
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2.5 border border-[#E5E5E4] rounded-lg text-sm bg-white font-medium text-[#111111] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] outline-none transition-all"
              placeholder="Location Name"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-[#666666] uppercase tracking-widest mb-1.5">
              Type
            </label>
            <select
              required
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full p-2.5 border border-[#E5E5E4] rounded-lg text-sm bg-white font-medium text-[#111111] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] outline-none transition-all"
            >
              <option value="OFFICE">Office</option>
              <option value="TRANSIT">Transit Point</option>
              <option value="PLANT">Production Plant</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-[#111111] text-white p-3.5 rounded-lg font-bold shadow-md hover:bg-[#333333] transition-colors mt-2"
          >
            {isEditMode ? 'Save Changes' : 'Create Location'}
          </button>
        </form>
      </Modal>
    </div>
  );
}
