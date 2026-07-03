import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { Mail, Trash2, CheckCircle, Clock, Eye, AlertCircle } from 'lucide-react';

const ContactMessages = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMsg, setSelectedMsg] = useState(null);

  const fetchMessages = async () => {
    try {
      const response = await api.get('contact-messages/');
      const data = response.data.results || response.data;
      setMessages(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load customer messages.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const markAsRead = async (id) => {
    try {
      await api.patch(`contact-messages/${id}/`, { is_read: true });
      toast.success("Message marked as read.");
      setMessages(messages.map(m => m.id === id ? { ...m, is_read: true } : m));
      if (selectedMsg && selectedMsg.id === id) {
        setSelectedMsg({ ...selectedMsg, is_read: true });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status.");
    }
  };

  const deleteMessage = async (id) => {
    if (!window.confirm("Are you sure you want to delete this contact message?")) return;
    try {
      await api.delete(`contact-messages/${id}/`);
      toast.success("Message deleted successfully.");
      setMessages(messages.filter(m => m.id !== id));
      if (selectedMsg && selectedMsg.id === id) {
        setSelectedMsg(null);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete message.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Customer Messages</h1>
          <p className="text-xs text-slate-500 mt-1">Review contact inquiries and feedback sent by site visitors.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[75vh]">
          <div className="bg-slate-50/70 p-4 border-b border-slate-200">
            <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Inbox</h3>
          </div>

          <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading messages...</div>
            ) : messages.length > 0 ? (
              messages.map((msg) => (
                <div 
                  key={msg.id} 
                  onClick={() => setSelectedMsg(msg)}
                  className={`p-4 cursor-pointer transition-colors hover:bg-slate-50/50 flex justify-between items-start gap-4 ${
                    selectedMsg && selectedMsg.id === msg.id ? 'bg-cyan-50/20 border-l-2 border-[#00a3c4]' : ''
                  } ${!msg.is_read ? 'bg-slate-50/30' : ''}`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold text-xs ${!msg.is_read ? 'text-slate-800' : 'text-slate-500'}`}>{msg.name}</span>
                      {!msg.is_read && (
                        <span className="h-1.5 w-1.5 bg-[#00a3c4] rounded-full shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">{msg.email}</p>
                    <p className="text-xs font-bold text-slate-700 mt-1 truncate">{msg.subject}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{msg.message}</p>
                  </div>

                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <span className="text-[9px] text-slate-400 flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(msg.sent_at).toLocaleDateString()}
                    </span>
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {!msg.is_read && (
                        <button 
                          onClick={() => markAsRead(msg.id)}
                          title="Mark as Read"
                          className="h-7 w-7 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center hover:bg-emerald-100 transition-colors"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                      <button 
                        onClick={() => deleteMessage(msg.id)}
                        title="Delete Message"
                        className="h-7 w-7 bg-red-50 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-xs text-slate-400">
                <Mail className="mx-auto text-slate-300 mb-3" size={32} />
                No messages received yet.
              </div>
            )}
          </div>
        </div>

        {/* Message Detail View */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-h-[75vh] flex flex-col justify-between">
          {selectedMsg ? (
            <div className="space-y-6 flex flex-col h-full justify-between">
              <div className="space-y-4 overflow-y-auto">
                <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">{selectedMsg.name}</h3>
                    <p className="text-[10px] text-[#00a3c4] font-medium">{selectedMsg.email}</p>
                  </div>
                  <span className="text-[9px] text-slate-400 flex items-center gap-1 font-bold">
                    <Clock size={10} />
                    {new Date(selectedMsg.sent_at).toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Subject</span>
                  <p className="text-xs font-bold text-slate-800 bg-slate-50 p-3 rounded-xl">{selectedMsg.subject}</p>
                </div>

                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Message</span>
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl whitespace-pre-wrap">{selectedMsg.message}</p>
                </div>
              </div>

              <div className="flex gap-3 border-t border-slate-100 pt-4 mt-auto">
                {!selectedMsg.is_read && (
                  <button 
                    onClick={() => markAsRead(selectedMsg.id)}
                    className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <CheckCircle size={14} />
                    Mark Read
                  </button>
                )}
                <button 
                  onClick={() => deleteMessage(selectedMsg.id)}
                  className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full py-16 text-slate-400 space-y-3">
              <Eye size={36} className="text-slate-300" />
              <div>
                <h4 className="font-bold text-slate-700 text-xs">Select Message</h4>
                <p className="text-[10px] text-slate-400 mt-1 max-w-[200px] mx-auto">Click on any message in the inbox list to read the full body content details here.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactMessages;
