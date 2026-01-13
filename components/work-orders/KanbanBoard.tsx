
import React, { useState, useContext } from 'react';
import { UserContext } from '../../context/UserContext';
import { DataContext } from '../../context/DataContext';
import { WorkOrder, WorkOrderStatus, WorkOrderPriority, WorkOrderType, UserRole } from '../../types';
import { Plus, Clock, X, Sparkles, Package, Users, User as UserIcon } from 'lucide-react';
import { generateMaintenanceChecklist } from '../../services/geminiService';
import toast from 'react-hot-toast';
import FileUpload from '../ui/FileUpload';

const KanbanBoard: React.FC = () => {
  const { user } = useContext(UserContext);
  const { workOrders, addWorkOrder, updateWorkOrder, assets, inventory, consumeInventory, users } = useContext(DataContext);
  const [selectedOrder, setSelectedOrder] = useState<WorkOrder | null>(null);
  
  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    title: '',
    description: '',
    assetId: assets[0]?.id || '',
    priority: WorkOrderPriority.MEDIUM,
    dueDate: '',
    assigneeType: 'INDIVIDUAL', // 'INDIVIDUAL' | 'ALL'
    assignedToId: ''
  });

  // Part Usage State
  const [selectedPartId, setSelectedPartId] = useState('');
  const [partQuantity, setPartQuantity] = useState(1);

  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);

  const columns = [
    { id: WorkOrderStatus.PENDING, label: 'Pending', color: 'bg-slate-100 border-slate-200' },
    { id: WorkOrderStatus.IN_PROGRESS, label: 'In Progress', color: 'bg-blue-50 border-blue-200' },
    { id: WorkOrderStatus.REVIEW, label: 'Review', color: 'bg-amber-50 border-amber-200' },
    { id: WorkOrderStatus.COMPLETED, label: 'Completed', color: 'bg-green-50 border-green-200' },
  ];

  const handleStatusChange = (orderId: string, newStatus: WorkOrderStatus) => {
    const order = workOrders.find(o => o.id === orderId);
    if (order) {
       updateWorkOrder({ ...order, status: newStatus });
       toast.success(`Work Order moved to ${newStatus}`);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrderForm.title || !newOrderForm.dueDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    const baseOrder = {
      description: newOrderForm.description,
      assetId: newOrderForm.assetId,
      requestedById: user?.id || 'u1',
      status: WorkOrderStatus.PENDING,
      priority: newOrderForm.priority,
      type: WorkOrderType.REACTIVE,
      dueDate: newOrderForm.dueDate,
      createdAt: new Date().toISOString().split('T')[0],
      partsUsed: []
    };

    if (newOrderForm.assigneeType === 'ALL') {
        // Find all Technicians and Contractors
        const workers = users.filter(u => (u.role === UserRole.TECHNICIAN || u.role === UserRole.CONTRACTOR) && u.status === 'ACTIVE');
        
        if (workers.length === 0) {
            toast.error("No active workers found to assign.");
            return;
        }

        workers.forEach((worker, index) => {
            const newOrder: WorkOrder = {
                ...baseOrder,
                id: `wo-${Date.now()}-${index}`,
                title: `${newOrderForm.title} - ${worker.name}`, // Personalize title
                assignedToId: worker.id
            };
            addWorkOrder(newOrder);
        });
        toast.success(`Created ${workers.length} Work Orders for all workers`);
    } else {
        const newOrder: WorkOrder = {
            ...baseOrder,
            id: `wo-${Date.now().toString().slice(-4)}`,
            title: newOrderForm.title,
            assignedToId: newOrderForm.assignedToId || undefined
        };
        addWorkOrder(newOrder);
        toast.success('Work Order created successfully');
    }

    setIsCreateModalOpen(false);
    setNewOrderForm({
      title: '',
      description: '',
      assetId: assets[0]?.id || '',
      priority: WorkOrderPriority.MEDIUM,
      dueDate: '',
      assigneeType: 'INDIVIDUAL',
      assignedToId: ''
    });
  };

  const handleAiAssist = async () => {
    if (!selectedOrder) return;
    setIsAiLoading(true);
    setAiResponse(null);
    
    const asset = assets.find(a => a.id === selectedOrder.assetId);
    const assetName = asset ? asset.name : "Unknown Asset";

    const result = await generateMaintenanceChecklist(assetName, selectedOrder.description);
    setAiResponse(result);
    setIsAiLoading(false);
  };

  const handleAddPart = () => {
    if (!selectedOrder || !selectedPartId || partQuantity <= 0) return;

    const part = inventory.find(p => p.id === selectedPartId);
    if (!part) return;

    const success = consumeInventory(selectedPartId, partQuantity);

    if (success) {
      const newPartUsage = {
        inventoryId: part.id,
        name: part.name,
        quantity: partQuantity,
        costAtTime: part.unitPrice
      };
      
      const updatedOrder = {
        ...selectedOrder,
        partsUsed: [...(selectedOrder.partsUsed || []), newPartUsage]
      };

      updateWorkOrder(updatedOrder);
      setSelectedOrder(updatedOrder);
      toast.success(`Used ${partQuantity} x ${part.name}`);
      setPartQuantity(1);
      setSelectedPartId('');
    }
  };

  const handleFileUpload = (file: File) => {
    toast.success(`Attached ${file.name} to order`);
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Work Orders</h1>
        <button 
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors shadow-sm font-medium"
        >
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
                  {workOrders.filter(o => o.status === col.id).length}
                </span>
              </div>
            </div>
            
            <div className="flex-1 p-2 overflow-y-auto space-y-3 scrollbar-hide">
              {workOrders.filter(o => o.status === col.id).map(order => {
                const assignedUser = users.find(u => u.id === order.assignedToId);
                return (
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
                    <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due {order.dueDate}
                        </div>
                        {assignedUser && (
                            <div className="flex items-center gap-1" title={`Assigned to ${assignedUser.name}`}>
                                <img src={assignedUser.avatar} className="w-5 h-5 rounded-full border border-white shadow-sm" alt="" />
                            </div>
                        )}
                    </div>
                    <div className="flex justify-end pt-2 border-t border-slate-50 opacity-0 group-hover:opacity-100 transition-opacity mt-2">
                      <select 
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusChange(order.id, e.target.value as WorkOrderStatus)}
                        value={order.status}
                        className="text-xs border rounded px-1 py-0.5 bg-slate-50"
                      >
                        {Object.values(WorkOrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-900">Create Work Order</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input required type="text" value={newOrderForm.title} onChange={e => setNewOrderForm({...newOrderForm, title: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="e.g. Hydraulic Pump Maintenance" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Asset</label>
                   <select value={newOrderForm.assetId} onChange={e => setNewOrderForm({...newOrderForm, assetId: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white">
                     {assets.map(asset => <option key={asset.id} value={asset.id}>{asset.name}</option>)}
                   </select>
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                   <input required type="date" value={newOrderForm.dueDate} onChange={e => setNewOrderForm({...newOrderForm, dueDate: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                 </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                 <select value={newOrderForm.priority} onChange={e => setNewOrderForm({...newOrderForm, priority: e.target.value as WorkOrderPriority})} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white">
                    {Object.values(WorkOrderPriority).map(p => <option key={p} value={p}>{p}</option>)}
                 </select>
              </div>

              {/* Assignment Section */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Assignment</label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="radio" 
                        name="assigneeType" 
                        value="INDIVIDUAL" 
                        checked={newOrderForm.assigneeType === 'INDIVIDUAL'}
                        onChange={() => setNewOrderForm({...newOrderForm, assigneeType: 'INDIVIDUAL'})}
                        className="text-secondary focus:ring-secondary"
                      />
                      <UserIcon className="w-4 h-4 text-slate-500" />
                      Specific Person
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input 
                        type="radio" 
                        name="assigneeType" 
                        value="ALL" 
                        checked={newOrderForm.assigneeType === 'ALL'}
                        onChange={() => setNewOrderForm({...newOrderForm, assigneeType: 'ALL'})}
                        className="text-secondary focus:ring-secondary"
                      />
                      <Users className="w-4 h-4 text-slate-500" />
                      All Workers
                    </label>
                  </div>
                  
                  {newOrderForm.assigneeType === 'INDIVIDUAL' && (
                    <select 
                      value={newOrderForm.assignedToId} 
                      onChange={(e) => setNewOrderForm({...newOrderForm, assignedToId: e.target.value})} 
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-sm"
                    >
                      <option value="">-- Select Worker --</option>
                      {users
                        .filter(u => u.role === UserRole.TECHNICIAN || u.role === UserRole.CONTRACTOR)
                        .map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                      ))}
                    </select>
                  )}
                  {newOrderForm.assigneeType === 'ALL' && (
                      <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">
                          This will create a separate Work Order for every active Technician and Contractor in the system.
                      </p>
                  )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea rows={3} value={newOrderForm.description} onChange={e => setNewOrderForm({...newOrderForm, description: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
              </div>

              <div className="pt-2 flex gap-3">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-secondary text-white rounded-lg font-medium hover:bg-amber-600 transition-colors">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                   <label className="text-xs font-semibold text-slate-500 uppercase">Priority</label>
                   <div className="mt-1 font-medium">{selectedOrder.priority}</div>
                </div>
                <div>
                   <label className="text-xs font-semibold text-slate-500 uppercase">Assigned To</label>
                   <div className="mt-1 font-medium flex items-center gap-2">
                       {selectedOrder.assignedToId ? (
                           <>
                             <UserIcon className="w-4 h-4 text-slate-400" />
                             {users.find(u => u.id === selectedOrder.assignedToId)?.name || 'Unknown User'}
                           </>
                       ) : (
                           <span className="text-slate-400 italic">Unassigned</span>
                       )}
                   </div>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase">Description</label>
                <p className="mt-2 text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-lg border border-slate-100">{selectedOrder.description}</p>
              </div>
              
              {/* Materials & Parts Usage Section */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                 <div className="flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">Materials & Parts</h3>
                 </div>
                 
                 {/* Usage History */}
                 {selectedOrder.partsUsed && selectedOrder.partsUsed.length > 0 && (
                   <div className="mb-4 space-y-2">
                     {selectedOrder.partsUsed.map((part, idx) => (
                       <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded border border-slate-200">
                         <span className="text-slate-700">{part.name}</span>
                         <div className="flex items-center gap-2">
                            <span className="font-medium">Qty: {part.quantity}</span>
                            <span className="text-slate-400 text-xs">${(part.costAtTime * part.quantity).toFixed(2)}</span>
                         </div>
                       </div>
                     ))}
                   </div>
                 )}

                 {/* Add Part Form */}
                 <div className="flex gap-2">
                    <select 
                      value={selectedPartId} 
                      onChange={(e) => setSelectedPartId(e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white"
                    >
                      <option value="">Select Part...</option>
                      {inventory.map(item => (
                        <option key={item.id} value={item.id} disabled={item.quantity === 0}>
                           {item.name} ({item.quantity} avail)
                        </option>
                      ))}
                    </select>
                    <input 
                      type="number" 
                      min="1" 
                      value={partQuantity} 
                      onChange={(e) => setPartQuantity(parseInt(e.target.value))}
                      className="w-20 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                    />
                    <button 
                      onClick={handleAddPart}
                      disabled={!selectedPartId}
                      className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm hover:bg-slate-900 disabled:opacity-50"
                    >
                      Add
                    </button>
                 </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-2 font-semibold text-indigo-900"><Sparkles className="w-4 h-4" /> Smart Assist</h3>
                  {!aiResponse && <button onClick={handleAiAssist} disabled={isAiLoading} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700">Generate Checklist</button>}
                </div>
                {isAiLoading && <div className="text-sm text-indigo-500 animate-pulse">Consulting Gemini...</div>}
                {aiResponse && <div className="prose prose-sm prose-indigo max-w-none text-slate-700 bg-white p-4 rounded-lg">{aiResponse}</div>}
              </div>
              <FileUpload onFileSelect={handleFileUpload} label="Attachments" />
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-xl">
               <button onClick={() => setSelectedOrder(null)} className="px-4 py-2 text-slate-600 hover:text-slate-800 font-medium">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KanbanBoard;
