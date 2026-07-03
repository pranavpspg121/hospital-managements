import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { 
  Heart, Shield, Users, Activity, Mail, Phone, MapPin, CheckCircle, ArrowRight
} from 'lucide-react';

const Departments = () => {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState({
    address: '123 Creative Boulevard, Design District, NY 10012',
    phone: '+1 (555) 987-6543',
    email: 'hello@designstudio.com'
  });
  const [depts, setDepts] = useState([]);
  const [activeTab, setActiveTab] = useState('neurology');

  useEffect(() => {
    const fetchSettingsAndDepts = async () => {
      try {
        const [settingsRes, deptsRes] = await Promise.all([
          api.get('settings/'),
          api.get('departments/')
        ]);
        setSettings(settingsRes.data);
        setDepts(deptsRes.data.results || deptsRes.data);
      } catch (err) {
        console.error("Failed to load settings or departments:", err);
      }
    };
    fetchSettingsAndDepts();
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
            <Link to="/departments" className="text-[#00a3c4] transition-colors">Departments</Link>
            <Link to="/services" className="hover:text-[#00a3c4] transition-colors">Services</Link>
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
          <h1 className="text-4xl font-bold font-serif uppercase tracking-wider">Clinical Departments</h1>
          <p className="text-white/80 text-xs leading-relaxed">
            Delivering multidisciplinary therapeutic excellence across general medicine, surgery, and diagnostics.
          </p>
        </div>
      </div>

      {/* Main Tabbed Content */}
      <main className="flex-1 py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          
          {/* Specialties Pills Navigation */}
          <div className="flex flex-wrap justify-center gap-2 border-b border-slate-200 pb-4">
            {['neurology', 'surgery', 'dental', 'ophthalmology', 'cardiology'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                  activeTab === tab 
                    ? 'bg-[#00a3c4] text-white shadow-md' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>

          {/* Active Tab Details */}
          <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200/60 shadow-xl">
            {activeTab === 'neurology' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#0e383c] font-serif">Neurological Sciences Department</h2>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Offering advanced diagnostic testing and neurological therapies for complex brain and nervous system disorders.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-xs">Brain Monitoring</h4>
                      <p className="text-slate-400 text-[10px]">Real-time intracranial pressure and brain metrics monitoring.</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-xs">EEG Testing</h4>
                      <p className="text-slate-400 text-[10px]">High density electroencephalography tests for seizures.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl flex items-center justify-center">
                  <img src="/assets/images/about-banner.png" alt="Neurology Banner" className="rounded-xl max-h-64 object-cover" />
                </div>
              </div>
            )}

            {activeTab === 'surgery' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#0e383c] font-serif">Surgical Services Department</h2>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Advanced inpatient and outpatient surgical procedures performed inside clean environments with total safety.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-xs">Minimally Invasive</h4>
                      <p className="text-slate-400 text-[10px]">Laparoscopic procedures minimizing patient recovery times.</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-xs">Advanced Procedures</h4>
                      <p className="text-slate-400 text-[10px]">Equipped for cardiothoracic and vascular surgeries.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl flex items-center justify-center">
                  <img src="/assets/images/about-banner.png" alt="Surgery Banner" className="rounded-xl max-h-64 object-cover" />
                </div>
              </div>
            )}

            {activeTab === 'dental' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#0e383c] font-serif">Dental Care Department</h2>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Complete dental screenings, hygiene therapy, corrective braces, and cosmetic dentistry.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-xs">Oral Hygiene</h4>
                      <p className="text-slate-400 text-[10px]">Comprehensive plaque cleaning and gum treatment.</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-xs">Orthodontics</h4>
                      <p className="text-slate-400 text-[10px]">Alignment braces and custom root canal therapies.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl flex items-center justify-center">
                  <img src="/assets/images/about-banner.png" alt="Dental Banner" className="rounded-xl max-h-64 object-cover" />
                </div>
              </div>
            )}

            {activeTab === 'ophthalmology' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#0e383c] font-serif">Ophthalmology Department</h2>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Vision testing, laser refractive corrective surgeries, and comprehensive retina wellness scans.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-xs">Vision Correction</h4>
                      <p className="text-slate-400 text-[10px]">Laser treatment and custom corrective prescription lenses.</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-xs">Retinal Wellness</h4>
                      <p className="text-slate-400 text-[10px]">Diagnostics scanning for early macular degeneration.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl flex items-center justify-center">
                  <img src="/assets/images/about-banner.png" alt="Ophthal Banner" className="rounded-xl max-h-64 object-cover" />
                </div>
              </div>
            )}

            {activeTab === 'cardiology' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-[#0e383c] font-serif">Cardiology Department</h2>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Preventive cardiac health management, stress testing, bypass support, and pacemaker configuration.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-xs">ECG Analysis</h4>
                      <p className="text-slate-400 text-[10px]">Detailed electrocardiogram diagnostic charting analysis.</p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-800 text-xs">Preventive Health</h4>
                      <p className="text-slate-400 text-[10px]">Hypertension management programs and checkups.</p>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-50 p-6 rounded-2xl flex items-center justify-center">
                  <img src="/assets/images/about-banner.png" alt="Cardiology Banner" className="rounded-xl max-h-64 object-cover" />
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Departments Grid from API */}
          <div className="space-y-8">
            <h3 className="text-lg font-bold text-[#0e383c] font-serif uppercase tracking-wider text-center">All Medical Specialties</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {depts.length > 0 ? (
                depts.map((dept) => (
                  <div key={dept.id} className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                    <div className="h-10 w-10 rounded-xl bg-cyan-50 text-[#00a3c4] flex items-center justify-center">
                      <Heart size={20} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">{dept.name}</h4>
                      <p className="text-slate-500 text-[11px] leading-relaxed mt-2">{dept.description || 'No description configured for this department.'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center text-slate-400 text-xs py-8">
                  Loading clinical specialties catalog...
                </div>
              )}
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
              <li><a href="/#services" className="hover:text-white transition-colors">Services</a></li>
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

export default Departments;
