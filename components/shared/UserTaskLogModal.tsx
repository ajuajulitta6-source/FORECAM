
import React, { useState, useContext } from 'react';
import { X, History, ClipboardList, Clock, FileText, Plus, Edit2, Trash2, Key, Settings, Activity, CheckCircle, AlertCircle } from 'lucide-react';
import { User, ActivityType } from '../../types';
import { DataContext } from '../../context/DataContext';

interface UserTaskLogModalProps {
  user: User;
  onClose: () => void;
  initialTab?: 'LOGS' | 'TASKS';
}

const UserTaskLogModal: React.FC<UserTaskLogModalProps> = ({ user, onClose, initialTab = 'TASKS' }) => {
  const { activityLogs, workOrders } = useContext(DataContext);
  const [activeTab, setActiveTab] = useState<'LOGS' | 'TASKS'>(initialTab);

  const userLogs = activityLogs.filter(log => log.userId === user.id);
  const userTasks = workOrders.filter(wo => wo.assignedToId === user.id);

  // Helper for History Icons
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'CREATE': return <Plus className="w-4 h-4 text-green-600" />;
      case 'UPDATE': return <Edit2 className="w-4 h-4 text-blue-600" />;
      case 'DELETE': return <Trash2 className="w-4 h-4 text-red-600" />;
      case 'LOGIN': return <Key className="w-4 h-4 text-purple-600" />;
      case 'SYSTEM': return <Settings className="w-4 h-4 text-slate-600" />;
      default: return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg h-[650px] flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
             <div className="bg-primary/5 p-2 rounded-full">
                {activeTab === 'TASKS' ? <ClipboardList className="w-5 h-5 text-primary" /> : <History className="w-5 h-5 text-primary" />}
             </div>
             <div>
                <h3 className="font-semibold text-slate-900">{user.name}</h3>
                <p className="text-xs text-slate-500">{user.role} • {user.email}</p>
             </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('TASKS')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'TASKS' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Assigned Tasks ({userTasks.length})
          </button>
          <button
            onClick={() => setActiveTab('LOGS')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${activeTab === 'LOGS' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Activity History ({userLogs.length})
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          {activeTab === 'TASKS' ? (
            <div className="space-y-3">
               {userTasks.length === 0 && (
                 <div className="flex flex-col items-center justify-center text-slate-400 py-12">
                    <ClipboardList className="w-10 h-10 mb-2 opacity-30" />
                    <p className="text-sm">No tasks currently assigned.</p>
                 </div>
               )}
               {userTasks.map(task => (
                 <div key={task.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-2">
                       <span className="text-xs font-mono text-slate-400">{task.id}</span>
                       <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          task.status === 'PENDING' ? 'bg-slate-100 text-slate-700' :
                          'bg-blue-100 text-blue-700'
                       }`}>
                          {task.status}
                       </span>
                    </div>
                    <h4 className="font-medium text-slate-900 mb-1">{task.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mb-3">{task.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-50 pt-2">
                       <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Due: {task.dueDate}
                       </div>
                       <div className="flex items-center gap-1">
                          {task.priority === 'HIGH' || task.priority === 'CRITICAL' ? 
                             <AlertCircle className="w-3 h-3 text-red-500" /> : 
                             <CheckCircle className="w-3 h-3 text-slate-400" />
                          }
                          {task.priority} Priority
                       </div>
                    </div>
                 </div>
               ))}
            </div>
          ) : (
            <div className="relative border-l border-slate-200 ml-3 space-y-6">
              {userLogs.length === 0 && (
                  <div className="ml-6 flex flex-col items-center justify-center text-slate-400 py-12">
                    <Clock className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No activity recorded for this user.</p>
                  </div>
              )}

              {userLogs.map((log) => (
                <div key={log.id} className="relative ml-6">
                    <span className="absolute -left-9 top-1 bg-white ring-4 ring-white rounded-full">
                      <div className={`p-1.5 rounded-full ${
                        log.type === 'CREATE' ? 'bg-green-100' : 
                        log.type === 'DELETE' ? 'bg-red-100' : 
                        log.type === 'LOGIN' ? 'bg-purple-100' :
                        'bg-blue-100'
                      }`}>
                          {getActivityIcon(log.type)}
                      </div>
                    </span>
                    <div className="bg-white p-4 rounded-lg border border-slate-100 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-semibold text-slate-900">{log.action}</h4>
                          <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                            {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                      </div>
                      {log.target && (
                          <div className="flex items-center gap-1.5 mt-1">
                            <FileText className="w-3 h-3 text-slate-400" />
                            <p className="text-xs text-slate-600 font-medium">{log.target}</p>
                          </div>
                      )}
                    </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
           <button 
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm"
           >
              Close
           </button>
        </div>
      </div>
    </div>
  );
};

export default UserTaskLogModal;
