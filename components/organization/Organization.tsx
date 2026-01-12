
import React, { useState, useContext } from 'react';
import { DataContext } from '../../context/DataContext';
import { Users, FolderOpen, Tag, Plus, Download, FileText, Image as ImageIcon, Trash2, Search, X } from 'lucide-react';
import UserManagement from '../admin/UserManagement';
import FileUpload from '../ui/FileUpload';
import { DocFile, SystemCategory } from '../../types';
import toast from 'react-hot-toast';
import ConfirmationModal from '../shared/ConfirmationModal';

const Organization: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'PEOPLE' | 'CATEGORIES' | 'FILES'>('PEOPLE');
  const { documents, categories, addDocument, deleteDocument, addCategory, deleteCategory } = useContext(DataContext);
  
  // File Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Category State
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryType, setNewCategoryType] = useState<SystemCategory['type']>('ASSET');

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<'FILE' | 'CATEGORY' | null>(null);

  const handleFileUpload = (file: File) => {
    const newDoc: DocFile = {
        id: `d-${Date.now()}`,
        name: file.name,
        type: file.type.includes('pdf') ? 'PDF' : file.type.includes('image') ? 'IMG' : 'DOC',
        size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        uploadedBy: 'Current User', // In real app use user context
        uploadedAt: new Date().toISOString().split('T')[0],
        category: 'General'
    };
    addDocument(newDoc);
    setIsUploadModalOpen(false);
    toast.success("File uploaded successfully");
  };

  const handleAddCategory = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newCategoryName) return;
      addCategory({
          id: `c-${Date.now()}`,
          name: newCategoryName,
          type: newCategoryType,
          count: 0
      });
      setNewCategoryName('');
      toast.success("Category added");
  };

  const confirmDelete = (id: string, type: 'FILE' | 'CATEGORY') => {
    setDeleteId(id);
    setDeleteType(type);
  };

  const handleConfirmDelete = () => {
    if (deleteType === 'FILE' && deleteId) {
      deleteDocument(deleteId);
      toast.success("Document deleted");
    } else if (deleteType === 'CATEGORY' && deleteId) {
      deleteCategory(deleteId);
      toast.success("Category deleted");
    }
    setDeleteId(null);
    setDeleteType(null);
  };

  const renderFilesTab = () => (
      <div className="space-y-4">
          <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-slate-800">Company Documents</h3>
              <button onClick={() => setIsUploadModalOpen(true)} className="flex items-center gap-2 bg-secondary text-white px-3 py-2 rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium">
                  <Plus className="w-4 h-4" /> Upload File
              </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {documents.map(doc => (
                  <div key={doc.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative">
                      <div className="flex items-center justify-between mb-3">
                          <div className={`p-2 rounded-lg ${doc.type === 'PDF' ? 'bg-red-50 text-red-600' : doc.type === 'IMG' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                              {doc.type === 'IMG' ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                          </div>
                          <button onClick={() => confirmDelete(doc.id, 'FILE')} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Trash2 className="w-4 h-4" />
                          </button>
                      </div>
                      <h4 className="font-medium text-slate-900 truncate" title={doc.name}>{doc.name}</h4>
                      <div className="flex justify-between items-center mt-2 text-xs text-slate-500">
                          <span>{doc.size}</span>
                          <span>{doc.uploadedAt}</span>
                      </div>
                      <div className="mt-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">{doc.category}</div>
                  </div>
              ))}
          </div>
      </div>
  );

  const renderCategoriesTab = () => (
      <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Add New Category</h3>
              <form onSubmit={handleAddCategory} className="flex gap-4 items-end">
                  <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Name</label>
                      <input 
                        type="text" 
                        value={newCategoryName}
                        onChange={e => setNewCategoryName(e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm" 
                        placeholder="e.g. Electrical Supplies" 
                      />
                  </div>
                  <div className="w-48">
                      <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Type</label>
                      <select 
                        value={newCategoryType}
                        onChange={e => setNewCategoryType(e.target.value as any)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white text-sm"
                      >
                          <option value="ASSET">Asset Category</option>
                          <option value="WORK_ORDER">Work Order Type</option>
                          <option value="INVENTORY">Inventory Category</option>
                          <option value="VENDOR">Vendor Category</option>
                      </select>
                  </div>
                  <button type="submit" className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-slate-800 transition-colors font-medium text-sm">Add</button>
              </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(['ASSET', 'WORK_ORDER', 'INVENTORY', 'VENDOR'] as const).map(type => (
                  <div key={type} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700 text-sm flex justify-between">
                          <span>{type.replace('_', ' ')} CATEGORIES</span>
                          <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">
                              {categories.filter(c => c.type === type).length}
                          </span>
                      </div>
                      <div className="divide-y divide-slate-100">
                          {categories.filter(c => c.type === type).map(cat => (
                              <div key={cat.id} className="px-4 py-3 flex justify-between items-center hover:bg-slate-50 group">
                                  <span className="text-sm text-slate-700">{cat.name}</span>
                                  <button onClick={() => confirmDelete(cat.id, 'CATEGORY')} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                              </div>
                          ))}
                          {categories.filter(c => c.type === type).length === 0 && (
                              <div className="px-4 py-6 text-center text-xs text-slate-400 italic">No categories defined</div>
                          )}
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <h1 className="text-2xl font-bold text-slate-900">Organization Settings</h1>
         
         <div className="flex bg-slate-100 p-1 rounded-lg">
            <button 
                onClick={() => setActiveTab('PEOPLE')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'PEOPLE' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Users className="w-4 h-4" /> People & Teams
            </button>
            <button 
                onClick={() => setActiveTab('CATEGORIES')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'CATEGORIES' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Tag className="w-4 h-4" /> Categories
            </button>
            <button 
                onClick={() => setActiveTab('FILES')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'FILES' ? 'bg-white text-primary shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <FolderOpen className="w-4 h-4" /> Files
            </button>
         </div>
      </div>

      <div className="mt-6">
          {activeTab === 'PEOPLE' && (
              <UserManagement embedded={true} />
          )}
          {activeTab === 'CATEGORIES' && renderCategoriesTab()}
          {activeTab === 'FILES' && renderFilesTab()}
      </div>

      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
           <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <h3 className="font-semibold text-slate-900">Upload Document</h3>
                  <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
               </div>
               <div className="p-6">
                   <FileUpload onFileSelect={handleFileUpload} label="Select File" />
               </div>
           </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={!!deleteId}
        onClose={() => { setDeleteId(null); setDeleteType(null); }}
        onConfirm={handleConfirmDelete}
        title={`Delete ${deleteType === 'FILE' ? 'Document' : 'Category'}`}
        message={`Are you sure you want to delete this ${deleteType === 'FILE' ? 'document' : 'category'}? This action cannot be undone.`}
        confirmText="Delete"
        isDangerous={true}
      />
    </div>
  );
};

export default Organization;
