
import React, { useMemo, useContext, useState } from 'react';
import { DataContext } from '../../context/DataContext';
import { UserContext } from '../../context/UserContext';
import { WorkOrderStatus, WorkOrderPriority, UserRole, RequestStatus, WorkRequest, Message } from '../../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { AlertTriangle, CheckCircle, Package, Clipboard, Wrench, Clock, Activity, Calendar, Camera, Send, MapPin, FileText, HardHat, Building, Briefcase, Megaphone, Truck, Siren, User as UserIcon, UploadCloud } from 'lucide-react';
import toast from 'react-hot-toast';
import FileUpload from '../ui/FileUpload';

const Dashboard: React.FC = () => {
  const { workOrders, assets, inventory, updateWorkOrder, addRequest, requests, materialRequests, serviceBroadcasts, addMessage } = useContext(DataContext);
  const { user } = useContext(UserContext);

  // --- CLIENT SPECIFIC STATE ---
  const [clientIssue, setClientIssue] = useState('');
  const [clientImage, setClientImage] = useState('');

  // --- CONTRACTOR/VENDOR REPORTING STATE ---
  const [reportNote, setReportNote] = useState('');
  const [reportImage, setReportImage] = useState('');

  // --- HANDLERS ---

  const handleClientSubmit = (e: React.FormEvent, assetId: string, assetLocation: string) => {
    e.preventDefault();
    if (!clientIssue) {
      toast.error("Please describe the issue or update");
      return;
    }

    const newRequest: WorkRequest = {
      id: `req-${Date.now()}`,
      title: 'Client Update: ' + clientIssue.substring(0, 20) + '...',
      description: clientIssue,
      priority: WorkOrderPriority.MEDIUM,
      status: RequestStatus.PENDING,
      requestedBy: user?.id || 'client',
      assetId: assetId,
      createdAt: new Date().toISOString().split('T')[0],
      image: clientImage,
      location: assetLocation || 'Project Site'
    };

    addRequest(newRequest);
    toast.success("Update/Report submitted successfully");
    setClientIssue('');
    setClientImage('');
  };

  const handleGeneralReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportNote) {
        toast.error("Please provide a description.");
        return;
    }

    const newRequest: WorkRequest = {
        id: `rep-${Date.now()}`,
        title: `${user?.role === UserRole.VENDOR ? 'Vendor' : 'Contractor'} Report: ${reportNote.substring(0, 15)}...`,
        description: reportNote,
        priority: WorkOrderPriority.MEDIUM,
        status: RequestStatus.PENDING, // Goes to admin for review
        requestedBy: user?.id || 'unknown',
        createdAt: new Date().toISOString().split('T')[0],
        image: reportImage,
        location: 'Remote / Field'
    };

    addRequest(newRequest);
    toast.success("Report & Image uploaded successfully");
    setReportNote('');
    setReportImage('');
  };

  // --- SHARED: VENDOR/CONTRACTOR RESPONSE LOGIC ---
  const handleVendorResponse = (entityId: string, entityTitle: string, type: 'MATERIAL_BID' | 'SERVICE_ACCEPT') => {
      // Create a pre-filled message for the admin
      const subject = type === 'MATERIAL_BID' 
          ? `Bid for: ${entityTitle}`
          : `Interest in Service Call: ${entityTitle}`;
      
      const body = type === 'MATERIAL_BID'
          ? `I can supply the requested material (${entityTitle}).\n\nPrice per unit: $0.00\nAvailable Quantity: \nDelivery Estimate: `
          : `I am available for this service call (${entityTitle}).\n\nEarliest Start Date: \nEstimated Cost: `;

      const newMessage: Message = {
          id: `msg-${Date.now()}`,
          senderId: user?.id || 'unknown',
          receiverId: 'ADMIN',
          subject: subject,
          body: body,
          type: 'GENERAL',
          relatedEntityId: entityId,
          isRead: false,
          createdAt: new Date().toISOString()
      };

      addMessage(newMessage);
      // We could also navigate to messages page here
  };

  // --- ADMIN/TECH DASHBOARD LOGIC ---
  
  // Compute KPIs
  const kpis = useMemo(() => {
    const totalWO = workOrders.length;
    const pendingWO = workOrders.filter(w => w.status === WorkOrderStatus.PENDING).length;
    const criticalWO = workOrders.filter(w => w.priority === WorkOrderPriority.CRITICAL || w.priority === WorkOrderPriority.HIGH).length;
    const downAssets = assets.filter(a => a.status === 'DOWN').length;
    const lowStock = inventory.filter(i => i.quantity <= i.minQuantity).length;

    return { totalWO, pendingWO, criticalWO, downAssets, lowStock };
  }, [workOrders, assets, inventory]);

  const statusData = useMemo(() => {
    const counts = workOrders.reduce((acc, curr) => {
      acc[curr.status] = (acc[curr.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [workOrders]);

  // My Tasks Logic
  const myTasks = useMemo(() => {
     if (!user) return [];
     return workOrders.filter(wo => wo.assignedToId === user.id && wo.status !== WorkOrderStatus.COMPLETED);
  }, [workOrders, user]);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    const order = workOrders.find(o => o.id === orderId);
    if (order) {
       updateWorkOrder({ ...order, status: newStatus as WorkOrderStatus });
       toast.success(`Task status updated to ${newStatus}`);
    }
  };

  // Mock data for downtime trend
  const downtimeData = [
    { name: 'Mon', hours: 4 },
    { name: 'Tue', hours: 2 },
    { name: 'Wed', hours: 8 }, // Spike
    { name: 'Thu', hours: 1 },
    { name: 'Fri', hours: 3 },
  ];

  // --- RENDER ---

  // 1. CLIENT VIEW
  if (user?.role === UserRole.CLIENT) {
    // Find all assets assigned to this client
    const myProjects = assets.filter(a => a.clientId === user.id); 
    const myRequests = requests.filter(r => r.requestedBy === user.id);

    if (myProjects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
                <div className="bg-slate-100 p-6 rounded-full">
                    <HardHat className="w-12 h-12 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">Welcome to ConstructMate</h2>
                <p className="text-slate-500 max-w-md">
                    No active construction projects have been linked to your account yet. 
                    Please contact the administrator to assign your project dashboard.
                </p>
                <div className="text-xs text-slate-400">User ID: {user.id}</div>
            </div>
        );
    }

    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Projects</h1>
          <p className="text-sm text-slate-500">Track construction progress and submit updates for your properties.</p>
        </div>

        {myProjects.map(project => {
            const progress = project.projectProgress || 0;
            return (
              <div key={project.id} className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200 mb-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Left Column: Property Status */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="relative h-64">
                                <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
                                <div className="absolute top-4 right-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase shadow-sm ${
                                        project.status === 'OPERATIONAL' || project.status === 'UNDER_CONSTRUCTION' ? 'bg-blue-500 text-white' : 
                                        'bg-amber-500 text-white'
                                    }`}>
                                        {project.status === 'UNDER_CONSTRUCTION' ? 'Under Construction' : project.status}
                                    </span>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
                                    <h2 className="text-white text-xl font-bold">{project.name}</h2>
                                    <div className="flex items-center text-white/90 text-sm mt-1">
                                        <MapPin className="w-4 h-4 mr-1" /> {project.location}
                                    </div>
                                </div>
                            </div>
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold text-slate-900">Construction Progress</h3>
                                    <span className="text-2xl font-bold text-blue-600">{progress}%</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-4 mb-2">
                                    <div 
                                        className="bg-blue-600 h-4 rounded-full transition-all duration-1000 ease-out" 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-500">
                                    <span>Start</span>
                                    <span>Foundation</span>
                                    <span>Framing</span>
                                    <span>Finishing</span>
                                    <span>Completion</span>
                                </div>
                            </div>
                        </div>

                        {/* Report Issue Form */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <Camera className="w-5 h-5 text-secondary" />
                                Report Issue / Upload Photo
                            </h3>
                            <p className="text-sm text-slate-500 mb-4">Found an issue or want to document progress? Upload a photo and let us know.</p>
                            <form onSubmit={(e) => handleClientSubmit(e, project.id, project.location)} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Description / Notes</label>
                                    <textarea 
                                        rows={3} 
                                        value={clientIssue}
                                        onChange={(e) => setClientIssue(e.target.value)}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-secondary/50 outline-none"
                                        placeholder="e.g. Kitchen cabinets installed, looks great..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Upload Photo (Optional)</label>
                                    {clientImage ? (
                                        <div className="relative h-32 rounded-lg overflow-hidden border border-slate-200 group">
                                            <img src={clientImage} alt="Preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button type="button" onClick={() => setClientImage('')} className="text-white bg-red-500/80 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm hover:bg-red-600">Remove</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <FileUpload onFileSelect={(file) => {
                                            setClientImage(URL.createObjectURL(file));
                                            toast.success("Photo attached");
                                        }} label="" />
                                    )}
                                </div>
                                <button type="submit" className="w-full bg-secondary text-white py-2 rounded-lg font-bold hover:bg-amber-600 transition-colors flex justify-center items-center gap-2">
                                    <Send className="w-4 h-4" /> Submit Update
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Right Column: Request History (Global or filtered by project if we wanted) */}
                    <div className="space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
                            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-slate-400" />
                                <h3 className="font-bold text-slate-900">Request & Update History</h3>
                            </div>
                            <div className="p-6 flex-1 overflow-y-auto max-h-[600px] space-y-4">
                                {myRequests.filter(r => r.assetId === project.id || !r.assetId).length === 0 ? (
                                    <div className="text-center py-12 text-slate-400">
                                        <p>No recent history for this project.</p>
                                    </div>
                                ) : (
                                    myRequests
                                        .filter(r => r.assetId === project.id || !r.assetId)
                                        .map(req => (
                                        <div key={req.id} className="bg-slate-50 border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                                                    req.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                                    req.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                                                    'bg-blue-100 text-blue-700'
                                                }`}>
                                                    {req.status}
                                                </span>
                                                <span className="text-xs text-slate-400">{req.createdAt}</span>
                                            </div>
                                            <h4 className="font-medium text-slate-900 mb-1">{req.title}</h4>
                                            <p className="text-sm text-slate-600 mb-3">{req.description}</p>
                                            
                                            {req.image && (
                                                <div className="mt-3">
                                                    <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Attachment</p>
                                                    <img src={req.image} alt="Request Attachment" className="w-24 h-24 object-cover rounded-lg border border-slate-200" />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            );
        })}
      </div>
    );
  }

  // 2. VENDOR (SUPPLIER) VIEW
  if (user?.role === UserRole.VENDOR) {
      // Find open material requests where this vendor is notified (or public)
      // In a real app, backend filters this. Here we check `notifiedVendorIds`
      const myMaterialRequests = materialRequests.filter(req => 
          req.status === 'OPEN' && 
          req.notifiedVendorIds.includes(user.id)
      );

      return (
          <div className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div>
                      <h1 className="text-2xl font-bold text-slate-900">Supplier Dashboard</h1>
                      <p className="text-sm text-slate-500">Welcome, {user.name}. Review and respond to material sourcing requests.</p>
                  </div>
                  <div className="flex gap-4">
                      <div className="text-center">
                          <span className="block text-2xl font-bold text-blue-600">{myMaterialRequests.length}</span>
                          <span className="text-xs text-slate-500 font-semibold uppercase">Open Requests</span>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Reporting Column */}
                  <div className="lg:col-span-1 bg-white p-6 rounded-xl border border-slate-200 shadow-sm h-fit">
                      <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-4">
                          <UploadCloud className="w-5 h-5 text-secondary" /> Submit Supply Report / Invoice
                      </h2>
                      <p className="text-xs text-slate-500 mb-4">Upload proof of delivery, invoices, or report issues with orders.</p>
                      <form onSubmit={handleGeneralReportSubmit} className="space-y-4">
                          <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Details / Invoice #</label>
                              <textarea 
                                  required
                                  rows={3} 
                                  value={reportNote}
                                  onChange={(e) => setReportNote(e.target.value)}
                                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-secondary/50 outline-none"
                                  placeholder="e.g. Delivery completed for Order #1234..."
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Attachment</label>
                              {reportImage ? (
                                  <div className="relative h-24 rounded-lg overflow-hidden border border-slate-200 group">
                                      <img src={reportImage} alt="Preview" className="w-full h-full object-cover" />
                                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button type="button" onClick={() => setReportImage('')} className="text-white bg-red-500/80 px-2 py-1 rounded text-xs font-medium backdrop-blur-sm">Clear</button>
                                      </div>
                                  </div>
                              ) : (
                                  <FileUpload onFileSelect={(file) => {
                                      setReportImage(URL.createObjectURL(file));
                                      toast.success("Document attached");
                                  }} label="" />
                              )}
                          </div>
                          <button type="submit" className="w-full bg-secondary text-white py-2 rounded-lg text-sm font-bold hover:bg-amber-600 transition-colors">
                              Submit Report
                          </button>
                      </form>
                  </div>

                  {/* Requests Column */}
                  <div className="lg:col-span-2 space-y-6">
                      {myMaterialRequests.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-xl border border-slate-200 border-dashed">
                              <Package className="w-16 h-16 text-slate-300 mb-4" />
                              <h3 className="text-lg font-medium text-slate-700">No open requests</h3>
                              <p className="text-sm text-slate-500">You're all caught up! Check back later for new sourcing needs.</p>
                          </div>
                      ) : (
                          myMaterialRequests.map(req => (
                              <div key={req.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row gap-6">
                                  <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-2">
                                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-bold uppercase">Material Needed</span>
                                          <span className="text-xs text-slate-400">Posted {new Date(req.createdAt).toLocaleDateString()}</span>
                                      </div>
                                      <h3 className="text-xl font-bold text-slate-900 mb-2">{req.quantity} x {req.itemName}</h3>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100">
                                          <div>
                                              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Location</p>
                                              <div className="flex items-center gap-1 font-medium"><MapPin className="w-3.5 h-3.5" /> {req.location}</div>
                                          </div>
                                          <div>
                                              <p className="text-xs font-semibold text-slate-500 uppercase mb-1">Specifications</p>
                                              <p>{req.qualitySpecs || 'Standard Specs'}</p>
                                          </div>
                                      </div>
                                  </div>
                                  <div className="flex flex-col justify-center min-w-[200px] gap-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-6">
                                      <button 
                                          onClick={() => handleVendorResponse(req.id, `${req.quantity} x ${req.itemName}`, 'MATERIAL_BID')}
                                          className="w-full bg-primary text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-sm flex items-center justify-center gap-2"
                                      >
                                          <Send className="w-4 h-4" /> Submit Quote / Bid
                                      </button>
                                      <button 
                                          className="w-full bg-white border border-slate-300 text-slate-700 py-2.5 rounded-lg font-medium hover:bg-slate-50 transition-colors"
                                      >
                                          Mark Unavailable
                                      </button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // 3. CONTRACTOR VIEW
  if (user?.role === UserRole.CONTRACTOR) {
      const myServiceOpportunities = serviceBroadcasts.filter(srv => 
          srv.status === 'OPEN' && 
          srv.notifiedVendorIds.includes(user.id)
      );

      return (
          <div className="space-y-8">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                  <div>
                      <h1 className="text-2xl font-bold text-slate-900">Contractor Dashboard</h1>
                      <p className="text-sm text-slate-500">Welcome, {user.name}. Manage your assigned jobs and find new opportunities.</p>
                  </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Reporting Column */}
                  <div className="lg:col-span-1 space-y-6">
                      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                          <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2 mb-4">
                              <Camera className="w-5 h-5 text-secondary" /> Site Report & Progress Upload
                          </h2>
                          <p className="text-xs text-slate-500 mb-4">Upload photos of completed work or report blockers on site.</p>
                          <form onSubmit={handleGeneralReportSubmit} className="space-y-4">
                              <div>
                                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Description / Notes</label>
                                  <textarea 
                                      required
                                      rows={3} 
                                      value={reportNote}
                                      onChange={(e) => setReportNote(e.target.value)}
                                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-secondary/50 outline-none"
                                      placeholder="e.g. Electrical wiring completed for Room 101..."
                                  />
                              </div>
                              <div>
                                  <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Photo / Document</label>
                                  {reportImage ? (
                                      <div className="relative h-24 rounded-lg overflow-hidden border border-slate-200 group">
                                          <img src={reportImage} alt="Preview" className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                              <button type="button" onClick={() => setReportImage('')} className="text-white bg-red-500/80 px-2 py-1 rounded text-xs font-medium backdrop-blur-sm">Clear</button>
                                          </div>
                                      </div>
                                  ) : (
                                      <FileUpload onFileSelect={(file) => {
                                          setReportImage(URL.createObjectURL(file));
                                          toast.success("File attached");
                                      }} label="" />
                                  )}
                              </div>
                              <button type="submit" className="w-full bg-secondary text-white py-2 rounded-lg text-sm font-bold hover:bg-amber-600 transition-colors">
                                  Submit Report
                              </button>
                          </form>
                      </div>

                      {/* Opportunities Column (Moved here for better layout) */}
                      <div className="space-y-4">
                          <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                              <Siren className="w-5 h-5 text-purple-600" /> Service Opportunities
                          </h2>
                          {myServiceOpportunities.length === 0 ? (
                              <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
                                  <p>No new service calls.</p>
                              </div>
                          ) : (
                              myServiceOpportunities.map(opp => (
                                  <div key={opp.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-purple-500">
                                      <div className="flex justify-between items-start mb-2">
                                          <span className="bg-purple-50 text-purple-700 text-[10px] px-2 py-1 rounded-full font-bold uppercase">Open Call</span>
                                          <span className="text-xs text-slate-400">{new Date(opp.createdAt).toLocaleDateString()}</span>
                                      </div>
                                      <h3 className="font-bold text-slate-900">{opp.title}</h3>
                                      <p className="text-sm text-slate-600 mt-1 mb-3">{opp.description}</p>
                                      <div className="flex items-center text-xs text-slate-500 gap-1 mb-4">
                                          <MapPin className="w-3 h-3" /> {opp.location}
                                      </div>
                                      <button 
                                          onClick={() => handleVendorResponse(opp.id, opp.title, 'SERVICE_ACCEPT')}
                                          className="w-full bg-purple-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                                      >
                                          Accept / Contact Admin
                                      </button>
                                  </div>
                              ))
                          )}
                      </div>
                  </div>

                  {/* Assigned Jobs Column */}
                  <div className="lg:col-span-2 space-y-4">
                      <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                          <Briefcase className="w-5 h-5 text-secondary" /> My Active Jobs
                      </h2>
                      {myTasks.length === 0 ? (
                          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-slate-400">
                              <p>No active jobs assigned.</p>
                          </div>
                      ) : (
                          myTasks.map(task => (
                              <div key={task.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                                  <div className="flex justify-between items-start mb-2">
                                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${
                                          task.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' : 
                                          'bg-blue-100 text-blue-700'
                                      }`}>
                                          {task.priority} Priority
                                      </span>
                                      <span className="text-xs text-slate-400">Due: {task.dueDate}</span>
                                  </div>
                                  <h3 className="font-bold text-slate-900">{task.title}</h3>
                                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{task.description}</p>
                                  <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
                                      <select 
                                          value={task.status}
                                          onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                          className="text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-secondary"
                                      >
                                          {Object.values(WorkOrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                      </select>
                                      <button className="text-primary hover:text-secondary text-sm font-medium">View Details</button>
                                  </div>
                              </div>
                          ))
                      )}
                  </div>
              </div>
          </div>
      );
  }

  // --- ADMIN / TECHNICIAN VIEW (Default) ---

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
          value={kpis.pendingWO + workOrders.filter(w=>w.status === WorkOrderStatus.IN_PROGRESS).length} 
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

      {/* My Tasks Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
         <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
             <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                 <Clipboard className="w-5 h-5 text-secondary" /> 
                 My Assigned Tasks 
                 <span className="ml-2 text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">{myTasks.length}</span>
             </h2>
             <button className="text-sm text-slate-500 hover:text-secondary">View All</button>
         </div>
         {myTasks.length > 0 ? (
             <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm text-slate-600">
                     <thead className="bg-slate-50 border-b border-slate-100">
                         <tr>
                             <th className="px-6 py-3 font-semibold">Task</th>
                             <th className="px-6 py-3 font-semibold">Asset</th>
                             <th className="px-6 py-3 font-semibold">Priority</th>
                             <th className="px-6 py-3 font-semibold">Due Date</th>
                             <th className="px-6 py-3 font-semibold">Status</th>
                             <th className="px-6 py-3 font-semibold text-right">Actions</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                         {myTasks.map(task => {
                             const asset = assets.find(a => a.id === task.assetId);
                             return (
                                 <tr key={task.id} className="hover:bg-slate-50 transition-colors">
                                     <td className="px-6 py-3">
                                         <div className="font-medium text-slate-900">{task.title}</div>
                                         <div className="text-xs text-slate-400 line-clamp-1">{task.description}</div>
                                     </td>
                                     <td className="px-6 py-3">
                                         {asset ? (
                                             <div className="flex items-center gap-1.5">
                                                 <img src={asset.image} className="w-6 h-6 rounded object-cover" alt="" />
                                                 <span className="truncate max-w-[150px]">{asset.name}</span>
                                             </div>
                                         ) : <span className="text-slate-400 italic">Unknown</span>}
                                     </td>
                                     <td className="px-6 py-3">
                                         <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                             task.priority === 'CRITICAL' ? 'bg-red-100 text-red-700' :
                                             task.priority === 'HIGH' ? 'bg-orange-100 text-orange-700' :
                                             task.priority === 'MEDIUM' ? 'bg-amber-100 text-amber-700' :
                                             'bg-green-100 text-green-700'
                                         }`}>
                                             {task.priority}
                                         </span>
                                     </td>
                                     <td className="px-6 py-3">
                                         <div className="flex items-center gap-1.5 text-xs font-medium">
                                             <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                             {task.dueDate}
                                         </div>
                                     </td>
                                     <td className="px-6 py-3">
                                         <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                             task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                                             task.status === 'REVIEW' ? 'bg-purple-100 text-purple-700' :
                                             'bg-slate-100 text-slate-700'
                                         }`}>
                                             {task.status.replace('_', ' ')}
                                         </span>
                                     </td>
                                     <td className="px-6 py-3 text-right">
                                         <select 
                                             value={task.status}
                                             onChange={(e) => handleStatusChange(task.id, e.target.value)}
                                             className="text-xs border border-slate-300 rounded px-2 py-1 bg-white focus:ring-1 focus:ring-secondary"
                                         >
                                             {Object.values(WorkOrderStatus).map(s => <option key={s} value={s}>{s}</option>)}
                                         </select>
                                     </td>
                                 </tr>
                             );
                         })}
                     </tbody>
                 </table>
             </div>
         ) : (
             <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                 <CheckCircle className="w-12 h-12 mb-3 text-slate-200" />
                 <p className="font-medium text-slate-500">You're all caught up!</p>
                 <p className="text-sm">No tasks assigned to you at the moment.</p>
             </div>
         )}
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

export default Dashboard;
