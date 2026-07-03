import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import { 
  Search, Calendar, Clock, User, UserCheck, CreditCard, 
  CheckCircle, ArrowLeft, Loader2, Sparkles, Filter 
} from 'lucide-react';
import toast from 'react-hot-toast';

const BookAppointment = () => {
  const navigate = useNavigate();

  // Wizard state
  const [step, setStep] = useState(1); // 1: Search Doctors, 2: Select Slot & Symptoms, 3: Payment Checkout, 4: Success
  
  // Data State
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(true);

  // Selected Booking Details
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [symptoms, setSymptoms] = useState('');
  
  // Payment / Booking results
  const [bookingLoading, setBookingLoading] = useState(false);
  const [createdAppointment, setCreatedAppointment] = useState(null);

  // Fetch initial department and doctor data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptsRes, docsRes] = await Promise.all([
          api.get('departments/'),
          api.get('doctors/available/'),
        ]);
        setDepartments(deptsRes.data.results || deptsRes.data);
        setDoctors(docsRes.data.results || docsRes.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load doctor lists.');
      } finally {
        setLoadingDocs(false);
      }
    };
    fetchData();
  }, []);

  // Filter doctors list
  const filteredDoctors = doctors.filter(doc => {
    const matchesDept = selectedDept ? doc.department === parseInt(selectedDept) : true;
    const docName = `${doc.user.first_name} ${doc.user.last_name}`.toLowerCase();
    const docSpec = doc.specialization.toLowerCase();
    const matchesSearch = docName.includes(searchQuery.toLowerCase()) || docSpec.includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  // Handle doctor selection -> move to step 2
  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedDate('');
    setSelectedSlot(null);
    setAvailableSlots([]);
    setStep(2);
  };

  // Fetch slot availability when date changes in step 2
  const handleDateChange = async (e) => {
    const dateVal = e.target.value;
    setSelectedDate(dateVal);
    setSelectedSlot(null);

    if (!dateVal || !selectedDoctor) return;

    setLoadingSlots(true);
    try {
      const response = await api.get(`slots/doctor_availability/?doctor=${selectedDoctor.id}&date=${dateVal}`);
      setAvailableSlots(response.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch slots for this date.');
    } finally {
      setLoadingSlots(false);
    }
  };

  // Submit Booking -> Move to payment step
  const handleConfirmBookingDetails = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      toast.error('Please select a time slot.');
      return;
    }

    setBookingLoading(true);
    try {
      const payload = {
        doctor: selectedDoctor.id,
        slot: selectedSlot.id,
        appt_date: selectedDate,
        slot_time: selectedSlot.start_time,
        symptoms: symptoms
      };
      
      const response = await api.post('appointments/', payload);
      setCreatedAppointment(response.data);
      toast.success('Appointment created! Proceeding to checkout.');
      setStep(3);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.non_field_errors?.[0] || err.response?.data?.detail || 'Booking failed.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Proceed with Real Razorpay Payment Checkout
  const handlePayWithRazorpay = async () => {
    if (!createdAppointment) return;
    setBookingLoading(true);

    try {
      // Step 1: Create Razorpay order via backend
      const orderRes = await api.post('billing/create-order/', {
        appointment_id: createdAppointment.id
      });
      const { order_id, key_id, amount } = orderRes.data;

      // Step 2: If mock order, use demo checkout
      if (!order_id || order_id.includes('mock') || !window.Razorpay) {
        const demoRes = await api.post('billing/demo-payment/', {
          appointment_id: createdAppointment.id
        });
        toast.success(demoRes.data.status || 'Payment Successful!');
        setStep(4);
        setBookingLoading(false);
        return;
      }

      // Step 3: Open Razorpay Checkout modal
      const options = {
        key: key_id,
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'Clinic Healthcare',
        description: `Consultation with Dr. ${selectedDoctor?.user.first_name} ${selectedDoctor?.user.last_name}`,
        order_id: order_id,
        handler: async (response) => {
          // Step 4: Verify payment signature with backend
          try {
            await api.post('billing/verify-payment/', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              appointment_id: createdAppointment.id
            });
            toast.success('✅ Payment verified! Appointment confirmed.');
            setStep(4);
          } catch {
            toast.error('Payment signature verification failed.');
          } finally {
            setBookingLoading(false);
          }
        },
        prefill: {
          name: `${createdAppointment?.patient_details?.user?.first_name || ''} ${createdAppointment?.patient_details?.user?.last_name || ''}`.trim(),
          email: createdAppointment?.patient_details?.user?.email || '',
        },
        theme: { color: '#0284c7' },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled. Your appointment is reserved for 10 minutes.', { icon: '⚠️' });
            setBookingLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', () => {
        toast.error('Payment failed. Please try again.');
        setBookingLoading(false);
      });
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error('Could not initiate payment. Please try again.');
      setBookingLoading(false);
    }
  };

  // Fallback Demo Payment
  const handlePayDemo = async () => {
    if (!createdAppointment) return;
    setBookingLoading(true);
    try {
      const response = await api.post('billing/demo-payment/', {
        appointment_id: createdAppointment.id
      });
      toast.success(response.data.status || 'Payment Successful!');
      setStep(4);
    } catch (err) {
      console.error(err);
      toast.error('Demo Payment checkout failed.');
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Indicators */}
      <div className="flex items-center justify-between mb-8 px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm max-w-2xl mx-auto text-xs font-semibold text-slate-400">
        <span className={step === 1 ? 'text-primary-600 font-bold' : step > 1 ? 'text-slate-700' : ''}>1. Choose Doctor</span>
        <span className="text-slate-300">/</span>
        <span className={step === 2 ? 'text-primary-600 font-bold' : step > 2 ? 'text-slate-700' : ''}>2. Slot & Symptoms</span>
        <span className="text-slate-300">/</span>
        <span className={step === 3 ? 'text-primary-600 font-bold' : step > 3 ? 'text-slate-700' : ''}>3. Pay Consultation</span>
        <span className="text-slate-300">/</span>
        <span className={step === 4 ? 'text-primary-600 font-bold' : ''}>4. Complete</span>
      </div>

      {/* STEP 1: Search & Filter Doctors */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            {/* Search Input */}
            <div className="flex-1 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={18} />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search doctors by name or specialty..."
                className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary-500"
              />
            </div>
            {/* Department Filter */}
            <div className="w-full md:w-64 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Filter size={18} />
              </span>
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full rounded-lg border border-slate-200 pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary-500 appearance-none bg-white"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>

          {loadingDocs ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="animate-spin text-primary-600" size={36} />
            </div>
          ) : filteredDoctors.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
              No active doctors found matching filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredDoctors.map((doc) => (
                <div key={doc.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
                  <div className="flex gap-4">
                    <div className="h-16 w-16 bg-primary-50 text-primary-700 font-extrabold uppercase rounded-2xl flex items-center justify-center shrink-0">
                      {doc.user.first_name.substring(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800">Dr. {doc.user.first_name} {doc.user.last_name}</h4>
                      <p className="text-xs text-primary-600 font-semibold">{doc.specialization}</p>
                      <p className="text-xs text-slate-500 mt-1">{doc.qualification}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{doc.experience} years experience</p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 mt-4 pt-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Fee</span>
                      <span className="text-sm font-bold text-slate-800">₹{doc.fee}</span>
                    </div>
                    <button
                      onClick={() => handleSelectDoctor(doc)}
                      className="rounded-lg bg-primary-600 hover:bg-primary-700 px-4 py-2 text-xs font-semibold text-white shadow-sm"
                    >
                      Choose Slots
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: Slots and Symptoms */}
      {step === 2 && selectedDoctor && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep(1)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <ArrowLeft size={18} />
            </button>
            <div>
              <h3 className="font-bold text-slate-800 text-lg">Booking Details</h3>
              <p className="text-xs text-slate-400">Dr. {selectedDoctor.user.first_name} {selectedDoctor.user.last_name} • {selectedDoctor.specialization}</p>
            </div>
          </div>

          <form onSubmit={handleConfirmBookingDetails} className="space-y-6">
            {/* Select Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Select Date</label>
              <input
                type="date"
                required
                value={selectedDate}
                onChange={handleDateChange}
                min={new Date().toISOString().split('T')[0]}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-primary-500 w-full max-w-sm"
              />
              <p className="text-[10px] text-slate-400 mt-1">Available days: {selectedDoctor.avail_days.join(', ')}</p>
            </div>

            {/* Select Time Slot */}
            {selectedDate && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Select Available Slot</label>
                {loadingSlots ? (
                  <Loader2 className="animate-spin text-primary-600" size={24} />
                ) : availableSlots.length === 0 ? (
                  <p className="text-sm text-rose-500 font-medium">No slots found or doctor is unavailable on this day.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={slot.is_booked}
                        onClick={() => setSelectedSlot(slot)}
                        className={`flex flex-col items-center justify-center p-3 border rounded-xl transition-all ${
                          slot.is_booked ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed' :
                          selectedSlot?.id === slot.id ? 'bg-primary-50 border-primary-600 text-primary-700 shadow-sm font-semibold' :
                          'border-slate-200 text-slate-600 hover:border-primary-300 hover:bg-slate-50/50'
                        }`}
                      >
                        <Clock size={16} className="mb-1" />
                        <span className="text-xs">{slot.start_time} - {slot.end_time}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Symptoms / Notes */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">Reason for Visit / Symptoms</label>
              <textarea
                value={symptoms}
                onChange={(e) => setSymptoms(e.target.value)}
                placeholder="Describe your symptoms (e.g., headache for 2 days, general fatigue...)"
                rows="4"
                className="w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-primary-500"
              />
            </div>

            <button
              type="submit"
              disabled={bookingLoading || !selectedSlot}
              className="rounded-xl bg-primary-600 hover:bg-primary-700 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-primary-200/50 disabled:bg-slate-300 disabled:shadow-none flex items-center gap-2"
            >
              {bookingLoading && <Loader2 className="animate-spin" size={16} />}
              <span>Confirm & Proceed to Payment</span>
            </button>
          </form>
        </div>
      )}

      {/* STEP 3: Payment Checkout */}
      {step === 3 && createdAppointment && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-md mx-auto space-y-6 text-center">
          <div className="flex justify-center text-primary-600 mb-2">
            <CreditCard size={48} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Consultation Payment</h3>
            <p className="text-xs text-slate-400 mt-1">Please complete the fee payment to confirm booking slots.</p>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl text-left text-xs text-slate-600 space-y-2 border border-slate-100">
            <div className="flex justify-between">
              <span>Doctor:</span>
              <span className="font-bold text-slate-800">Dr. {selectedDoctor?.user.first_name} {selectedDoctor?.user.last_name}</span>
            </div>
            <div className="flex justify-between">
              <span>Date & Time:</span>
              <span className="font-semibold text-slate-800">{createdAppointment.appt_date} at {createdAppointment.slot_time}</span>
            </div>
            <div className="border-t border-slate-200/80 my-2 pt-2 flex justify-between text-sm font-bold">
              <span className="text-slate-700">Total Fee:</span>
              <span className="text-primary-700">₹{createdAppointment.amount}</span>
            </div>
          </div>

          <div className="space-y-3">
            {/* Real Razorpay Button */}
            <button
              onClick={handlePayWithRazorpay}
              disabled={bookingLoading}
              className="w-full rounded-xl bg-primary-600 hover:bg-primary-700 py-3 text-sm font-semibold text-white shadow-md shadow-primary-200/50 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {bookingLoading && <Loader2 className="animate-spin" size={16} />}
              <span>Pay ₹{createdAppointment.amount} via Razorpay</span>
            </button>
            {/* Demo bypass option */}
            <button
              onClick={handlePayDemo}
              disabled={bookingLoading}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 py-2.5 text-xs font-semibold text-slate-500 flex items-center justify-center gap-2"
            >
              <span>Demo Checkout (Bypass Razorpay)</span>
            </button>
            <p className="text-[10px] text-slate-400">Secured by Razorpay. Test mode active.</p>
          </div>
        </div>
      )}

      {/* STEP 4: Success */}
      {step === 4 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm max-w-md mx-auto text-center space-y-5">
          <div className="flex justify-center text-emerald-500 animate-bounce">
            <CheckCircle size={56} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-xl">Booking Confirmed!</h3>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Your appointment has been successfully confirmed. A notification email will be dispatched to your mailbox with invoice details.
            </p>
          </div>

          <button
            onClick={() => navigate('/patient')}
            className="w-full rounded-xl bg-slate-800 hover:bg-slate-900 py-2.5 text-sm font-semibold text-white transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default BookAppointment;
