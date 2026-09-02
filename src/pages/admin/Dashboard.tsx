import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QrCode, FileText } from 'lucide-react';
import { fetchApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { io, Socket } from 'socket.io-client';

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, inTransit: 0, atTransit: 0, overdue: 0 });
  const [activeDocs, setActiveDocs] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = () => {
    fetchApi('/api/dashboard')
      .then((res) => res.json())
      .then((data) => {
        if (data.stats) setStats(data.stats);
        if (data.activeDocs) setActiveDocs(data.activeDocs);
        if (data.recentEvents) setRecentEvents(data.recentEvents);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load dashboard data');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchDashboardData();

    const token = localStorage.getItem('token');
    // We connect to the socket server
    const socket: Socket = io(window.location.origin, {
      auth: { token }
    });

    socket.on('connect', () => {
      console.log('Connected to real-time updates');
    });

    socket.on('document:scanned', (data) => {
      toast.success(`Scanned: ${data.document.documentNumber}`);
      fetchDashboardData();
    });

    socket.on('document:updated', (data) => {
      toast.success(`Updated: ${data.document.documentNumber}`);
      fetchDashboardData();
    });

    socket.on('document:created', (data) => {
      toast.success(`New Document: ${data.document.documentNumber}`);
      fetchDashboardData();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] bg-slate-50">
      <section className="p-4 lg:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 shrink-0">
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">
            Total Documents
          </div>
          <div className="text-3xl font-bold text-slate-800">{stats.total.toLocaleString()}</div>
          <div className="mt-2 text-green-600 text-[10px] font-medium">+12% vs last month</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="text-[#800000] text-[10px] font-bold uppercase tracking-wider mb-1">
            In Transit
          </div>
          <div className="text-3xl font-bold text-slate-800">{stats.inTransit}</div>
          <div className="mt-2 text-slate-400 text-[10px] font-medium">Currently moving</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="text-orange-500 text-[10px] font-bold uppercase tracking-wider mb-1">
            At Transit Points
          </div>
          <div className="text-3xl font-bold text-slate-800">{stats.atTransit}</div>
          <div className="mt-2 text-slate-400 text-[10px] font-medium">Waiting dispatch</div>
        </div>
        <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
          <div className="text-red-600 text-[10px] font-bold uppercase tracking-wider mb-1">
            Overdue SLA
          </div>
          <div className="text-3xl font-bold text-red-600">{stats.overdue}</div>
          <div className="mt-2 text-red-600/60 text-[10px] font-medium">Requires attention</div>
        </div>
      </section>

      <section className="px-4 lg:px-8 pb-4 lg:pb-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 min-h-0">
        <div className="col-span-1 lg:col-span-8 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden min-h-[400px]">
          <div className="p-5 border-b flex justify-between items-center bg-white shrink-0">
            <h2 className="font-bold text-slate-800 text-sm md:text-base">
              Live Monitoring: Active Chain of Custody
            </h2>
            <span className="text-[10px] font-bold text-green-500 uppercase tracking-widest hidden md:flex items-center">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5 animate-pulse"></div>
              Live WebSocket connected
            </span>
          </div>
          <div className="flex-1 overflow-auto p-0">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-slate-50 sticky top-0 z-10 shadow-[0_1px_0_0_#e2e8f0]">
                <tr>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase border-b whitespace-nowrap">
                    Doc ID
                  </th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase border-b whitespace-nowrap">
                    Current Location
                  </th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase border-b whitespace-nowrap">
                    Holder
                  </th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase border-b whitespace-nowrap">
                    Status
                  </th>
                  <th className="p-4 text-[11px] font-bold text-slate-500 uppercase border-b whitespace-nowrap">
                    Last Update
                  </th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y">
                {activeDocs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      No active documents right now.
                    </td>
                  </tr>
                ) : (
                  activeDocs.map((doc: any) => (
                    <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-4 font-mono font-bold text-[#800000] whitespace-nowrap">
                        {doc.documentNumber}
                      </td>
                      <td className="p-4 text-slate-600">{doc.currentLocationId || 'Unknown'}</td>
                      <td className="p-4 font-medium">{doc.currentHolder || 'Unassigned'}</td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap ${
                            doc.status === 'IN_TRANSIT'
                              ? 'bg-orange-100 text-orange-700'
                              : doc.status === 'REJECTED'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {doc.status}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 text-xs whitespace-nowrap">
                        {new Date(doc.updatedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-4 flex flex-col space-y-4 lg:space-y-6 min-h-[300px]">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex-1 overflow-y-auto">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center">
              <div className="w-2 h-4 bg-[#800000] mr-2 rounded-sm"></div> Tracking Timeline
            </h3>
            <div className="space-y-6 relative border-l-2 border-slate-100 ml-2 pl-6">
              {recentEvents.length === 0 ? (
                <div className="text-sm text-slate-400">No recent events.</div>
              ) : (
                recentEvents.map((evt: any, idx: number) => {
                  const isFirst = idx === 0;
                  return (
                    <div key={evt.id} className="relative">
                      <div
                        className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-4 border-white shadow-sm ${isFirst ? 'bg-green-500' : 'bg-slate-300'}`}
                      ></div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">
                        {new Date(evt.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}{' '}
                        — {evt.eventType.replace(/_/g, ' ')}
                      </div>
                      <div className="text-sm font-semibold text-slate-700">
                        Doc: {evt.document?.documentNumber}
                      </div>
                      <div className="text-xs text-slate-500">
                        By: {evt.user?.name} at {evt.location?.name || 'Unknown'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
          <div className="bg-[#1a1c23] rounded-2xl p-6 text-white shrink-0">
            <div className="text-xs font-bold text-white/50 uppercase tracking-widest mb-3">
              Quick Scan Document
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.target as HTMLFormElement;
                const input = form.elements.namedItem('docId') as HTMLInputElement;
                const docId = input?.value.trim();
                if (!docId) return;

                const toastId = toast.loading('Memproses dokumen...');
                try {
                  const res = await fetchApi('/api/scan', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ documentNumber: docId }),
                  });
                  if (res.ok) {
                    const data = await res.json();
                    toast.success(`Berhasil diproses: ${data.documentNumber} (${data.status})`, { id: toastId });
                    input.value = '';
                    fetchDashboardData();
                  } else {
                    const err = await res.json();
                    toast.error(err.error || 'Gagal memproses dokumen', { id: toastId });
                  }
                } catch {
                  toast.error('Gagal terhubung ke server', { id: toastId });
                }
              }}
              className="flex flex-col gap-3"
            >
              <input
                name="docId"
                type="text"
                placeholder="Scan or type Document ID..."
                className="bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-[#800000] transition-all"
                autoComplete="off"
              />
              <button
                type="submit"
                className="bg-[#800000] hover:bg-[#600000] text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Track Document
              </button>
            </form>
            <div className="mt-4 flex justify-between items-center text-[11px]">
              <span className="text-white/40">Ready for barcode scanner</span>
              <span className="text-green-400 flex items-center">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-1.5 animate-pulse"></div>
                Active
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
