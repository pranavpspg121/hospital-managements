import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Briefcase, Download, Mail, Phone, Calendar, Search } from 'lucide-react';
import toast from 'react-hot-toast';

const JobApplications = () => {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchApplications = async () => {
    try {
      const res = await api.get('job-applications/');
      setApps(res.data.results || res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load career applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.qualification.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="text-primary-600" size={24} /> Career & Job Applications
          </h1>
          <p className="text-xs text-slate-500 mt-1">Review resumes and qualifications of applicants applying for Nurse and staff roles.</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-3">
        <Search size={18} className="text-slate-400" />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Filter applications by name, position, or qualifications..." 
          className="w-full bg-slate-50 border border-slate-200/60 px-4 py-2 rounded-xl text-xs outline-none focus:border-primary-500"
        />
      </div>

      {/* Applications List Grid */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                <th className="py-3 px-2">Applicant</th>
                <th className="py-3 px-2">Target Position</th>
                <th className="py-3 px-2">Qualifications & Details</th>
                <th className="py-3 px-2">Applied At</th>
                <th className="py-3 px-2 text-right">Resume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-slate-400">Loading applications...</td>
                </tr>
              ) : filteredApps.length > 0 ? (
                filteredApps.map((app) => {
                  const resumeUrl = app.resume 
                    ? (app.resume.startsWith('http') ? app.resume : `http://localhost:8000${app.resume}`) 
                    : null;
                  return (
                    <tr key={app.id} className="hover:bg-slate-50/50">
                      <td className="py-4 px-2">
                        <span className="font-bold text-slate-800 block">{app.name}</span>
                        <span className="text-[10px] text-slate-400 block flex items-center gap-1 mt-0.5"><Mail size={10} /> {app.email}</span>
                        <span className="text-[10px] text-slate-400 block flex items-center gap-1 mt-0.5"><Phone size={10} /> {app.phone}</span>
                      </td>
                      <td className="py-4 px-2">
                        <span className="px-2.5 py-0.5 bg-primary-50 text-primary-700 font-bold rounded-lg uppercase tracking-wider text-[10px]">
                          {app.position}
                        </span>
                      </td>
                      <td className="py-4 px-2 max-w-xs">
                        <p className="text-slate-600 leading-relaxed font-medium line-clamp-3">{app.qualification}</p>
                      </td>
                      <td className="py-4 px-2 text-slate-500">
                        <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(app.applied_at).toLocaleDateString()}</span>
                      </td>
                      <td className="py-4 px-2 text-right">
                        {resumeUrl ? (
                          <a 
                            href={resumeUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#00a3c4] hover:bg-[#0086a1] text-white rounded-lg font-bold transition-colors"
                          >
                            <Download size={12} /> Download
                          </a>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400">
                    No applications submitted yet.
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

export default JobApplications;
