import React, { useState, useEffect } from 'react';
import { MOCK_WORK_ORDERS, MOCK_ASSETS } from '../constants';
import { WorkOrder, WorkOrderStatus, WorkOrderPriority } from '../types';
import { Plus, Clock, AlertCircle, CheckCircle, MoreHorizontal, X, Upload, Sparkles } from 'lucide-react';
import { generateMaintenanceChecklist } from '../services/geminiService';
import toast from 'react-hot-toast';

const WorkOrderBoard: React.FC = () => {
  const [orders, setOrders] = useState<WorkOrder[]>(MOCK_WORK_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  // Columns definition
  const columns = [
    { id: WorkOrderStatus.PENDING, label: 'Pending', color: 'bg-slate-100 border-slate-200' },
    { id: WorkOrderStatus.IN_PROGRESS, label: 'In Progress', color: 'bg-blue-50 border-blue-200' },
    { id: WorkOrderStatus.REVIEW, label: 'Review', color: 'bg-amber-50 border-amber-200' },
    { id: WorkOrderStatus.COMPLETED, label: 'Completed', color: 'bg-green-50 border-green-200' },
  ];

  const handleStatusChange = (orderId: string, newStatus: WorkOrderStatus) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    toast.success(`Work Order moved to ${newStatus}`);
  };

  const handleAiAssist = async () => {
    if (!selectedOrder) return;
    setIsAiLoading(true);
    setAiResponse(null);
    
    // Find asset name
    const asset = MOCK_ASSETS.find(a => a.id === selectedOrder.assetId);
    const assetName = asset ? asset.name : "Unknown Asset";

    const result = await generateMaintenanceChecklist(assetName, selectedOrder.description);
    setAiResponse(result);
    setIsAiLoading(false);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Work Orders</h1>
        <button className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors shadow-sm font-medium">
          <Plus className="w-4 h-4" />
          New Work Order
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {columns.map(col => (
          <div key={col.id} className="min-w-[300px] flex-1 flex flex-col bg-slate-50/50 rounded-xl border border-slate-200 h-full">
            <div className={`p-3 border-b ${col.color.split(' ')[1]} rounded-t-xl bg-white sticky top-0 z-10`}>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-700">{col.label}</h3>
                <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-full font-medium">
                  {orders.filter(o => o.status === col.id).length}
                </span>
              </div>
            </div>
            
            <div className="flex-1 p-2 overflow-y-auto space-y-3 scrollbar-hide">
              {orders.filter(o => o.status === col.id).map(order => (
                <div 
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="group bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono text-slate-400">{order.id.toUpperCase()}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                      order.priority === 'HIGH' || order.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : 
                      order.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
                    }`}>
                      {order.priority}
                    </span>
                  </div>
                  <h4 className="font-medium text-slate-800 mb-1 line-clamp-2">{order.title}</h4>
                  <div className="text-xs text-slate-500 flex items-center gap-1 mb-3">
                    <Clock className="w-3 h-3" />
                    Due {order.dueDate}
                  </div>
                  
                  {/* Quick Actions overlay */}
                  <div className="flex justify-end pt-2 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <select 
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => handleStatusChange(order.id, e.target.value as WorkOrderStatus)}
                      value={order.status}
                      className="text-xs border rounded px-1 py-0.5 bg-slate-50"
                    >
                      {Object.values(WorkOrderStatus).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
              
              {orders.filter(o => o.status === col.id).length === 0 && (
                <div className="h-32 flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg m-2">
                  <span className="text-sm">No orders</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div>
                 <h2 className="text-xl font-bold text-slate-900">{selectedOrder.title}</h2>
                 <p className="text-sm text-slate-500">ID: {selectedOrder.id}</p>
              </div>
              <button onClick={() => {setSelectedOrder(null); setAiResponse(null);}} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs font-semibold text-slate-500 uppercase">Asset ID</label>
                   <div className="mt-1 font-medium">{selectedOrder.assetId}</div>
                </div>
                <div>
                   <label className="text-xs font-semibold text-slate-500 uppercase">Assigned To</label>
                   <div className="flex items-center gap-2 mt-1">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">MT</div>
                      <span className="font-medium">Mike Tech</span>
                   </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Description</label>
                <p className="mt-2 text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">
                  {selectedOrder.description}
                </p>
              </div>

              {/* AI Section */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-2 font-semibold text-indigo-900">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    Smart Assist
                  </h3>
                  {!aiResponse && (
                    <button 
                      onClick={handleAiAssist}
                      disabled={isAiLoading}
                      className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                      {isAiLoading ? 'Analyzing...' : 'Generate Checklist'}
                    </button>
                  )}
                </div>
                
                {isAiLoading && <div className="text-sm text-indigo-500 animate-pulse">Consulting Gemini knowledge base...</div>}
                
                {aiResponse && (
                   <div className="prose prose-sm prose-indigo max-w-none text-slate-700 text-sm whitespace-pre-line bg-white p-4 rounded-lg border border-indigo-100">
                     {aiResponse}
                   </div>
                )}
              </div>

              {/* Upload Section */}
              <div>
                 <label className="text-xs font-semibold text-slate-500 uppercase mb-2 block">Attachments</label>
                 <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                        <p className="text-sm text-slate-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-slate-400">SVG, PNG, JPG or PDF (MAX. 800x400px)</p>
                    </div>
                    <input type="file" className="hidden" />
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
               <button onClick={() => setSelectedOrder(null)} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium text-sm">Cancel</button>
               <button className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-slate-800 font-medium text-sm">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkOrderBoard;