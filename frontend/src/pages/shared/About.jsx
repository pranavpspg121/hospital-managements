import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { 
  Heart, Shield, Users, Lightbulb, Mail, Phone, MapPin, CheckCircle, Activity, Award
} from 'lucide-react';

const About = () => {
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
            <Link to="/about" className="text-[#00a3c4] transition-colors">About</Link>
            <Link to="/departments" className="hover:text-[#00a3c4] transition-colors">Departments</Link>
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
          <h1 className="text-4xl font-bold font-serif uppercase tracking-wider">About Clinic</h1>
          <p className="text-white/80 text-xs leading-relaxed">
            Providing high-quality, compassionate clinical care through our collaborative team of healthcare professionals and advanced facilities.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-20">
          
          {/* Intro Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-800 font-serif leading-tight">Compassionate Care for Every Family</h2>
              <p className="text-slate-700 font-medium text-sm leading-relaxed">
                For over two decades, we have been dedicated to providing exceptional healthcare services to our community. Our commitment goes beyond medical treatment—we believe in building lasting relationships with our patients and their families.
              </p>
              <p className="text-slate-500 text-xs leading-relaxed">
                Our collaborative clinical environment brings together leading specialists, nursing staff, and medical technicians using state-of-the-art diagnostic resources to ensure absolute diagnostic accuracy and patient comfort.
              </p>

              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100">
                <div>
                  <h4 className="text-2xl font-bold text-[#00a3c4]">15,000+</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Patients Treated</p>
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-[#00a3c4]">25+</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Years Experience</p>
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-[#00a3c4]">50+</h4>
                  <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Specialists</p>
                </div>
              </div>
            </div>

            <div className="relative bg-slate-100 p-8 rounded-3xl border border-slate-200 flex items-center justify-center">
              <img src="/assets/images/about-banner.png" alt="Clinical facility" className="rounded-2xl shadow-lg max-h-80 object-cover" />
            </div>
          </div>

          {/* Core Values */}
          <div className="space-y-12">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <h3 className="text-2xl font-bold text-[#0e383c] font-serif uppercase tracking-wider">Our Core Values</h3>
              <p className="text-slate-500 text-xs">These principles guide everything we do in our commitment to exceptional healthcare.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                <div className="h-10 w-10 bg-cyan-50 text-[#00a3c4] rounded-xl flex items-center justify-center"><Heart size={20} /></div>
                <h4 className="font-bold text-slate-800 text-sm">Compassion</h4>
                <p className="text-slate-500 text-xs leading-relaxed">Providing care with empathy and understanding for every patient's unique needs and circumstances.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                <div className="h-10 w-10 bg-cyan-50 text-[#00a3c4] rounded-xl flex items-center justify-center"><Shield size={20} /></div>
                <h4 className="font-bold text-slate-800 text-sm">Excellence</h4>
                <p className="text-slate-500 text-xs leading-relaxed">Maintaining the highest standards of medical care through continuous learning and innovation.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                <div className="h-10 w-10 bg-cyan-50 text-[#00a3c4] rounded-xl flex items-center justify-center"><Users size={20} /></div>
                <h4 className="font-bold text-slate-800 text-sm">Integrity</h4>
                <p className="text-slate-500 text-xs leading-relaxed">Building trust through honest communication and ethical practices in all our interactions.</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                <div className="h-10 w-10 bg-cyan-50 text-[#00a3c4] rounded-xl flex items-center justify-center"><Lightbulb size={20} /></div>
                <h4 className="font-bold text-slate-800 text-sm">Innovation</h4>
                <p className="text-slate-500 text-xs leading-relaxed">Embracing cutting-edge technology and treatments to improve patient outcomes and processes.</p>
              </div>
            </div>
          </div>

          {/* Accreditations & Certifications */}
          <div className="space-y-8 bg-[#0e383c]/5 p-8 rounded-3xl border border-[#0e383c]/10 text-center">
            <h3 className="text-lg font-bold text-slate-800 font-serif uppercase tracking-wider">Accreditations & Certifications</h3>
            <p className="text-slate-500 text-xs">Recognized by leading global healthcare organizations for our absolute commitment to safety and quality care.</p>
            <div className="flex flex-wrap justify-center gap-8 items-center pt-4 opacity-75">
              <span className="text-xs font-bold text-slate-400">NABH Accredited</span>
              <span className="text-xs font-bold text-slate-400">Joint Commission International</span>
              <span className="text-xs font-bold text-slate-400">ISO 9001:2015</span>
              <span className="text-xs font-bold text-slate-400">National Quality Forum</span>
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
              <li><a href="/#departments" className="hover:text-white transition-colors">Departments</a></li>
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

export default About;
