import React from 'react';
import { MOCK_ASSETS } from '../constants';
import { Search, Filter, AlertTriangle, CheckCircle, PenTool } from 'lucide-react';

const AssetRegistry: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Asset Registry</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search assets..." 
              className="w-full sm:w-64 pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none"
            />
          </div>
          <button className="flex items-center gap-2 px-3 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 text-sm font-medium text-slate-700">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_ASSETS.map(asset => (
          <div key={asset.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group">
            <div className="relative h-48 overflow-hidden">
               <img src={asset.image} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               <div className="absolute top-3 right-3">
                 <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase backdrop-blur-md ${
                   asset.status === 'OPERATIONAL' ? 'bg-green-500/90 text-white' :
                   asset.status === 'DOWN' ? 'bg-red-500/90 text-white' : 'bg-amber-500/90 text-white'
                 }`}>
                   {asset.status}
                 </span>
               </div>
            </div>
            
            <div className="p-5">
              <div className="flex justify-between items-start mb-2">
                <div>
                   <h3 className="font-bold text-slate-900 text-lg">{asset.name}</h3>
                   <p className="text-sm text-slate-500">{asset.model}</p>
                </div>
                <div className="flex flex-col items-end">
                   <div className="text-xs font-semibold text-slate-400">HEALTH</div>
                   <div className={`text-lg font-bold ${
                     asset.healthScore > 90 ? 'text-green-600' :
                     asset.healthScore > 50 ? 'text-amber-600' : 'text-red-600'
                   }`}>
                     {asset.healthScore}%
                   </div>
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Location</span>
                    <span className="font-medium text-slate-700">{asset.location}</span>
                 </div>
                 <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Serial</span>
                    <span className="font-medium text-slate-700 font-mono">{asset.serialNumber}</span>
                 </div>
              </div>

              <div className="mt-6 flex gap-2">
                <button className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors">
                  Details
                </button>
                <button className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                  Schedule PM
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssetRegistry;