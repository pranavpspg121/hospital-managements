import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { 
  Heart, Brain, Bone, Shield, Activity, Mail, Phone, MapPin, CheckCircle, ArrowRight, Users
} from 'lucide-react';

const Services = () => {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState({
    address: '123 Creative Boulevard, Design District, NY 10012',
    phone: '+1 (555) 987-6543',
    email: 'hello@designstudio.com'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('settings/');
        setSettings(res.data);
      } catch (err) {
        console.error("Failed to load settings:", err);
      }
    };
    fetchSettings();
  }, []);

  const getDashboardPath = () => {
    if (!user) return '/login';
    if (user.role === 'ADMIN') return '/admin';
    if (user.role === 'DOCTOR') return '/doctor';
    if (user.role === 'RECEPTIONIST') return '/reception';
    return '/patient';
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-600 flex flex-col justify-between">
      {/* Top bar */}
      <div className="bg-[#0e383c] text-white text-xs py-2 px-6 flex justify-between items-center border-b border-white/5">
        <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row justify-between items-center gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5"><Mail size={12} className="text-[#00a3c4]" /> {settings.email}</span>
            <span className="flex items-center gap-1.5"><Phone size={12} className="text-[#00a3c4]" /> {settings.phone}</span>
          </div>
          <div className="flex gap-3 font-semibold text-[10px] uppercase tracking-wider text-white/80">
            <span>Accredited Medical Center</span>
            <span>•</span>
            <span>24/7 Support</span>
          </div>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 bg-white/95 backdrop-blur shadow-sm z-40 py-4 px-6 border-b border-slate-100">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0e383c] text-[#00a3c4] font-extrabold text-xl">+</div>
            <span className="font-extrabold text-2xl text-[#0e383c] tracking-tight font-serif">Clinic</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8 text-xs font-bold text-slate-800 uppercase tracking-wider">
            <Link to="/" className="hover:text-[#00a3c4] transition-colors">Home</Link>
            <Link to="/about" className="hover:text-[#00a3c4] transition-colors">About</Link>
            <Link to="/departments" className="hover:text-[#00a3c4] transition-colors">Departments</Link>
            <Link to="/services" className="text-[#00a3c4] transition-colors">Services</Link>
            <Link to="/doctors" className="hover:text-[#00a3c4] transition-colors">Doctors</Link>
            <Link to="/contact" className="hover:text-[#00a3c4] transition-colors">Contact</Link>
            <Link to="/careers" className="hover:text-[#00a3c4] transition-colors text-primary-600">Careers</Link>
          </nav>

          <div className="flex gap-3 items-center">
            {user ? (
              <>
                <Link to={getDashboardPath()} className="px-5 py-2 rounded-lg bg-[#0e383c] hover:bg-[#071c1e] text-white font-bold text-xs uppercase tracking-wider transition-colors">
                  Dashboard
                </Link>
                <button onClick={logout} className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase tracking-wider transition-colors">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-5 py-2 rounded-lg bg-[#00a3c4] hover:bg-[#0086a1] text-white font-bold text-xs uppercase tracking-wider transition-colors">
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Page Title */}
      <div className="bg-[#0e383c] text-white py-16 px-6 text-center space-y-4">
        <div className="max-w-2xl mx-auto space-y-2">
          <h1 className="text-4xl font-bold font-serif uppercase tracking-wider">Clinical Services</h1>
          <p className="text-white/80 text-xs leading-relaxed">
            Delivering advanced clinical diagnostic imaging, surgeries, dermatological therapies, and emergency care.
          </p>
        </div>
      </div>

      {/* Main Grid Content */}
      <main className="flex-1 py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Cardiology */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="p-6 space-y-4">
                <div className="h-10 w-10 bg-cyan-50 text-[#00a3c4] rounded-xl flex items-center justify-center"><Heart size={20} /></div>
                <h3 className="font-bold text-slate-800 text-sm">Cardiology</h3>
                <p className="text-slate-500 text-xs leading-relaxed">Comprehensive heart care with advanced diagnostic tools and treatment options for cardiovascular conditions.</p>
                <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600">
                  <span className="px-2 py-0.5 bg-slate-50 rounded-md flex items-center gap-1"><CheckCircle size={10} className="text-[#00a3c4]" /> ECG Testing</span>
                  <span className="px-2 py-0.5 bg-slate-50 rounded-md flex items-center gap-1"><CheckCircle size={10} className="text-[#00a3c4]" /> Heart Surgery</span>
                </div>
              </div>
            </div>

            {/* Neurology */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="p-6 space-y-4">
                <div className="h-10 w-10 bg-cyan-50 text-[#00a3c4] rounded-xl flex items-center justify-center"><Brain size={20} /></div>
                <h3 className="font-bold text-slate-800 text-sm">Neurology</h3>
                <p className="text-slate-500 text-xs leading-relaxed">Expert neurological care for brain and nervous system disorders with state-of-the-art imaging technology.</p>
                <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600">
                  <span className="px-2 py-0.5 bg-slate-50 rounded-md flex items-center gap-1"><CheckCircle size={10} className="text-[#00a3c4]" /> MRI Scans</span>
                  <span className="px-2 py-0.5 bg-slate-50 rounded-md flex items-center gap-1"><CheckCircle size={10} className="text-[#00a3c4]" /> Stroke Care</span>
                </div>
              </div>
            </div>

            {/* Orthopedics */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="p-6 space-y-4">
                <div className="h-10 w-10 bg-cyan-50 text-[#00a3c4] rounded-xl flex items-center justify-center"><Bone size={20} /></div>
                <h3 className="font-bold text-slate-800 text-sm">Orthopedics</h3>
                <p className="text-slate-500 text-xs leading-relaxed">Specialized bone and joint treatment including sports medicine and reconstructive surgery procedures.</p>
                <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600">
                  <span className="px-2 py-0.5 bg-slate-50 rounded-md flex items-center gap-1"><CheckCircle size={10} className="text-[#00a3c4]" /> Joint Replacement</span>
                  <span className="px-2 py-0.5 bg-slate-50 rounded-md flex items-center gap-1"><CheckCircle size={10} className="text-[#00a3c4]" /> Sports Medicine</span>
                </div>
              </div>
            </div>

            {/* Pediatrics */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="p-6 space-y-4">
                <div className="h-10 w-10 bg-cyan-50 text-[#00a3c4] rounded-xl flex items-center justify-center"><Users size={20} /></div>
                <h3 className="font-bold text-slate-800 text-sm">Pediatrics</h3>
                <p className="text-slate-500 text-xs leading-relaxed">Dedicated healthcare for children from infancy through adolescence with specialized treatment protocols.</p>
                <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600">
                  <span className="px-2 py-0.5 bg-slate-50 rounded-md flex items-center gap-1"><CheckCircle size={10} className="text-[#00a3c4]" /> Well-Child Visits</span>
                  <span className="px-2 py-0.5 bg-slate-50 rounded-md flex items-center gap-1"><CheckCircle size={10} className="text-[#00a3c4]" /> Immunizations</span>
                </div>
              </div>
            </div>

            {/* Emergency Care */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="p-6 space-y-4">
                <div className="h-10 w-10 bg-cyan-50 text-[#00a3c4] rounded-xl flex items-center justify-center"><Shield size={20} /></div>
                <h3 className="font-bold text-slate-800 text-sm">Emergency Care</h3>
                <p className="text-slate-500 text-xs leading-relaxed">24/7 emergency medical services with rapid response teams and critical care capabilities.</p>
                <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600">
                  <span className="px-2 py-0.5 bg-slate-50 rounded-md flex items-center gap-1"><CheckCircle size={10} className="text-[#00a3c4]" /> Trauma Center</span>
                  <span className="px-2 py-0.5 bg-slate-50 rounded-md flex items-center gap-1"><CheckCircle size={10} className="text-[#00a3c4]" /> Critical Care</span>
                </div>
              </div>
            </div>

            {/* Laboratory Testing */}
            <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col justify-between">
              <div className="p-6 space-y-4">
                <div className="h-10 w-10 bg-cyan-50 text-[#00a3c4] rounded-xl flex items-center justify-center"><Activity size={20} /></div>
                <h3 className="font-bold text-slate-800 text-sm">Laboratory Testing</h3>
                <p className="text-slate-500 text-xs leading-relaxed">Advanced diagnostic laboratory services with comprehensive testing panels and rapid result delivery.</p>
                <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-600">
                  <span className="px-2 py-0.5 bg-slate-50 rounded-md flex items-center gap-1"><CheckCircle size={10} className="text-[#00a3c4]" /> Blood Tests</span>
                  <span className="px-2 py-0.5 bg-slate-50 rounded-md flex items-center gap-1"><CheckCircle size={10} className="text-[#00a3c4]" /> Pathology Scans</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-12 px-6 border-t border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00a3c4] text-white font-extrabold">+</div>
              <span className="font-bold text-lg text-white">Clinic</span>
            </div>
            <p className="leading-relaxed">Providing high quality, accessible healthcare services with complete medical transparency.</p>
            <div className="space-y-2 mt-4 text-[10px] text-slate-500">
              <p className="flex items-center gap-1.5"><MapPin size={12} className="text-[#00a3c4]" /> {settings.address}</p>
              <p className="flex items-center gap-1.5"><Phone size={12} className="text-[#00a3c4]" /> {settings.phone}</p>
              <p className="flex items-center gap-1.5"><Mail size={12} className="text-[#00a3c4]" /> {settings.email}</p>
            </div>
          </div>
          <div>
            <h6 className="text-white text-xs font-bold mb-4 uppercase tracking-wider">Quick Links</h6>
            <ul className="space-y-2">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link to="/departments" className="hover:text-white transition-colors">Departments</Link></li>
              <li><Link to="/services" className="hover:text-white transition-colors">Services</Link></li>
              <li><Link to="/careers" className="hover:text-white transition-colors text-primary-500">Careers</Link></li>
            </ul>
          </div>
          <div>
            <h6 className="text-white text-xs font-bold mb-4 uppercase tracking-wider">Services</h6>
            <ul className="space-y-2 text-slate-500">
              <li>Cardiology</li>
              <li>Neurology</li>
              <li>Pediatrics</li>
              <li>Orthopedics</li>
            </ul>
          </div>
          <div className="space-y-4">
            <h6 className="text-white text-xs font-bold uppercase tracking-wider">Newsletter</h6>
            <p className="leading-relaxed text-slate-500">Subscribe to receive health tips and system announcements.</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/5 mt-12 pt-6 text-center text-slate-600">
          <p>© {new Date().getFullYear()} Clinic. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Services;
