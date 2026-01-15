
import React, { useState, useContext } from 'react';
import { User, UserRole, UserPermission, WorkOrderPriority, WorkOrderStatus, WorkOrderType } from '../../types';
import { UserContext } from '../../context/UserContext';
import { DataContext } from '../../context/DataContext';
import { Plus, Search, Trash2, Edit2, Shield, Mail, User as UserIcon, X, Check, Lock, Key, Settings, ClipboardList, ChevronDown, Calendar, AlertTriangle, Send, RefreshCw, History, Copy } from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/apiClient';
import UserTaskLogModal from '../shared/UserTaskLogModal';
import ConfirmationModal from '../shared/ConfirmationModal';

const DEFAULT_PERMISSIONS: Record<UserRole, UserPermission[]> = {
  [UserRole.ADMIN]: [
    UserPermission.MANAGE_TEAM,
    UserPermission.VIEW_ANALYTICS,
    UserPermission.MANAGE_WORK_ORDERS,
    UserPermission.MANAGE_ASSETS,
    UserPermission.MANAGE_INVENTORY,
    UserPermission.SEND_MESSAGES,
    UserPermission.MESSAGE_ANYONE
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
  [UserPermission.MESSAGE_ANYONE]: 'Message Any User (Direct)',
};

interface UserManagementProps {
  embedded?: boolean;
}

const UserManagement: React.FC<UserManagementProps> = ({ embedded = false }) => {
  const { user: currentUser } = useContext(UserContext);
  const { users, addUser, updateUser, deleteUser, addWorkOrder, addActivityLog, assets } = useContext(DataContext);

  const [searchQuery, setSearchQuery] = useState('');

  // Bulk Actions State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modals State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // View Log State
  const [viewingLogUser, setViewingLogUser] = useState<User | null>(null);
  const [viewingLogTab, setViewingLogTab] = useState<'LOGS' | 'TASKS'>('TASKS');

  // Forms State
  const [userFormData, setUserFormData] = useState<{
    name: string;
    email: string;
    role: UserRole;
    permissions: UserPermission[];
    status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  }>({
    name: '',
    email: '',
    role: UserRole.TECHNICIAN,
    permissions: DEFAULT_PERMISSIONS[UserRole.TECHNICIAN],
    status: 'ACTIVE'
  });

  const [taskFormData, setTaskFormData] = useState({
    title: '',
    description: '',
    priority: WorkOrderPriority.MEDIUM,
    dueDate: '',
    assetId: ''
  });

  // Access Control Check
  const canManageTeam = currentUser?.role === UserRole.ADMIN || currentUser?.permissions?.includes(UserPermission.MANAGE_TEAM);

  // If not embedded and no permission, block entire view
  if (!embedded && !canManageTeam) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500 bg-white rounded-xl border border-slate-200">
        <Lock className="w-12 h-12 mb-4 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-900">Access Denied</h2>
        <p>You do not have permission to manage the team.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredUsers.map(u => u.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkDeactivate = () => {
    if (!canManageTeam) {
      toast.error("Permission denied");
      return;
    }
    const count = selectedIds.size;
    if (count === 0) return;

    if (window.confirm(`Are you sure you want to deactivate ${count} users?`)) {
      users.forEach(u => {
        if (selectedIds.has(u.id)) {
          updateUser({ ...u, status: 'INACTIVE' });
        }
      });
      setSelectedIds(new Set());
      toast.success(`${count} users deactivated`);
    }
  };

  const handleBulkAssignRole = (newRole: UserRole) => {
    if (!canManageTeam) {
      toast.error("Permission denied");
      return;
    }
    const count = selectedIds.size;
    if (count === 0) return;

    if (window.confirm(`Assign role "${newRole}" to ${count} users?`)) {
      users.forEach(u => {
        if (selectedIds.has(u.id)) {
          updateUser({
            ...u,
            role: newRole,
            permissions: DEFAULT_PERMISSIONS[newRole]
          });
        }
      });
      setSelectedIds(new Set());
      toast.success(`Role updated for ${count} users`);
    }
  };

  const handleOpenEditModal = (userToEdit?: User) => {
    if (!canManageTeam) {
      toast.error("You do not have permission to edit users.");
      return;
    }

    if (userToEdit) {
      setSelectedUser(userToEdit);
      setUserFormData({
        name: userToEdit.name,
        email: userToEdit.email,
        role: userToEdit.role,
        permissions: userToEdit.permissions || DEFAULT_PERMISSIONS[userToEdit.role],
        status: userToEdit.status || 'ACTIVE'
      });
    } else {
      setSelectedUser(null);
      setUserFormData({
        name: '',
        email: '',
        role: UserRole.TECHNICIAN,
        permissions: DEFAULT_PERMISSIONS[UserRole.TECHNICIAN],
        status: 'PENDING' // Default to PENDING for new invites
      });
    }
    setIsEditModalOpen(true);
  };

  const handleOpenTaskModal = (user: User) => {
    // Basic task assignment might be allowed for non-admins in some contexts, 
    // but for now we restrict to team managers within this component
    if (!canManageTeam) {
      toast.error("Permission denied");
      return;
    }
    setSelectedUser(user);
    setTaskFormData({
      title: '',
      description: '',
      priority: WorkOrderPriority.MEDIUM,
      dueDate: '',
      assetId: assets[0]?.id || ''
    });
    setIsTaskModalOpen(true);
  };

  const handleRoleChange = (role: UserRole) => {
    setUserFormData({
      ...userFormData,
      role,
      permissions: DEFAULT_PERMISSIONS[role]
    });
  };

  const togglePermission = (permission: UserPermission) => {
    const current = userFormData.permissions;
    const exists = current.includes(permission);
    if (exists) {
      setUserFormData({ ...userFormData, permissions: current.filter(p => p !== permission) });
    } else {
      setUserFormData({ ...userFormData, permissions: [...current, permission] });
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageTeam) {
      toast.error("Permission denied");
      return;
    }

    if (selectedUser) {
      updateUser({ ...selectedUser, ...userFormData });
      toast.success('User updated successfully');
    } else {
      // Invite New User via API
      try {
        const response = await api.post('/auth/invite', {
          email: userFormData.email,
          role: userFormData.role,
          permissions: userFormData.permissions
        });

        const { inviteLink } = response;

        // Optimistically add to UI as Pending
        const newUser: User = {
          id: `invite-${Date.now()}`,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(userFormData.name)}&background=random`,
          ...userFormData,
          status: 'PENDING'
        };
        addUser(newUser);

        setIsEditModalOpen(false);

        // Show Invite Link
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
            <div className="flex-1 w-0 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <Mail className="h-10 w-10 text-primary" />
                </div>
                <div className="ml-3 flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Invitation Created!
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    Share this link with {userFormData.name}:
                  </p>
                  <div className="mt-2 flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200">
                    <code className="text-xs text-slate-600 truncate flex-1">{inviteLink}</code>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLink);
                        toast.success("Link copied!");
                      }}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-200">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-primary hover:text-primary-focus focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        ), { duration: 10000 });

      } catch (error: any) {
        console.error("Invite Error", error);
        toast.error(error.message || "Failed to create invitation");
      }
    }
    setIsEditModalOpen(false);
  };

  const handleResendInvite = (user: User) => {
    if (!canManageTeam) return;
    toast.success(`Invitation resent to ${user.email}`);
    addActivityLog({
      id: `log-${Date.now()}`,
      userId: currentUser?.id || 'sys',
      action: 'Resent Invitation',
      type: 'SYSTEM',
      target: user.email,
      timestamp: new Date().toISOString()
    });
  };

  const handleAssignTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageTeam) return;

    if (!selectedUser) return;
    if (!taskFormData.title || !taskFormData.dueDate || !taskFormData.assetId) {
      toast.error("Please fill required fields");
      return;
    }

    const newWO = {
      id: `wo-${Date.now()}`,
      title: taskFormData.title,
      description: taskFormData.description,
      assetId: taskFormData.assetId,
      assignedToId: selectedUser.id,
      requestedById: currentUser?.id || 'admin',
      status: WorkOrderStatus.PENDING,
      priority: taskFormData.priority,
      type: WorkOrderType.REACTIVE,
      dueDate: taskFormData.dueDate,
      createdAt: new Date().toISOString().split('T')[0]
    };

    addWorkOrder(newWO);
    addActivityLog({
      id: `log-${Date.now()}`,
      userId: currentUser?.id || 'sys',
      action: 'Assigned Task',
      type: 'SYSTEM',
      target: `${taskFormData.title} -> ${selectedUser.name}`,
      timestamp: new Date().toISOString()
    });

    toast.success(`Task assigned to ${selectedUser.name}`);
    setIsTaskModalOpen(false);
  };

  const confirmDeleteUser = (userId: string) => {
    if (!canManageTeam) return;
    if (userId === currentUser?.id) {
      toast.error("You cannot delete your own account.");
      return;
    }
    setUserToDelete(userId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteUser = () => {
    if (!canManageTeam) {
      toast.error("Permission denied");
      return;
    }
    if (userToDelete) {
      deleteUser(userToDelete);
      toast.success('User removed successfully');
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const isAllSelected = filteredUsers.length > 0 && selectedIds.size === filteredUsers.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < filteredUsers.length;

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Team Management</h1>
            <p className="text-sm text-slate-500">Manage user access, roles, and assign tasks.</p>
          </div>
          {canManageTeam && (
            <button
              onClick={() => handleOpenEditModal()}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors shadow-sm font-medium"
            >
              <Mail className="w-4 h-4" />
              Invite User
            </button>
          )}
        </div>
      )}

      {embedded && (
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Users Directory</h3>
          {canManageTeam && (
            <button
              onClick={() => handleOpenEditModal()}
              className="flex items-center gap-2 bg-primary text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors shadow-sm text-sm font-medium"
            >
              <Mail className="w-3 h-3" />
              Invite User
            </button>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Bulk Action Toolbar */}
        {selectedIds.size > 0 && canManageTeam ? (
          <div className="p-4 border-b border-slate-200 bg-secondary/10 flex flex-wrap gap-4 items-center animate-in slide-in-from-top-2 duration-200">
            <span className="text-sm font-semibold text-secondary-800 bg-white px-3 py-1 rounded-full border border-secondary/20 shadow-sm">
              {selectedIds.size} Selected
            </span>
            <div className="h-4 w-px bg-secondary/30 mx-2 hidden sm:block"></div>

            <button
              onClick={handleBulkDeactivate}
              className="text-sm font-medium text-slate-700 hover:text-red-600 bg-white px-3 py-1.5 rounded-md border border-slate-200 hover:border-red-200 hover:bg-red-50 transition-all flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Deactivate
            </button>

            <div className="relative group">
              <button className="text-sm font-medium text-slate-700 bg-white px-3 py-1.5 rounded-md border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2">
                <Shield className="w-4 h-4 text-indigo-500" />
                Assign Role
                <ChevronDown className="w-3 h-3" />
              </button>
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 hidden group-hover:block z-20">
                {Object.values(UserRole).map(role => (
                  <button
                    key={role}
                    onClick={() => handleBulkAssignRole(role)}
                    className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
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
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-900 font-semibold border-b border-slate-200">
              <tr>
                {canManageTeam && (
                  <th className="px-6 py-4 w-12">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer"
                        checked={isAllSelected}
                        ref={input => {
                          if (input) input.indeterminate = isIndeterminate;
                        }}
                        onChange={handleSelectAll}
                      />
                    </div>
                  </th>
                )}
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className={`hover:bg-slate-50 transition-colors group ${selectedIds.has(user.id) ? 'bg-slate-50/80' : ''}`}>
                  {canManageTeam && (
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary cursor-pointer"
                        checked={selectedIds.has(user.id)}
                        onChange={() => handleSelectOne(user.id)}
                      />
                    </td>
                  )}
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
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${user.role === UserRole.ADMIN ? 'bg-purple-50 text-purple-700 border-purple-200' :
                      user.role === UserRole.TECHNICIAN ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        user.role === UserRole.VENDOR ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          'bg-green-50 text-green-700 border-green-200'
                      }`}>
                      {user.role === UserRole.ADMIN && <Shield className="w-3 h-3 mr-1" />}
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.status === 'PENDING' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                        Pending Invite
                      </span>
                    ) : user.status === 'INACTIVE' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        Inactive
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {canManageTeam && (
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {user.status === 'PENDING' && (
                          <button
                            onClick={() => handleResendInvite(user)}
                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Resend Invitation"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenTaskModal(user)}
                          className="p-2 text-slate-400 hover:text-green-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Assign Task"
                        >
                          <ClipboardList className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setViewingLogUser(user);
                            setViewingLogTab('TASKS');
                          }}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
                          title="View Assigned Tasks"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setViewingLogUser(user);
                            setViewingLogTab('LOGS');
                          }}
                          className="p-2 text-slate-400 hover:text-purple-600 hover:bg-slate-100 rounded-lg transition-colors"
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
                          onClick={() => confirmDeleteUser(user.id)}
                          className="p-2 text-slate-400 hover:text-danger hover:bg-slate-100 rounded-lg transition-colors"
                          title="Remove User"
                          disabled={user.id === currentUser?.id}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {!canManageTeam && <span className="text-xs text-slate-400 italic">View Only</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h3 className="font-semibold text-slate-900">{selectedUser ? 'Edit User & Permissions' : 'Invite New Team Member'}</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveUser} className="p-6 space-y-6">
              {!selectedUser && (
                <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-800 flex gap-2">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  An invitation email will be sent to the user with a link to set up their account.
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input required type="text" value={userFormData.name} onChange={e => setUserFormData({ ...userFormData, name: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <input required type="email" value={userFormData.email} onChange={e => setUserFormData({ ...userFormData, email: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Role</label>
                <div className="flex gap-2 flex-wrap">
                  {Object.values(UserRole).map(role => (
                    <button key={role} type="button" onClick={() => handleRoleChange(role)} className={`px-3 py-2 rounded-md border text-xs font-bold ${userFormData.role === role ? 'bg-secondary/10 border-secondary text-secondary-700' : 'bg-slate-50 border-slate-200'}`}>{role}</button>
                  ))}
                </div>
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
                          checked={userFormData.permissions.includes(permission)}
                          onChange={() => togglePermission(permission)}
                          className="peer sr-only"
                        />
                        <div className="w-5 h-5 bg-white border-2 border-slate-300 rounded peer-checked:bg-primary peer-checked:border-primary transition-colors"></div>
                        <Check className="w-3 h-3 text-white absolute top-1 left-1 opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                      </div>
                      <span className={`text-sm ${userFormData.permissions.includes(permission) ? 'text-slate-900 font-medium' : 'text-slate-600'}`}>
                        {PERMISSION_LABELS[permission]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 px-4 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg flex items-center justify-center gap-2">
                  {selectedUser ? 'Save Changes' : (
                    <>
                      <Send className="w-3 h-3" /> Send Invitation
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Task Assignment Modal */}
      {isTaskModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-semibold text-slate-900">Assign Task</h3>
              <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAssignTask} className="p-6 space-y-4">
              <div className="bg-blue-50 p-3 rounded-lg flex items-center gap-3 mb-4">
                <img src={selectedUser.avatar} alt={selectedUser.name} className="w-8 h-8 rounded-full" />
                <div>
                  <p className="text-xs text-blue-600 font-bold uppercase">Assigning to</p>
                  <p className="text-sm font-medium text-blue-900">{selectedUser.name}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Task Title</label>
                <input required type="text" value={taskFormData.title} onChange={e => setTaskFormData({ ...taskFormData, title: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="e.g. Update Safety Logs" />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Target Asset</label>
                <select value={taskFormData.assetId} onChange={e => setTaskFormData({ ...taskFormData, assetId: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white">
                  <option value="">Select Asset...</option>
                  {assets.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                  <input required type="date" value={taskFormData.dueDate} onChange={e => setTaskFormData({ ...taskFormData, dueDate: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Priority</label>
                  <select value={taskFormData.priority} onChange={e => setTaskFormData({ ...taskFormData, priority: e.target.value as WorkOrderPriority })} className="w-full px-4 py-2 border border-slate-300 rounded-lg">
                    {Object.values(WorkOrderPriority).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea rows={3} value={taskFormData.description} onChange={e => setTaskFormData({ ...taskFormData, description: e.target.value })} className="w-full px-4 py-2 border border-slate-300 rounded-lg" placeholder="Details about the task..." />
              </div>

              <button type="submit" className="w-full py-2 bg-primary text-white rounded-lg font-medium hover:bg-slate-800 transition-colors">Assign Task</button>
            </form>
          </div>
        </div>
      )}

      {/* View Logs/Tasks Modal */}
      {viewingLogUser && (
        <UserTaskLogModal
          user={viewingLogUser}
          onClose={() => setViewingLogUser(null)}
          initialTab={viewingLogTab}
        />
      )}

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message="Are you sure you want to permanently delete this user? This action cannot be undone."
        confirmText="Delete User"
        isDangerous={true}
      />
    </div>
  );
};

export default UserManagement;
