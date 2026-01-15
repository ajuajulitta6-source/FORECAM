
import React, { useState, useContext, useMemo, useEffect } from 'react';
import { DataContext } from '../../context/DataContext';
import { UserContext } from '../../context/UserContext';
import { Message, UserRole, UserPermission } from '../../types';
import { Send, Mail, CheckCircle, AlertTriangle, MessageSquare, Plus, Search, User as UserIcon, Lock } from 'lucide-react';
import toast from 'react-hot-toast';

const MessageCenter: React.FC = () => {
    const { messages, addMessage, markMessageRead, workOrders, users } = useContext(DataContext);
    const { user } = useContext(UserContext);

    const [activeTab, setActiveTab] = useState<'INBOX' | 'SENT'>('INBOX');
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

    const [composeForm, setComposeForm] = useState({
        receiverId: '',
        subject: '',
        body: '',
        type: 'GENERAL' as Message['type'],
        relatedEntityId: ''
    });

    const canMessageAnyone = user?.role === UserRole.ADMIN || user?.permissions?.includes(UserPermission.MESSAGE_ANYONE);

    // Set default receiver based on permission when modal opens
    useEffect(() => {
        if (isComposeOpen) {
            if (!canMessageAnyone) {
                setComposeForm(prev => ({ ...prev, receiverId: 'ADMIN' }));
            } else {
                setComposeForm(prev => ({ ...prev, receiverId: '' }));
            }
        }
    }, [isComposeOpen, canMessageAnyone]);

    // Clear selected message when tab changes
    useEffect(() => {
        setSelectedMessage(null);
    }, [activeTab]);

    const myMessages = useMemo(() => {
        if (!user) return [];

        return messages.filter(m => {
            // If admin, they see all messages sent to ADMIN
            if (user.role === UserRole.ADMIN && m.receiverId === 'ADMIN') return true;
            // Normal filtering
            return m.receiverId === user.id || m.senderId === user.id;
        }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    }, [messages, user]);

    const filteredMessages = myMessages.filter(m => {
        // Inbox logic: Receiver is Me OR (Me is Admin AND Receiver is 'ADMIN') OR Receiver is 'ALL'
        // Sent logic: Sender is Me
        const isInbox = activeTab === 'INBOX' ? (
            m.receiverId === user?.id ||
            m.receiverId === 'ALL' ||
            (user?.role === UserRole.ADMIN && m.receiverId === 'ADMIN')
        ) : m.senderId === user?.id;
        const matchesSearch = m.subject.toLowerCase().includes(searchQuery.toLowerCase()) || m.body.toLowerCase().includes(searchQuery.toLowerCase());
        return isInbox && matchesSearch;
    });

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        if (!composeForm.subject || !composeForm.body) {
            toast.error("Subject and body are required");
            return;
        }

        // Ensure receiver ID is set properly based on permissions
        const finalReceiverId = canMessageAnyone ? composeForm.receiverId : 'ADMIN';

        if (!finalReceiverId) {
            toast.error("Please select a recipient");
            return;
        }

        const newMessage: Message = {
            id: `msg-${Date.now()}`,
            senderId: user.id,
            receiverId: finalReceiverId,
            subject: composeForm.subject,
            body: composeForm.body,
            type: composeForm.type,
            relatedEntityId: composeForm.relatedEntityId || undefined,
            isRead: false,
            createdAt: new Date().toISOString()
        };

        addMessage(newMessage); // Optimistic add
        setIsComposeOpen(false);
        setComposeForm({ receiverId: '', subject: '', body: '', type: 'GENERAL', relatedEntityId: '' });
    };

    const getSenderName = (id: string) => {
        const u = users.find(user => user.id === id);
        return u ? u.name : 'Unknown User';
    };

    const getReceiverName = (id: string) => {
        if (id === 'ADMIN') return 'Admin Team';
        if (id === 'ALL') return 'All Users (Broadcast)';
        const u = users.find(user => user.id === id);
        return u ? u.name : 'Unknown User';
    };

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6">
            {/* Sidebar / List */}
            <div className="w-full md:w-1/3 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-lg text-slate-800">Messages</h2>
                        <button
                            onClick={() => setIsComposeOpen(true)}
                            className="bg-primary text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Compose Message"
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="flex gap-2 mb-3">
                        <button
                            onClick={() => setActiveTab('INBOX')}
                            className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${activeTab === 'INBOX' ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/50'}`}
                        >
                            Inbox
                        </button>
                        <button
                            onClick={() => setActiveTab('SENT')}
                            className={`flex-1 text-xs font-bold py-1.5 rounded-md transition-colors ${activeTab === 'SENT' ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:bg-white/50'}`}
                        >
                            Sent
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search messages..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {filteredMessages.length === 0 && (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            <Mail className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            No messages found
                        </div>
                    )}
                    {filteredMessages.map(msg => (
                        <div
                            key={msg.id}
                            className={`p-4 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 ${selectedMessage?.id === msg.id ? 'bg-blue-50 border-l-4 border-l-primary' : ''} ${!msg.isRead && activeTab === 'INBOX' ? 'bg-blue-50/30' : ''}`}
                            onClick={() => {
                                setSelectedMessage(msg);
                                if (!msg.isRead && activeTab === 'INBOX') {
                                    markMessageRead(msg.id);
                                }
                            }}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-xs font-bold text-slate-700 truncate max-w-[120px]">
                                    {activeTab === 'INBOX' ? getSenderName(msg.senderId) : `To: ${getReceiverName(msg.receiverId)}`}
                                </span>
                                <span className="text-[10px] text-slate-400 whitespace-nowrap">
                                    {new Date(msg.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mb-1">
                                {msg.type === 'TASK_COMPLETION' && <CheckCircle className="w-3 h-3 text-green-500" />}
                                {msg.type === 'PROBLEM' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                                {msg.type === 'GENERAL' && <MessageSquare className="w-3 h-3 text-blue-500" />}
                                <h4 className={`text-sm font-medium truncate ${!msg.isRead && activeTab === 'INBOX' ? 'text-slate-900' : 'text-slate-600'}`}>{msg.subject}</h4>
                            </div>
                            <p className="text-xs text-slate-500 line-clamp-2">{msg.body}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main View */}
            <div className="hidden md:flex flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-col">
                {selectedMessage ? (
                    <div className="flex flex-col h-full">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h1 className="text-xl font-bold text-slate-900 mb-2">{selectedMessage.subject}</h1>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-2 text-sm text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                                            <UserIcon className="w-4 h-4 text-slate-400" />
                                            <span className="font-medium">{activeTab === 'INBOX' ? getSenderName(selectedMessage.senderId) : `To: ${getReceiverName(selectedMessage.receiverId)}`}</span>
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {new Date(selectedMessage.createdAt).toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    {selectedMessage.type === 'TASK_COMPLETION' && <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Task Done</span>}
                                    {selectedMessage.type === 'PROBLEM' && <span className="bg-red-100 text-red-700 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Problem</span>}
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 p-6 overflow-y-auto whitespace-pre-wrap text-slate-700 leading-relaxed">
                            {selectedMessage.body}
                        </div>

                        {/* Actions (Reply?) */}
                        {activeTab === 'INBOX' && (
                            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end">
                                <button
                                    onClick={() => {
                                        setComposeForm({
                                            receiverId: selectedMessage.senderId,
                                            subject: `Re: ${selectedMessage.subject}`,
                                            body: `\n\n> On ${new Date(selectedMessage.createdAt).toLocaleString()}, ${getSenderName(selectedMessage.senderId)} wrote:\n> ${selectedMessage.body}\n`,
                                            type: 'GENERAL',
                                            relatedEntityId: ''
                                        });
                                        setIsComposeOpen(true);
                                    }}
                                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:border-primary hover:text-primary rounded-lg transition-colors text-sm font-medium text-slate-600 shadow-sm"
                                >
                                    <Send className="w-4 h-4" /> Reply
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-400 bg-slate-50/30">
                        <div className="text-center max-w-sm">
                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mx-auto mb-4">
                                <Mail className="w-8 h-8 text-slate-300" />
                            </div>
                            <h3 className="text-lg font-semibold text-slate-700 mb-2">Select a message</h3>
                            <p className="text-sm">Choose a message from the sidebar to view details or start a new conversation.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Compose Modal */}
            {isComposeOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-semibold text-slate-900">New Message</h3>
                            <button onClick={() => setIsComposeOpen(false)} className="text-slate-400 hover:text-slate-600"><Plus className="w-5 h-5 rotate-45" /></button>
                        </div>
                        <form onSubmit={handleSend} className="p-6 space-y-4">

                            {/* Recipient Selection */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">To</label>
                                {canMessageAnyone ? (
                                    <select
                                        required
                                        value={composeForm.receiverId}
                                        onChange={(e) => setComposeForm({ ...composeForm, receiverId: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white"
                                    >
                                        <option value="">Select Recipient...</option>
                                        <option value="ADMIN" className="font-bold">Admin Team (All Admins)</option>
                                        {user?.role === UserRole.ADMIN && (
                                            <option value="ALL" className="font-bold text-blue-700">📢 All Users (Broadcast)</option>
                                        )}
                                        {users.filter(u => u.id !== user?.id).map(u => (
                                            <option key={u.id} value={u.id}>
                                                {u.name} ({u.role})
                                            </option>
                                        ))}
                                    </select>
                                ) : (
                                    <div className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500">
                                        <Lock className="w-3.5 h-3.5" />
                                        <span className="text-sm font-medium">Admin Team</span>
                                        <input type="hidden" value="ADMIN" />
                                    </div>
                                )}
                                {!canMessageAnyone && <p className="text-[10px] text-slate-400 mt-1">You can only message administrators directly.</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setComposeForm({ ...composeForm, type: 'TASK_COMPLETION' })} className={`flex-1 py-2 text-xs font-bold rounded border flex items-center justify-center gap-1 ${composeForm.type === 'TASK_COMPLETION' ? 'bg-green-50 border-green-500 text-green-700' : 'border-slate-200'}`}>
                                        <CheckCircle className="w-3 h-3" /> Task Done
                                    </button>
                                    <button type="button" onClick={() => setComposeForm({ ...composeForm, type: 'PROBLEM' })} className={`flex-1 py-2 text-xs font-bold rounded border flex items-center justify-center gap-1 ${composeForm.type === 'PROBLEM' ? 'bg-red-50 border-red-500 text-red-700' : 'border-slate-200'}`}>
                                        <AlertTriangle className="w-3 h-3" /> Problem
                                    </button>
                                    <button type="button" onClick={() => setComposeForm({ ...composeForm, type: 'GENERAL' })} className={`flex-1 py-2 text-xs font-bold rounded border flex items-center justify-center gap-1 ${composeForm.type === 'GENERAL' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-slate-200'}`}>
                                        <MessageSquare className="w-3 h-3" /> General
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
                                <input
                                    required
                                    type="text"
                                    value={composeForm.subject}
                                    onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                                    placeholder={composeForm.type === 'TASK_COMPLETION' ? "Completed Order #123" : "Subject..."}
                                />
                            </div>

                            {composeForm.type === 'TASK_COMPLETION' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Related Work Order</label>
                                    <select
                                        value={composeForm.relatedEntityId}
                                        onChange={(e) => setComposeForm({ ...composeForm, relatedEntityId: e.target.value })}
                                        className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-white"
                                    >
                                        <option value="">Select Work Order...</option>
                                        {workOrders.filter(wo => wo.assignedToId === user?.id).map(wo => (
                                            <option key={wo.id} value={wo.id}>{wo.id} - {wo.title}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={composeForm.body}
                                    onChange={(e) => setComposeForm({ ...composeForm, body: e.target.value })}
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg"
                                    placeholder="Type your message here..."
                                />
                            </div>

                            <button type="submit" className="w-full py-2 bg-primary text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
                                <Send className="w-4 h-4" /> Send Message
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MessageCenter;
