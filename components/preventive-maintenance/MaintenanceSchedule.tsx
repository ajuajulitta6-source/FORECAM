import React, { useContext, useState, useMemo } from 'react';
import { DataContext } from '../../context/DataContext';
import { UserContext } from '../../context/UserContext';
import { WorkOrder, WorkOrderPriority, WorkOrderStatus, WorkOrderType } from '../../types';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Clock, AlertTriangle, CheckCircle, RotateCw, X, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';
import FileUpload from '../ui/FileUpload';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const MaintenanceSchedule: React.FC = () => {
  const { workOrders, addWorkOrder, assets, users } = useContext(DataContext);
  const { user } = useContext(UserContext);
  
  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  
  // Modal State
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    title: '',
    description: '',
    assetId: '',
    assignedToId: '',
    priority: WorkOrderPriority.MEDIUM,
    frequency: 'ONE_TIME',
    date: '',
    location: '',
    image: ''
  });

  // Derived Data
  const pmOrders = workOrders.filter(wo => wo.type === WorkOrderType.PREVENTIVE);
  
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDayClick = (day: number) => {
    const month = currentDate.getMonth() + 1;
    const year = currentDate.getFullYear();
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    setSelectedDate(dateStr);
    
    // Pre-fill form
    setScheduleForm(prev => ({ ...prev, date: dateStr }));
    setIsScheduleModalOpen(true);
  };

  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const assetId = e.target.value;
    const asset = assets.find(a => a.id === assetId);
    setScheduleForm(prev => ({ 
        ...prev, 
        assetId, 
        location: asset ? asset.location : prev.location 
    }));
  };

  const handleFileUpload = (file: File) => {
    const fakeUrl = URL.createObjectURL(file);
    setScheduleForm(prev => ({ ...prev, image: fakeUrl }));
    toast.success("File attached");
  };

  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.title || !scheduleForm.date || !scheduleForm.assetId) {
      toast.error("Please fill required fields");
      return;
    }

    const newWO: WorkOrder = {
      id: `pm-${Date.now()}`,
      title: scheduleForm.title,
      description: scheduleForm.description,
      assetId: scheduleForm.assetId,
      requestedById: user?.id || 'sys',
      assignedToId: scheduleForm.assignedToId || user?.id, 
      status: WorkOrderStatus.PENDING,
      priority: scheduleForm.priority,
      type: WorkOrderType.PREVENTIVE,
      frequency: scheduleForm.frequency as any,
      dueDate: scheduleForm.date,
      createdAt: new Date().toISOString().split('T')[0],
      location: scheduleForm.location,
      image: scheduleForm.image
    };

    addWorkOrder(newWO);
    toast.success('Preventive Maintenance Scheduled');
    setIsScheduleModalOpen(false);
    
    // Reset form mostly
    setScheduleForm({
      title: '',
      description: '',
      assetId: '',
      assignedToId: '',
      priority: WorkOrderPriority.MEDIUM,
      frequency: 'ONE_TIME',
      date: '',
      location: '',
      image: ''
    });
  };

  // Calendar Grid Generation
  const renderCalendar = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    
    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-32 bg-slate-50 border border-slate-100/50"></div>);
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
       const dateStr = `${year}-${(month + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
       const daysPMs = pmOrders.filter(wo => wo.dueDate === dateStr);
       const isToday = new Date().toISOString().split('T')[0] === dateStr;

       days.push(
         <div 
            key={day} 
            onClick={() => handleDayClick(day)}
            className={`h-32 border border-slate-200 p-2 cursor-pointer hover:bg-slate-50 transition-colors relative group ${isToday ? 'bg-blue-50/50' : 'bg-white'}`}
         >
            <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-blue-600' : 'text-slate-700'}`}>
               {day} {isToday && <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full ml-1">Today</span>}
            </div>
            
            <div className="space-y-1 overflow-y-auto max-h-[85px] scrollbar-hide">
               {daysPMs.map(pm => (
                 <div key={pm.id} className={`text-[10px] px-1.5 py-1 rounded border truncate flex items-center gap-1
                    ${pm.status === 'COMPLETED' ? 'bg-green-50 text-green-700 border-green-100' : 
                      pm.priority === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-100' : 
                      'bg-indigo-50 text-indigo-700 border-indigo-100'}`}
                 >
                    {pm.frequency !== 'ONE_TIME' && <RotateCw className="w-3 h-3 flex-shrink-0" />}
                    <span className="truncate">{pm.title}</span>
                 </div>
               ))}
            </div>

            {/* Add Button on Hover */}
            <button className="absolute bottom-2 right-2 p-1 bg-primary text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10">
               <Plus className="w-3 h-3" />
            </button>
         </div>
       );
    }

    return days;
  };

  // Upcoming List Logic
  const upcomingPMs = useMemo(() => {
    return [...pmOrders]
      .filter(wo => wo.status !== WorkOrderStatus.COMPLETED)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5); // Take top 5
  }, [pmOrders]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Preventive Maintenance</h1>
            <p className="text-sm text-slate-500">Schedule and track recurring asset maintenance.</p>
          </div>
          <button 
             onClick={() => {
                setScheduleForm(prev => ({ ...prev, date: new Date().toISOString().split('T')[0] }));
                setIsScheduleModalOpen(true);
             }}
             className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors shadow-sm font-medium"
          >
             <Plus className="w-4 h-4" />
             Schedule PM
          </button>
       </div>

       <div className="flex flex-col lg:flex-row gap-6 h-full">
          {/* Calendar Section */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
             {/* Calendar Header */}
             <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                   <CalendarIcon className="w-5 h-5 text-slate-500" />
                   {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h2>
                <div className="flex items-center gap-1">
                   <button onClick={handlePrevMonth} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600">
                      <ChevronLeft className="w-5 h-5" />
                   </button>
                   <button onClick={() => setCurrentDate(new Date())} className="text-sm font-medium px-3 py-1 hover:bg-slate-100 rounded-lg text-slate-600">
                      Today
                   </button>
                   <button onClick={handleNextMonth} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600">
                      <ChevronRight className="w-5 h-5" />
                   </button>
                </div>
             </div>

             {/* Days Header */}
             <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                {DAYS_OF_WEEK.map(day => (
                   <div key={day} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      {day}
                   </div>
                ))}
             </div>

             {/* Calendar Grid */}
             <div className="flex-1 overflow-y-auto">
                <div className="grid grid-cols-7">
                   {renderCalendar()}
                </div>
             </div>
          </div>

          {/* Sidebar Info Section */}
          <div className="w-full lg:w-80 space-y-6">
             {/* Upcoming Widget */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                   <Clock className="w-4 h-4 text-primary" />
                   Upcoming Maintenance
                </h3>
                <div className="space-y-3">
                   {upcomingPMs.length === 0 && (
                      <p className="text-sm text-slate-400 text-center py-4">No upcoming tasks.</p>
                   )}
                   {upcomingPMs.map(pm => {
                      const isOverdue = new Date(pm.dueDate) < new Date() && pm.status !== 'COMPLETED';
                      return (
                        <div key={pm.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors">
                           <div className="flex justify-between items-start mb-1">
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${isOverdue ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                                 {isOverdue ? 'OVERDUE' : pm.dueDate}
                              </span>
                              {pm.priority === 'CRITICAL' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                           </div>
                           <h4 className="text-sm font-medium text-slate-900 line-clamp-1">{pm.title}</h4>
                           <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              {pm.frequency !== 'ONE_TIME' && <RotateCw className="w-3 h-3" />}
                              <span className="capitalize">{pm.frequency?.toLowerCase().replace('_', ' ')}</span>
                           </div>
                        </div>
                      );
                   })}
                </div>
             </div>

             {/* Legend */}
             <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 mb-3 text-sm">Status Legend</h3>
                <div className="space-y-2 text-xs text-slate-600">
                   <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-50 border border-green-200 rounded"></span>
                      Completed
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-indigo-50 border border-indigo-200 rounded"></span>
                      Scheduled
                   </div>
                   <div className="flex items-center gap-2">
                      <span className="w-3 h-3 bg-red-50 border border-red-200 rounded"></span>
                      Critical / Overdue
                   </div>
                </div>
             </div>
          </div>
       </div>

       {/* Schedule Modal */}
       {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h3 className="font-semibold text-slate-900">Schedule Preventive Maintenance</h3>
              <button onClick={() => setIsScheduleModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleScheduleSubmit} className="p-6 space-y-4">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                  <input 
                     required 
                     type="text" 
                     value={scheduleForm.title} 
                     onChange={e => setScheduleForm({...scheduleForm, title: e.target.value})} 
                     className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                     placeholder="e.g. Monthly Generator Test"
                  />
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Asset</label>
                     <select 
                        required
                        value={scheduleForm.assetId} 
                        onChange={handleAssetChange} 
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white"
                     >
                        <option value="">Select Asset...</option>
                        {assets.map(asset => (
                           <option key={asset.id} value={asset.id}>{asset.name}</option>
                        ))}
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Assigned To</label>
                     <select 
                        value={scheduleForm.assignedToId} 
                        onChange={e => setScheduleForm({...scheduleForm, assignedToId: e.target.value})} 
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white"
                     >
                        <option value="">Assign to me (Default)</option>
                        {users.map(u => (
                           <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                        ))}
                     </select>
                  </div>
               </div>

               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                 <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <MapPin className="h-4 w-4 text-slate-400" />
                   </div>
                   <input 
                      type="text" 
                      value={scheduleForm.location} 
                      onChange={e => setScheduleForm({...scheduleForm, location: e.target.value})} 
                      className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg"
                      placeholder="e.g. Site A - Main Hall"
                   />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                     <input 
                        required 
                        type="date" 
                        value={scheduleForm.date} 
                        onChange={e => setScheduleForm({...scheduleForm, date: e.target.value})} 
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                     />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                     <select 
                        value={scheduleForm.priority} 
                        onChange={e => setScheduleForm({...scheduleForm, priority: e.target.value as WorkOrderPriority})} 
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white"
                     >
                        {Object.values(WorkOrderPriority).map(p => (
                           <option key={p} value={p}>{p}</option>
                        ))}
                     </select>
                  </div>
               </div>
               
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Frequency</label>
                  <select 
                     value={scheduleForm.frequency} 
                     onChange={e => setScheduleForm({...scheduleForm, frequency: e.target.value})} 
                     className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                     <option value="ONE_TIME">One Time</option>
                     <option value="WEEKLY">Weekly</option>
                     <option value="MONTHLY">Monthly</option>
                     <option value="QUARTERLY">Quarterly</option>
                  </select>
               </div>

               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                  <textarea 
                     rows={3} 
                     value={scheduleForm.description} 
                     onChange={e => setScheduleForm({...scheduleForm, description: e.target.value})} 
                     className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                     placeholder="Check oil levels, filters, and safety guards."
                  />
               </div>

               {/* File Upload Section */}
               <div className="space-y-2">
                 {scheduleForm.image ? (
                   <div className="relative h-32 rounded-lg overflow-hidden border border-slate-200 group">
                      <img src={scheduleForm.image} alt="Attached" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => setScheduleForm({...scheduleForm, image: ''})} className="text-white bg-red-500/80 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm hover:bg-red-600">Remove</button>
                      </div>
                   </div>
                 ) : (
                    <FileUpload onFileSelect={handleFileUpload} label="Attach Image or Document" />
                 )}
               </div>

               <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
                  <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">Schedule</button>
               </div>
            </form>
          </div>
        </div>
       )}
    </div>
  );
};

export default MaintenanceSchedule;