import React, { useState, useContext } from 'react';
import { User, UserRole, UserPermission, ActivityType } from '../types';
import { MOCK_USERS, MOCK_ACTIVITY_LOGS } from '../constants';
import { UserContext } from '../context/UserContext';
import { Plus, Search, MoreVertical, Trash2, Edit2, Shield, Mail, User as UserIcon, X, Check, Lock, Key, History, Activity, Clock, FileText, Settings } from 'lucide-react';
import toast from 'react-hot-toast';

const DEFAULT_PERMISSIONS: Record<UserRole, UserPermission[]> = {
  [UserRole.ADMIN]: [
    UserPermission.MANAGE_TEAM,
    UserPermission.VIEW_ANALYTICS,
    UserPermission.MANAGE_WORK_ORDERS,
    UserPermission.MANAGE_ASSETS,
    UserPermission.MANAGE_INVENTORY,
    UserPermission.SEND_MESSAGES
  ],
  [UserRole.TECHNICIAN]: [
    UserPermission.MANAGE_WORK_ORDERS,
    UserPermission.MANAGE_ASSETS,
    UserPermission.MANAGE_INVENTORY,
    UserPermission.SEND_MESSAGES
  ],
  [UserRole.CLIENT]: [
    UserPermission.MANAGE_WORK_ORDERS,
    UserPermission.SEND_MESSAGES
  ],
  [UserRole.CONTRACTOR]: [
    UserPermission.MANAGE_WORK_ORDERS,
    UserPermission.SEND_MESSAGES
  ],
  [UserRole.VENDOR]: [
    UserPermission.SEND_MESSAGES
  ]
};

const PERMISSION_LABELS: Record<UserPermission, string> = {
  [UserPermission.MANAGE_TEAM]: 'Manage Team & Users',
  [UserPermission.VIEW_ANALYTICS]: 'View Analytics Dashboard',
  [UserPermission.MANAGE_WORK_ORDERS]: 'Manage Work Orders',
  [UserPermission.MANAGE_ASSETS]: 'Manage Assets Registry',
  [UserPermission.MANAGE_INVENTORY]: 'Manage Inventory',
  [UserPermission.SEND_MESSAGES]: 'Send & Receive Messages',
  [UserPermission.MESSAGE_ANYONE]: 'Message Any User',
};

