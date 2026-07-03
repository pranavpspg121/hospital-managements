import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Calendar, Check, X, Clipboard, User, Clock, 
  AlertTriangle, CheckCircle, ShieldAlert 
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConsultationModal from '../../components/ConsultationModal';

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Consultation modal states
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [apptToConsult, setApptToConsult] = useState(null);

  const [selectedAppt, setSelectedAppt] = useState(null);
  const [notes, setNotes] = useState('');
  const [notesLoading, setNotesLoading] = useState(false);

  const fetchTodayAppointments = async () => {
    try {
      const response = await api.get('appointments/');
      // Filter for today's appointments on frontend or let it fetch all for simple view
      setAppointments(response.data.results || response.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch appointments queue.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAppointments();
  }, []);

  const handleStatusChange = async (apptId, newStatus) => {
    try {
      await api.patch(`appointments/${apptId}/`, { status: newStatus });
      toast.success(`Appointment marked as ${newStatus}`);
      fetchTodayAppointments();
    } catch (err) {
      console.error(err);
      toast.error('Failed to update status.');
    }
  };

  const handleSaveNotes = async (e) => {
    e.preventDefault();
    if (!selectedAppt) return;

    setNotesLoading(true);
    try {
      await api.patch(`appointments/${selectedAppt.id}/`, { 
        symptoms: notes, // doctor notes can append to symptoms or notes
        status: 'Completed' 
      });
      toast.success('Medical history notes saved and appointment marked Completed.');
      setSelectedAppt(null);
      setNotes('');
      fetchTodayAppointments();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save notes.');
    } finally {
      setNotesLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="h-32 bg-slate-200 rounded-2xl"></div>
        <div className="h-32 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  const photoUrl = user?.profile_photo 
    ? (user.profile_photo.startsWith('http') ? user.profile_photo : `http://localhost:8000${user.profile_photo}`)
    : null;

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-xl font-bold uppercase overflow-hidden border border-slate-200">
            {photoUrl ? (
              <img src={photoUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              user?.username?.substring(0, 2)
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Welcome, Dr. {user?.first_name || user?.username}!</h2>
            <p className="text-sm text-slate-500">
              {user?.doctor_profile?.specialization ? `${user.doctor_profile.specialization} Specialist` : 'Medical Practitioner'} • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Appointments Queue Table */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 text-lg mb-4">Patient Visits Queue</h3>

          {appointments.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-xl">
              <User size={36} className="text-slate-300 mb-2 mx-auto" />
              <p className="text-sm font-medium text-slate-500">No appointments in the queue.</p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase">
                    <th className="pb-3">Patient</th>
                    <th className="pb-3">Date/Time</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {appointments.map((appt) => (
                    <tr key={appt.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5">
                        <p className="font-semibold text-slate-800">{appt.patient_details.user.first_name} {appt.patient_details.user.last_name}</p>
                        <p className="text-xs text-slate-400 font-medium">{appt.patient_details.phone || 'No phone'}</p>
                      </td>
                      <td className="py-3.5">
                        <p className="font-semibold text-slate-700">{appt.appt_date}</p>
                        <p className="text-xs text-slate-400 font-medium">{appt.slot_time}</p>
                      </td>
                      <td className="py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          appt.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          appt.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          appt.status === 'Completed' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                          appt.status === 'Cancelled' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                          'bg-rose-50 text-rose-700 border border-rose-100'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="py-3.5 text-right flex justify-end gap-2 mt-1">
                        {appt.status === 'Pending' && (
                          <button
                            onClick={() => handleStatusChange(appt.id, 'Confirmed')}
                            className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                            title="Confirm Appointment"
                          >
                            <Check size={16} />
                          </button>
                        )}
                        {appt.status === 'Confirmed' && (
                          <>
                            <button
                              onClick={() => {
                                setApptToConsult(appt);
                                setIsConsultModalOpen(true);
                              }}
                              className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                              title="Add Prescription / Complete"
                            >
                              <Clipboard size={16} />
                            </button>
                            <button
                              onClick={() => handleStatusChange(appt.id, 'No Show')}
                              className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                              title="Mark No Show"
                            >
                              <AlertTriangle size={16} />
                            </button>
                          </>
                        )}
                        {appt.status === 'Completed' && (
                          <span className="text-xs text-slate-400 font-medium">Completed</span>
                        )}
                        {appt.status === 'Cancelled' && (
                          <span className="text-xs text-slate-400 font-medium">Cancelled</span>
                        )}
                        {appt.status === 'No Show' && (
                          <button
                            onClick={() => handleStatusChange(appt.id, 'Confirmed')}
                            className="text-xs font-semibold text-primary-600 hover:text-primary-750 bg-primary-50 hover:bg-primary-100 px-2.5 py-1 rounded-lg transition-colors border border-primary-100"
                            title="Undo No Show / Revert to Confirmed"
                          >
                            Undo No Show
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Diagnosis & Prescription Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-fit">
          <h3 className="font-bold text-slate-800 text-lg mb-4">Diagnosis & Notes</h3>

          {!selectedAppt ? (
            <div className="text-center py-16 text-slate-400 text-xs">
              Select an appointment from the queue to start diagnosing or writing medical recommendations.
            </div>
          ) : (
            <form onSubmit={handleSaveNotes} className="space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
                <p><span className="font-semibold text-slate-600">Patient:</span> {selectedAppt.patient_details.user.first_name} {selectedAppt.patient_details.user.last_name}</p>
                <p><span className="font-semibold text-slate-600">Time:</span> {selectedAppt.slot_time}</p>
                {selectedAppt.symptoms && <p><span className="font-semibold text-slate-600">Reported Symptoms:</span> {selectedAppt.symptoms}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-500 mb-1.5">Doctor Diagnosis & Prescription</label>
                <textarea
                  required
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add diagnosis, drugs prescription, and follow-up rules..."
                  rows="6"
                  className="w-full rounded-xl border border-slate-200 p-3.5 text-sm outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={notesLoading}
                  className="flex-1 bg-primary-600 hover:bg-primary-700 text-white rounded-xl py-2.5 text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-md shadow-primary-200"
                >
                  {notesLoading && <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></span>}
                  <span>Complete Diagnosis</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedAppt(null)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl px-4 py-2.5 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
      <ConsultationModal 
        isOpen={isConsultModalOpen} 
        onClose={() => {
          setIsConsultModalOpen(false);
          setApptToConsult(null);
        }}
        appointment={apptToConsult}
        onConsultationComplete={fetchTodayAppointments}
      />
    </div>
  );
};

export default DoctorDashboard;
