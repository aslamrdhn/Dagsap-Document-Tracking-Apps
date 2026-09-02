import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { fetchApi } from '../../lib/api';
import toast from 'react-hot-toast';
import { PackageSearch, History } from 'lucide-react';
import { motion } from 'motion/react';

export default function MobileHome() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ inTransit: 0, completed: 0, recentDocs: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/api/mobile/dashboard')
      .then((res) => res.json())
      .then((data) => {
        setStats(data);
        setLoading(false);
      })
      .catch(() => {
        toast.error('Failed to load dashboard data');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#800000]/20 border-t-[#800000] rounded-full animate-spin"></div>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-6"
    >
      <motion.div
        variants={itemVariants}
        className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100"
      >
        <p className="text-slate-500 font-medium text-sm">{getGreeting()},</p>
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{user?.name}</h2>
        <div className="mt-3 inline-flex items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
          <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
          <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
            {user?.role} • {user?.defaultLocationId}
          </span>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden active:scale-[0.98] transition-transform">
          <div className="absolute -right-4 -top-4 text-orange-500/10">
            <PackageSearch size={80} />
          </div>
          <div className="relative z-10">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">
              {user?.role === 'COURIER' ? 'Carrying' : 'Incoming'}
            </div>
            <div className="text-4xl font-black text-orange-600">{stats.inTransit}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden active:scale-[0.98] transition-transform">
          <div className="absolute -right-4 -top-4 text-green-500/10">
            <History size={80} />
          </div>
          <div className="relative z-10">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-1">
              {user?.role === 'COURIER' ? 'Delivered' : 'Received'}
            </div>
            <div className="text-4xl font-black text-green-600">{stats.completed}</div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants}>
        <h3 className="font-bold text-slate-800 mb-4 flex items-center">
          <div className="w-1 h-4 bg-[#800000] rounded-full mr-2"></div>
          Recent Activity
        </h3>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden divide-y divide-slate-50">
          {stats.recentDocs.length === 0 ? (
            <div className="p-8 text-sm text-slate-400 text-center font-medium">
              No recent documents
            </div>
          ) : (
            stats.recentDocs.map((doc: any) => (
              <div
                key={doc.id}
                className="p-4 flex items-center justify-between active:bg-slate-100 transition-colors"
              >
                <div>
                  <div className="font-mono font-bold text-[#800000] text-sm">
                    {doc.documentNumber}
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                    {new Date(doc.updatedAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                    doc.status === 'COMPLETED'
                      ? 'bg-green-100 text-green-700'
                      : doc.status === 'IN_TRANSIT'
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {doc.status}
                </span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
