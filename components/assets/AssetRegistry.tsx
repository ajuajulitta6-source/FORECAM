
import React, { useContext, useState } from 'react';
import { DataContext } from '../../context/DataContext';
import { UserContext } from '../../context/UserContext';
import { Asset, UserRole, WorkOrderStatus } from '../../types';
import { Search, Filter, Plus, X, Save, Edit2, MapPin, Tag, Monitor, Trash2, User as UserIcon, Building, Calendar, Clock, FileText, CheckCircle, AlertTriangle, ChevronRight } from 'lucide-react';
import FileUpload from '../ui/FileUpload';
import toast from 'react-hot-toast';
import ConfirmationModal from '../shared/ConfirmationModal';

const AssetRegistry: React.FC = () => {
  const { assets, addAsset, updateAsset, deleteAsset, users, workOrders } = useContext(DataContext);
  const { user } = useContext(UserContext);
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filtering State
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [viewingAsset, setViewingAsset] = useState<Asset | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  // Form State
  const [formData, setFormData] = useState<Partial<Asset>>({
    name: '',
    category: '',
    status: 'OPERATIONAL',
    location: '',
    model: '',
    serialNumber: '',
    image: '',
    healthScore: 100,
    projectProgress: 0,
    clientId: ''
  });

  // Filter users to show only Clients in dropdown
  const clientUsers = users.filter(u => u.role === UserRole.CLIENT);

  const handleOpenModal = (asset?: Asset) => {
    if (asset) {
      setEditingAsset(asset);
      setFormData(asset);
    } else {
      setEditingAsset(null);
      setFormData({
        name: '',
        category: 'Heavy Machinery', 
        status: 'OPERATIONAL',
        location: '',
        model: '',
        serialNumber: '',
        image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1000',
        healthScore: 100,
        projectProgress: 0,
        clientId: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleFileUpload = (file: File) => {
    const fakeUrl = URL.createObjectURL(file);
    setFormData(prev => ({ ...prev, image: fakeUrl }));
    toast.success("Image uploaded (simulated)");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.model || !formData.serialNumber) {
        toast.error("Name, Model, and Serial Number are required");
        return;
    }

    if (editingAsset) {
        updateAsset({ ...editingAsset, ...formData } as Asset);
    } else {
        const newAsset: Asset = {
            id: `a-${Date.now()}`,
            ...formData as Asset
        };
        addAsset(newAsset);
    }
    setIsModalOpen(false);
  };

  const handleDeleteAsset = () => {
    if (editingAsset) {
      deleteAsset(editingAsset.id);
      setIsDeleteModalOpen(false);
      setIsModalOpen(false);
    }
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch = 
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.model.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter ? a.status === statusFilter : true;
    const matchesCategory = categoryFilter ? a.category === categoryFilter : true;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Get unique categories from assets for the filter dropdown
  const categories = Array.from(new Set(assets.map(a => a.category))).sort();

  // Helper to get asset history
  const getAssetHistory = (assetId: string) => {
    return workOrders
      .filter(wo => wo.assetId === assetId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Asset & Project Registry</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search assets..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none"
            />
          </div>
          
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full sm:w-48 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${
              showFilters || statusFilter
                ? 'bg-primary/5 border-primary text-primary'
                : 'border-slate-300 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="sm:hidden md:inline">Status</span>
            {statusFilter && (
              <span className="flex h-2 w-2 rounded-full bg-primary"></span>
            )}
          </button>
          {isAdmin && (
            <button 
              onClick={() => handleOpenModal()}
              className="flex items-center justify-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors shadow-sm font-medium whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Add Asset / Project
            </button>
          )}
        </div>
      </div>

      {showFilters && (
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-end animate-in slide-in-from-top-2">
           <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Status</label>
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-secondary/50"
              >
                <option value="">All Statuses</option>
                <option value="OPERATIONAL">OPERATIONAL</option>
                <option value="UNDER_CONSTRUCTION">UNDER CONSTRUCTION</option>
                <option value="MAINTENANCE">MAINTENANCE</option>
                <option value="DOWN">DOWN</option>
              </select>
           </div>
           
           <div>
              <button 
                onClick={() => { setStatusFilter(''); setCategoryFilter(''); setSearchQuery(''); }}
                className="px-4 py-2 text-sm text-slate-500 hover:text-slate-800 font-medium hover:bg-slate-200/50 rounded-lg transition-colors"
                disabled={!statusFilter && !categoryFilter}
              >
                Clear All Filters
              </button>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Prominent Add Asset Card for Admins */}
        {isAdmin && !searchQuery && !statusFilter && !categoryFilter && (
            <button 
                onClick={() => handleOpenModal()}
                className="flex flex-col items-center justify-center min-h-[350px] bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl hover:border-secondary hover:bg-secondary/5 transition-all group p-6 h-full"
            >
                <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-lg font-bold text-slate-700 group-hover:text-secondary">Add New Asset</h3>
                <p className="text-sm text-slate-500 mt-2 text-center max-w-[200px]">Register machinery, vehicles, or start a new construction project tracking.</p>
            </button>
        )}

        {filteredAssets.map(asset => (
          <div key={asset.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow group flex flex-col h-full">
            <div className="relative h-48 overflow-hidden bg-slate-100">
               <img src={asset.image} alt={asset.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               <div className="absolute top-3 right-3">
                 <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase backdrop-blur-md shadow-sm ${
                   asset.status === 'OPERATIONAL' ? 'bg-green-500/90 text-white' :
                   asset.status === 'DOWN' ? 'bg-red-500/90 text-white' : 
                   asset.status === 'UNDER_CONSTRUCTION' ? 'bg-blue-500/90 text-white' :
                   'bg-amber-500/90 text-white'
                 }`}>
                   {asset.status.replace('_', ' ')}
                 </span>
               </div>
               {isAdmin && (
                 <button 
                   onClick={(e) => { e.stopPropagation(); handleOpenModal(asset); }}
                   className="absolute top-3 left-3 p-2 bg-white/90 backdrop-blur-md rounded-lg text-slate-600 hover:text-primary hover:bg-white shadow-sm transition-all opacity-0 group-hover:opacity-100"
                   title="Edit Asset"
                 >
                   <Edit2 className="w-4 h-4" />
                 </button>
               )}
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div>
                   <h3 className="font-bold text-slate-900 text-lg line-clamp-1">{asset.name}</h3>
                   <p className="text-sm text-slate-500">{asset.model}</p>
                </div>
                <div className="flex flex-col items-end">
                   {asset.category === 'Construction Site' || asset.projectProgress !== undefined ? (
                       <>
                         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Progress</div>
                         <div className="text-lg font-bold text-blue-600">{asset.projectProgress || 0}%</div>
                       </>
                   ) : (
                       <>
                         <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Health</div>
                         <div className={`text-lg font-bold ${
                           asset.healthScore > 90 ? 'text-green-600' :
                           asset.healthScore > 50 ? 'text-amber-600' : 'text-red-600'
                         }`}>
                           {asset.healthScore}%
                         </div>
                       </>
                   )}
                </div>
              </div>
              
              <div className="space-y-3 mt-4 flex-1">
                 <div className="flex items-center gap-3 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{asset.location}</span>
                 </div>
                 <div className="flex items-center gap-3 text-sm text-slate-600">
                    <Tag className="w-4 h-4 text-slate-400" />
                    <span>{asset.category}</span>
                 </div>
                 {asset.clientId && (
                     <div className="flex items-center gap-3 text-sm text-blue-600 font-medium">
                        <UserIcon className="w-4 h-4" />
                        <span>Client: {users.find(u => u.id === asset.clientId)?.name || 'Unknown'}</span>
                     </div>
                 )}
              </div>

              <div className="mt-6 flex gap-2">
                <button 
                  onClick={() => setViewingAsset(asset)}
                  className="flex-1 bg-slate-50 border border-slate-200 text-slate-700 py-2 rounded-lg text-sm font-medium hover:bg-slate-100 transition-colors"
                >
                  Details
                </button>
                <button className="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors">
                  Schedule PM
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {filteredAssets.length === 0 && !(!searchQuery && !statusFilter && !categoryFilter && isAdmin) && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-slate-400">
                <Monitor className="w-12 h-12 mb-3 opacity-50" />
                <p>No assets found matching your criteria.</p>
                {(statusFilter || categoryFilter || searchQuery) && (
                    <button 
                        onClick={() => { setStatusFilter(''); setCategoryFilter(''); setSearchQuery(''); }}
                        className="mt-2 text-primary hover:text-secondary text-sm font-medium"
                    >
                        Clear all filters
                    </button>
                )}
            </div>
        )}
      </div>

      {/* --- Asset Details Modal --- */}
      {viewingAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row">
              {/* Left Column: Asset Info */}
              <div className="w-full md:w-2/5 bg-slate-50 border-r border-slate-200 flex flex-col">
                 <div className="relative h-64 bg-slate-200">
                    <img src={viewingAsset.image} alt={viewingAsset.name} className="w-full h-full object-cover" />
                    <button 
                       onClick={() => setViewingAsset(null)}
                       className="absolute top-4 left-4 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full transition-colors backdrop-blur-sm md:hidden"
                    >
                       <X className="w-5 h-5" />
                    </button>
                    <div className="absolute bottom-4 left-4 right-4">
                       <span className={`px-2 py-1 rounded-md text-xs font-bold uppercase backdrop-blur-md shadow-sm border border-white/20 ${
                         viewingAsset.status === 'OPERATIONAL' ? 'bg-green-500/90 text-white' :
                         viewingAsset.status === 'DOWN' ? 'bg-red-500/90 text-white' : 
                         viewingAsset.status === 'UNDER_CONSTRUCTION' ? 'bg-blue-500/90 text-white' :
                         'bg-amber-500/90 text-white'
                       }`}>
                         {viewingAsset.status.replace('_', ' ')}
                       </span>
                    </div>
                 </div>
                 
                 <div className="p-6 flex-1 overflow-y-auto">
                    <h2 className="text-xl font-bold text-slate-900 mb-1">{viewingAsset.name}</h2>
                    <p className="text-sm text-slate-500 mb-6">{viewingAsset.category} • {viewingAsset.model}</p>
                    
                    <div className="space-y-4">
                       <div>
                          <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Location</p>
                          <div className="flex items-center gap-2 text-slate-700 font-medium">
                             <MapPin className="w-4 h-4 text-slate-400" /> {viewingAsset.location}
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <div>
                             <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Serial Number</p>
                             <p className="text-sm text-slate-700 font-mono bg-white border border-slate-200 px-2 py-1 rounded inline-block">
                                {viewingAsset.serialNumber}
                             </p>
                          </div>
                          <div>
                             <p className="text-xs font-semibold text-slate-400 uppercase mb-1">
                                {viewingAsset.category === 'Construction Site' ? 'Progress' : 'Health Score'}
                             </p>
                             <p className={`text-lg font-bold ${
                                (viewingAsset.healthScore || 0) > 80 ? 'text-green-600' : 'text-amber-600'
                             }`}>
                                {viewingAsset.category === 'Construction Site' ? viewingAsset.projectProgress : viewingAsset.healthScore}%
                             </p>
                          </div>
                       </div>

                       {viewingAsset.clientId && (
                          <div className="pt-4 border-t border-slate-200">
                             <p className="text-xs font-semibold text-slate-400 uppercase mb-2">Assigned Client</p>
                             <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
                                <div className="p-2 bg-blue-50 rounded-full">
                                   <UserIcon className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="overflow-hidden">
                                   <p className="text-sm font-medium text-slate-900 truncate">
                                      {users.find(u => u.id === viewingAsset.clientId)?.name || 'Unknown Client'}
                                   </p>
                                   <p className="text-xs text-slate-500 truncate">
                                      {users.find(u => u.id === viewingAsset.clientId)?.email}
                                   </p>
                                </div>
                             </div>
                          </div>
                       )}
                    </div>
                 </div>
              </div>

              {/* Right Column: Maintenance History */}
              <div className="w-full md:w-3/5 flex flex-col bg-white">
                 <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                       <FileText className="w-5 h-5 text-secondary" /> Maintenance History
                    </h3>
                    <button onClick={() => setViewingAsset(null)} className="text-slate-400 hover:text-slate-600 hidden md:block">
                       <X className="w-6 h-6" />
                    </button>
                 </div>
                 
                 <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
                    {getAssetHistory(viewingAsset.id).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12">
                           <Clock className="w-12 h-12 mb-3 opacity-20" />
                           <p>No work order history found for this asset.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                           {getAssetHistory(viewingAsset.id).map(wo => (
                              <div key={wo.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-blue-200 transition-colors group">
                                 <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                          wo.status === WorkOrderStatus.COMPLETED ? 'bg-green-100 text-green-700' :
                                          wo.status === WorkOrderStatus.IN_PROGRESS ? 'bg-blue-100 text-blue-700' :
                                          'bg-slate-100 text-slate-600'
                                       }`}>
                                          {wo.status.replace('_', ' ')}
                                       </span>
                                       <span className="text-xs text-slate-400 flex items-center gap-1">
                                          <Calendar className="w-3 h-3" /> {wo.dueDate}
                                       </span>
                                    </div>
                                    {wo.priority === 'HIGH' || wo.priority === 'CRITICAL' ? (
                                       <AlertTriangle className="w-4 h-4 text-red-500" />
                                    ) : wo.status === WorkOrderStatus.COMPLETED ? (
                                       <CheckCircle className="w-4 h-4 text-green-500" />
                                    ) : null}
                                 </div>
                                 
                                 <h4 className="font-bold text-slate-800 text-sm mb-1">{wo.title}</h4>
                                 <p className="text-xs text-slate-600 line-clamp-2 mb-3">{wo.description}</p>
                                 
                                 <div className="flex justify-between items-center pt-3 border-t border-slate-50">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                       <UserIcon className="w-3 h-3" />
                                       {users.find(u => u.id === wo.assignedToId)?.name || 'Unassigned'}
                                    </div>
                                    <span className="text-xs font-mono text-slate-300">#{wo.id.slice(-4)}</span>
                                 </div>
                              </div>
                           ))}
                        </div>
                    )}
                 </div>
                 
                 <div className="p-4 border-t border-slate-100 bg-white">
                    <button 
                       className="w-full py-2 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors text-sm flex items-center justify-center gap-2"
                       onClick={() => toast("View Full Report functionality would go here")}
                    >
                       View Full Asset Report <ChevronRight className="w-4 h-4" />
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Add/Edit Asset Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h3 className="font-semibold text-slate-900">{editingAsset ? 'Edit Asset' : 'Register New Asset'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Left Column - Image */}
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Asset Image</label>
                    <div className="mb-4">
                        {formData.image ? (
                            <div className="relative h-48 rounded-lg overflow-hidden border border-slate-200 group">
                                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button type="button" onClick={() => setFormData({...formData, image: ''})} className="text-white bg-red-500/80 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm hover:bg-red-600">Remove</button>
                                </div>
                            </div>
                        ) : (
                            <FileUpload onFileSelect={handleFileUpload} label="" />
                        )}
                    </div>
                    
                    {formData.category === 'Construction Site' ? (
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Construction Progress (%)</label>
                          <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={formData.projectProgress || 0} 
                              onChange={e => setFormData({...formData, projectProgress: parseInt(e.target.value)})} 
                              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                          />
                          <div className="flex justify-between text-xs text-slate-500 mt-1">
                              <span>Started (0)</span>
                              <span className="font-bold text-slate-900">{formData.projectProgress || 0}%</span>
                              <span>Completed (100)</span>
                          </div>
                       </div>
                    ) : (
                       <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Health Score (0-100)</label>
                          <input 
                              type="range" 
                              min="0" 
                              max="100" 
                              value={formData.healthScore} 
                              onChange={e => setFormData({...formData, healthScore: parseInt(e.target.value)})} 
                              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-secondary"
                          />
                          <div className="flex justify-between text-xs text-slate-500 mt-1">
                              <span>Critical (0)</span>
                              <span className="font-bold text-slate-900">{formData.healthScore}%</span>
                              <span>Excellent (100)</span>
                          </div>
                       </div>
                    )}
                 </div>

                 {/* Right Column - Details */}
                 <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Name / Title</label>
                        <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="e.g. Caterpillar Excavator or Luxury Villa" />
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white">
                            <option value="Heavy Machinery">Heavy Machinery</option>
                            <option value="Facilities">Facilities</option>
                            <option value="Shop Tools">Shop Tools</option>
                            <option value="Power">Power Generation</option>
                            <option value="Vehicles">Fleet Vehicles</option>
                            <option value="Construction Site">Construction Site (Client Project)</option>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Model / Type</label>
                            <input required type="text" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Serial / Project ID</label>
                            <input required type="text" value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                        </div>
                    </div>
                    
                    {/* Client Assignment for Projects */}
                    {formData.category === 'Construction Site' && (
                       <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                          <label className="block text-sm font-medium text-blue-900 mb-1 flex items-center gap-2">
                             <Building className="w-4 h-4" /> Assign to Client
                          </label>
                          <select 
                            value={formData.clientId || ''} 
                            onChange={e => setFormData({...formData, clientId: e.target.value})} 
                            className="w-full px-4 py-2 border border-blue-200 rounded-lg bg-white text-sm"
                          >
                             <option value="">-- Select Client --</option>
                             {clientUsers.map(client => (
                                <option key={client.id} value={client.id}>{client.name} ({client.email})</option>
                             ))}
                          </select>
                          <p className="text-[10px] text-blue-600 mt-1">
                             The selected client will see this project on their dashboard.
                          </p>
                       </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Location / Address</label>
                        <input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="e.g. Site A - North" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                        <div className="grid grid-cols-2 gap-2">
                             {(['OPERATIONAL', 'UNDER_CONSTRUCTION', 'MAINTENANCE', 'DOWN'] as const).map(status => (
                                 <button
                                    key={status}
                                    type="button"
                                    onClick={() => setFormData({...formData, status})}
                                    className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-colors ${
                                        formData.status === status 
                                        ? status === 'OPERATIONAL' ? 'bg-green-50 border-green-500 text-green-700' : 
                                          status === 'DOWN' ? 'bg-red-50 border-red-500 text-red-700' : 
                                          status === 'UNDER_CONSTRUCTION' ? 'bg-blue-50 border-blue-500 text-blue-700' :
                                          'bg-amber-50 border-amber-500 text-amber-700'
                                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                                    }`}
                                 >
                                    {status.replace('_', ' ')}
                                 </button>
                             ))}
                        </div>
                    </div>
                 </div>
              </div>

              <div className="pt-4 flex items-center justify-between gap-3 border-t border-slate-100">
                {editingAsset && (
                  <button 
                    type="button" 
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                )}
                <div className="flex gap-3 flex-1 justify-end">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
                    <button type="submit" className="px-6 py-2 bg-primary text-white rounded-lg font-medium hover:bg-slate-800 flex items-center justify-center gap-2">
                        <Save className="w-4 h-4" /> {editingAsset ? 'Update' : 'Register'}
                    </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteAsset}
        title="Delete Asset"
        message="Are you sure you want to delete this asset? This action will remove it from the registry permanently."
        confirmText="Delete Asset"
        isDangerous={true}
      />
    </div>
  );
};

export default AssetRegistry;
