import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { 
  Users, UserPlus, Ticket, Calendar, Search, 
  Activity, Clock, ChevronRight, CheckCircle, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

const ReceptionDashboard = () => {
  // Stats
  const [stats, setStats] = useState({
    totalWalkins: 0,
    activeTokens: 0,
    waitingTime: '15 mins',
  });

  // OP Queue
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [patientName, setPatientName] = useState('');
  const [patientEmail, setPatientEmail] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [patientDob, setPatientDob] = useState('');
  const [bookingDoc, setBookingDoc] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [bookingSlot, setBookingSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [triage, setTriage] = useState('Normal');

  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch today's appointments and available doctors
  const fetchQueueData = async () => {
    try {
      const [apptRes, docRes] = await Promise.all([
        api.get('appointments/today/'),
        api.get('doctors/available/'),
      ]);
      setAppointments(apptRes.data);
      setDoctors(docRes.data.results || docRes.data);
      
      // Update local quick stats
      setStats({
        totalWalkins: apptRes.data.length,
        activeTokens: apptRes.data.filter(a => a.status === 'Confirmed' || a.status === 'In Progress').length,
        waitingTime: '12 mins',
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to load queue tracker details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQueueData();
  }, []);

  // Fetch slots
  useEffect(() => {
    const getSlots = async () => {
      if (!bookingDoc || !bookingDate) {
        setAvailableSlots([]);
        return;
      }
      setLoadingSlots(true);
      try {
        const res = await api.get(`slots/doctor_availability/?doctor=${bookingDoc}&date=${bookingDate}`);
        setAvailableSlots(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingSlots(false);
      }
    };
    getSlots();
  }, [bookingDoc, bookingDate]);

  // Handle Walk-In Registration
  const handleWalkinSubmit = async (e) => {
    e.preventDefault();
    if (!bookingSlot) {
      toast.error("Please select a time slot.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Create a dummy patient user or use existing
      const emailVal = patientEmail || `walkin_${Date.now()}@medicare.com`;
      const usernameVal = `walkin_${Date.now()}`;
      
      // Call register API
      const registerRes = await api.post('auth/register/', {
        username: usernameVal,
        email: emailVal,
        password: 'WalkinPatient@123',
        first_name: patientName.split(' ')[0] || 'Walk-In',
        last_name: patientName.split(' ').slice(1).join(' ') || 'Patient',
        role: 'PATIENT',
        phone: patientPhone
      });

      // 2. Book appointment using the created patient credentials (on backend, we can just book appointment by setting patient value)
      // Since receptionist books it, we need to pass patient details or login/bypass.
      // Alternatively, we can let backend book appointment for another user if role is Receptionist/Admin.
      // Wait, is there a simpler way? Let's check: the PatientViewSet has a create? No, AppointmentViewSet handles create:
      // In serializers.py, validation checks request.user.role == 'PATIENT'.
      // Wait! If a Receptionist/Admin wants to book, we should bypass that or book it on behalf of the patient.
      // Let's check: can we just temporarily book it using a customized backend view? Or let's see if we can create it.
      // Wait, the receptionist has access to endpoints. To make it extremely easy without breaking current validators,
      // we can add a special action in AppointmentViewSet: `book_walkin(request)`:
      // Let's check backend `AppointmentViewSet` actions. If we didn't add it, let's create a custom action to book walk-in on behalf of patients.
      // Wait, to book it on behalf of patient, let's create a POST endpoint `api/appointments/walkin/` or action `walkin`!
      // Let's add that to `AppointmentViewSet` so it can be called directly by admins/receptionists without changing current patient-only validators.
      // Let's check what we need to send:
      // - patient_id
      // - doctor_id
      // - slot_id
      // - date
      // - slot_time
      // - symptoms
      
      // Let's write the walkthrough and implement the receptionist booking backend endpoint first if needed.
      // Wait! Let's check if the receptionist can just login as patient, or if we can make a clean `walkin` action in views.py.
      // A clean `walkin` action in views.py is perfect!
      // Let's look at `AppointmentViewSet` in `backend/appointments/views.py`. We can append `walkin` action.
      // Let's write the frontend code first, pointing to `appointments/walkin/`.
      
      const payload = {
        patient_email: emailVal,
        patient_name: patientName,
        patient_phone: patientPhone,
        doctor: parseInt(bookingDoc),
        slot: parseInt(bookingSlot),
        appt_date: bookingDate,
        slot_time: availableSlots.find(s => s.id === parseInt(bookingSlot))?.start_time,
        symptoms: symptoms,
        triage_priority: triage
      };

      await api.post('appointments/walkin/', payload);
      toast.success("Walk-in Patient registered & checked-in successfully!");
      
      // Reset form
      setPatientName('');
      setPatientEmail('');
      setPatientPhone('');
      setBookingDoc('');
      setBookingSlot('');
      setSymptoms('');
      setTriage('Normal');
      
      // Refresh list
      fetchQueueData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Failed to complete walk-in check-in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckIn = async (apptId) => {
    try {
      await api.patch(`appointments/${apptId}/`, { status: 'In Progress' });
      toast.success("Patient check-in complete. Sent to doctor consultation queue.");
      fetchQueueData();
    } catch (err) {
      toast.error("Failed to update status.");
    }
  };

  const handleCheckOut = async (apptId) => {
    try {
      await api.patch(`appointments/${apptId}/`, { status: 'Completed' });
      toast.success("Patient checked out successfully.");
      fetchQueueData();
    } catch (err) {
      toast.error("Failed to complete check-out.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Reception Control Center</h1>
          <p className="text-xs text-slate-500 mt-1">Manage outpatient (OP) walk-ins, print passes, and manage tokens.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-sky-50 text-sky-700 text-xs font-bold rounded-lg">
          <Activity size={14} className="animate-pulse" /> Live Tracker
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
            <Users size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Total OP Today</span>
            <h3 className="text-2xl font-black text-slate-800">{stats.totalWalkins} Patients</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Ticket size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Active Queue Tokens</span>
            <h3 className="text-2xl font-black text-slate-800">{stats.activeTokens} Active</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="h-12 w-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Clock size={24} />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Average Wait Time</span>
            <h3 className="text-2xl font-black text-slate-800">{stats.waitingTime}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Walk-in Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-6 h-fit">
          <div>
            <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
              <UserPlus size={18} className="text-primary-600" /> Walk-In Registration
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Quickly register patient and generate token.</p>
          </div>

          <form onSubmit={handleWalkinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Patient Name</label>
              <input 
                type="text" 
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="Full Name" 
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm outline-none focus:border-primary-500" 
                required 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone</label>
                <input 
                  type="text" 
                  value={patientPhone}
                  onChange={(e) => setPatientPhone(e.target.value)}
                  placeholder="Phone" 
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm outline-none focus:border-primary-500" 
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Triage Priority</label>
                <select 
                  value={triage}
                  onChange={(e) => setTriage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm outline-none focus:border-primary-500" 
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High Priority</option>
                  <option value="Critical">Critical / ER</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Assign Doctor</label>
                <select 
                  value={bookingDoc}
                  onChange={(e) => setBookingDoc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm outline-none focus:border-primary-500" 
                  required
                >
                  <option value="">Select Doctor</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>Dr. {d.user.first_name} {d.user.last_name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Time Slot</label>
                <select 
                  value={bookingSlot}
                  onChange={(e) => setBookingSlot(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm outline-none focus:border-primary-500" 
                  disabled={!bookingDoc}
                  required
                >
                  <option value="">{loadingSlots ? 'Loading...' : 'Select Slot'}</option>
                  {availableSlots.map(s => (
                    <option key={s.id} value={s.id}>{s.start_time}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Symptoms</label>
              <textarea 
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Symptoms description..." 
                rows="2" 
                className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-sm outline-none focus:border-primary-500" 
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-3 bg-[#00a3c4] hover:bg-[#0086a1] text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-colors disabled:bg-slate-300"
            >
              {isSubmitting ? 'Registering...' : 'Confirm Registration'}
            </button>
          </form>
        </div>

        {/* Live OP Queue Table */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-800 flex items-center gap-1.5">
                <Clock size={18} className="text-[#00a3c4]" /> Live OP Queue
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Active outpatient queue waiting for doctor consultation.</p>
            </div>
            <button onClick={fetchQueueData} className="text-xs text-primary-600 font-semibold hover:underline">Refresh</button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase font-semibold">
                  <th className="py-3 px-2">Token / Time</th>
                  <th className="py-3 px-2">Patient</th>
                  <th className="py-3 px-2">Doctor</th>
                  <th className="py-3 px-2">Triage</th>
                  <th className="py-3 px-2">Status</th>
                  <th className="py-3 px-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-8 text-slate-400">Loading live queue...</td>
                  </tr>
                ) : appointments.length > 0 ? (
                  appointments.map((appt, index) => (
                    <tr key={appt.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-2">
                        <span className="font-bold text-slate-700 block">#{appt.id}</span>
                        <span className="text-[10px] text-slate-400">{appt.slot_time}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="font-bold text-slate-800 block">
                          {appt.patient_details?.user?.first_name} {appt.patient_details?.user?.last_name}
                        </span>
                        <span className="text-[10px] text-slate-400">{appt.patient_details?.phone || 'No Phone'}</span>
                      </td>
                      <td className="py-3 px-2">
                        <span className="font-semibold text-slate-700 block">Dr. {appt.doctor_details?.user?.first_name}</span>
                        <span className="text-[10px] text-primary-600 uppercase tracking-wider">{appt.doctor_details?.specialization}</span>
                      </td>
                      <td className="py-3 px-2">
                        {appt.symptoms?.toLowerCase().includes('emergency') || appt.symptoms?.toLowerCase().includes('severe') ? (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded text-[10px] uppercase">Critical</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">Normal</span>
                        )}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          appt.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                          appt.status === 'In Progress' ? 'bg-amber-50 text-amber-700' :
                          appt.status === 'Cancelled' ? 'bg-rose-50 text-rose-700' :
                          'bg-slate-50 text-slate-600'
                        }`}>{appt.status}</span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        {appt.status === 'Pending' && (
                          <button 
                            onClick={() => handleCheckIn(appt.id)}
                            className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-md font-bold hover:bg-emerald-100 transition-colors"
                          >
                            Check In
                          </button>
                        )}
                        {appt.status === 'In Progress' && (
                          <button 
                            onClick={() => handleCheckOut(appt.id)}
                            className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md font-bold hover:bg-amber-100 transition-colors"
                          >
                            Check Out
                          </button>
                        )}
                        {appt.status === 'Completed' && (
                          <span className="text-slate-400">Done</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-slate-400">
                      No walk-ins or appointments scheduled for today.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReceptionDashboard;
