import React, { useState } from 'react';
import { X, Plus, Trash2, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const ConsultationModal = ({ isOpen, onClose, appointment, onConsultationComplete }) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [notes, setNotes] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  
  // Prescription builders
  const [medicines, setMedicines] = useState([]);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medDuration, setMedDuration] = useState('');
  const [medInst, setMedInst] = useState('');

  const [loading, setLoading] = useState(false);

  if (!isOpen || !appointment) return null;

  const addMedicine = () => {
    if (!medName.trim() || !medDosage.trim()) {
      toast.error("Please fill in at least the medicine name and dosage.");
      return;
    }
    const newMed = {
      name: medName,
      dosage: medDosage,
      duration: medDuration || 'As needed',
      instructions: medInst || 'Take after meals'
    };
    setMedicines([...medicines, newMed]);
    setMedName('');
    setMedDosage('');
    setMedDuration('');
    setMedInst('');
  };

  const removeMedicine = (index) => {
    setMedicines(medicines.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      toast.error("Diagnosis description is required.");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        diagnosis,
        notes,
        medicines,
        follow_up_date: followUpDate || null
      };

      await api.post(`appointments/${appointment.id}/add_prescription/`, payload);
      toast.success("Consultation complete & EMR updated successfully!");
      onConsultationComplete();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to save EMR consultation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-[#0e383c] text-white rounded-t-3xl">
          <div>
            <h3 className="text-lg font-bold">EMR & Outpatient Consultation</h3>
            <p className="text-xs text-slate-300 mt-0.5">Patient: {appointment.patient_details?.user?.first_name} {appointment.patient_details?.user?.last_name}</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1">
          {/* Diagnosis */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Diagnosis Summary</label>
            <input 
              type="text" 
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              placeholder="e.g. Hypertension stage 1, acute bronchitis"
              className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-[#00a3c4]"
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Clinical Notes & Observations</label>
            <textarea 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Vitals: BP 130/85, Pulse 72. Patient reports chest congestion..."
              rows="3"
              className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-[#00a3c4]"
            />
          </div>

          {/* Medicine Builder Section */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <h4 className="text-xs font-bold text-slate-700 uppercase">Prescription Builder</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input 
                type="text" 
                value={medName}
                onChange={(e) => setMedName(e.target.value)}
                placeholder="Medicine Name (e.g. Paracetamol)" 
                className="bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs outline-none focus:border-[#00a3c4]"
              />
              <input 
                type="text" 
                value={medDosage}
                onChange={(e) => setMedDosage(e.target.value)}
                placeholder="Dosage (e.g. 500mg, Twice a day)" 
                className="bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs outline-none focus:border-[#00a3c4]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input 
                type="text" 
                value={medDuration}
                onChange={(e) => setMedDuration(e.target.value)}
                placeholder="Duration (e.g. 5 days)" 
                className="bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs outline-none focus:border-[#00a3c4]"
              />
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={medInst}
                  onChange={(e) => setMedInst(e.target.value)}
                  placeholder="Instructions (e.g. After food)" 
                  className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded-lg text-xs outline-none focus:border-[#00a3c4]"
                />
                <button 
                  type="button" 
                  onClick={addMedicine}
                  className="px-3 bg-[#00a3c4] hover:bg-[#0086a1] text-white rounded-lg flex items-center justify-center transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* List of Added Medicines */}
            {medicines.length > 0 && (
              <div className="border-t border-slate-200 pt-3 space-y-2">
                {medicines.map((m, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-100 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{m.name}</span>
                      <span className="text-[10px] text-slate-400 ml-2">({m.dosage} • {m.duration} • {m.instructions})</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeMedicine(idx)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Follow Up Date</label>
              <input 
                type="date" 
                value={followUpDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFollowUpDate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm outline-none focus:border-[#00a3c4]"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-5 py-2.5 bg-[#00a3c4] hover:bg-[#0086a1] text-white font-bold text-sm rounded-xl transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck size={16} /> {loading ? 'Completing...' : 'Complete Consultation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsultationModal;
