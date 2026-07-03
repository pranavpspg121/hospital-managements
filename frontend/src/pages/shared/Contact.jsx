import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { 
  Mail, Phone, MapPin, Send, HelpCircle, Landmark, ShieldCheck
} from 'lucide-react';
import toast from 'react-hot-toast';

const Contact = () => {
  const { user, logout } = useAuth();
  const [settings, setSettings] = useState({
    address: '123 Creative Boulevard, Design District, NY 10012',
    phone: '+1 (555) 987-6543',
    email: 'hello@designstudio.com'
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSending, setIsSending] = useState(false);

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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    try {
      await api.post('contact-messages/', formData);
      toast.success("Thank you! Your message has been sent successfully.");
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit contact message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

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
            <Link to="/services" className="hover:text-[#00a3c4] transition-colors">Services</Link>
            <Link to="/doctors" className="hover:text-[#00a3c4] transition-colors">Doctors</Link>
            <Link to="/contact" className="text-[#00a3c4] transition-colors">Contact</Link>
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
          <h1 className="text-4xl font-bold font-serif uppercase tracking-wider">Contact Us</h1>
          <p className="text-white/80 text-xs leading-relaxed">
            Get in touch with our administrative staff or submit support tickets directly.
          </p>
        </div>
      </div>

      {/* Contact Section */}
      <main className="flex-1 py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Contact Information Cards */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-cyan-50 text-[#00a3c4] flex items-center justify-center shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Our Location</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">{settings.address}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-cyan-50 text-[#00a3c4] flex items-center justify-center shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Phone Support</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">{settings.phone}</p>
                </div>
              </div>

              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-cyan-50 text-[#00a3c4] flex items-center justify-center shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider">Email Inquiry</h4>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">{settings.email}</p>
                </div>
              </div>
            </div>

            {/* Message Form */}
            <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-md">
              <h3 className="text-lg font-bold text-[#0e383c] font-serif mb-6 uppercase tracking-wider">Send a Message</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Your Name</label>
                    <input 
                      type="text" 
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter full name"
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#00a3c4]"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Your Email</label>
                    <input 
                      type="email" 
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter email address"
                      className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#00a3c4]"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Subject</label>
                  <input 
                    type="text" 
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Enter message subject"
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs outline-none focus:border-[#00a3c4]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Message</label>
                  <textarea 
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Enter message body..."
                    rows="5"
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-xs outline-none focus:border-[#00a3c4]"
                    required
                  />
                </div>

                <button 
                  type="submit" 
                  disabled={isSending}
                  className="px-6 py-3 bg-[#00a3c4] hover:bg-[#0086a1] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md flex items-center justify-center gap-2 disabled:bg-slate-300"
                >
                  <Send size={14} />
                  {isSending ? 'Sending Message...' : 'Send Message'}
                </button>
              </form>
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

export default Contact;
