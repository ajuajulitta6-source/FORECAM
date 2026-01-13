
import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../../context/UserContext';
import { DataContext } from '../../context/DataContext';
import { X, Camera, Mail, Shield, User, Save, Check } from 'lucide-react';
import FileUpload from '../ui/FileUpload';
import toast from 'react-hot-toast';

interface ProfileModalProps {
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ onClose }) => {
  const { user, updateProfile } = useContext(UserContext);
  const { updateUser } = useContext(DataContext);
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    avatar: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        avatar: user.avatar
      });
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const updates = {
        name: formData.name,
        avatar: formData.avatar
        // Email usually requires re-verification, keeping simplistic for now
      };

      // 1. Update Backend/Data Context
      await updateUser({ ...user, ...updates });

      // 2. Update Local Session
      updateProfile(updates);

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
    }
  };

  const handleAvatarChange = async (file: File) => {
    // Convert to Base64 for persistence in this demo environment
    // In a production app with storage, you would upload the file and get a URL
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
      setFormData(prev => ({ ...prev, avatar: base64 }));
    } catch (error) {
      console.error("Error converting image:", error);
      toast.error("Failed to process image");
    }
  };

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        
        {/* Header Background */}
        <div className="h-32 bg-gradient-to-r from-slate-800 to-slate-900 relative">
           <button 
              onClick={onClose}
              className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-1 rounded-full transition-colors backdrop-blur-sm"
           >
              <X className="w-5 h-5" />
           </button>
        </div>

        {/* Avatar Section */}
        <div className="px-8 relative -mt-12 mb-6 flex justify-between items-end">
           <div className="relative group">
              <img 
                src={formData.avatar} 
                alt="Profile" 
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg object-cover bg-white"
              />
              {isEditing && (
                 <div className="absolute bottom-0 right-0">
                    <label className="bg-white text-slate-700 p-1.5 rounded-full shadow-md border border-slate-200 cursor-pointer hover:bg-slate-50 flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
                       <Camera className="w-4 h-4" />
                       <input type="file" className="hidden" accept="image/*" onChange={(e) => e.target.files?.[0] && handleAvatarChange(e.target.files[0])} />
                    </label>
                 </div>
              )}
           </div>
           
           {!isEditing ? (
             <button 
               onClick={() => setIsEditing(true)}
               className="mb-2 text-sm font-medium text-primary hover:text-secondary underline decoration-dotted underline-offset-4"
             >
               Edit Profile
             </button>
           ) : (
             <div className="flex gap-2 mb-2">
                <button 
                  onClick={() => { setIsEditing(false); setFormData({ name: user.name, email: user.email, avatar: user.avatar }); }}
                  className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="text-xs px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-slate-800 flex items-center gap-1"
                >
                  <Save className="w-3 h-3" /> Save
                </button>
             </div>
           )}
        </div>

        {/* Content */}
        <div className="px-8 pb-8 space-y-6">
           {isEditing ? (
             <div className="space-y-4 animate-in slide-in-from-left-2 duration-200">
                <div>
                   <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Full Name</label>
                   <input 
                     type="text" 
                     value={formData.name} 
                     onChange={e => setFormData({...formData, name: e.target.value})}
                     className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none"
                   />
                </div>
                <div>
                   <label className="block text-xs font-semibold text-slate-500 uppercase mb-1">Email Address</label>
                   <input 
                     type="email" 
                     value={formData.email} 
                     disabled
                     className="w-full px-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg cursor-not-allowed"
                     title="Contact admin to change email"
                   />
                   <p className="text-[10px] text-slate-400 mt-1">Email cannot be changed.</p>
                </div>
             </div>
           ) : (
             <div>
                <h2 className="text-2xl font-bold text-slate-900">{user.name}</h2>
                <div className="flex items-center gap-2 mt-1">
                   <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {user.role}
                   </span>
                   <span className="text-sm text-slate-500">{user.status === 'ACTIVE' ? 'Active' : 'Inactive'}</span>
                </div>
             </div>
           )}

           <div className="border-t border-slate-100 pt-6 space-y-4">
              <div className="flex items-center gap-3 text-slate-600">
                 <div className="p-2 bg-slate-100 rounded-lg">
                    <Mail className="w-4 h-4" />
                 </div>
                 <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Email</p>
                    <p className="text-sm font-medium">{user.email}</p>
                 </div>
              </div>

              <div className="flex items-center gap-3 text-slate-600">
                 <div className="p-2 bg-slate-100 rounded-lg">
                    <Shield className="w-4 h-4" />
                 </div>
                 <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">User ID</p>
                    <p className="text-sm font-medium font-mono">{user.id}</p>
                 </div>
              </div>
              
              <div className="flex items-center gap-3 text-slate-600">
                 <div className="p-2 bg-slate-100 rounded-lg">
                    <User className="w-4 h-4" />
                 </div>
                 <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Permissions</p>
                    <p className="text-sm font-medium">
                       {user.permissions?.length || 0} capabilities assigned
                    </p>
                 </div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileModal;
