import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { CreditCard, ArrowDownRight, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const BillingManagement = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await api.get('billing/history/');
        setPayments(response.data.results || response.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load transaction history.');
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

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
        <h3 className="font-bold text-slate-800 text-lg mb-4">Financial Transactions</h3>

        {payments.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-xl">
            <CreditCard size={36} className="text-slate-300 mb-2 mx-auto" />
            <p className="text-sm font-medium text-slate-500">No payment receipts found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 text-xs font-semibold uppercase">
                  <th className="pb-3">Transaction ID</th>
                  <th className="pb-3">Patient</th>
                  <th className="pb-3">Doctor</th>
                  <th className="pb-3">Consultation Fee</th>
                  <th className="pb-3">Payment Method</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {payments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 font-semibold text-slate-500 flex items-center gap-1.5">
                      <ArrowDownRight size={14} className="text-emerald-500" />
                      <span>{pay.transaction_id || 'N/A'}</span>
                    </td>
                    <td className="py-4 font-semibold text-slate-800">
                      {pay.appointment_details?.patient_details?.user?.first_name} {pay.appointment_details?.patient_details?.user?.last_name}
                    </td>
                    <td className="py-4">
                      Dr. {pay.appointment_details?.doctor_details?.user?.first_name} {pay.appointment_details?.doctor_details?.user?.last_name}
                    </td>
                    <td className="py-4 font-bold text-slate-700">₹{pay.amount}</td>
                    <td className="py-4 text-xs font-medium text-slate-500">{pay.method || 'Demo'}</td>
                    <td className="py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {pay.status || 'Success'}
                      </span>
                    </td>
                    <td className="py-4 text-xs text-slate-400 font-medium">
                      {new Date(pay.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillingManagement;