const UserManagement: React.FC = () => {
  const { user: currentUser } = useContext(UserContext);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [historyUser, setHistoryUser] = useState<User | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    role: UserRole;
    permissions: UserPermission[];
  }>({
    name: '',
    email: '',
    role: UserRole.TECHNICIAN,
    permissions: DEFAULT_PERMISSIONS[UserRole.TECHNICIAN]
  });

  // Access Control Check
  const canManageTeam = currentUser?.role === UserRole.ADMIN || currentUser?.permissions?.includes(UserPermission.MANAGE_TEAM);

  if (!canManageTeam) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <Lock className="w-12 h-12 mb-4 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-900">Access Denied</h2>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenEditModal = (userToEdit?: User) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        name: userToEdit.name,
        email: userToEdit.email,
        role: userToEdit.role,
        permissions: userToEdit.permissions || DEFAULT_PERMISSIONS[userToEdit.role]
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: UserRole.TECHNICIAN,
        permissions: DEFAULT_PERMISSIONS[UserRole.TECHNICIAN]
      });
    }
    setIsEditModalOpen(true);
  };

  const handleOpenHistoryModal = (user: User) => {
    if (!canManageTeam) {
      toast.error("You do not have permission to view activity logs.");
      return;
    }
    setHistoryUser(user);
    setIsHistoryModalOpen(true);
  };

  const handleRoleChange = (role: UserRole) => {
    setFormData({
      ...formData,
      role,
      permissions: DEFAULT_PERMISSIONS[role]
    });
  };

  const togglePermission = (permission: UserPermission) => {
    const current = formData.permissions;
    const exists = current.includes(permission);
    if (exists) {
      setFormData({ ...formData, permissions: current.filter(p => p !== permission) });
    } else {
      setFormData({ ...formData, permissions: [...current, permission] });
    }
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Security Check
    if (!canManageTeam) {
      toast.error("You do not have permission to perform this action.");
      return;
    }

    if (editingUser) {
      // Edit Mode
      setUsers(users.map(u => u.id === editingUser.id ? { ...u, ...formData } : u));
      toast.success('User updated successfully');
    } else {
      // Add Mode
      const newUser: User = {
        id: `u-${Date.now()}`,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.name)}&background=random`,
        ...formData
      };
      setUsers([...users, newUser]);
      toast.success('User added successfully');
    }
    setIsEditModalOpen(false);
  };

  const handleDeleteUser = (userId: string) => {
    // Security Check
    if (!canManageTeam) {
      toast.error("You do not have permission to perform this action.");
      return;
    }

    if (userId === currentUser?.id) {
      toast.error("You cannot delete your own account.");
      return;
    }
    if (window.confirm("Are you sure you want to remove this user?")) {
      setUsers(users.filter(u => u.id !== userId));
      toast.success('User removed successfully');
    }
  };

  // Helper for History Icons
  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'CREATE': return <Plus className="w-4 h-4 text-green-600" />;
      case 'UPDATE': return <Edit2 className="w-4 h-4 text-blue-600" />;
      case 'DELETE': return <Trash2 className="w-4 h-4 text-red-600" />;
      case 'LOGIN': return <Key className="w-4 h-4 text-purple-600" />;
      case 'SYSTEM': return <Settings className="w-4 h-4 text-slate-600" />;
      default: return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Management</h1>
          <p className="text-sm text-slate-500">Manage user access, roles, and granular permissions.</p>
        </div>
        <button 
          onClick={() => handleOpenEditModal()}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
      </div>

      {/* Filters & Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-secondary/50 focus:border-secondary outline-none bg-white"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Permissions</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm" />
                      <div>
                        <div className="font-medium text-slate-900">{user.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      user.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      user.role === UserRole.TECHNICIAN ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-green-50 text-green-700 border-green-200'
                    }`}>
                      {user.role === UserRole.ADMIN && <Shield className="w-3 h-3 mr-1" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                     <div className="flex flex-wrap gap-1 max-w-xs">
                       {user.permissions && user.permissions.length > 0 ? (
                         <>
                           <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-600">
                             {user.permissions.length} Access Rights
                           </span>
                           {user.permissions.includes(UserPermission.MANAGE_TEAM) && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-600" title="Team Manager">
                                Team
                              </span>
                           )}
                         </>
                       ) : (
                         <span className="text-slate-400 text-xs italic">No specific permissions</span>
                       )}
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenHistoryModal(user)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View Activity Log"
                      >
                        <History className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleOpenEditModal(user)}
                        className="p-2 text-slate-400 hover:text-secondary hover:bg-slate-100 rounded-lg transition-colors"
                        title="Edit User"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 text-slate-400 hover:text-danger hover:bg-slate-100 rounded-lg transition-colors"
                        title="Remove User"
                        disabled={user.id === currentUser?.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center">
                      <UserIcon className="w-12 h-12 text-slate-300 mb-3" />
                      <p className="text-lg font-medium text-slate-900">No users found</p>
                      <p className="text-sm">Try adjusting your search query.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h3 className="font-semibold text-slate-900">{editingUser ? 'Edit User & Permissions' : 'Add New User'}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveUser} className="p-6 space-y-6">
              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <UserIcon className="w-3 h-3" />
                  Basic Information
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                    <input
                      required
                      type="text"
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                    <input
                      required
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-3 h-3" />
                  Role Assignment
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  {[UserRole.ADMIN, UserRole.TECHNICIAN, UserRole.CLIENT, UserRole.CONTRACTOR, UserRole.VENDOR].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleChange(role)}
                      className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-medium transition-all ${
                        formData.role === role 
                          ? 'border-secondary bg-secondary/10 text-secondary-700 ring-1 ring-secondary shadow-sm' 
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="uppercase tracking-wider font-bold">{role}</span>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500">
                  Changing the role will reset permissions to defaults.
                </p>
              </div>

              <div className="space-y-4">
                 <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Key className="w-3 h-3" />
                  Granular Permissions
                </h4>
                <div className="space-y-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                  {Object.values(UserPermission).map((permission) => (
                    <label key={permission} className="flex items-center space-x-3 cursor-pointer group">
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(permission)}
                          onChange={() => togglePermission(permission)}
                          className="peer sr-only"
                        />
                        <div className="w-5 h-5 bg-white border-2 border-slate-300 rounded peer-checked:bg-primary peer-checked:border-primary transition-colors"></div>
                        <Check className="w-3 h-3 text-white absolute top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                      <span className={`text-sm ${formData.permissions.includes(permission) ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                        {PERMISSION_LABELS[permission]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activity History Modal */}
      {isHistoryModalOpen && historyUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg h-[600px] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                 <div className="bg-primary/5 p-2 rounded-full">
                    <History className="w-5 h-5 text-primary" />
                 </div>
                 <div>
                    <h3 className="font-semibold text-slate-900">Activity Log</h3>
                    <p className="text-xs text-slate-500">History for <span className="font-medium">{historyUser.name}</span></p>
                 </div>
              </div>
              <button onClick={() => setIsHistoryModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-6">
               <div className="relative border-l border-slate-200 ml-3 space-y-6">
                  {MOCK_ACTIVITY_LOGS.filter(log => log.userId === historyUser.id).length === 0 && (
                     <div className="ml-6 flex flex-col items-center justify-center text-slate-400 py-12">
                        <Clock className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">No activity recorded for this user.</p>
                     </div>
                  )}

                  {MOCK_ACTIVITY_LOGS.filter(log => log.userId === historyUser.id).map((log, index) => (
                    <div key={log.id} className="relative ml-6">
                       <span className="absolute -left-9 top-1 bg-white ring-4 ring-white rounded-full">
                          <div className={`p-1.5 rounded-full ${
                            log.type === 'CREATE' ? 'bg-green-100' : 
                            log.type === 'DELETE' ? 'bg-red-100' : 
                            log.type === 'LOGIN' ? 'bg-purple-100' :
                            'bg-blue-100'
                          }`}>
                             {getActivityIcon(log.type)}
                          </div>
                       </span>
                       <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 hover:shadow-sm transition-shadow">
                          <div className="flex justify-between items-start mb-1">
                             <h4 className="text-sm font-semibold text-slate-900">{log.action}</h4>
                             <span className="text-xs text-slate-400 whitespace-nowrap ml-2">
                                {new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                             </span>
                          </div>
                          {log.target && (
                             <div className="flex items-center gap-1.5 mt-1">
                                <FileText className="w-3 h-3 text-slate-400" />
                                <p className="text-xs text-slate-600 font-medium">{log.target}</p>
                             </div>
                          )}
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
               <button 
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium hover:bg-slate-50 transition-colors text-sm"
               >
                  Close
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;