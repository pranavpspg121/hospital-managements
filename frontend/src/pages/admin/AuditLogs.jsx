import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { ShieldCheck, Search, Clock, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    try {
      const res = await api.get('audit-logs/');
      setLogs(res.data.results || res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load audit logs timeline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (log.username && log.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="text-primary-600" size={24} /> Security Audit Trails
          </h1>
          <p className="text-xs text-slate-500 mt-1">Real-time system actions tracking and user access history logs.</p>
        </div>
        <button onClick={fetchLogs} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors">
          Refresh Logs
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-3">
        <Search size={18} className="text-slate-400" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter logs by action description or username..." 
          className="w-full bg-slate-50 border border-slate-200/60 px-4 py-2 rounded-xl text-xs outline-none focus:border-primary-500"
        />
      </div>

      {/* Audit Timeline Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                <th className="py-3 px-2">Timestamp</th>
                <th className="py-3 px-2">User / Role</th>
                <th className="py-3 px-2">Action Description</th>
                <th className="py-3 px-2">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-slate-400">Loading audit trails...</td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 px-2 text-slate-500 font-medium">
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {new Date(log.timestamp).toLocaleString()}</span>
                    </td>
                    <td className="py-3.5 px-2">
                      <span className="font-bold text-slate-800 block">{log.username || 'System'}</span>
                      <span className="text-[10px] text-primary-600 font-bold uppercase tracking-wider">{log.role || 'CORE'}</span>
                    </td>
                    <td className="py-3.5 px-2 text-slate-700 font-medium">{log.action}</td>
                    <td className="py-3.5 px-2 text-slate-500 font-mono">{log.ip_address || '127.0.0.1'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-12 text-slate-400">
                    No matching audit trails found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AuditLogs;
