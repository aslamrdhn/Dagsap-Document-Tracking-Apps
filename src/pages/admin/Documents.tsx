import React, { useState, useEffect } from 'react';
import { Plus, QrCode as QRIcon, FileText, X } from 'lucide-react';
import { Modal } from '../../components/Modal';
import { QRCodeSVG } from 'qrcode.react';
import { fetchApi } from '../../lib/api';
import toast from 'react-hot-toast';

export default function Documents() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [qrModalDoc, setQrModalDoc] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    documentTypeId: '',
    originLocationId: '',
    destinationLocationId: '',
    priority: 'NORMAL',
    description: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [docsRes, locsRes, typesRes] = await Promise.all([
        fetchApi('/api/documents'),
        fetchApi('/api/locations'),
        fetchApi('/api/documents/types'),
      ]);
      const docs = await docsRes.json();
      const locs = await locsRes.json();
      const typs = await typesRes.json();
      setDocuments(Array.isArray(docs) ? docs : []);
      setLocations(Array.isArray(locs) ? locs : []);
      setTypes(Array.isArray(typs) ? typs : []);
    } catch (e) {
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetchApi('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        toast.success('Document created!');
        setIsModalOpen(false);
        fetchData();
        const newDoc = await res.json();
        setQrModalDoc(newDoc); // show QR code for the new doc
      } else {
        const error = await res.json();
        toast.error(error.error || 'Creation failed');
      }
    } catch (e) {
      toast.error('Something went wrong');
    }
  };

  if (loading) return <div className="p-8 text-slate-500">Loading documents...</div>;

  return (
    <div className="p-4 lg:p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Documents</h1>
          <p className="text-slate-500 text-sm mt-1">Manage and track all documents</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#800000] text-white px-4 py-2 rounded-lg text-sm font-semibold shadow-sm flex items-center hover:bg-[#600000] transition"
        >
          <Plus size={16} className="mr-2" /> New Document
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
        <div className="overflow-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-[0_1px_0_0_#e2e8f0]">
              <tr>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase">Document ID</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase">Type</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase">Route</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase">Status</th>
                <th className="p-4 text-[11px] font-bold text-slate-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y text-sm">
              {documents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No documents found.
                  </td>
                </tr>
              ) : (
                documents.map((doc: any) => (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="p-4 font-mono font-bold text-[#800000]">{doc.documentNumber}</td>
                    <td className="p-4">{doc.documentType?.name || doc.documentTypeId}</td>
                    <td className="p-4 text-slate-600 text-xs">
                      <span className="font-semibold">{doc.originLocation?.code}</span> →{' '}
                      <span className="font-semibold">{doc.destinationLocation?.code}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold">
                        {doc.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <button
                        onClick={() => setQrModalDoc(doc)}
                        className="flex items-center text-[#800000] hover:text-[#600000] font-bold text-[11px] bg-[#800000]/10 px-2 py-1 rounded transition"
                        title="View Label"
                      >
                        <QRIcon size={14} className="mr-1" /> Print QR
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Document">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Document Type
            </label>
            <select
              required
              value={formData.documentTypeId}
              onChange={(e) => setFormData({ ...formData, documentTypeId: e.target.value })}
              className="w-full p-2 border rounded-lg text-sm bg-slate-50"
            >
              <option value="">Select type...</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Origin
              </label>
              <select
                required
                value={formData.originLocationId}
                onChange={(e) => setFormData({ ...formData, originLocationId: e.target.value })}
                className="w-full p-2 border rounded-lg text-sm bg-slate-50"
              >
                <option value="">Select origin...</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                Destination
              </label>
              <select
                required
                value={formData.destinationLocationId}
                onChange={(e) =>
                  setFormData({ ...formData, destinationLocationId: e.target.value })
                }
                className="w-full p-2 border rounded-lg text-sm bg-slate-50"
              >
                <option value="">Select dest...</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
              className="w-full p-2 border rounded-lg text-sm bg-slate-50"
            >
              <option value="NORMAL">Normal</option>
              <option value="URGENT">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded-lg text-sm bg-slate-50 h-20"
              placeholder="Enter notes..."
            ></textarea>
          </div>
          <button
            type="submit"
            className="w-full bg-[#800000] text-white p-3 rounded-lg font-bold shadow hover:bg-[#600000] transition"
          >
            Create Document
          </button>
        </form>
      </Modal>

      <Modal isOpen={!!qrModalDoc} onClose={() => setQrModalDoc(null)} title="Document Label">
        {qrModalDoc && (
          <div
            id="printable-label"
            className="flex flex-col items-center p-6 space-y-6 text-center bg-white"
          >
            <QRCodeSVG value={qrModalDoc.documentNumber} size={200} level="H" />
            <div>
              <div className="text-2xl font-mono font-bold tracking-widest text-slate-800">
                {qrModalDoc.documentNumber}
              </div>
              <div className="text-slate-500 text-sm uppercase font-bold mt-2">
                Route: {qrModalDoc.originLocation?.code} to {qrModalDoc.destinationLocation?.code}
              </div>
            </div>
            <button
              onClick={() => {
                setTimeout(() => window.print(), 100);
              }}
              className="print:hidden bg-slate-800 text-white px-6 py-2 rounded-lg font-bold hover:bg-slate-900 transition w-full"
            >
              Print Label
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
