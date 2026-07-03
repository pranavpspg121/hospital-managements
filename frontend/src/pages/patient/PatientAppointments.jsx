import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Calendar, Clock, AlertCircle, X, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

const PatientAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppt, setSelectedAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('appointments/');
      setAppointments(response.data.results || response.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleCancelClick = (appt) => {
    setSelectedAppt(appt);
    setCancelReason('');
    setShowCancelModal(true);
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAppt) return;
    setCancelling(true);
    try {
      await api.post(`appointments/${selectedAppt.id}/cancel/`, {
        cancel_reason: cancelReason,
      });
      toast.success('Appointment cancelled.');
      setShowCancelModal(false);
      fetchAppointments();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Cancellation failed.');
    } finally {
      setCancelling(false);
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

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
        <h3 className="font-bold text-slate-800 text-lg mb-4">Your Appointment Log</h3>
        
        {appointments.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-xl">
            <Calendar size={36} className="text-slate-300 mb-2 mx-auto" />
            <p className="text-sm font-medium text-slate-500">No appointments recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase">
                  <th className="pb-3">Booking ID</th>
                  <th className="pb-3">Doctor</th>
                  <th className="pb-3">Appointment Date</th>
                  <th className="pb-3">Booked On</th>
                  <th className="pb-3">Consultation Fee</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {appointments.map((appt) => {
                  // Determine if cancellation is permitted (>24 hours)
                  const apptDateStr = `${appt.appt_date}T${appt.slot_time}`;
                  const apptDate = new Date(apptDateStr);
                  const now = new Date();
                  const timeDiff = apptDate.getTime() - now.getTime();
                  const hoursDiff = timeDiff / (1000 * 3600);
                  const canCancel = appt.status !== 'Cancelled' && appt.status !== 'Completed' && hoursDiff > 24;

                  return (
                    <tr key={appt.id} className="hover:bg-slate-50/40 transition-colors">
                      {/* Booking ID */}
                      <td className="py-4 pr-4">
                        <p className="font-mono font-bold text-xs text-primary-600 bg-primary-50 px-2 py-1 rounded-lg inline-block">
                          #BK-{String(appt.id).padStart(4, '0')}
                        </p>
                        {appt.razorpay_ord_id && !appt.razorpay_ord_id.includes('mock') && (
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                            {appt.razorpay_ord_id.slice(0, 18)}…
                          </p>
                        )}
                      </td>
                      <td className="py-4">
                        <p className="font-semibold text-slate-800">Dr. {appt.doctor_details.user.first_name} {appt.doctor_details.user.last_name}</p>
                        <p className="text-xs text-slate-400 font-medium">{appt.doctor_details.specialization}</p>
                      </td>
                      <td className="py-4">
                        <p className="font-semibold text-slate-700">{appt.appt_date}</p>
                        <p className="text-xs text-slate-400 font-medium">{appt.slot_time}</p>
                      </td>
                      {/* Booked On */}
                      <td className="py-4">
                        <p className="font-semibold text-slate-700">
                          {new Date(appt.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-slate-400 font-medium">
                          {new Date(appt.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                        </p>
                      </td>
                      <td className="py-4 font-semibold text-slate-700">₹{appt.amount}</td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          appt.payment_status === 'Paid' ? 'bg-emerald-50 text-emerald-700' :
                          appt.payment_status === 'Pending' ? 'bg-amber-50 text-amber-600' :
                          'bg-rose-50 text-rose-600'
                        }`}>
                          {appt.payment_status}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          appt.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700' :
                          appt.status === 'Pending' ? 'bg-amber-50 text-amber-700' :
                          appt.status === 'Cancelled' ? 'bg-slate-100 text-slate-600' :
                          'bg-indigo-50 text-indigo-700'
                        }`}>
                          {appt.status}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        {canCancel ? (
                          <button
                            onClick={() => handleCancelClick(appt)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">None</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-base">Cancel Appointment</h3>
              <button onClick={() => setShowCancelModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Reason for Cancellation</label>
                <textarea
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please state why you are cancelling..."
                  rows="3"
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 rounded-lg"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-xs font-semibold text-white rounded-lg flex items-center gap-1"
                >
                  {cancelling && <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></span>}
                  <span>Cancel Visit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientAppointments;
