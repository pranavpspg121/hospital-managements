import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Trash2, Plus, Clock, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ManageSlots = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [newSlot, setNewSlot] = useState({
    day_of_week: 'Monday',
    start_time: '10:00',
    end_time: '12:00',
    duration: 30,
    max_patients: 4,
    break_start: '',
    break_end: '',
  });

  const fetchSlots = async () => {
    try {
      // Find doctor profile from user profile
      const doctorId = user?.doctor_profile?.id;
      if (doctorId) {
        const response = await api.get(`slots/?doctor=${doctorId}`);
        setSlots(response.data.results || response.data);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load slots.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSlots();
    }
  }, [user]);

  const handleInputChange = (e) => {
    setNewSlot({ ...newSlot, [e.target.name]: e.target.value });
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    const doctorId = user?.doctor_profile?.id;
    if (!doctorId) return;

    setSaving(true);
    try {
      const payload = {
        doctor: doctorId,
        day_of_week: newSlot.day_of_week,
        start_time: newSlot.start_time + ':00',
        end_time: newSlot.end_time + ':00',
        duration: parseInt(newSlot.duration),
        max_patients: parseInt(newSlot.max_patients),
        is_active: true
      };

      if (newSlot.break_start && newSlot.break_end) {
        payload.break_start = newSlot.break_start + ':00';
        payload.break_end = newSlot.break_end + ':00';
      }

      await api.post('slots/', payload);
      toast.success('Availability time slot added successfully!');
      setShowAddModal(false);
      // Reset form
      setNewSlot({
        day_of_week: 'Monday',
        start_time: '10:00',
        end_time: '12:00',
        duration: 30,
        max_patients: 4,
        break_start: '',
        break_end: '',
      });
      fetchSlots();
    } catch (err) {
      console.error(err);
      const errors = err.response?.data;
      if (errors) {
        const msg = Array.isArray(errors) ? errors[0] : Object.values(errors)[0];
        toast.error(msg || 'Overlapping or invalid slot times.');
      } else {
        toast.error('Failed to create slot.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Are you sure you want to delete this availability slot?')) return;
    try {
      await api.delete(`slots/${slotId}/`);
      toast.success('Time slot deleted.');
      fetchSlots();
    } catch (err) {
      console.error(err);
      toast.error('Cannot delete slots that have active appointments booked.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="h-32 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Weekly Schedule Slots</h3>
            <p className="text-xs text-slate-400">Define available weekdays, break sessions, and slot durations</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md shadow-primary-200"
          >
            <Plus size={16} />
            <span>Add Availability Slot</span>
          </button>
        </div>

        {slots.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-xl">
            <Calendar size={36} className="text-slate-300 mb-2 mx-auto" />
            <p className="text-sm font-medium text-slate-500">No schedule slots configured.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {slots.map((slot) => (
              <div key={slot.id} className="p-4 border border-slate-200 rounded-xl flex items-center justify-between bg-slate-50/50 hover:border-primary-100 transition-colors">
                <div>
                  <h4 className="font-bold text-slate-800 text-sm">{slot.day_of_week}</h4>
                  <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
                    <Clock size={12} />
                    {slot.start_time.substring(0,5)} - {slot.end_time.substring(0,5)}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Duration: {slot.duration} min • Max: {slot.max_patients} patients
                  </p>
                  {slot.break_start && (
                    <p className="text-[10px] text-amber-600 font-semibold mt-1">
                      Break: {slot.break_start.substring(0,5)} - {slot.break_end.substring(0,5)}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteSlot(slot.id)}
                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Slot Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-base">Add Availability Slot</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSlot} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Weekday *</label>
                <select
                  name="day_of_week"
                  value={newSlot.day_of_week}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500 bg-white"
                >
                  <option value="Monday">Monday</option>
                  <option value="Tuesday">Tuesday</option>
                  <option value="Wednesday">Wednesday</option>
                  <option value="Thursday">Thursday</option>
                  <option value="Friday">Friday</option>
                  <option value="Saturday">Saturday</option>
                  <option value="Sunday">Sunday</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Start Time *</label>
                  <input
                    type="time"
                    name="start_time"
                    value={newSlot.start_time}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">End Time *</label>
                  <input
                    type="time"
                    name="end_time"
                    value={newSlot.end_time}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Slot Duration (Min)</label>
                  <input
                    type="number"
                    name="duration"
                    value={newSlot.duration}
                    onChange={handleInputChange}
                    min="5"
                    max="180"
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Max Patients</label>
                  <input
                    type="number"
                    name="max_patients"
                    value={newSlot.max_patients}
                    onChange={handleInputChange}
                    min="1"
                    max="50"
                    required
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Break Start (Opt)</label>
                  <input
                    type="time"
                    name="break_start"
                    value={newSlot.break_start}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Break End (Opt)</label>
                  <input
                    type="time"
                    name="break_end"
                    value={newSlot.break_end}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 rounded-lg"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-xs font-semibold text-white rounded-lg flex items-center gap-1"
                >
                  {saving && <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></span>}
                  <span>Add Slot</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSlots;
