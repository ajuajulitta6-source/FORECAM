
import React, { useContext, useState } from 'react';
import { DataContext } from '../../context/DataContext';
import { UserContext } from '../../context/UserContext';
import { Package, AlertCircle, Plus, X, Save, Edit2, Trash2, Megaphone, MapPin } from 'lucide-react';
import { InventoryItem, MaterialRequest } from '../../types';
import ConfirmationModal from '../shared/ConfirmationModal';
import toast from 'react-hot-toast';

const InventoryList: React.FC = () => {
  const { user } = useContext(UserContext);
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem, vendors, addMaterialRequest } = useContext(DataContext);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSourcingModalOpen, setIsSourcingModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    sku: '',
    category: '',
    location: '',
    quantity: 0,
    minQuantity: 5,
    unitPrice: 0
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

  const handleEdit = (item: InventoryItem) => {
    setNewItem({ ...item });
    setEditingId(item.id);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setNewItem({
      name: '',
      sku: '',
      category: '',
      location: '',
      quantity: 0,
      minQuantity: 5,
      unitPrice: 0
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.name && newItem.sku && newItem.quantity !== undefined) {
      if (editingId) {
        // Update existing item
        const updatedItem: InventoryItem = {
          ...newItem,
          id: editingId,
          quantity: Number(newItem.quantity),
          minQuantity: Number(newItem.minQuantity || 5),
          unitPrice: Number(newItem.unitPrice || 0)
        } as InventoryItem;
        updateInventoryItem(updatedItem);
      } else {
        // Create new item
        const item: InventoryItem = {
          id: `inv-${Date.now()}`,
          name: newItem.name!,
          sku: newItem.sku!,
          category: newItem.category || 'General',
          location: newItem.location || 'Warehouse',
          quantity: Number(newItem.quantity),
          minQuantity: Number(newItem.minQuantity || 5),
          unitPrice: Number(newItem.unitPrice || 0)
        };
        addInventoryItem(item);
      }
      setIsModalOpen(false);
    }
  };

  const handleDeleteItem = () => {
    if (editingId) {
      deleteInventoryItem(editingId);
      setIsDeleteModalOpen(false);
      setIsModalOpen(false);
    }
  };

  // Sourcing Logic
  const handleOpenSourcing = (item?: InventoryItem) => {
    if (item) {
        setSourcingForm({
            itemName: item.name,
            quantity: Math.max(item.minQuantity * 2, 10), // Auto-suggest restocking amount
            qualitySpecs: '',
            location: item.location,
            selectedVendorIds: new Set()
        });
    } else {
        setSourcingForm({
            itemName: '',
            quantity: 1,
            qualitySpecs: '',
            location: '',
            selectedVendorIds: new Set()
        });
    }
    setIsSourcingModalOpen(true);
  };

  const toggleVendorSelection = (id: string) => {
    const newSet = new Set(sourcingForm.selectedVendorIds);
    if (newSet.has(id)) {
        newSet.delete(id);
    } else {
        newSet.add(id);
    }
    setSourcingForm({ ...sourcingForm, selectedVendorIds: newSet });
  };

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
    toast.success(`Broadcasting need to ${sourcingForm.selectedVendorIds.size} vendors`);
    setIsSourcingModalOpen(false);
  };

  const suppliersOnly = vendors.filter(v => v.type === 'SUPPLIER' && v.status !== 'INACTIVE');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Parts Inventory</h1>
        <div className="flex gap-2">
            <button 
                onClick={() => handleOpenSourcing()}
                className="flex items-center gap-2 bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-50 transition-colors shadow-sm font-medium"
            >
                <Megaphone className="w-4 h-4" />
                Broadcast Need
            </button>
            <button 
            onClick={handleOpenAdd}
            className="flex items-center gap-2 bg-secondary text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors shadow-sm font-medium"
            >
            <Plus className="w-4 h-4" />
            Add Part
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Item Name</th>
                <th className="px-6 py-4">SKU</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Location</th>
                <th className="px-6 py-4">Quantity</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.map((item) => {
                const isLowStock = item.quantity <= item.minQuantity;
                const isOutOfStock = item.quantity === 0;
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                       <div className="p-2 bg-slate-100 rounded-lg">
                          <Package className="w-5 h-5 text-slate-500" />
                       </div>
                       {item.name}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">{item.sku}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">{item.location}</td>
                    <td className="px-6 py-4 font-semibold">{item.quantity} / {item.minQuantity}</td>
                    <td className="px-6 py-4">
                      {isOutOfStock ? (
                         <span className="inline-flex items-center gap-1 text-red-700 bg-red-100 px-2 py-1 rounded-md text-xs font-medium border border-red-200">
                          <AlertCircle className="w-3 h-3" /> Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded-md text-xs font-medium border border-amber-200">
                          <AlertCircle className="w-3 h-3" /> Low Stock
                        </span>
                      ) : (
                        <span className="text-green-700 bg-green-50 px-2 py-1 rounded-md text-xs font-medium border border-green-200">
                          In Stock
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                           <button 
                                onClick={() => handleOpenSourcing(item)}
                                className="text-slate-400 hover:text-secondary transition-colors p-1"
                                title="Broadcast Material Need"
                           >
                                <Megaphone className="w-4 h-4" />
                           </button>
                           <button 
                                onClick={() => handleEdit(item)}
                                className="text-slate-400 hover:text-primary transition-colors p-1"
                                title="Edit Item"
                           >
                                <Edit2 className="w-4 h-4" />
                           </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
              {inventory.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No inventory items found. Add some parts to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-900">{editingId ? 'Edit Inventory Item' : 'Add New Inventory Item'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Item Name</label>
                  <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="e.g. 1/2 inch Bolt" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                  <input required type="text" value={newItem.sku} onChange={e => setNewItem({...newItem, sku: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="BLT-001" />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input type="text" value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="Fasteners" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                  <input required type="number" min="0" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Min. Alert Qty</label>
                  <input required type="number" min="1" value={newItem.minQuantity} onChange={e => setNewItem({...newItem, minQuantity: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-amber-50 border-amber-200 focus:border-amber-400 focus:ring-amber-200" title="System will notify admins if stock falls below this number" />
                  <p className="text-[10px] text-amber-600 mt-1">* Notification Threshold</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Location</label>
                  <input type="text" value={newItem.location} onChange={e => setNewItem({...newItem, location: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="Shelf A1" />
                </div>

                 <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Unit Price ($)</label>
                  <input type="number" min="0" step="0.01" value={newItem.unitPrice} onChange={e => setNewItem({...newItem, unitPrice: parseFloat(e.target.value)})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                </div>
              </div>

              <div className="pt-4 flex items-center gap-3">
                 {editingId && (
                    <button 
                        type="button" 
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="px-4 py-2 bg-red-50 text-red-600 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                 )}
                 <div className="flex-1 flex gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50">Cancel</button>
                    <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-slate-800 flex items-center justify-center gap-2">
                      <Save className="w-4 h-4" /> {editingId ? 'Update Item' : 'Save Item'}
                    </button>
                 </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- Broadcast Material Need Modal --- */}
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
                                <input required type="text" value={sourcingForm.itemName} onChange={e => setSourcingForm({...sourcingForm, itemName: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="e.g. 50 bags of Cement" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Quantity</label>
                                <input required type="number" min="1" value={sourcingForm.quantity} onChange={e => setSourcingForm({...sourcingForm, quantity: parseInt(e.target.value)})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Delivery Location</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input required type="text" value={sourcingForm.location} onChange={e => setSourcingForm({...sourcingForm, location: e.target.value})} className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg" placeholder="e.g. Site A - Storage" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Quality & Specifications</label>
                            <textarea rows={3} value={sourcingForm.qualitySpecs} onChange={e => setSourcingForm({...sourcingForm, qualitySpecs: e.target.value})} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="Describe quality requirements, brand preferences, or technical specs... (Optional)" />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">Select Vendors to Notify</label>
                            <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto bg-slate-50 divide-y divide-slate-200">
                                {suppliersOnly.length === 0 && <div className="p-4 text-center text-xs text-slate-400">No active suppliers found.</div>}
                                {suppliersOnly.map(v => (
                                    <div key={v.id} className="flex items-center p-3 hover:bg-white transition-colors cursor-pointer" onClick={() => toggleVendorSelection(v.id)}>
                                        <input 
                                            type="checkbox" 
                                            checked={sourcingForm.selectedVendorIds.has(v.id)} 
                                            onChange={() => {}} // Handled by div click
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
                             <Megaphone className="w-4 h-4" /> Broadcast
                        </button>
                    </div>
                 </form>
             </div>
          </div>
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteItem}
        title="Delete Item"
        message="Are you sure you want to remove this item from inventory? This action cannot be undone."
        confirmText="Delete Item"
        isDangerous={true}
      />
    </div>
  );
};

export default InventoryList;
