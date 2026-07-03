import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Calendar, Clock, X, Search, Filter } from 'lucide-react';
import toast from 'react-hot-toast';

const AppointmentManagement = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Cancellation Modal State
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
      toast.error('Failed to load appointments log.');
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
        cancel_reason: cancelReason
      });
      toast.success('Appointment cancelled.');
      setShowCancelModal(false);
      fetchAppointments();
    } catch (err) {
      console.error(err);
      toast.error('Failed to cancel appointment.');
    } finally {
      setCancelling(false);
    }
  };

  // Filter appointments list
  const filteredAppointments = appointments.filter(appt => {
    const matchesStatus = statusFilter ? appt.status === statusFilter : true;
    const patName = `${appt.patient_details.user.first_name} ${appt.patient_details.user.last_name}`.toLowerCase();
    const docName = `${appt.doctor_details.user.first_name} ${appt.doctor_details.user.last_name}`.toLowerCase();
    const matchesSearch = patName.includes(search.toLowerCase()) || docName.includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

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
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={18} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by patient or doctor name..."
              className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2 text-sm outline-none focus:border-primary-500"
            />
          </div>

          <div className="w-full md:w-48 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Filter size={18} />
            </span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2.5 text-xs outline-none focus:border-primary-500 appearance-none bg-white font-semibold text-slate-600"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Confirmed">Confirmed</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="No Show">No Show</option>
            </select>
          </div>
        </div>

        {filteredAppointments.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-xl">
            <Calendar size={36} className="text-slate-300 mb-2 mx-auto" />
            <p className="text-sm font-medium text-slate-500">No appointments found matching filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase">
                  <th className="pb-3">Appointment ID</th>
                  <th className="pb-3">Patient</th>
                  <th className="pb-3">Doctor</th>
                  <th className="pb-3">Date & Time</th>
                  <th className="pb-3">Payment</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredAppointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-slate-50/40 transition-colors">
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
                    <td className="py-4 font-semibold text-slate-800">
                      {appt.patient_details.user.first_name} {appt.patient_details.user.last_name}
                    </td>
                    <td className="py-4">
                      <p className="font-semibold text-slate-700">Dr. {appt.doctor_details.user.first_name} {appt.doctor_details.user.last_name}</p>
                      <p className="text-xs text-slate-400">{appt.doctor_details.specialization}</p>
                    </td>
                    <td className="py-4">
                      <p className="font-semibold text-slate-700">{appt.appt_date}</p>
                      <p className="text-xs text-slate-400 font-medium">{appt.slot_time}</p>
                    </td>
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
                        appt.status === 'Completed' ? 'bg-indigo-50 text-indigo-700' :
                        'bg-rose-50 text-rose-700'
                      }`}>
                        {appt.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      {appt.status !== 'Cancelled' && appt.status !== 'Completed' ? (
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
                ))}
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
              <h3 className="font-bold text-slate-800 text-base">Force Cancel Appointment</h3>
              <button onClick={() => setShowCancelModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-1.5">Administrative Reason</label>
                <textarea
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="State the administrative reason for cancelling this patient visit..."
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

export default AppointmentManagement;
