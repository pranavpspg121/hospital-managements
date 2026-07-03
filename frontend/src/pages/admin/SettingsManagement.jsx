import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Settings, Save, MapPin, Phone, Mail } from 'lucide-react';
import toast from 'react-hot-toast';

const SettingsManagement = () => {
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('settings/');
        setAddress(res.data.address);
        setPhone(res.data.phone);
        setEmail(res.data.email);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load hospital settings.");
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('settings/', { address, phone, email });
      toast.success("Hospital settings updated successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update settings.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-slate-200 rounded-lg w-1/4"></div>
        <div className="h-48 bg-slate-200 rounded-2xl"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Settings className="text-primary-600" size={24} /> Hospital Global Settings
          </h1>
          <p className="text-xs text-slate-500 mt-1">Configure global details and public contact credentials shown on landing page.</p>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl space-y-6">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hospital Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <MapPin size={18} />
            </span>
            <input 
              type="text" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 123 Health Ave, New Delhi" 
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-primary-500" 
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Support Phone Number</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Phone size={18} />
            </span>
            <input 
              type="text" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +1 (555) 911-2468" 
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-primary-500" 
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Support Email Address</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Mail size={18} />
            </span>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. info@medicare.com" 
              className="w-full bg-slate-50 border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none focus:border-primary-500" 
              required
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={saving}
          className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-md shadow-primary-200 transition-colors flex items-center justify-center gap-2"
        >
          <Save size={18} /> {saving ? 'Saving Settings...' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
};

export default SettingsManagement;
