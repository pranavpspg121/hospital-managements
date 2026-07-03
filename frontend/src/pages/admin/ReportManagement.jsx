import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FileText, Plus, Trash2, Download, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

const ReportManagement = () => {
  const [reports, setReports] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    patient: '',
    report_type: 'Lab Test',
    description: '',
  });
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchData = async () => {
    try {
      const [reportsRes, patientsRes] = await Promise.all([
        api.get('reports/'),
        api.get('patients/'),
      ]);
      setReports(reportsRes.data.results || reportsRes.data);
      setPatients(patientsRes.data.results || patientsRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load reports directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size cannot exceed 10MB.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient || !selectedFile) {
      toast.error('Please choose a patient and attach a report file.');
      return;
    }

    setUploading(true);
    try {
      const payload = new FormData();
      payload.append('patient', formData.patient);
      payload.append('report_type', formData.report_type);
      payload.append('description', formData.description);
      payload.append('file', selectedFile);

      await api.post('reports/', payload, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      toast.success('Medical report uploaded successfully.');
      setShowAddModal(false);
      // Reset form
      setFormData({ patient: '', report_type: 'Lab Test', description: '' });
      setSelectedFile(null);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.file?.[0] || 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report permanently?')) return;
    try {
      await api.delete(`reports/${id}/`);
      toast.success('Report deleted.');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Deletion failed.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="h-32 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Hospital Diagnostic Records</h3>
            <p className="text-xs text-slate-400">Upload reports for patient records and remove old files</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md shadow-primary-200"
          >
            <Plus size={16} />
            <span>Upload Diagnostic Report</span>
          </button>
        </div>

        {reports.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-xl">
            <FileText size={36} className="text-slate-300 mb-2 mx-auto" />
            <p className="text-sm font-medium text-slate-500">No diagnostic reports present.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase">
                  <th className="pb-3">Patient</th>
                  <th className="pb-3">Report Category</th>
                  <th className="pb-3">Details</th>
                  <th className="pb-3">Uploaded Date</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4">
                      <p className="font-semibold text-slate-800">
                        {report.patient_details?.user?.first_name} {report.patient_details?.user?.last_name}
                      </p>
                      <p className="text-xs text-slate-400">@{report.patient_details?.user?.username}</p>
                    </td>
                    <td className="py-4 font-semibold text-slate-700">{report.report_type}</td>
                    <td className="py-4 text-xs text-slate-500 max-w-xs truncate">{report.description || 'No description'}</td>
                    <td className="py-4 text-xs text-slate-400 font-medium">{new Date(report.uploaded_at).toLocaleDateString()}</td>
                    <td className="py-4 text-right flex justify-end gap-2 mt-1">
                      <a
                        href={`http://localhost:8000${report.file}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-100"
                        title="Download File"
                      >
                        <Download size={15} />
                      </a>
                      <button
                        onClick={() => handleDelete(report.id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors border border-rose-50"
                        title="Delete Report"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-base">Upload Diagnostic Report</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Select Patient *</label>
                <select
                  name="patient"
                  value={formData.patient}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500 bg-white"
                >
                  <option value="">Choose Patient</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>{p.user.first_name} {p.user.last_name} (@{p.user.username})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Report Category *</label>
                  <select
                    name="report_type"
                    value={formData.report_type}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-primary-500 bg-white"
                  >
                    <option value="Lab Test">Lab Test</option>
                    <option value="X-Ray">X-Ray</option>
                    <option value="MRI Scan">MRI Scan</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Discharge Summary">Discharge Summary</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Choose File *</label>
                  <label className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-600">
                    <Upload size={14} />
                    <span className="truncate">{selectedFile ? selectedFile.name : 'Choose File'}</span>
                    <input
                      type="file"
                      required
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Notes / Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Additional notes about test results..."
                  rows="3"
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-xs font-semibold text-white rounded-lg flex items-center gap-1"
                >
                  {uploading && <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></span>}
                  <span>Upload Report</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportManagement;
