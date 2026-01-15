
import React, { useContext, useState } from 'react';
import { DataContext } from '../../context/DataContext';
import { UserContext } from '../../context/UserContext';
import { UserRole, Vendor, WorkRequest, RequestStatus, WorkOrderPriority, WorkOrderType, WorkOrderStatus, MaterialRequest, ServiceBroadcast } from '../../types';
import { Plus, Search, MapPin, Phone, Mail, CheckCircle, XCircle, Briefcase, User as UserIcon, Star, Filter, X, HardHat, Megaphone, Truck, Send, AlertTriangle, Siren } from 'lucide-react';
import toast from 'react-hot-toast';
import FileUpload from '../ui/FileUpload';
import ConfirmationModal from '../shared/ConfirmationModal';
import { uploadFile } from '../../lib/storage';

const RequestsVendors: React.FC = () => {
    const { user } = useContext(UserContext);
    const { vendors, requests, materialRequests, serviceBroadcasts, addVendor, updateVendor, deleteVendor, addRequest, updateRequest, addWorkOrder, addMaterialRequest, addServiceBroadcast } = useContext(DataContext);

    const [activeTab, setActiveTab] = useState<'REQUESTS' | 'VENDORS' | 'CONTRACTORS' | 'SOURCING' | 'SERVICE_CALLS'>('REQUESTS');
    const [searchQuery, setSearchQuery] = useState('');

    // Forms & Modal State
    const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [isSourcingModalOpen, setIsSourcingModalOpen] = useState(false);
    const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

    const [vendorForm, setVendorForm] = useState<Partial<Vendor>>({
        name: '', type: 'SUPPLIER', contactName: '', email: '', phone: '', category: '', status: 'ACTIVE', rating: 5
    });

    const [requestForm, setRequestForm] = useState<Partial<WorkRequest>>({
        title: '', description: '', priority: WorkOrderPriority.LOW, location: '', image: ''
    });

    const [sourcingForm, setSourcingForm] = useState<{
        itemName: string;
        quantity: number;
        qualitySpecs: string;
        location: string;
        selectedVendorIds: Set<string>;
    }>({
        itemName: '',
        quantity: 1,
        qualitySpecs: '',
        location: '',
        selectedVendorIds: new Set()
    });

    const [serviceForm, setServiceForm] = useState<{
        title: string;
        description: string;
        location: string;
        priority: WorkOrderPriority;
        selectedVendorIds: Set<string>;
        image?: string;
    }>({
        title: '',
        description: '',
        location: '',
        priority: WorkOrderPriority.HIGH,
        selectedVendorIds: new Set(),
        image: ''
    });

    const [deleteVendorId, setDeleteVendorId] = useState<string | null>(null);

    const canManageVendors = user?.role === UserRole.ADMIN || user?.role === UserRole.TECHNICIAN;

    const handleTabChange = (tab: typeof activeTab) => {
        setActiveTab(tab);
        setSearchQuery(''); // Clear search when switching tabs
    };

    // --- Handlers for Vendors/Contractors ---

    const handleVendorSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!vendorForm.name || !vendorForm.email) return;

        if (vendorForm.id) {
            updateVendor(vendorForm as Vendor);
            toast.success(`${vendorForm.type === 'CONTRACTOR' ? 'Contractor' : 'Vendor'} updated`);
        } else {
            addVendor({ ...vendorForm, id: `v-${Date.now()}` } as Vendor);
            if (vendorForm.status === 'INVITED') {
                toast.success(`Invitation sent to ${vendorForm.email}`);
            } else {
                toast.success(`${vendorForm.type === 'CONTRACTOR' ? 'Contractor' : 'Vendor'} added`);
            }
        }
        setIsVendorModalOpen(false);
    };

    const openVendorModal = (v?: Vendor) => {
        if (v) {
            setVendorForm(v);
        } else {
            const defaultType = activeTab === 'CONTRACTORS' ? 'CONTRACTOR' : 'SUPPLIER';
            setVendorForm({
                name: '',
                type: defaultType,
                contactName: '',
                email: '',
                phone: '',
                category: '',
                status: 'ACTIVE',
                rating: 5
            });
        }
        setIsVendorModalOpen(true);
    };

    const confirmDeleteVendor = (id: string) => {
        setDeleteVendorId(id);
    };

    const handleDeleteVendor = () => {
        if (deleteVendorId) {
            deleteVendor(deleteVendorId);
            toast.success("Removed successfully");
            setDeleteVendorId(null);
        }
    }

    // --- Handlers for Material Sourcing ---

    const handleSourcingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sourcingForm.itemName || sourcingForm.selectedVendorIds.size === 0) {
            toast.error("Please select an item and at least one vendor.");
            return;
        }

        const newMaterialReq: MaterialRequest = {
            id: `mat-${Date.now()}`,
            itemName: sourcingForm.itemName,
            quantity: sourcingForm.quantity,
            qualitySpecs: sourcingForm.qualitySpecs,
            location: sourcingForm.location,
            status: 'OPEN',
            notifiedVendorIds: Array.from(sourcingForm.selectedVendorIds),
            createdAt: new Date().toISOString(),
            createdBy: user?.id || 'sys'
        };

        addMaterialRequest(newMaterialReq);
        toast.success(`Notifications sent to ${sourcingForm.selectedVendorIds.size} vendors`);
        setIsSourcingModalOpen(false);
        setSourcingForm({
            itemName: '',
            quantity: 1,
            qualitySpecs: '',
            location: '',
            selectedVendorIds: new Set()
        });
    };

    const toggleVendorSelection = (id: string, formType: 'SOURCING' | 'SERVICE') => {
        if (formType === 'SOURCING') {
            const newSet = new Set(sourcingForm.selectedVendorIds);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            setSourcingForm({ ...sourcingForm, selectedVendorIds: newSet });
        } else {
            const newSet = new Set(serviceForm.selectedVendorIds);
            if (newSet.has(id)) newSet.delete(id);
            else newSet.add(id);
            setServiceForm({ ...serviceForm, selectedVendorIds: newSet });
        }
    };

    // --- Handlers for Service Broadcast ---

    const handleServiceSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!serviceForm.title || serviceForm.selectedVendorIds.size === 0) {
            toast.error("Please describe the problem and select at least one contractor.");
            return;
        }

        const newServiceReq: ServiceBroadcast = {
            id: `srv-${Date.now()}`,
            title: serviceForm.title,
            description: serviceForm.description,
            location: serviceForm.location,
            priority: serviceForm.priority,
            status: 'OPEN',
            notifiedVendorIds: Array.from(serviceForm.selectedVendorIds),
            createdAt: new Date().toISOString(),
            createdBy: user?.id || 'sys',
            image: serviceForm.image
        };

        addServiceBroadcast(newServiceReq);
        toast.success(`Service Help notification sent to ${serviceForm.selectedVendorIds.size} contractors`);
        setIsServiceModalOpen(false);
        setServiceForm({
            title: '',
            description: '',
            location: '',
            priority: WorkOrderPriority.HIGH,
            selectedVendorIds: new Set(),
            image: ''
        });
    };

    // --- Handlers for Requests ---

    const handleRequestSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!requestForm.title) return;

        addRequest({
            ...requestForm,
            id: `req-${Date.now()}`,
            status: RequestStatus.PENDING,
            requestedBy: user?.id || 'guest',
            createdAt: new Date().toISOString().split('T')[0]
        } as WorkRequest);

        toast.success("Request submitted successfully");
        setIsRequestModalOpen(false);
    };

    const handleApproveRequest = (req: WorkRequest) => {
        // 1. Update Request Status
        updateRequest({ ...req, status: RequestStatus.APPROVED });

        // 2. Create Work Order
        addWorkOrder({
            id: `wo-${Date.now()}`,
            title: req.title,
            description: req.description,
            assetId: req.assetId || 'a1', // Default or need asset picker in request
            requestedById: req.requestedBy,
            status: WorkOrderStatus.PENDING,
            priority: req.priority,
            type: WorkOrderType.REACTIVE,
            dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0], // +3 days default
            createdAt: new Date().toISOString().split('T')[0],
            location: req.location,
            image: req.image
        });

        toast.success("Request approved & Work Order created");
    };

    const handleRejectRequest = (req: WorkRequest) => {
        if (window.confirm("Reject this request?")) {
            updateRequest({ ...req, status: RequestStatus.REJECTED });
            toast("Request rejected");
        }
    };

    // --- Render Helpers ---

    const getPlaceholderText = () => {
        switch (activeTab) {
            case 'REQUESTS': return "Search requests by title or location...";
            case 'SOURCING': return "Search broadcast history...";
            case 'SERVICE_CALLS': return "Search service calls...";
            case 'VENDORS': return "Search vendors by name, category, or contact...";
            case 'CONTRACTORS': return "Search contractors by name, category, or contact...";
            default: return "Search...";
        }
    };

    const filteredRequests = requests.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredVendors = vendors.filter(v => {
        const typeMatch = activeTab === 'CONTRACTORS' ? v.type === 'CONTRACTOR' : v.type === 'SUPPLIER';
        const q = searchQuery.toLowerCase();
        const searchMatch = v.name.toLowerCase().includes(q) ||
            v.category.toLowerCase().includes(q) ||
            v.contactName.toLowerCase().includes(q) ||
            v.email.toLowerCase().includes(q);
        return typeMatch && searchMatch;
    });

    const suppliersOnly = vendors.filter(v => v.type === 'SUPPLIER' && v.status !== 'INACTIVE');
    const contractorsOnly = vendors.filter(v => v.type === 'CONTRACTOR');

    return (
        <div className="space-y-6">
            {/* Header & Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-900">Requests & Sourcing</h1>
                <div className="flex bg-slate-100 p-1 rounded-lg overflow-x-auto max-w-full">
                    <button
                        onClick={() => handleTabChange('REQUESTS')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'REQUESTS' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Work Requests
                    </button>
                    <button
                        onClick={() => handleTabChange('SERVICE_CALLS')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'SERVICE_CALLS' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Service Calls
                    </button>
                    <button
                        onClick={() => handleTabChange('SOURCING')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'SOURCING' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Material Sourcing
                    </button>
                    <button
                        onClick={() => handleTabChange('VENDORS')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'VENDORS' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Vendors
                    </button>
                    <button
                        onClick={() => handleTabChange('CONTRACTORS')}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${activeTab === 'CONTRACTORS' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        Contractors
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder={getPlaceholderText()}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none transition-all"
                    />
                </div>
                <button
                    onClick={() => {
                        if (activeTab === 'REQUESTS') setIsRequestModalOpen(true);
                        else if (activeTab === 'SOURCING') setIsSourcingModalOpen(true);
                        else if (activeTab === 'SERVICE_CALLS') setIsServiceModalOpen(true);
                        else openVendorModal();
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors shadow-sm font-medium whitespace-nowrap"
                >
                    {activeTab === 'SOURCING' ? <Megaphone className="w-4 h-4" /> : activeTab === 'SERVICE_CALLS' ? <Siren className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {activeTab === 'REQUESTS' ? 'New Request' : activeTab === 'SOURCING' ? 'Broadcast Material Need' : activeTab === 'SERVICE_CALLS' ? 'Broadcast Service Need' : activeTab === 'VENDORS' ? 'Add/Invite Vendor' : 'Add/Invite Contractor'}
                </button>
            </div>

            {/* Content Area */}
            {activeTab === 'REQUESTS' && (
                <div className="grid grid-cols-1 gap-4">
                    {filteredRequests.map(req => (
                        <div key={req.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row gap-4">
                            {req.image && (
                                <img src={req.image} alt="Request" className="w-full sm:w-32 h-32 object-cover rounded-lg bg-slate-100" />
                            )}
                            <div className="flex-1">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                            req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                'bg-blue-100 text-blue-700'
                                            }`}>
                                            {req.status}
                                        </span>
                                        <span className="text-xs text-slate-400">{req.createdAt}</span>
                                    </div>
                                    <div className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${req.priority === 'HIGH' || req.priority === 'CRITICAL' ? 'bg-red-50 text-red-600 border-red-100' :
                                        'bg-slate-50 text-slate-600 border-slate-100'
                                        }`}>
                                        {req.priority} Priority
                                    </div>
                                </div>
                                <h3 className="font-bold text-slate-900 mb-1">{req.title}</h3>
                                <p className="text-sm text-slate-600 mb-3">{req.description}</p>

                                <div className="flex flex-wrap gap-4 text-xs text-slate-500">
                                    {req.location && (
                                        <div className="flex items-center gap-1">
                                            <MapPin className="w-3 h-3" /> {req.location}
                                        </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                        <UserIcon className="w-3 h-3" /> Requested by: {req.requestedBy}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons for Admin/Tech */}
                            {canManageVendors && req.status === 'PENDING' && (
                                <div className="flex sm:flex-col gap-2 justify-center border-t sm:border-t-0 sm:border-l border-slate-100 pt-4 sm:pt-0 sm:pl-4">
                                    <button
                                        onClick={() => handleApproveRequest(req)}
                                        className="flex-1 flex items-center justify-center gap-1 bg-green-50 text-green-700 hover:bg-green-100 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <CheckCircle className="w-4 h-4" /> Approve
                                    </button>
                                    <button
                                        onClick={() => handleRejectRequest(req)}
                                        className="flex-1 flex items-center justify-center gap-1 bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        <XCircle className="w-4 h-4" /> Reject
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                    {filteredRequests.length === 0 && <div className="text-center py-12 text-slate-400">No requests found.</div>}
                </div>
            )}

            {activeTab === 'SERVICE_CALLS' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        {serviceBroadcasts.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                                <Siren className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <h3 className="text-slate-900 font-medium">No service calls broadcasted</h3>
                                <p className="text-slate-500 text-sm mt-1">Use "Broadcast Service Need" to notify multiple contractors about an issue.</p>
                            </div>
                        )}
                        {serviceBroadcasts.map(req => (
                            <div key={req.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-purple-100 text-purple-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Service Call</span>
                                        <span className="text-xs text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{req.notifiedVendorIds.length} Contractors Notified</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">{req.title}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Description</p>
                                        <p className="text-sm text-slate-700">{req.description}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Location & Priority</p>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1 text-sm text-slate-700">
                                                <MapPin className="w-3 h-3 text-slate-400" /> {req.location}
                                            </div>
                                            <span className={`inline-flex self-start items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${req.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                                req.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                {req.priority} Priority
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'SOURCING' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        {materialRequests.length === 0 && (
                            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                                <Megaphone className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                                <h3 className="text-slate-900 font-medium">No material broadcasts</h3>
                                <p className="text-slate-500 text-sm mt-1">Use "Broadcast Material Need" to notify multiple vendors.</p>
                            </div>
                        )}
                        {materialRequests.map(req => (
                            <div key={req.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase">Material Need</span>
                                        <span className="text-xs text-slate-400">{new Date(req.createdAt).toLocaleDateString()}</span>
                                    </div>
                                    <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{req.notifiedVendorIds.length} Vendors Notified</span>
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 mb-1">{req.quantity} x {req.itemName}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 bg-slate-50 p-3 rounded-lg border border-slate-100">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Specs / Quality</p>
                                        <p className="text-sm text-slate-700">{req.qualitySpecs || 'Standard quality'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-slate-500 uppercase">Delivery Location</p>
                                        <p className="text-sm text-slate-700">{req.location}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {(activeTab === 'VENDORS' || activeTab === 'CONTRACTORS') && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVendors.map(vendor => (
                        <div key={vendor.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-slate-100 rounded-lg">
                                        {vendor.type === 'CONTRACTOR' ? <HardHat className="w-6 h-6 text-slate-600" /> : <Briefcase className="w-6 h-6 text-slate-600" />}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 line-clamp-1">{vendor.name}</h3>
                                        <div className="flex items-center gap-1 text-xs text-slate-500">
                                            <span className="uppercase font-semibold text-secondary">{vendor.type}</span>
                                            <span>•</span>
                                            <span>{vendor.category}</span>
                                        </div>
                                    </div>
                                </div>
                                {vendor.status === 'INVITED' ? (
                                    <div className="flex items-center bg-amber-50 px-2 py-1 rounded text-amber-700 text-xs font-bold border border-amber-200">
                                        Pending Invite
                                    </div>
                                ) : (
                                    <div className="flex items-center bg-slate-50 px-2 py-1 rounded text-slate-700 text-xs font-bold">
                                        <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" />
                                        {vendor.rating}
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2 text-sm text-slate-600 mb-4">
                                <div className="flex items-center gap-2">
                                    <UserIcon className="w-4 h-4 text-slate-400" /> {vendor.contactName}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-slate-400" /> {vendor.email}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-slate-400" /> {vendor.phone}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {canManageVendors && (
                                    <>
                                        <button onClick={() => openVendorModal(vendor)} className="flex-1 py-1.5 text-xs font-medium bg-slate-50 hover:bg-slate-100 rounded text-slate-700">Edit</button>
                                        <button onClick={() => confirmDeleteVendor(vendor.id)} className="flex-1 py-1.5 text-xs font-medium bg-red-50 hover:bg-red-100 rounded text-red-600">Remove</button>
                                    </>
                                )}
                                {!canManageVendors && <span className="text-xs text-slate-400 italic w-full text-center">Contact Admin to edit</span>}
                            </div>
                        </div>
                    ))}
                    {filteredVendors.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-400">
                            <p className="mb-2">No results found for "{searchQuery}"</p>
                            <p className="text-xs">Try searching by name, category, contact person or email.</p>
                        </div>
                    )}
                </div>
            )}

            {/* --- Vendor/Contractor Modal --- */}
            {isVendorModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-semibold text-slate-900">
                                {vendorForm.id ? 'Edit Entry' : `Add/Invite ${activeTab === 'CONTRACTORS' ? 'Contractor' : 'Vendor'}`}
                            </h3>
                            <button onClick={() => setIsVendorModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleVendorSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                                <input required type="text" value={vendorForm.name} onChange={e => setVendorForm({ ...vendorForm, name: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                    <select value={vendorForm.type} onChange={e => setVendorForm({ ...vendorForm, type: e.target.value as any })} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white">
                                        <option value="SUPPLIER">Supplier (Parts)</option>
                                        <option value="CONTRACTOR">Contractor (Service)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                                    <input type="text" value={vendorForm.category} onChange={e => setVendorForm({ ...vendorForm, category: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder={vendorForm.type === 'CONTRACTOR' ? 'e.g. Electrical' : 'e.g. Plumbing Parts'} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Contact Name</label>
                                    <input required type="text" value={vendorForm.contactName} onChange={e => setVendorForm({ ...vendorForm, contactName: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                                    <input required type="text" value={vendorForm.phone} onChange={e => setVendorForm({ ...vendorForm, phone: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                                <input required type="email" value={vendorForm.email} onChange={e => setVendorForm({ ...vendorForm, email: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                            </div>

                            {/* Status / Invite Selector */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">Onboarding Status</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setVendorForm({ ...vendorForm, status: 'ACTIVE' })} className={`flex-1 py-2 text-xs font-bold rounded border ${vendorForm.status === 'ACTIVE' ? 'bg-green-50 border-green-500 text-green-700' : 'border-slate-200'}`}>
                                        Active
                                    </button>
                                    <button type="button" onClick={() => setVendorForm({ ...vendorForm, status: 'INVITED' })} className={`flex-1 py-2 text-xs font-bold rounded border ${vendorForm.status === 'INVITED' ? 'bg-amber-50 border-amber-500 text-amber-700' : 'border-slate-200'}`}>
                                        Invite via Email
                                    </button>
                                </div>
                                {vendorForm.status === 'INVITED' && (
                                    <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                                        <Mail className="w-3 h-3" /> An email invitation will be sent to the address above.
                                    </p>
                                )}
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsVendorModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg flex items-center justify-center gap-2">
                                    {vendorForm.status === 'INVITED' ? <Send className="w-4 h-4" /> : null}
                                    {vendorForm.status === 'INVITED' ? 'Send Invite' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ... Other Modals ... */}

            {/* --- Material Sourcing Modal --- */}
            {isSourcingModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                    <Megaphone className="w-5 h-5 text-secondary" /> Broadcast Material Need
                                </h3>
                                <p className="text-xs text-slate-500">Notify multiple vendors about required materials.</p>
                            </div>
                            <button onClick={() => setIsSourcingModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSourcingSubmit} className="flex-1 flex flex-col">
                            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Item Name / Material</label>
                                        <input required type="text" value={sourcingForm.itemName} onChange={e => setSourcingForm({ ...sourcingForm, itemName: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="e.g. 50 bags of Cement" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                                        <input required type="number" min="1" value={sourcingForm.quantity} onChange={e => setSourcingForm({ ...sourcingForm, quantity: parseInt(e.target.value) })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Location</label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input required type="text" value={sourcingForm.location} onChange={e => setSourcingForm({ ...sourcingForm, location: e.target.value })} className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg" placeholder="e.g. Site A - Storage" />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Quality & Specifications</label>
                                    <textarea required rows={3} value={sourcingForm.qualitySpecs} onChange={e => setSourcingForm({ ...sourcingForm, qualitySpecs: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="Describe quality requirements, brand preferences, or technical specs..." />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Vendors to Notify</label>
                                    <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto bg-slate-50 divide-y divide-slate-200">
                                        {suppliersOnly.length === 0 && <div className="p-4 text-center text-xs text-slate-400">No active suppliers found.</div>}
                                        {suppliersOnly.map(v => (
                                            <div key={v.id} className="flex items-center p-3 hover:bg-white transition-colors cursor-pointer" onClick={() => toggleVendorSelection(v.id, 'SOURCING')}>
                                                <input
                                                    type="checkbox"
                                                    checked={sourcingForm.selectedVendorIds.has(v.id)}
                                                    onChange={() => { }} // Handled by div click
                                                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary pointer-events-none"
                                                />
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-slate-900">{v.name}</p>
                                                    <p className="text-xs text-slate-500">{v.category} • {v.email}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{sourcingForm.selectedVendorIds.size} vendor(s) selected</p>
                                </div>
                            </div>

                            <div className="p-6 pt-4 border-t border-slate-100 flex gap-3 bg-white">
                                <button type="button" onClick={() => setIsSourcingModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-secondary text-white rounded-lg font-medium hover:bg-amber-600 shadow-sm flex items-center justify-center gap-2">
                                    <Megaphone className="w-4 h-4" /> Send Notifications
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Service Call Modal --- */}
            {isServiceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                                    <Siren className="w-5 h-5 text-purple-600" /> Broadcast Service Need
                                </h3>
                                <p className="text-xs text-slate-500">Notify multiple contractors about a problem or service need.</p>
                            </div>
                            <button onClick={() => setIsServiceModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleServiceSubmit} className="flex-1 flex flex-col">
                            <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Problem Title</label>
                                    <input required type="text" value={serviceForm.title} onChange={e => setServiceForm({ ...serviceForm, title: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="e.g. Electrical Failure in Block C" />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <input required type="text" value={serviceForm.location} onChange={e => setServiceForm({ ...serviceForm, location: e.target.value })} className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg" placeholder="e.g. Site A" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                                        <select value={serviceForm.priority} onChange={e => setServiceForm({ ...serviceForm, priority: e.target.value as WorkOrderPriority })} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white">
                                            {Object.values(WorkOrderPriority).map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description / Requirements</label>
                                    <textarea required rows={3} value={serviceForm.description} onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="Describe the problem, access requirements, etc..." />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Photo (Optional)</label>
                                    <FileUpload
                                        label="Reference Photo"
                                        accept="image/*"
                                        onFileSelect={async (file) => {
                                            const toastId = toast.loading("Uploading...");
                                            const url = await uploadFile(file);
                                            if (url) {
                                                setServiceForm(prev => ({ ...prev, image: url }));
                                                toast.success("Photo attached", { id: toastId });
                                            } else {
                                                toast.error("Upload failed", { id: toastId });
                                            }
                                        }}
                                    />
                                    {serviceForm.image && (
                                        <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group">
                                            <img src={serviceForm.image} className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => setServiceForm(prev => ({ ...prev, image: '' }))} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X className="w-5 h-5 text-white" />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-2">Select Contractors to Notify</label>
                                    <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto bg-slate-50 divide-y divide-slate-200">
                                        {contractorsOnly.length === 0 && <div className="p-4 text-center text-xs text-slate-400">No active contractors found.</div>}
                                        {contractorsOnly.map(v => (
                                            <div key={v.id} className="flex items-center p-3 hover:bg-white transition-colors cursor-pointer" onClick={() => toggleVendorSelection(v.id, 'SERVICE')}>
                                                <input
                                                    type="checkbox"
                                                    checked={serviceForm.selectedVendorIds.has(v.id)}
                                                    onChange={() => { }} // Handled by div click
                                                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary pointer-events-none"
                                                />
                                                <div className="ml-3">
                                                    <p className="text-sm font-medium text-slate-900">{v.name}</p>
                                                    <p className="text-xs text-slate-500">{v.category} • {v.status === 'INVITED' ? 'Invited' : 'Active'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">{serviceForm.selectedVendorIds.size} contractor(s) selected</p>
                                </div>
                            </div>

                            <div className="p-6 pt-4 border-t border-slate-100 flex gap-3 bg-white">
                                <button type="button" onClick={() => setIsServiceModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
                                <button type="submit" className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 shadow-sm flex items-center justify-center gap-2">
                                    <Siren className="w-4 h-4" /> Send Help Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Request Modal --- */}
            {isRequestModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-semibold text-slate-900">Submit Work Request</h3>
                            <button onClick={() => setIsRequestModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Issue Title</label>
                                <input required type="text" value={requestForm.title} onChange={e => setRequestForm({ ...requestForm, title: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="e.g. Leak in Lobby" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                                <input type="text" value={requestForm.location} onChange={e => setRequestForm({ ...requestForm, location: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="e.g. Main Lobby, North Wall" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                                <select value={requestForm.priority} onChange={e => setRequestForm({ ...requestForm, priority: e.target.value as WorkOrderPriority })} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white">
                                    {Object.values(WorkOrderPriority).map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                                <textarea required rows={3} value={requestForm.description} onChange={e => setRequestForm({ ...requestForm, description: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="Describe the issue..." />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Photo (Optional)</label>
                                <FileUpload
                                    label="Evidence Photo"
                                    accept="image/*"
                                    onFileSelect={async (file) => {
                                        const toastId = toast.loading("Uploading...");
                                        const url = await uploadFile(file);
                                        if (url) {
                                            setRequestForm(prev => ({ ...prev, image: url }));
                                            toast.success("Photo attached", { id: toastId });
                                        } else {
                                            toast.error("Upload failed", { id: toastId });
                                        }
                                    }}
                                />
                                {requestForm.image && (
                                    <div className="mt-2 relative w-20 h-20 rounded-lg overflow-hidden border border-slate-200 group">
                                        <img src={requestForm.image} className="w-full h-full object-cover" />
                                        <button type="button" onClick={() => setRequestForm(prev => ({ ...prev, image: '' }))} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X className="w-5 h-5 text-white" />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsRequestModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={!requestForm.title} className="flex-1 px-4 py-2 bg-secondary text-white rounded-lg hover:bg-amber-600 disabled:opacity-50">Submit Request</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={!!deleteVendorId}
                onClose={() => setDeleteVendorId(null)}
                onConfirm={handleDeleteVendor}
                title={`Delete ${activeTab === 'CONTRACTORS' ? 'Contractor' : 'Vendor'}`}
                message={`Are you sure you want to remove this ${activeTab === 'CONTRACTORS' ? 'contractor' : 'vendor'}? This action cannot be undone.`}
                confirmText="Delete"
                isDangerous={true}
            />
        </div>
    );
};

export default RequestsVendors;
