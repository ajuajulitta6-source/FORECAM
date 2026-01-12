
import React, { useState } from 'react';
import { Save, Globe, Calendar, DollarSign, Bell, CheckCircle, Smartphone, Database, AlertTriangle, Layout } from 'lucide-react';
import toast from 'react-hot-toast';

type FieldRequirement = 'OPTIONAL' | 'REQUIRED' | 'HIDDEN';

interface FieldConfig {
  id: string;
  label: string;
  requirement: FieldRequirement;
}

const Settings: React.FC = () => {
  // General Preferences
  const [language, setLanguage] = useState('EN');
  const [dateFormat, setDateFormat] = useState('MMDDYY');
  const [currency, setCurrency] = useState('USD');

  // Workflow Settings
  const [notificationDays, setNotificationDays] = useState(1);
  const [settings, setSettings] = useState({
    autoAssignCreator: false,
    autoAssignApprover: false,
    disableClosedNotifications: false,
    askFeedback: true,
    includeLaborCost: false,
    requesterUpdates: true,
    mobileSimplify: false,
  });

  // Field Configuration
  const [fields, setFields] = useState<FieldConfig[]>([
    { id: 'description', label: 'Description', requirement: 'OPTIONAL' },
    { id: 'priority', label: 'Priority', requirement: 'OPTIONAL' },
    { id: 'images', label: 'Images', requirement: 'OPTIONAL' },
    { id: 'asset', label: 'Asset', requirement: 'OPTIONAL' },
    { id: 'primaryWorker', label: 'Primary Worker', requirement: 'OPTIONAL' },
    { id: 'additionalWorkers', label: 'Additional Workers', requirement: 'OPTIONAL' },
    { id: 'team', label: 'Team', requirement: 'OPTIONAL' },
    { id: 'location', label: 'Location', requirement: 'OPTIONAL' },
    { id: 'dueDate', label: 'Due Date', requirement: 'OPTIONAL' },
    { id: 'category', label: 'Category', requirement: 'OPTIONAL' },
  ]);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFieldChange = (id: string, value: FieldRequirement) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, requirement: value } : f));
  };

  const handleSave = () => {
    toast.success("System settings saved successfully");
  };

  const handleDeleteDemoData = () => {
    if (window.confirm("Are you sure? This will remove all demo data and reset the dashboard. This action cannot be undone.")) {
      toast.success("Demo data cleared");
      // In a real app, this would trigger a clear function in DataContext
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-2xl font-bold text-slate-900">System Settings</h1>
           <p className="text-sm text-slate-500">Configure application preferences, workflows, and data fields.</p>
        </div>
        <button 
          onClick={handleSave}
          className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm font-medium"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: General & Workflow */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* General Preferences */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <Globe className="w-4 h-4 text-slate-500" /> General Preferences
              </h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-6">
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    Language
                  </label>
                  <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="EN">English (EN)</option>
                    <option value="ES">Spanish (ES)</option>
                    <option value="FR">French (FR)</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" /> Date Format
                  </label>
                  <select 
                    value={dateFormat} 
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="MMDDYY">MM/DD/YY</option>
                    <option value="DDMMYY">DD/MM/YY</option>
                    <option value="YYMMDD">YY/MM/DD</option>
                  </select>
               </div>
               <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-slate-400" /> Currency
                  </label>
                  <select 
                    value={currency} 
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-primary/20 outline-none"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
               </div>
            </div>
          </div>

          {/* Workflow & Automation */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-slate-500" /> Workflow & Automation
              </h2>
            </div>
            <div className="p-6 space-y-6">
               
               <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <label className="block text-sm font-medium text-slate-900">Pre-work order notifications</label>
                    <p className="text-xs text-slate-500">Alert lead time for scheduled maintenance</p>
                  </div>
                  <div className="flex items-center gap-2">
                     <input 
                        type="number" 
                        min="0" 
                        value={notificationDays} 
                        onChange={(e) => setNotificationDays(parseInt(e.target.value))}
                        className="w-16 px-2 py-1 border border-slate-300 rounded-md text-center"
                     />
                     <span className="text-sm text-slate-600">Day(s)</span>
                  </div>
               </div>

               <div className="space-y-4">
                  <ToggleSetting 
                    label="Auto-assign Work Orders" 
                    description="Automatically assign new work orders to the person that creates them"
                    checked={settings.autoAssignCreator}
                    onChange={() => handleToggle('autoAssignCreator')}
                  />
                  <ToggleSetting 
                    label="Auto-assign requests" 
                    description="Automatically assign new work orders to the person who approve the request"
                    checked={settings.autoAssignApprover}
                    onChange={() => handleToggle('autoAssignApprover')}
                  />
                  <ToggleSetting 
                    label="Disable closed Work Order notifications" 
                    description="Disable notifications when closed Work Orders are updated"
                    checked={settings.disableClosedNotifications}
                    onChange={() => handleToggle('disableClosedNotifications')}
                  />
                  <ToggleSetting 
                    label="Ask for feedback when Work Order is closed" 
                    description="Users are asked to give feedback on the job done"
                    checked={settings.askFeedback}
                    onChange={() => handleToggle('askFeedback')}
                  />
                  <ToggleSetting 
                    label="Include labor cost in the total cost" 
                    description="Add labor costs to the total when a user logs time and has an hourly rate stored"
                    checked={settings.includeLaborCost}
                    onChange={() => handleToggle('includeLaborCost')}
                  />
                  <ToggleSetting 
                    label="Enable work order updates for Requesters" 
                    description="Users get updates for the work orders they requested"
                    checked={settings.requesterUpdates}
                    onChange={() => handleToggle('requesterUpdates')}
                  />
                  <ToggleSetting 
                    label="Simplify Work Orders in the mobile app" 
                    description="Hide time controls, costs and parts in the Work Order details while using the mobile app"
                    icon={<Smartphone className="w-4 h-4 text-slate-400" />}
                    checked={settings.mobileSimplify}
                    onChange={() => handleToggle('mobileSimplify')}
                  />
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Fields & Data */}
        <div className="space-y-6">
          
          {/* Field Configuration */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Layout className="w-4 h-4 text-slate-500" /> Work Order Fields
                </h2>
                <p className="text-xs text-slate-500 mt-1">Mark fields as Optional, Hidden or Required</p>
             </div>
             <div className="divide-y divide-slate-100">
                {fields.map(field => (
                   <div key={field.id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors">
                      <span className="text-sm font-medium text-slate-700">{field.label}</span>
                      <select 
                        value={field.requirement}
                        onChange={(e) => handleFieldChange(field.id, e.target.value as FieldRequirement)}
                        className={`text-xs font-semibold px-2 py-1 rounded border outline-none cursor-pointer
                           ${field.requirement === 'REQUIRED' ? 'bg-red-50 text-red-700 border-red-200' : 
                             field.requirement === 'HIDDEN' ? 'bg-slate-100 text-slate-500 border-slate-200' : 
                             'bg-green-50 text-green-700 border-green-200'}`}
                      >
                         <option value="OPTIONAL">OPTIONAL</option>
                         <option value="REQUIRED">REQUIRED</option>
                         <option value="HIDDEN">HIDDEN</option>
                      </select>
                   </div>
                ))}
             </div>
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-semibold text-slate-900 flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-500" /> Data Management
                </h2>
             </div>
             <div className="p-6">
                <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                   <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                         <h3 className="text-sm font-bold text-red-900">Delete Demo Data</h3>
                         <p className="text-xs text-red-700 mt-1 mb-3">
                            Permanently remove all sample assets, work orders, and inventory items. This action cannot be undone.
                         </p>
                         <button 
                            onClick={handleDeleteDemoData}
                            className="text-xs bg-white border border-red-200 text-red-600 font-bold px-3 py-2 rounded hover:bg-red-50 transition-colors shadow-sm"
                         >
                            Clear Demo Data
                         </button>
                      </div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const ToggleSetting: React.FC<{
  label: string; 
  description: string; 
  checked: boolean; 
  onChange: () => void;
  icon?: React.ReactNode;
}> = ({ label, description, checked, onChange, icon }) => (
  <div className="flex items-start gap-3">
    <div className="relative inline-flex items-center cursor-pointer mt-1" onClick={onChange}>
      <input type="checkbox" className="sr-only peer" checked={checked} readOnly />
      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary"></div>
    </div>
    <div>
       <h3 className="text-sm font-medium text-slate-900 flex items-center gap-2">
         {label}
         {icon}
       </h3>
       <p className="text-xs text-slate-500">{description}</p>
    </div>
  </div>
);

export default Settings;
