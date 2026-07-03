import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Users, Trash2, Eye, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

const PatientManagement = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const fetchPatients = async () => {
    try {
      const response = await api.get('patients/');
      setPatients(response.data.results || response.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load patient records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate/delete this patient account?')) return;
    try {
      await api.delete(`patients/${id}/`);
      toast.success('Patient account deleted/deactivated.');
      fetchPatients();
    } catch (err) {
      console.error(err);
      toast.error('Deactivation failed.');
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Patients Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden flex flex-col">
          <h3 className="font-bold text-slate-800 text-lg mb-4">Patient Directory</h3>

          {patients.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-xl">
              <Users size={36} className="text-slate-300 mb-2 mx-auto" />
              <p className="text-sm font-medium text-slate-500">No patients registered.</p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase">
                    <th className="pb-3">Patient</th>
                    <th className="pb-3">Mobile Phone</th>
                    <th className="pb-3">Blood Group</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {patients.map((pat) => (
                    <tr key={pat.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-4">
                        <p className="font-semibold text-slate-800">{pat.user.first_name} {pat.user.last_name}</p>
                        <p className="text-xs text-slate-500">@{pat.user.username} • {pat.user.email}</p>
                      </td>
                      <td className="py-4 font-medium text-slate-700">{pat.phone || 'N/A'}</td>
                      <td className="py-4 font-semibold text-slate-700">
                        {pat.blood_group ? (
                          <span className="px-2.5 py-0.5 rounded bg-primary-50 text-primary-700 text-xs border border-primary-100">{pat.blood_group}</span>
                        ) : 'N/A'}
                      </td>
                      <td className="py-4 text-right flex justify-end gap-2 mt-1">
                        <button
                          onClick={() => setSelectedPatient(pat)}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-100"
                          title="View Details"
                        >
                          <Eye size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(pat.id)}
                          className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors border border-rose-50"
                          title="Deactivate Account"
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

        {/* Selected Patient Medical History Detail Panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-fit">
          <h3 className="font-bold text-slate-800 text-lg mb-4">Patient Profile Detail</h3>

          {!selectedPatient ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              Select a patient from directory to view medical notes, date of birth, emergency numbers, and home addresses.
            </div>
          ) : (
            <div className="space-y-4 text-xs text-slate-600">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm uppercase">
                  {selectedPatient.user.username.substring(0, 2)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{selectedPatient.user.first_name} {selectedPatient.user.last_name}</h4>
                  <p className="text-[10px] text-slate-400">UID: #{selectedPatient.id}</p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-2">
                <p><span className="font-semibold text-slate-400 block mb-0.5">Date of Birth</span> <span className="text-slate-800 font-semibold">{selectedPatient.date_of_birth || 'N/A'}</span></p>
                <p><span className="font-semibold text-slate-400 block mb-0.5">Emergency Contact</span> <span className="text-slate-800 font-semibold">{selectedPatient.emergency_no || 'N/A'}</span></p>
                <p><span className="font-semibold text-slate-400 block mb-0.5">Home Address</span> <span className="text-slate-700">{selectedPatient.address || 'N/A'}</span></p>
                <p><span className="font-semibold text-slate-400 block mb-0.5">Medical History Notes</span> <span className="text-slate-700 italic block mt-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100/50">{selectedPatient.medical_history || 'No history logged.'}</span></p>
              </div>

              <button
                onClick={() => setSelectedPatient(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl py-2 text-xs font-bold transition-all mt-4"
              >
                Clear Details
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default PatientManagement;
