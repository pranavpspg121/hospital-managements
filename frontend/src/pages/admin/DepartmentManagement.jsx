import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { Layers, Plus, Trash2, Edit3, X } from 'lucide-react';
import toast from 'react-hot-toast';

const DepartmentManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentDeptId, setCurrentDeptId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: true
  });
  
  const [saving, setSaving] = useState(false);

  const fetchDepartments = async () => {
    try {
      const response = await api.get('departments/');
      setDepartments(response.data.results || response.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const handleInputChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleOpenAdd = () => {
    setEditMode(false);
    setFormData({ name: '', description: '', is_active: true });
    setShowModal(true);
  };

  const handleOpenEdit = (dept) => {
    setEditMode(true);
    setCurrentDeptId(dept.id);
    setFormData({
      name: dept.name,
      description: dept.description || '',
      is_active: dept.is_active
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSaving(true);
    try {
      if (editMode) {
        await api.put(`departments/${currentDeptId}/`, formData);
        toast.success('Department updated successfully!');
      } else {
        await api.post('departments/', formData);
        toast.success('Department created successfully!');
      }
      setShowModal(false);
      fetchDepartments();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.name?.[0] || 'Operation failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;
    try {
      await api.delete(`departments/${id}/`);
      toast.success('Department deleted.');
      fetchDepartments();
    } catch (err) {
      console.error(err);
      toast.error('Cannot delete department with active doctors. Consider deactivating it instead.');
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
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-bold text-slate-800 text-lg">Hospital Departments</h3>
            <p className="text-xs text-slate-400">Configure medical wings and toggle activation status</p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-4 py-2 text-xs font-bold transition-all shadow-md shadow-primary-200"
          >
            <Plus size={16} />
            <span>Create Department</span>
          </button>
        </div>

        {departments.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-xl">
            <Layers size={36} className="text-slate-300 mb-2 mx-auto" />
            <p className="text-sm font-medium text-slate-500">No departments configured yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase">
                  <th className="pb-3">Department Name</th>
                  <th className="pb-3">Description</th>
                  <th className="pb-3">Doctor Count</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {departments.map((dept) => (
                  <tr key={dept.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 font-semibold text-slate-800">{dept.name}</td>
                    <td className="py-4 text-xs text-slate-500 max-w-xs truncate">{dept.description || 'No description'}</td>
                    <td className="py-4 font-semibold text-slate-700">{dept.doctor_count} Doctors</td>
                    <td className="py-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        dept.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {dept.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 text-right flex justify-end gap-2 mt-1.5">
                      <button
                        onClick={() => handleOpenEdit(dept)}
                        className="p-1.5 hover:bg-slate-100 text-slate-600 rounded-lg transition-colors border border-slate-100"
                        title="Edit Department"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(dept.id)}
                        className="p-1.5 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors border border-rose-50"
                        title="Delete Department"
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

      {/* Department Editor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 text-base">{editMode ? 'Edit Department' : 'Create Department'}</h3>
              <button onClick={() => setShowModal(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Department Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g. Cardiology"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Wing descriptions, specialized tests..."
                  rows="3"
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleInputChange}
                  className="accent-primary-600 rounded"
                />
                <label htmlFor="is_active" className="text-xs font-semibold text-slate-600">Active status</label>
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

export default DepartmentManagement;
