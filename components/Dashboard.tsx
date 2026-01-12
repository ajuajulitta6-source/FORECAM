import React, { useMemo } from 'react';
import { MOCK_WORK_ORDERS, MOCK_ASSETS, MOCK_INVENTORY } from '../constants';
import { WorkOrderStatus, WorkOrderPriority } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { AlertTriangle, CheckCircle, Clock, Wrench } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const Dashboard: React.FC = () => {
  // Compute KPIs
  const kpis = useMemo(() => {
    const totalWO = MOCK_WORK_ORDERS.length;
    const pendingWO = MOCK_WORK_ORDERS.filter(w => w.status === WorkOrderStatus.PENDING).length;
    const criticalWO = MOCK_WORK_ORDERS.filter(w => w.priority === WorkOrderPriority.CRITICAL || w.priority === WorkOrderPriority.HIGH).length;
    const downAssets = MOCK_ASSETS.filter(a => a.status === 'DOWN').length;
    const lowStock = MOCK_INVENTORY.filter(i => i.quantity <= i.minQuantity).length;

    return { totalWO, pendingWO, criticalWO, downAssets, lowStock };
  }, []);

  const statusData = useMemo(() => {
    const counts = MOCK_WORK_ORDERS.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, []);

  // Mock data for downtime trend
  const downtimeData = [
    { name: 'Mon', hours: 4 },
    { name: 'Tue', hours: 2 },
    { name: 'Wed', hours: 8 }, // Spike
    { name: 'Thu', hours: 1 },
    { name: 'Fri', hours: 3 },
  ];

  const StatCard = ({ title, value, icon: Icon, color, trend }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
          {trend && <p className="text-xs text-green-600 mt-1 font-medium">{trend}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard Overview</h1>
        <span className="text-sm text-slate-500">Last updated: Just now</span>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Open Work Orders" 
          value={kpis.pendingWO + MOCK_WORK_ORDERS.filter(w=>w.status === WorkOrderStatus.IN_PROGRESS).length} 
          icon={Clipboard} 
          color="bg-blue-500 text-blue-600"
          trend="+12% from last week"
        />
        <StatCard 
          title="Assets Down" 
          value={kpis.downAssets} 
          icon={AlertTriangle} 
          color="bg-red-500 text-red-600"
        />
        <StatCard 
          title="Low Stock Items" 
          value={kpis.lowStock} 
          icon={Package} 
          color="bg-amber-500 text-amber-600" 
        />
        <StatCard 
          title="Completed Today" 
          value="4" 
          icon={CheckCircle} 
          color="bg-green-500 text-green-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Charts - Work Orders by Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Work Order Status</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tick={{fontSize: 12}} />
                <YAxis />
                <Tooltip cursor={{fill: '#f1f5f9'}} />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts - Downtime Trend */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Weekly Downtime (Hours)</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={downtimeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="hours" stroke="#f59e0b" strokeWidth={3} dot={{r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
       {/* Recent Activity Skeleton (Simulated) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
        </div>
        <div className="divide-y divide-slate-100">
          {[1, 2, 3].map((i) => (
             <div key={i} className="px-6 py-4 flex items-start space-x-3 hover:bg-slate-50 transition-colors">
               <div className="mt-1 bg-slate-100 p-2 rounded-full">
                 <Wrench className="w-4 h-4 text-slate-500" />
               </div>
               <div>
                 <p className="text-sm font-medium text-slate-900">Technician updated WO-10{i}</p>
                 <p className="text-xs text-slate-500">Changed status to In Progress • 2 hours ago</p>
               </div>
             </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Icons helper
function Clipboard(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
}
function Package(props: any) {
    return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22v-10"/></svg>
}

export default Dashboard;