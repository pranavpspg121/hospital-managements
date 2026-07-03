import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Award, Plus, Trash2, Edit3, X, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

const DoctorManagement = () => {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentDoctorId, setCurrentDoctorId] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    department: '',
    specialization: '',
    qualification: '',
    experience: 0,
    fee: 0,
    is_active: true,
    avail_days: []
  });
  
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      const [docsRes, deptsRes] = await Promise.all([
        api.get('doctors/'),
        api.get('departments/'),
      ]);
      setDoctors(docsRes.data.results || docsRes.data);
      setDepartments(deptsRes.data.results || deptsRes.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load doctors list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleDayToggle = (day) => {
    const currentDays = [...formData.avail_days];
    if (currentDays.includes(day)) {
      setFormData({ ...formData, avail_days: currentDays.filter(d => d !== day) });
    } else {
      setFormData({ ...formData, avail_days: [...currentDays, day] });
    }
  };

  const handleOpenAdd = () => {
    setEditMode(false);
    setFormData({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      department: '',
      specialization: '',
      qualification: '',
      experience: 0,
      fee: 0,
      is_active: true,
      avail_days: []
    });
    setShowModal(true);
  };

  const handleOpenEdit = (doc) => {
    setEditMode(true);
    setCurrentDoctorId(doc.id);
    setFormData({
      username: doc.user.username,
      email: doc.user.email,
      password: '', // Leave blank when editing
      first_name: doc.user.first_name || '',
      last_name: doc.user.last_name || '',
      department: doc.department || '',
      specialization: doc.specialization,
      qualification: doc.qualification,
      experience: doc.experience,
      fee: doc.fee,
      is_active: doc.is_active,
      avail_days: doc.avail_days || []
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editMode) {
        // Edit flow: Updates both profile and user fields
        await api.put(`doctors/${currentDoctorId}/`, {
          department: formData.department ? parseInt(formData.department) : null,
          specialization: formData.specialization,
          qualification: formData.qualification,
          experience: parseInt(formData.experience),
          fee: parseFloat(formData.fee),
          is_active: formData.is_active,
          avail_days: formData.avail_days
        });
        toast.success('Doctor profile updated.');
      } else {
        // Create Flow: 
        // 1. Create User account with DOCTOR role
        const regPayload = {
          username: formData.username,
          email: formData.email,
          password: formData.password || 'Doctor@123', // fallback default
          first_name: formData.first_name,
          last_name: formData.last_name,
          role: 'DOCTOR'
        };
        
        await api.post('auth/register/', regPayload);
        
        // Wait, auth/register/ automatically creates a blank Doctor profile.
        // We need to fetch the newly created doctor profile (which has user.username) and update it.
        const docsList = await api.get('doctors/');
        const newDocObj = docsList.data.find(d => d.user.username === formData.username);
        
        if (newDocObj) {
          await api.put(`doctors/${newDocObj.id}/`, {
            department: formData.department ? parseInt(formData.department) : null,
            specialization: formData.specialization,
            qualification: formData.qualification,
            experience: parseInt(formData.experience),
            fee: parseFloat(formData.fee),
            is_active: formData.is_active,
            avail_days: formData.avail_days
          });
        }
        
        toast.success('Doctor account and profile created successfully!');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save doctor details. Check unique constraints.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this doctor profile?')) return;
    try {
      await api.delete(`doctors/${id}/`);
      toast.success('Doctor profile deleted.');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Cannot delete doctors with active appointment histories.');
    }
  };

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Hospital Doctors</h3>
            <p className="text-xs text-slate-400">Manage physician credentials, fees, and weekly slots</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md shadow-primary-200"
          >
            <Plus size={16} />
            <span>Add Doctor Profile</span>
          </button>
        </div>

        {doctors.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-xl">
            <Award size={36} className="text-slate-300 mb-2 mx-auto" />
            <p className="text-sm font-medium text-slate-500">No doctors registered yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase">
                  <th className="pb-3">Doctor</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Fee</th>
                  <th className="pb-3">Available Days</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {doctors.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4">
                      <p className="font-semibold text-slate-800">Dr. {doc.user.first_name} {doc.user.last_name}</p>
                      <p className="text-xs text-slate-500">{doc.specialization} • {doc.qualification}</p>
                    </td>
                    <td className="py-4 text-xs text-slate-600 font-semibold">{doc.department_details?.name || 'Unassigned'}</td>
                    <td className="py-4 font-semibold text-slate-700">₹{doc.fee}</td>
                    <td className="py-4 text-xs text-slate-400 font-medium">{doc.avail_days?.join(', ') || 'None'}</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        doc.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {doc.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 text-right flex justify-end gap-2 mt-1">
                      <button
                        onClick={() => handleOpenEdit(doc)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-100"
                        title="Edit Doctor details"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors border border-rose-50"
                        title="Delete Doctor"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Doctor Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-lg w-full shadow-xl my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-base">{editMode ? 'Edit Doctor Profile' : 'Add Doctor Profile'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* User Account Info - only for new Doctors */}
              {!editMode && (
                <div className="border-b border-slate-100 pb-4 space-y-3">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">1. User Account Credentials</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Username *</label>
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-primary-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 mb-1">Password *</label>
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        placeholder="••••••••"
                        className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-primary-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Personal Profile Details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">2. Professional Profiles</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">First Name *</label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Last Name</label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Department *</label>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleInputChange}
                      required
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-primary-500 bg-white"
                    >
                      <option value="">Choose Department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Specialization *</label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. Cardiologist"
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Qualification *</label>
                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g. MD, DM"
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Experience (Yrs)</label>
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Consultation Fee (₹) *</label>
                    <input
                      type="number"
                      name="fee"
                      value={formData.fee}
                      onChange={handleInputChange}
                      min="0"
                      required
                      className="w-full rounded-xl border border-slate-200 px-3 py-1.5 text-xs outline-none focus:border-primary-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-5">
                    <input
                      type="checkbox"
                      id="is_active"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                      className="accent-primary-600 rounded"
                    />
                    <label htmlFor="is_active" className="text-xs font-semibold text-slate-600">Active Status</label>
                  </div>
                </div>

                {/* Available Days */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1.5">Availability Weekdays</label>
                  <div className="flex flex-wrap gap-2">
                    {weekdays.map(day => {
                      const isSelected = formData.avail_days.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => handleDayToggle(day)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${
                            isSelected ? 'bg-primary-50 border-primary-600 text-primary-700' : 'bg-white border-slate-200 text-slate-500'
                          }`}
                        >
                          {day.substring(0, 3)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-600 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-xs font-semibold text-white rounded-lg flex items-center gap-1"
                >
                  {saving && <span className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent"></span>}
                  <span>{editMode ? 'Save Changes' : 'Create'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorManagement;
