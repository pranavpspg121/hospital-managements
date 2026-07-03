import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FileText, Download, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const PatientReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const response = await api.get('reports/');
        setReports(response.data.results || response.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load reports.');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="h-24 bg-slate-200 rounded-2xl"></div>
        <div className="h-24 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Your Medical Records</h3>

        {reports.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-xl">
            <FileText size={36} className="text-slate-300 mb-2 mx-auto" />
            <p className="text-sm font-medium text-slate-500">No medical reports uploaded yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reports.map((report) => (
              <div key={report.id} className="p-4 border border-slate-200 hover:border-primary-200 rounded-xl flex items-center justify-between transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-primary-50 rounded-lg text-primary-600">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">{report.report_type}</h4>
                    {report.description && <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{report.description}</p>}
                    <span className="text-[10px] text-slate-400 font-medium block mt-1 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(report.uploaded_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <a
                  href={`http://localhost:8000${report.file}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-slate-500 hover:text-primary-600 hover:bg-slate-50 rounded-lg transition-colors border border-slate-100"
                >
                  <Download size={18} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientReports;
