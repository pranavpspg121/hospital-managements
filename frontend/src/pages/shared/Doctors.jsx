import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { 
  Heart, Shield, Users, Mail, Phone, MapPin, Search, Award, Star, Clock, HeartHandshake, PhoneCall
} from 'lucide-react';
import toast from 'react-hot-toast';

const Doctors = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [settings, setSettings] = useState({
    address: '123 Creative Boulevard, Design District, NY 10012',
    phone: '+1 (555) 987-6543',
    email: 'hello@designstudio.com'
  });
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search/Filters State
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

  useEffect(() => {
    const fetchLandingData = async () => {
      try {
        const [settingsRes, docsRes, deptsRes] = await Promise.all([
          api.get('settings/'),
          api.get('doctors/available/'),
          api.get('departments/')
        ]);
        setSettings(settingsRes.data);
        setDoctors(docsRes.data.results || docsRes.data);
        setDepartments(deptsRes.data.results || deptsRes.data);
      } catch (err) {
        console.error("Failed to load doctors list data:", err);
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
      navigate(`/login?redirect=/doctors`);
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
            <Link to="/doctors" className="text-[#00a3c4] transition-colors">Doctors</Link>
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
          <h1 className="text-4xl font-bold font-serif uppercase tracking-wider">Medical Specialists</h1>
          <p className="text-white/80 text-xs leading-relaxed">
            Search our comprehensive directory of highly experienced clinical practitioners.
          </p>
        </div>
      </div>

      {/* Main Grid Content */}
      <main className="flex-1 py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Search Panel */}
          <div className="max-w-4xl mx-auto bg-white p-4 rounded-2xl border border-slate-200 shadow-md flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-3 top-3.5 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Search doctor by name..." 
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#00a3c4]"
              />
            </div>
            <div className="w-full md:w-64">
              <select 
                value={searchSpecialty}
                onChange={(e) => setSearchSpecialty(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#00a3c4]"
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

          {/* Doctors profiles grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {loading ? (
              <div className="col-span-4 text-center py-8 text-slate-400 text-xs">Loading doctors directory...</div>
            ) : filteredDoctors.length > 0 ? (
              filteredDoctors.map((doc) => (
                <div key={doc.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
                  <div className="p-5 space-y-4">
                    <div className="h-44 w-full bg-slate-100 rounded-2xl overflow-hidden flex items-center justify-center text-slate-500 font-bold text-lg border border-slate-200/60 relative">
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
                    </div>

                    <div className="border-t border-slate-50 pt-3 text-[10px] space-y-1 text-slate-500 font-medium">
                      <p className="flex items-center gap-1.5"><Award size={12} className="text-[#00a3c4]" /> {doc.experience_years}+ Years Experience</p>
                      <p className="flex items-center gap-1.5"><Heart size={12} className="text-red-400" /> {doc.department_name || 'Cardiology Dept.'}</p>
                    </div>
                  </div>

                  <div className="p-5 border-t border-slate-50 flex justify-between items-center bg-slate-50/50">
                    <div>
                      <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Fee</p>
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
              <div className="col-span-4 text-center py-12 text-slate-400 text-xs">
                No doctors registered under those search filters.
              </div>
            )}
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

export default Doctors;
