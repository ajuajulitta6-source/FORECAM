
import React, { useContext, useMemo, useState } from 'react';
import { DataContext } from '../../context/DataContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { 
  Download, Calendar, Filter, DollarSign, TrendingUp, 
  Activity, CheckCircle, AlertTriangle, FileText 
} from 'lucide-react';
import toast from 'react-hot-toast';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const Reports: React.FC = () => {
  const { workOrders, inventory, assets } = useContext(DataContext);
  const [activeTab, setActiveTab] = useState<'PERFORMANCE' | 'FINANCIAL' | 'ASSETS'>('PERFORMANCE');
  const [dateRange, setDateRange] = useState('LAST_30_DAYS');

  // --- Calculations ---

  // 1. Financials: Calculate total cost from parts used in work orders
  const totalPartsCost = useMemo(() => {
    return workOrders.reduce((total, wo) => {
      const partsCost = wo.partsUsed?.reduce((sum, part) => sum + (part.costAtTime * part.quantity), 0) || 0;
      return total + partsCost;
    }, 0);
  }, [workOrders]);

  // 2. Performance: Completion Rate
  const completionStats = useMemo(() => {
    const completed = workOrders.filter(wo => wo.status === 'COMPLETED').length;
    const total = workOrders.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, rate };
  }, [workOrders]);

  // 3. Asset Health Distribution
  const healthData = useMemo(() => {
    const good = assets.filter(a => a.healthScore >= 80).length;
    const fair = assets.filter(a => a.healthScore >= 50 && a.healthScore < 80).length;
    const critical = assets.filter(a => a.healthScore < 50).length;
    return [
      { name: 'Good (>80%)', value: good },
      { name: 'Fair (50-79%)', value: fair },
      { name: 'Critical (<50%)', value: critical },
    ];
  }, [assets]);

  // 4. Monthly Trends (Mocked based on WO dates for demo)
  const monthlyTrends = useMemo(() => {
    // In a real app, group workOrders by createdAt date
    return [
      { name: 'Jan', completed: 12, created: 15 },
      { name: 'Feb', completed: 19, created: 22 },
      { name: 'Mar', completed: 15, created: 18 },
      { name: 'Apr', completed: 25, created: 24 },
      { name: 'May', completed: 32, created: 30 },
      { name: 'Jun', completed: 28, created: 35 },
    ];
  }, []);

  // 5. Cost by Asset Category
  const costByCategory = useMemo(() => {
    const data: Record<string, number> = {};
    
    workOrders.forEach(wo => {
      const asset = assets.find(a => a.id === wo.assetId);
      if (asset) {
        const cost = wo.partsUsed?.reduce((sum, p) => sum + (p.costAtTime * p.quantity), 0) || 0;
        data[asset.category] = (data[asset.category] || 0) + cost;
      }
    });

    return Object.keys(data).map(cat => ({ name: cat, cost: data[cat] }));
  }, [workOrders, assets]);

  const handleExport = (format: 'CSV' | 'PDF') => {
    toast.success(`Generating ${format} report...`);
    setTimeout(() => {
      toast.success("Download started");
    }, 1000);
  };

  const KPICard = ({ title, value, subtitle, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded-full ${color.replace('bg-', 'text-').replace('500', '700')} bg-opacity-10`}>
          {dateRange === 'LAST_30_DAYS' ? 'Last 30 Days' : 'This Year'}
        </span>
      </div>
      <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
      <p className="text-sm font-medium text-slate-500 mt-1">{title}</p>
      {subtitle && <p className="text-xs text-green-600 mt-2 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {subtitle}</p>}
    </div>
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics & Reports</h1>
          <p className="text-sm text-slate-500">Insights into maintenance performance, costs, and asset health.</p>
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
             <select 
               value={dateRange} 
               onChange={(e) => setDateRange(e.target.value)}
               className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 outline-none bg-white"
             >
               <option value="LAST_30_DAYS">Last 30 Days</option>
               <option value="LAST_QUARTER">Last Quarter</option>
               <option value="THIS_YEAR">This Year</option>
             </select>
          </div>
          <button 
            onClick={() => handleExport('CSV')}
            className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 font-medium text-sm transition-colors"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard 
          title="Total Maintenance Cost" 
          value={`$${totalPartsCost.toLocaleString()}`} 
          subtitle="+12% vs last period"
          icon={DollarSign}
          color="bg-green-500"
        />
        <KPICard 
          title="Work Order Completion" 
          value={`${completionStats.rate}%`} 
          subtitle={`${completionStats.completed} of ${completionStats.total} orders`}
          icon={CheckCircle}
          color="bg-blue-500"
        />
        <KPICard 
          title="Critical Assets" 
          value={healthData.find(d => d.name.includes('Critical'))?.value || 0} 
          subtitle="Requires immediate attention"
          icon={AlertTriangle}
          color="bg-red-500"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          <button 
            onClick={() => setActiveTab('PERFORMANCE')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'PERFORMANCE' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Performance Trends
          </button>
          <button 
            onClick={() => setActiveTab('FINANCIAL')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'FINANCIAL' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Financial Analysis
          </button>
          <button 
            onClick={() => setActiveTab('ASSETS')}
            className={`pb-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'ASSETS' ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Asset & Inventory
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {activeTab === 'PERFORMANCE' && (
          <>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Work Order Trends</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrends}>
                    <defs>
                      <linearGradient id="colorCreated" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="created" stroke="#8884d8" fillOpacity={1} fill="url(#colorCreated)" name="Created" />
                    <Area type="monotone" dataKey="completed" stroke="#82ca9d" fillOpacity={1} fill="url(#colorCompleted)" name="Completed" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Task Efficiency (Mock)</h3>
              <div className="h-80 flex flex-col justify-center items-center text-center space-y-4">
                 <div className="w-full max-w-xs space-y-6">
                    <div>
                       <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">Avg Response Time</span>
                          <span className="font-bold text-slate-900">4.2 Hours</span>
                       </div>
                       <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                       </div>
                    </div>
                    <div>
                       <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">On-Time Completion</span>
                          <span className="font-bold text-slate-900">88%</span>
                       </div>
                       <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '88%' }}></div>
                       </div>
                    </div>
                    <div>
                       <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-600">PM Compliance</span>
                          <span className="font-bold text-slate-900">92%</span>
                       </div>
                       <div className="w-full bg-slate-100 rounded-full h-2.5">
                          <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: '92%' }}></div>
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'FINANCIAL' && (
          <>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm lg:col-span-2">
              <h3 className="font-bold text-slate-900 mb-4">Parts Cost by Asset Category</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={costByCategory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Bar dataKey="cost" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={60} name="Cost ($)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}

        {activeTab === 'ASSETS' && (
          <>
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Asset Health Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={healthData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {healthData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#22c55e' : index === 1 ? '#eab308' : '#ef4444'} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-6 mt-4">
                   {healthData.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                         <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-green-500' : index === 1 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                         <span className="text-slate-600">{entry.name}: <strong>{entry.value}</strong></span>
                      </div>
                   ))}
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 mb-4">Low Stock Alerts</h3>
              <div className="overflow-y-auto h-80 border border-slate-100 rounded-lg">
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-slate-700 font-semibold sticky top-0">
                       <tr>
                          <th className="px-4 py-2">Item</th>
                          <th className="px-4 py-2">Stock</th>
                          <th className="px-4 py-2">Status</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                       {inventory.filter(i => i.quantity <= i.minQuantity).length === 0 && (
                          <tr>
                             <td colSpan={3} className="px-4 py-8 text-center text-slate-400">All stock levels normal.</td>
                          </tr>
                       )}
                       {inventory.filter(i => i.quantity <= i.minQuantity).map(item => (
                          <tr key={item.id} className="hover:bg-slate-50">
                             <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                             <td className="px-4 py-3">
                                <span className="font-mono">{item.quantity}</span> 
                                <span className="text-xs text-slate-400 ml-1">/ {item.minQuantity}</span>
                             </td>
                             <td className="px-4 py-3">
                                {item.quantity === 0 ? (
                                   <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">Out of Stock</span>
                                ) : (
                                   <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded">Low</span>
                                )}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;
