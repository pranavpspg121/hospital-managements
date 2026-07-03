import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { User, ShieldAlert, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, setUser } = useAuth();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    // Patient Profile Fields
    phone: '',
    address: '',
    date_of_birth: '',
    blood_group: '',
    medical_history: '',
    emergency_no: '',
    // Doctor Profile Fields
    specialization: '',
    qualification: '',
    experience: 0,
    fee: 0,
  });

  const [passData, setPassData] = useState({
    old_password: '',
    new_password: '',
    confirm_password: '',
  });

  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [passLoading, setPassLoading] = useState(false);

  // Sync profile data on load
  useEffect(() => {
    if (user) {
      const patientProf = user.patient_profile || {};
      const doctorProf = user.doctor_profile || {};
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: patientProf.phone || '',
        address: patientProf.address || '',
        date_of_birth: patientProf.date_of_birth || '',
        blood_group: patientProf.blood_group || '',
        medical_history: patientProf.medical_history || '',
        emergency_no: patientProf.emergency_no || '',
        specialization: doctorProf.specialization || '',
        qualification: doctorProf.qualification || '',
        experience: doctorProf.experience || 0,
        fee: doctorProf.fee || 0,
      });
      if (user.profile_photo) {
        const photoUrl = user.profile_photo.startsWith('http')
          ? user.profile_photo
          : `http://localhost:8000${user.profile_photo}`;
        setPhotoPreview(photoUrl);
      } else {
        setPhotoPreview('');
      }
    }
  }, [user]);

  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handlePassChange = (e) => {
    setPassData({ ...passData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('first_name', formData.first_name);
      formDataToSend.append('last_name', formData.last_name);
      formDataToSend.append('email', formData.email);

      if (photoFile) {
        formDataToSend.append('profile_photo', photoFile);
      }

      if (user.role === 'PATIENT') {
        const patientProfile = {
          phone: formData.phone,
          address: formData.address,
          date_of_birth: formData.date_of_birth,
          blood_group: formData.blood_group,
          medical_history: formData.medical_history,
          emergency_no: formData.emergency_no,
        };
        formDataToSend.append('patient_profile', JSON.stringify(patientProfile));
      } else if (user.role === 'DOCTOR') {
        const doctorProfile = {
          specialization: formData.specialization,
          qualification: formData.qualification,
          experience: parseInt(formData.experience),
          fee: parseFloat(formData.fee),
        };
        formDataToSend.append('doctor_profile', JSON.stringify(doctorProfile));
      }

      const response = await api.put('auth/profile/', formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUser(response.data);
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passData.new_password !== passData.confirm_password) {
      toast.error('New passwords do not match.');
      return;
    }
    setPassLoading(true);
    try {
      await api.post('auth/change-password/', {
        old_password: passData.old_password,
        new_password: passData.new_password,
      });
      toast.success('Password changed successfully!');
      setPassData({ old_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.old_password?.[0] || err.response?.data?.new_password?.[0] || 'Password update failed.');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Account Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-20 w-20 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 text-2xl font-bold uppercase overflow-hidden border-2 border-slate-200">
            {photoPreview ? (
              <img src={photoPreview} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              user?.username.substring(0, 2)
            )}
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}</h2>
            <p className="text-sm text-slate-500 capitalize">{user?.role.toLowerCase()}</p>
          </div>
        </div>
        <div>
          <label className="cursor-pointer inline-flex items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition-colors px-4 py-2.5 text-xs font-semibold text-slate-700">
            <span>Choose Photo</span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Edit Card */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Edit Profile</h3>
          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">First Name</label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleProfileChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Last Name</label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleProfileChange}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleProfileChange}
                className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary-500"
              />
            </div>

            {/* Role Specific Fields */}
            {user?.role === 'PATIENT' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Phone Number</label>
                    <input
                      type="text"
                      name="phone"
                      value={formData.phone}
                      onChange={handleProfileChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      name="emergency_no"
                      value={formData.emergency_no}
                      onChange={handleProfileChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleProfileChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Blood Group</label>
                    <select
                      name="blood_group"
                      value={formData.blood_group}
                      onChange={handleProfileChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary-500"
                    >
                      <option value="">Select Blood Group</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Home Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleProfileChange}
                    rows="2"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Medical History Notes</label>
                  <textarea
                    name="medical_history"
                    value={formData.medical_history}
                    onChange={handleProfileChange}
                    rows="3"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary-500"
                  />
                </div>
              </>
            )}

            {user?.role === 'DOCTOR' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Specialization</label>
                    <input
                      type="text"
                      name="specialization"
                      value={formData.specialization}
                      onChange={handleProfileChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Qualifications</label>
                    <input
                      type="text"
                      name="qualification"
                      value={formData.qualification}
                      onChange={handleProfileChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Consultation Fee (₹)</label>
                    <input
                      type="number"
                      name="fee"
                      value={formData.fee}
                      onChange={handleProfileChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Experience (Years)</label>
                    <input
                      type="number"
                      name="experience"
                      value={formData.experience}
                      onChange={handleProfileChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-2 text-sm outline-none focus:border-primary-500"
                    />
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:bg-primary-400"
            >
              {loading ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Change Password Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-fit">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">Change Password</h3>
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Current Password</label>
              <input
                type="password"
                name="old_password"
                value={passData.old_password}
                onChange={handlePassChange}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">New Password</label>
              <input
                type="password"
                name="new_password"
                value={passData.new_password}
                onChange={handlePassChange}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Confirm New Password</label>
              <input
                type="password"
                name="confirm_password"
                value={passData.confirm_password}
                onChange={handlePassChange}
                placeholder="••••••••"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-primary-500"
              />
            </div>

            <button
              type="submit"
              disabled={passLoading}
              className="w-full rounded-xl bg-slate-800 py-2.5 text-sm font-semibold text-white hover:bg-slate-900 transition-colors disabled:bg-slate-400"
            >
              {passLoading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
