import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Phone, MapPin, Briefcase } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const Careers = () => {
  const [careerName, setCareerName] = useState('');
  const [careerEmail, setCareerEmail] = useState('');
  const [careerPhone, setCareerPhone] = useState('');
  const [careerPosition, setCareerPosition] = useState('Nurse');
  const [careerQuals, setCareerQuals] = useState('');
  const [careerResume, setCareerResume] = useState(null);
  const [isApplying, setIsApplying] = useState(false);

  const handleCareerSubmit = async (e) => {
    e.preventDefault();
    if (!careerResume) {
      toast.error("Please upload your resume file.");
      return;
    }
    setIsApplying(true);
    try {
      const formData = new FormData();
      formData.append('name', careerName);
      formData.append('email', careerEmail);
      formData.append('phone', careerPhone);
      formData.append('position', careerPosition);
      formData.append('qualification', careerQuals);
      formData.append('resume', careerResume);

      await api.post('job-applications/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success("Application submitted successfully! Our HR team will contact you.");
      setCareerName('');
      setCareerEmail('');
      setCareerPhone('');
      setCareerPosition('Nurse');
      setCareerQuals('');
      setCareerResume(null);
      e.target.reset();
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit your application.");
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-600 flex flex-col justify-between">
      {/* Top Bar / Header */}
      <header className="bg-white shadow-sm py-4 px-6 border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <a href="/" className="flex items-center gap-2">
            <img src="/assets/images/logo.svg" width="136" height="46" alt="Doclab logo" />
          </a>
          <a href="/" className="px-5 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm uppercase tracking-wider transition-colors">
            Back to Home
          </a>
        </div>
      </header>

      {/* Main Form Body */}
      <main className="flex-1 py-16 px-6">
        <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-3xl shadow-xl overflow-hidden">
          <div className="bg-[#0e383c] text-white p-8 text-center space-y-2">
            <h1 className="text-2xl font-bold font-serif uppercase tracking-wider flex items-center justify-center gap-2">
              <Briefcase size={24} className="text-[#00a3c4]" /> Join Our Medical Team
            </h1>
            <p className="text-white/80 text-xs">Are you a Nurse, Lab Technician, or other medical specialist? Upload your resume here.</p>
          </div>
          <form onSubmit={handleCareerSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={careerName}
                  onChange={(e) => setCareerName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-[#00a3c4]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={careerEmail}
                  onChange={(e) => setCareerEmail(e.target.value)}
                  placeholder="e.g. jane@example.com"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-[#00a3c4]"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Phone Number</label>
                <input 
                  type="text" 
                  value={careerPhone}
                  onChange={(e) => setCareerPhone(e.target.value)}
                  placeholder="e.g. +1 (555) 911-2468"
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-[#00a3c4]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Position</label>
                <select 
                  value={careerPosition}
                  onChange={(e) => setCareerPosition(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-[#00a3c4]"
                  required
                >
                  <option value="Nurse">Nurse</option>
                  <option value="Lab Technician">Lab Technician</option>
                  <option value="Receptionist">Receptionist</option>
                  <option value="Accountant">Accountant</option>
                  <option value="Other Staff">Other Staff</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Qualifications & Experience</label>
              <textarea 
                value={careerQuals}
                onChange={(e) => setCareerQuals(e.target.value)}
                placeholder="List your degrees, certifications, and years of experience..."
                rows="4"
                className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-[#00a3c4]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Upload Resume (PDF/Word)</label>
              <input 
                type="file" 
                onChange={(e) => setCareerResume(e.target.files[0])}
                accept=".pdf,.doc,.docx"
                className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-[#00a3c4]"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={isApplying}
              className="w-full py-3 bg-[#00a3c4] hover:bg-[#0086a1] text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-colors disabled:bg-slate-300"
            >
              {isApplying ? 'Submitting Application...' : 'Submit Application'}
            </button>
          </form>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-12 px-6">
        <div className="max-w-7xl mx-auto text-center space-y-2">
          <p>© {new Date().getFullYear()} MediCare Careers Portal. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Careers;
