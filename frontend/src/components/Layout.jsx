import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { 
  Home, User, Calendar, FileText, Settings, LogOut, Menu, X, Bell, 
  Layers, Users, ShieldAlert, Award, CreditCard, Check, Trash2, Briefcase, Mail
} from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await api.get('notifications/');
        const data = response.data.results || response.data;
        setNotifications(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    };
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 15000); // Poll every 15s
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllRead = async () => {
    try {
      await api.post('notifications/mark_all_read/');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await api.delete('notifications/clear_all/');
      setNotifications([]);
    } catch (err) {
      console.error(err);
    }
  };

  const markSingleRead = async (id) => {
    try {
      await api.patch(`notifications/${id}/`, { is_read: true });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const deleteSingleNotification = async (id) => {
    try {
      await api.delete(`notifications/${id}/`);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Define navigation based on User Role
  const getNavLinks = () => {
    switch (user?.role) {
      case 'ADMIN':
        return [
          {
            section: 'General',
            items: [
              { label: 'Dashboard', path: '/admin', icon: Home }
            ]
          },
          {
            section: 'Operations',
            items: [
              { label: 'Departments', path: '/admin/departments', icon: Layers },
              { label: 'Doctors', path: '/admin/doctors', icon: Award },
              { label: 'Patients', path: '/admin/patients', icon: Users },
              { label: 'Appointments', path: '/admin/appointments', icon: Calendar },
              { label: 'Reports', path: '/admin/reports', icon: FileText }
            ]
          },
          {
            section: 'Financials',
            items: [
              { label: 'Billing History', path: '/admin/billing', icon: CreditCard }
            ]
          },
          {
            section: 'System Control',
            items: [
              { label: 'Security Audits', path: '/admin/audit-logs', icon: ShieldAlert },
              { label: 'Global Settings', path: '/admin/settings', icon: Settings },
              { label: 'Job Applications', path: '/admin/careers', icon: Briefcase },
              { label: 'Contact Messages', path: '/admin/contact-messages', icon: Mail }
            ]
          }
        ];
      case 'DOCTOR':
        return [
          {
            section: 'General',
            items: [
              { label: 'Dashboard', path: '/doctor', icon: Home }
            ]
          },
          {
            section: 'Schedule',
            items: [
              { label: 'Manage Slots', path: '/doctor/slots', icon: Calendar }
            ]
          },
          {
            section: 'Account',
            items: [
              { label: 'Profile', path: '/profile', icon: User }
            ]
          }
        ];
      case 'RECEPTIONIST':
        return [
          {
            section: 'General',
            items: [
              { label: 'Reception Dashboard', path: '/reception', icon: Home }
            ]
          },
          {
            section: 'Account',
            items: [
              { label: 'Profile', path: '/profile', icon: User }
            ]
          }
        ];
      case 'PATIENT':
      default:
        return [
          {
            section: 'General',
            items: [
              { label: 'Dashboard', path: '/patient', icon: Home }
            ]
          },
          {
            section: 'Operations',
            items: [
              { label: 'Book Appointment', path: '/patient/book', icon: Calendar },
              { label: 'My Appointments', path: '/patient/appointments', icon: Calendar },
              { label: 'My Reports', path: '/patient/reports', icon: FileText }
            ]
          },
          {
            section: 'Account',
            items: [
              { label: 'Profile', path: '/profile', icon: User }
            ]
          }
        ];
    }
  };

  const navLinks = getNavLinks();
  const unreadCount = notifications.filter(n => !n.is_read).length;
  const photoUrl = user?.profile_photo 
    ? (user.profile_photo.startsWith('http') ? user.profile_photo : `http://localhost:8000${user.profile_photo}`)
    : null;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Component */}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-[#ebebeb] border-r border-slate-200/60 transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Brand Logo */}
        <div className="flex h-16 items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary-700">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-extrabold">+</div>
            <span>MediCare</span>
          </Link>
          <button className="lg:hidden text-slate-500" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-4 px-3 py-4 overflow-y-auto">
          {navLinks.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {section.section !== 'General' && (
                <div className="flex items-center justify-between px-3.5 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <span>{section.section}</span>
                  <span className="text-[9px] font-bold opacity-60">❯</span>
                </div>
              )}
              <div className="space-y-0.5">
                {section.items.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                        isActive 
                          ? 'bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.05)] font-semibold' 
                          : 'text-slate-700 hover:bg-white/40 hover:text-slate-900'
                      }`}
                    >
                      <Icon size={16} className={isActive ? 'text-slate-900' : 'text-slate-500'} />
                      <span>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Info / Logout */}
        <div className="p-4 bg-slate-200/40 border-t border-slate-300/30">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary-600 font-semibold uppercase overflow-hidden border border-slate-300/60 shadow-sm shrink-0">
              {photoUrl ? (
                <img src={photoUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                user?.username?.substring(0, 2)
              )}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-800 truncate">{user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}</p>
              <p className="text-xs text-slate-500 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 z-30 shadow-sm shadow-slate-100/40">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-slate-600" onClick={() => setSidebarOpen(true)}>
              <Menu size={22} />
            </button>
            <h1 className="text-lg font-semibold text-slate-800 hidden md:block">
              {navLinks.find(link => link.path === location.pathname)?.label || 'Portal'}
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Notification Bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors relative"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full h-5 w-5 flex items-center justify-center text-[9px] font-bold shadow-sm shadow-rose-200">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                  <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-700">Notifications</span>
                      <div className="flex gap-2">
                        {unreadCount > 0 && (
                          <button onClick={markAllRead} className="text-[10px] text-primary-600 hover:text-primary-800 font-semibold hover:underline">
                            Mark read
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button onClick={clearAllNotifications} className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold hover:underline">
                            Clear all
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center text-xs text-slate-400">No new notifications</div>
                      ) : (
                        notifications.map((notif) => (
                          <div key={notif.id} className={`px-4 py-3 border-b border-slate-50 text-xs transition-colors flex items-start justify-between gap-3 ${!notif.is_read ? 'bg-slate-50/70 font-medium' : ''}`}>
                            <div className="flex-1">
                              <p className="text-slate-800">{notif.message}</p>
                              <span className="text-[10px] text-slate-400 mt-1 block">
                                {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0 opacity-80 hover:opacity-100">
                              {!notif.is_read && (
                                <button 
                                  onClick={() => markSingleRead(notif.id)}
                                  title="Mark as read"
                                  className="p-1 hover:bg-slate-100 rounded text-emerald-600 transition-colors"
                                >
                                  <Check size={14} />
                                </button>
                              )}
                              <button 
                                onClick={() => deleteSingleNotification(notif.id)}
                                title="Delete"
                                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-rose-600 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Profile Avatar */}
            <Link to="/profile" className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white font-semibold text-sm overflow-hidden border border-slate-200">
              {photoUrl ? (
                <img src={photoUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                user?.username?.substring(0, 2).toUpperCase()
              )}
            </Link>
          </div>
        </header>

        {/* Route Pages Container */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
