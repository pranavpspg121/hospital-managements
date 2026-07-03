import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, Activity, Calendar, CreditCard, Loader2 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#0284c7', '#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [deptStats, setDeptStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, trendsRes, revRes, deptRes] = await Promise.all([
          api.get('dashboard/summary/'),
          api.get('dashboard/appointment-trends/'),
          api.get('dashboard/revenue/'),
          api.get('dashboard/department-stats/'),
        ]);

        setStats(statsRes.data);
        setTrends(trendsRes.data);
        setRevenue(revRes.data);
        setDeptStats(deptRes.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load analytics dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50/50">
        <Loader2 className="animate-spin text-primary-600" size={36} />
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
            <h2 className="text-xl font-bold text-slate-800">Welcome, {user?.first_name || user?.username}!</h2>
            <p className="text-sm text-slate-500">System Admin Portal • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>

      {/* Stats Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-sky-50 rounded-xl text-sky-600">
            <Users size={22} />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Patients</span>
            <span className="text-xl font-bold text-slate-800">{stats?.total_patients}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
            <Activity size={22} />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Doctors</span>
            <span className="text-xl font-bold text-slate-800">{stats?.total_doctors}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
            <Calendar size={22} />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Appointments</span>
            <span className="text-xl font-bold text-slate-800">{stats?.total_appointments}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
            <CreditCard size={22} />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Revenue</span>
            <span className="text-xl font-bold text-slate-800">₹{stats?.total_revenue}</span>
          </div>
        </div>
      </div>

      {/* Recharts Plots Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Appointments Trend Line Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Appointments Booked (Last 30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Line type="monotone" dataKey="count" name="Appointments" stroke="#0ea5e9" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Trends Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Revenue Earned (Last 30 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip formatter={(value) => `₹${value}`} contentStyle={{ background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Bar dataKey="revenue" name="Revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doctor Distribution Pie Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Department Load Distribution</h3>
          <div className="h-72 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="appointments"
                    nameKey="name"
                  >
                    {deptStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value} visits`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Department Custom Legend */}
            <div className="space-y-3">
              {deptStats.map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between text-xs border-b border-slate-50 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span className="font-semibold text-slate-700">{item.name}</span>
                  </div>
                  <span className="text-slate-400 font-medium">{item.doctors} Doctors • {item.appointments} Appointments</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
