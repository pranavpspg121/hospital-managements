import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { 
  MapPin, Phone, Mail, Search, ChevronRight, Activity, Calendar,
  ShieldPlus, Users, Award, Shield, CheckCircle, ArrowRight, Trash2, Check, Clock, Play, PhoneCall, Star, HelpCircle, Heart, ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';

const Home = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Dynamic Data States
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState({
    address: '123 Health Ave, New Delhi',
    phone: '+1 (558) 955-4885',
    email: 'info@medicare.com'
  });

  // Search Doctor state
  const [searchName, setSearchName] = useState('');
  const [searchSpecialty, setSearchSpecialty] = useState('');

  // Booking Modal Form State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingDept, setBookingDept] = useState('');
  const [bookingDoc, setBookingDoc] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingSlot, setBookingSlot] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [symptoms, setSymptoms] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  // Fetch departments, doctors and settings
  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const [deptsRes, docsRes, settingsRes] = await Promise.all([
          api.get('departments/'),
          api.get('doctors/available/'),
          api.get('settings/'),
        ]);
        setDepartments(deptsRes.data.results || deptsRes.data);
        setDoctors(docsRes.data.results || docsRes.data);
        setSettings(settingsRes.data);
      } catch (err) {
        console.error("Failed to load public landing data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLandingData();
  }, []);

  // Fetch available slots for the booking form
  useEffect(() => {
    const fetchSlots = async () => {
      if (!bookingDoc || !bookingDate) {
        setAvailableSlots([]);
        return;
      }
      setLoadingSlots(true);
      try {
        const response = await api.get(`slots/doctor_availability/?doctor=${bookingDoc}&date=${bookingDate}`);
        setAvailableSlots(response.data);
      } catch (err) {
        console.error("Failed to fetch slots:", err);
        toast.error("Could not load slots for selected date.");
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [bookingDoc, bookingDate]);

  // Filtered doctors list based on search filters
  const filteredDoctors = doctors.filter(doc => {
    const nameMatch = `${doc.user.first_name} ${doc.user.last_name}`.toLowerCase().includes(searchName.toLowerCase());
    const specialtyMatch = searchSpecialty ? doc.specialization.toLowerCase() === searchSpecialty.toLowerCase() : true;
    return nameMatch && specialtyMatch;
  });

  // Handle appointment booking submission
  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please login to book an appointment.");
      navigate(`/login?redirect=/`);
      return;
    }
    if (user.role !== 'PATIENT') {
      toast.error("Only registered patients can book appointments.");
      return;
    }
    if (!bookingSlot) {
      toast.error("Please select a time slot.");
      return;
    }

    setIsBooking(true);
    try {
      // 1. Create the pending appointment
      const apptResponse = await api.post('appointments/', {
        doctor: parseInt(bookingDoc),
        appt_date: bookingDate,
        slot: parseInt(bookingSlot),
        symptoms: symptoms,
      });

      const appointmentId = apptResponse.data.id;

      // 2. Request order details from backend
      const orderResponse = await api.post('billing/create-order/', {
        appointment_id: appointmentId,
      });

      const { order_id, key_id, currency, amount } = orderResponse.data;

      // 3. Launch Razorpay Checkout
      const options = {
        key: key_id,
        amount: Math.round(amount * 100),
        currency: currency,
        name: "Clinic Healthcare",
        description: "Clinical Consultation Fee",
        order_id: order_id,
        handler: async function (response) {
          try {
            setIsBooking(true);
            await api.post('billing/verify-payment/', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            toast.success("Payment verified and appointment confirmed!");
            setIsBookingModalOpen(false);
            navigate('/patient/appointments');
          } catch (err) {
            console.error(err);
            toast.error("Payment verification failed.");
          } finally {
            setIsBooking(false);
          }
        },
        prefill: {
          name: `${user.first_name || ''} ${user.last_name || ''}`,
          email: user.email,
        },
        theme: {
          color: "#0e383c",
        },
        modal: {
          ondismiss: function () {
            toast.error("Payment flow cancelled.");
          }
        }
      };

      if (window.Razorpay && !key_id.includes('mock') && !order_id.includes('mock')) {
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback for default mock keys
        console.log("Mock Key detected. Simulating transaction...");
        await api.post('billing/demo-payment/', {
          appointment_id: appointmentId,
        });
        toast.success("Demo checkout simulation completed successfully!");
        setIsBookingModalOpen(false);
        navigate('/patient/appointments');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || err.response?.data?.error || err.message || "Failed to complete appointment booking.");
    } finally {
      setIsBooking(false);
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
    <div className="min-h-screen bg-white font-sans text-slate-600 scroll-smooth">
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
            <a href="#hero" className="hover:text-[#00a3c4] transition-colors">Home</a>
            <Link to="/about" className="hover:text-[#00a3c4] transition-colors">About</Link>
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
                <Link to="/register" className="px-4 py-2 rounded-lg bg-[#0e383c] hover:bg-[#071c1e] text-white font-bold text-xs uppercase tracking-wider transition-colors">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="py-24 bg-gradient-to-br from-slate-50 to-white px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            {/* Trust Badges */}
            <div className="flex flex-wrap gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-sm">
                <CheckCircle size={14} className="text-[#00a3c4]" /> Accredited
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-sm">
                <Clock size={14} className="text-[#00a3c4]" /> 24/7 Emergency
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-200 rounded-full text-xs font-semibold text-slate-700 shadow-sm">
                <Star size={14} className="text-yellow-400 fill-yellow-400" /> 4.9/5 Rating
              </span>
            </div>

            <h1 className="text-5xl sm:text-6xl font-extrabold text-[#0e383c] leading-tight font-serif">
              Excellence in <span className="text-[#00a3c4] underline decoration-wavy">Healthcare</span> With Compassionate Care
            </h1>

            <p className="text-slate-500 text-sm leading-relaxed max-w-lg">
              Providing exceptional medical services utilizing advanced treatment facilities, combined with our collaborative network of specialist doctors.
            </p>

            {/* Hero Stats */}
            <div className="grid grid-cols-3 gap-6 border-t border-slate-100 pt-6">
              <div>
                <h3 className="text-3xl font-extrabold text-slate-800">15+</h3>
                <p className="text-xs text-slate-500 mt-1">Years Experience</p>
              </div>
              <div>
                <h3 className="text-3xl font-extrabold text-slate-800">5000+</h3>
                <p className="text-xs text-slate-500 mt-1">Patients Treated</p>
              </div>
              <div>
                <h3 className="text-3xl font-extrabold text-slate-800">50+</h3>
                <p className="text-xs text-slate-500 mt-1">Medical Experts</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-4 items-center">
              <button 
                onClick={() => setIsBookingModalOpen(true)}
                className="px-8 py-3.5 bg-[#00a3c4] hover:bg-[#0086a1] text-white rounded-xl font-bold uppercase tracking-wider text-xs shadow-lg shadow-cyan-200/50 transition-all transform hover:-translate-y-0.5"
              >
                Book Appointment
              </button>
              <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-150 shadow-sm">
                <div className="h-10 w-10 bg-red-50 text-red-500 rounded-lg flex items-center justify-center">
                  <PhoneCall size={18} />
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Emergency Hotline</p>
                  <p className="text-xs font-extrabold text-slate-800">{settings.phone}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Visual banner */}
          <div className="relative flex justify-center">
            <div className="relative max-w-md w-full">
              <img 
                src="/assets/images/hero-banner.png" 
                alt="Modern Healthcare staff" 
                className="w-full object-contain rounded-3xl"
              />
              {/* Floating card 1 */}
              <div className="absolute top-1/4 -left-6 bg-white p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3">
                <div className="h-10 w-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
                  <Calendar size={18} />
                </div>
                <div>
                  <h6 className="text-xs font-bold text-slate-800">Next Available</h6>
                  <p className="text-[10px] text-slate-500 mt-0.5">Today 2:30 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-extrabold text-[#0e383c] font-serif leading-tight">
              Compassionate Care, Advanced Medicine
            </h2>
            <p className="text-slate-800 font-medium text-sm leading-relaxed mt-4">
              For over two decades, we've been dedicated to providing exceptional healthcare that combines cutting-edge medical technology with the personal touch our patients deserve.
            </p>
            <p className="text-slate-500 text-xs leading-relaxed mt-4">
              Our multidisciplinary team of specialists works collaboratively to ensure every patient receives comprehensive care tailored to their unique needs. From preventive services to complex procedures, we maintain the highest standards of medical excellence while fostering an environment of trust and healing.
            </p>
            
            <div className="grid grid-cols-3 gap-4 mt-8 border-t border-slate-100 pt-6">
              <div>
                <h4 className="text-2xl font-bold text-[#00a3c4]">15,000+</h4>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Patients Served</p>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-[#00a3c4]">25+</h4>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Years of Excellence</p>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-[#00a3c4]">50+</h4>
                <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">Specialists</p>
              </div>
            </div>
          </div>

          <div className="relative bg-slate-50 p-8 rounded-3xl border border-slate-200/60 flex items-center justify-center">
            <img src="/assets/images/about-banner.png" alt="Clinical facility" className="rounded-2xl shadow-lg max-h-72 object-cover" />
            <div className="absolute bottom-6 right-6 bg-[#0e383c] text-white p-4 rounded-2xl shadow-xl flex items-center gap-2.5">
              <Activity className="text-[#00a3c4]" size={20} />
              <div>
                <h5 className="text-xs font-bold">24/7 Emergency Care</h5>
                <p className="text-[10px] text-white/80">Always here when you need us most</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Departments */}
      <section id="departments" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-[#0e383c] font-serif uppercase tracking-wider">Featured Departments</h2>
            <p className="text-slate-500 text-xs">Explore our specialty clinical departments offering advanced medical care.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center">
              <div className="space-y-4 flex-1">
                <span className="px-2.5 py-0.5 bg-cyan-50 text-[#00a3c4] font-bold rounded-lg text-[10px] uppercase">Specialized Care</span>
                <h3 className="text-lg font-bold text-slate-800">Cardiovascular Medicine</h3>
                <p className="text-slate-500 text-xs leading-relaxed">Advanced diagnostic imaging and interventional procedures for comprehensive heart health management with personalized treatment protocols.</p>
                <div className="text-[11px] font-bold text-slate-700 space-y-1.5">
                  <p className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#00a3c4]" /> 24/7 Emergency Cardiac Care</p>
                  <p className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#00a3c4]" /> Minimally Invasive Procedures</p>
                </div>
              </div>
              <div className="h-32 w-32 bg-[#0e383c]/5 rounded-2xl flex items-center justify-center text-[#0e383c]">
                <Heart size={48} className="stroke-1 text-[#00a3c4]" />
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-center">
              <div className="space-y-4 flex-1">
                <span className="px-2.5 py-0.5 bg-cyan-50 text-[#00a3c4] font-bold rounded-lg text-[10px] uppercase">Expert Care</span>
                <h3 className="text-lg font-bold text-slate-800">Neurological Sciences</h3>
                <p className="text-slate-500 text-xs leading-relaxed">Cutting-edge neuroimaging and neurosurgical expertise for complex brain and spinal cord conditions with innovative treatment approaches.</p>
                <div className="text-[11px] font-bold text-slate-700 space-y-1.5">
                  <p className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#00a3c4]" /> Advanced Brain Imaging</p>
                  <p className="flex items-center gap-1.5"><CheckCircle size={12} className="text-[#00a3c4]" /> Robotic Surgery Support</p>
                </div>
              </div>
              <div className="h-32 w-32 bg-[#0e383c]/5 rounded-2xl flex items-center justify-center text-[#0e383c]">
                <Activity size={48} className="stroke-1 text-[#00a3c4]" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-50 text-[#00a3c4] flex items-center justify-center"><ShieldPlus size={20} /></div>
              <h4 className="text-sm font-bold text-slate-800">Orthopedic Surgery</h4>
              <p className="text-slate-500 text-xs">Musculoskeletal care utilizing advanced arthroscopic techniques and joint replacement.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-50 text-[#00a3c4] flex items-center justify-center"><Users size={20} /></div>
              <h4 className="text-sm font-bold text-slate-800">Pediatric Care</h4>
              <p className="text-slate-500 text-xs">Child-centered healthcare services from newborn to adolescence with family focus.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-50 text-[#00a3c4] flex items-center justify-center"><Activity size={20} /></div>
              <h4 className="text-sm font-bold text-slate-800">Cancer Treatment</h4>
              <p className="text-slate-500 text-xs">Multidisciplinary oncology program offering personalized cancer care and therapies.</p>
            </div>
          </div>

          {/* Emergency Alert Banner */}
          <div className="bg-[#0e383c] text-white p-8 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-6 shadow-xl">
            <div className="space-y-1 text-center md:text-left">
              <h3 className="text-lg font-bold">Emergency Services Available 24/7</h3>
              <p className="text-xs text-white/80">Our emergency department is staffed by board-certified physicians ready to provide immediate care.</p>
            </div>
            <a href={`tel:${settings.phone}`} className="inline-flex items-center gap-2 px-6 py-3 bg-[#00a3c4] hover:bg-[#0086a1] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-900/50">
              <PhoneCall size={16} /> Call Emergency: {settings.phone}
            </a>
          </div>
        </div>
      </section>

      {/* Featured Services */}
      <section id="services" className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-[#0e383c] font-serif uppercase tracking-wider">Featured Services</h2>
            <p className="text-slate-500 text-xs">Comprehensive treatments and clinical procedures performed with state-of-the-art facilities.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200/60 space-y-4">
              <div className="h-10 w-10 bg-cyan-50 text-[#00a3c4] rounded-xl flex items-center justify-center"><ShieldPlus size={20} /></div>
              <h4 className="text-lg font-bold text-slate-800">Dermatology Clinic</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Providing high-end care for skin ailments, diagnostic screenings, and dermatological therapeutics for all ages.</p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200/60 space-y-4">
              <div className="h-10 w-10 bg-cyan-50 text-[#00a3c4] rounded-xl flex items-center justify-center"><Activity size={20} /></div>
              <h4 className="text-lg font-bold text-slate-800">Surgery Center</h4>
              <p className="text-slate-500 text-xs leading-relaxed">Advanced surgery center equipped for complex inpatient and outpatient surgical procedures with complete safety.</p>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200/60 space-y-4">
              <div className="h-10 w-10 bg-cyan-50 text-[#00a3c4] rounded-xl flex items-center justify-center"><Users size={20} /></div>
              <h4 className="text-lg font-bold text-slate-800">Diagnostics Lab</h4>
              <p className="text-slate-500 text-xs leading-relaxed">State-of-the-art diagnostics lab offering high speed test processing, scanning, and clinical reports.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Find A Doctor Grid */}
      <section id="doctors" className="py-24 px-6 bg-slate-50">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-extrabold text-[#0e383c] font-serif uppercase tracking-wider">Find A Doctor</h2>
            <p className="text-slate-500 text-xs">Search through our comprehensive directory of experienced medical professionals.</p>
          </div>

          {/* Search Inputs */}
          <div className="max-w-4xl mx-auto bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search doctor by name..." 
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs outline-none focus:border-primary-500"
              />
            </div>
            <div className="w-full md:w-64">
              <select 
                value={searchSpecialty}
                onChange={(e) => setSearchSpecialty(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs outline-none"
              >
                <option value="">All Specialties</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Neurology">Neurology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Oncology">Oncology</option>
              </select>
            </div>
          </div>

          {/* Doctors profiles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredDoctors.length > 0 ? (
              filteredDoctors.map((doc) => (
                <div key={doc.id} className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                  <div className="flex gap-4 items-center">
                    <div className="h-16 w-16 bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center text-slate-500 font-bold text-lg border border-slate-200/60">
                      {doc.user.profile_photo ? (
                        <img 
                          src={doc.user.profile_photo.startsWith('http') ? doc.user.profile_photo : `http://localhost:8000${doc.user.profile_photo}`} 
                          alt="Doctor" 
                          className="h-full w-full object-cover" 
                        />
                      ) : (
                        `${doc.user.first_name[0]}${doc.user.last_name[0]}`
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Dr. {doc.user.first_name} {doc.user.last_name}</h4>
                      <p className="text-[#00a3c4] font-bold text-[10px] uppercase tracking-wider mt-0.5">{doc.specialization}</p>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Award size={12} /> {doc.experience_years} Years Exp</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-50 pt-4 flex justify-between items-center">
                    <div>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Consultation Fee</p>
                      <p className="text-sm font-extrabold text-[#0e383c]">${doc.fee}</p>
                    </div>
                    <button 
                      onClick={() => {
                        setBookingDept(doc.department || '');
                        setBookingDoc(doc.id.toString());
                        setIsBookingModalOpen(true);
                      }}
                      className="px-4 py-2 bg-[#00a3c4] hover:bg-[#0086a1] text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-sm"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-center py-12 text-slate-400">
                No doctors found matching filters.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Call To Action Feature Block */}
      <section className="py-24 bg-gradient-to-br from-slate-900 to-slate-950 text-white px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold font-serif leading-tight">Excellence in Medical Care, Every Day</h1>
              <p className="text-slate-400 text-xs leading-relaxed max-w-md">
                Our collaborative team works to make sure you receive absolute support with zero administrative delays. Book your slot online today.
              </p>
              <div className="flex gap-4">
                <button onClick={() => setIsBookingModalOpen(true)} className="px-6 py-3 bg-[#00a3c4] hover:bg-[#0086a1] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-cyan-900/50">
                  Schedule Consultation
                </button>
                <a href="#services" className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors">
                  Explore Services
                </a>
              </div>
            </div>
            <div className="flex justify-center">
              <img src="/assets/images/about-banner.png" alt="Medical excellence" className="rounded-3xl max-h-64 object-cover border border-white/5 opacity-80" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-12 border-t border-white/5">
            <div className="space-y-3">
              <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-[#00a3c4]"><Shield size={20} /></div>
              <h3 className="font-bold text-sm">Advanced Technology</h3>
              <p className="text-slate-400 text-xs leading-relaxed">State-of-the-art medical testing diagnostic scanners for absolute accuracy.</p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-[#00a3c4]"><Clock size={20} /></div>
              <h3 className="font-bold text-sm">24/7 Availability</h3>
              <p className="text-slate-400 text-xs leading-relaxed">Immediate clinical consultation access and helpline facilities open always.</p>
            </div>
            <div className="space-y-3">
              <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center text-[#00a3c4]"><Users size={20} /></div>
              <h3 className="font-bold text-sm">Expert Clinical Team</h3>
              <p className="text-slate-400 text-xs leading-relaxed">Network of board certified clinical experts delivering compassionate care.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-16 px-6 border-t border-white/5">
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
              <li><a href="#hero" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#departments" className="hover:text-white transition-colors">Departments</a></li>
              <li><a href="#services" className="hover:text-white transition-colors">Services</a></li>
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
            <div className="flex gap-2">
              <input type="email" placeholder="Your Email..." className="w-full bg-slate-900 border border-white/10 px-3 py-2 rounded-lg text-xs outline-none text-white focus:border-[#00a3c4]" />
              <button className="px-4 py-2 bg-[#00a3c4] hover:bg-[#0086a1] text-white rounded-xl font-bold text-xs uppercase transition-colors">Join</button>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-white/5 mt-12 pt-6 text-center text-slate-600">
          <p>© {new Date().getFullYear()} Clinic. All rights reserved.</p>
        </div>
      </footer>

      {/* Booking Form Dialog Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="bg-[#0e383c] text-white p-6 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg">Book Clinical Appointment</h3>
                <p className="text-[10px] text-white/80 mt-0.5">Select doctor details, slot and complete direct checkout payment.</p>
              </div>
              <button 
                onClick={() => setIsBookingModalOpen(false)}
                className="h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBookingSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Department</label>
                <select 
                  value={bookingDept} 
                  onChange={(e) => setBookingDept(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs outline-none"
                  required
                >
                  <option value="">Choose department...</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Select Medical Expert</label>
                <select 
                  value={bookingDoc} 
                  onChange={(e) => setBookingDoc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs outline-none"
                  required
                >
                  <option value="">Choose doctor...</option>
                  {doctors
                    .filter(d => !bookingDept || d.department?.toString() === bookingDept.toString())
                    .map((doc) => (
                      <option key={doc.id} value={doc.id}>Dr. {doc.user.first_name} {doc.user.last_name} (${doc.fee})</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Appointment Date</label>
                  <input 
                    type="date" 
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Available Slots</label>
                  <select 
                    value={bookingSlot}
                    onChange={(e) => setBookingSlot(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs outline-none"
                    required
                  >
                    <option value="">{loadingSlots ? 'Loading slots...' : 'Select slot time...'}</option>
                    {availableSlots.map((slot) => (
                      <option key={slot.id} value={slot.id}>{slot.start_time} - {slot.end_time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Describe Symptoms</label>
                <textarea 
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  placeholder="Describe your current medical condition/symptoms..."
                  rows="3"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-xs outline-none"
                />
              </div>

              <button 
                type="submit" 
                disabled={isBooking}
                className="w-full py-3 bg-[#00a3c4] hover:bg-[#0086a1] text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-md disabled:bg-slate-300"
              >
                {isBooking ? 'Completing Payment...' : 'Confirm Appointment & Pay'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
