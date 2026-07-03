import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Calendar, FileText, Activity, ShieldAlert, Award, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    upcoming: 0,
    past: 0,
    reports: 0,
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [apptsRes, reportsRes] = await Promise.all([
          api.get('appointments/upcoming/'),
          api.get('reports/'),
        ]);

        // appointments/upcoming is unpaginated raw list
        const apptsData = apptsRes.data.results || apptsRes.data;
        setUpcomingAppointments(Array.isArray(apptsData) ? apptsData.slice(0, 3) : []);
        
        // Fetch past appointments to compute stats
        const pastRes = await api.get('appointments/history/');
        const pastData = pastRes.data.results || pastRes.data;
        const reportsData = reportsRes.data.results || reportsRes.data;
        
        setStats({
          upcoming: Array.isArray(apptsData) ? apptsData.length : 0,
          past: Array.isArray(pastData) ? pastData.length : 0,
          reports: Array.isArray(reportsData) ? reportsData.length : 0
        });
      } catch (err) {
        console.error(err);
        toast.error('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-slate-200 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
          <div className="h-32 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  const photoUrl = user?.profile_photo 
    ? (user.profile_photo.startsWith('http') ? user.profile_photo : `http://localhost:8000${user.profile_photo}`)
    : null;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 to-primary-800 p-8 rounded-2xl text-white shadow-lg shadow-primary-100/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl flex flex-col md:flex-row items-start md:items-center gap-4">
          <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center text-white text-xl font-bold uppercase overflow-hidden border border-white/20 shrink-0">
            {photoUrl ? (
              <img src={photoUrl} alt="Avatar" className="h-full w-full object-cover" />
            ) : (
              user?.username?.substring(0, 2)
            )}
          </div>
          <div>
            <h2 className="text-2xl font-bold">Hello, {user?.first_name || user?.username}!</h2>
            <p className="text-primary-100 mt-1.5 text-sm leading-relaxed">
              Welcome to your healthcare portal. Access your medical records, check doctor slot availability, and book appointments in seconds.
            </p>
          </div>
        </div>
        <div className="relative z-10 shrink-0">
          <Link
            to="/patient/book"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-primary-700 shadow-md shadow-primary-950/10 hover:bg-slate-50 transition-colors"
          >
            <Calendar size={16} />
            <span>Book New Appointment</span>
          </Link>
        </div>
        {/* Abstract background decorative shapes */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-white/5 -skew-x-12 transform origin-top-right"></div>
      </div>

      {/* Quick Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-primary-50 rounded-xl text-primary-600">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Upcoming Visits</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{stats.upcoming}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Completed Visits</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{stats.past}</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <FileText size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Medical Reports</p>
            <h3 className="text-2xl font-bold text-slate-800 mt-0.5">{stats.reports}</h3>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Appointments List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-800">Your Upcoming Appointments</h3>
            <Link to="/patient/appointments" className="text-xs font-semibold text-primary-600 hover:underline">
              View All
            </Link>
          </div>

          <div className="flex-1 space-y-4">
            {upcomingAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
                <Calendar size={32} className="text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-500">No upcoming appointments booked</p>
                <Link to="/patient/book" className="text-xs text-primary-600 mt-1 font-semibold hover:underline">
                  Book your first visit
                </Link>
              </div>
            ) : (
              upcomingAppointments.map((appt) => (
                <div key={appt.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border border-slate-100 rounded-xl hover:border-primary-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary-50 rounded-lg flex items-center justify-center text-primary-600 font-semibold uppercase text-xs">
                      {appt.doctor_details.user.first_name.substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">Dr. {appt.doctor_details.user.first_name} {appt.doctor_details.user.last_name}</p>
                      <p className="text-xs text-slate-500">{appt.doctor_details.specialization} • ₹{appt.amount}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 md:mt-0">
                    <div className="text-right">
                      <p className="text-xs font-semibold text-slate-700">{appt.appt_date}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{appt.slot_time}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      appt.status === 'Confirmed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                      appt.status === 'Pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                      'bg-slate-50 text-slate-700'
                    }`}>
                      {appt.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Health Tips */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-4">Wellness Recommendations</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3.5 bg-sky-50/50 rounded-xl border border-sky-100/50">
              <Award size={18} className="text-sky-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-xs text-slate-800">Hydration is Key</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Drink at least 2-3 liters of water daily to maintain electrolyte balances and improve energy.</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3.5 bg-emerald-50/50 rounded-xl border border-emerald-100/50">
              <Activity size={18} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-xs text-slate-800">Daily Exercise</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">A fast 30-minute walk improves heart rate levels, reduces stress hormones, and aids circulation.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDashboard;
