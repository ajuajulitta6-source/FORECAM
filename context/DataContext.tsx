
import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { User, WorkOrder, ActivityLogEntry, Asset, InventoryItem, Vendor, WorkRequest, DocFile, SystemCategory, MaterialRequest, ServiceBroadcast, Message } from '../types';
import { MOCK_USERS, MOCK_WORK_ORDERS, MOCK_ACTIVITY_LOGS, MOCK_VENDORS, MOCK_REQUESTS, MOCK_DOCUMENTS, MOCK_CATEGORIES, MOCK_MESSAGES } from '../constants';
import toast from 'react-hot-toast';
import { api } from '../lib/apiClient';
import { supabase } from '../lib/supabaseClient';
import { transformWorkOrderForApi, transformWorkOrderFromApi, transformMessageFromApi } from '../lib/apiTransformers';

interface DataContextType {
  users: User[];
  workOrders: WorkOrder[];
  activityLogs: ActivityLogEntry[];
  assets: Asset[];
  inventory: InventoryItem[];
  vendors: Vendor[];
  requests: WorkRequest[];
  documents: DocFile[];
  categories: SystemCategory[];
  materialRequests: MaterialRequest[];
  serviceBroadcasts: ServiceBroadcast[];
  messages: Message[];
  isLoading: boolean;
  addUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  addWorkOrder: (wo: WorkOrder) => Promise<void>;
  updateWorkOrder: (wo: WorkOrder) => Promise<void>;
  addActivityLog: (log: ActivityLogEntry) => void;
  addInventoryItem: (item: InventoryItem) => void;
  updateInventoryItem: (item: InventoryItem) => void;
  deleteInventoryItem: (id: string) => void;
  consumeInventory: (inventoryId: string, quantity: number) => boolean;
  addAsset: (asset: Asset) => void;
  updateAsset: (asset: Asset) => void;
  deleteAsset: (id: string) => void;
  addVendor: (vendor: Vendor) => void;
  updateVendor: (vendor: Vendor) => void;
  deleteVendor: (id: string) => void;
  addRequest: (req: WorkRequest) => void;
  updateRequest: (req: WorkRequest) => void;
  deleteRequest: (id: string) => void;
  addDocument: (doc: DocFile) => void;
  deleteDocument: (id: string) => void;
  addCategory: (cat: SystemCategory) => void;
  deleteCategory: (id: string) => void;
  addMaterialRequest: (req: MaterialRequest) => void;
  addServiceBroadcast: (req: ServiceBroadcast) => void;
  addMessage: (msg: Message) => void;
  markMessageRead: (id: string) => void;
}

export const DataContext = createContext<DataContextType>({} as DataContextType);

const sendBrowserNotification = (title: string, body: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(title, {
        body: body,
        icon: '/vite.svg',
        vibrate: [200, 100, 200]
      } as NotificationOptions & { vibrate?: number[] });
    } catch (e) {
      console.error("Failed to send notification", e);
    }
  }
};

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);

  // Data State
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(MOCK_WORK_ORDERS);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>(MOCK_ACTIVITY_LOGS);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>(MOCK_VENDORS);
  const [requests, setRequests] = useState<WorkRequest[]>(MOCK_REQUESTS);
  const [documents, setDocuments] = useState<DocFile[]>(MOCK_DOCUMENTS);
  const [categories, setCategories] = useState<SystemCategory[]>(MOCK_CATEGORIES);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [serviceBroadcasts, setServiceBroadcasts] = useState<ServiceBroadcast[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);

  // Initial Fetch & Realtime Subscriptions
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch from API
        const [usersData, woData, assetsData, invData, msgData] = await Promise.all([
          api.get<User[]>('/users').catch(e => { console.log('API Users Error', e); return null; }),
          api.get<any[]>('/work-orders').catch(e => { console.log('API WorkOrders Error', e); return null; }),
          api.get<Asset[]>('/assets').catch(e => { console.log('API Assets Error', e); return null; }),
          api.get<InventoryItem[]>('/inventory').catch(e => { console.log('API Inventory Error', e); return null; }),
          api.get<any[]>('/messages').catch(e => { console.log('API Messages Error', e); return null; })
        ]);

        if (usersData) setUsers(usersData);
        if (woData) setWorkOrders(woData.map(transformWorkOrderFromApi));
        if (assetsData) setAssets(assetsData);
        if (invData) setInventory(invData);
        if (msgData) setMessages(msgData.map(transformMessageFromApi));
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Enable Realtime Subscriptions if supabase client exists
    if (supabase) {
      // Channel for Work Orders
      const workOrderChannel = supabase.channel('public:work_orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'work_orders' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setWorkOrders(prev => [payload.new as WorkOrder, ...prev]);
            toast("New Work Order Created", { icon: '🆕' });
          } else if (payload.eventType === 'UPDATE') {
            setWorkOrders(prev => prev.map(w => w.id === payload.new.id ? payload.new as WorkOrder : w));
          } else if (payload.eventType === 'DELETE') {
            setWorkOrders(prev => prev.filter(w => w.id !== payload.old.id));
          }
        })
        .subscribe();

      // Channel for Inventory
      const inventoryChannel = supabase.channel('public:inventory')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setInventory(prev => [...prev, payload.new as InventoryItem]);
          } else if (payload.eventType === 'UPDATE') {
            setInventory(prev => prev.map(i => i.id === payload.new.id ? payload.new as InventoryItem : i));
          } else if (payload.eventType === 'DELETE') {
            setInventory(prev => prev.filter(i => i.id !== payload.old.id));
          }
        })
        .subscribe();

      // Channel for Messages
      const messagesChannel = supabase.channel('public:messages')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = transformMessageFromApi(payload.new as any);
            // Deduplicate if optimistic update already added it (by id check usually, but optimistic IDs are temporary)
            // Ideally we replace the optimistic one. But here we just append if not exists.
            // Simplified:
            setMessages(prev => {
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [newMsg, ...prev];
            });
            toast("New Message Received", { icon: '📩' });
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = transformMessageFromApi(payload.new as any);
            setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          }
        })
        .subscribe();

      // Channel for Assets
      const assetsChannel = supabase.channel('public:assets')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'assets' }, (payload) => {
          if (payload.eventType === 'INSERT') {
            setAssets(prev => [...prev, payload.new as Asset]);
          } else if (payload.eventType === 'UPDATE') {
            setAssets(prev => prev.map(a => a.id === payload.new.id ? payload.new as Asset : a));
          } else if (payload.eventType === 'DELETE') {
            setAssets(prev => prev.filter(a => a.id !== payload.old.id));
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(workOrderChannel);
        supabase.removeChannel(inventoryChannel);
        supabase.removeChannel(assetsChannel);
        supabase.removeChannel(messagesChannel);
      };
    }
  }, []);

  // --- Actions with Supabase Integration ---

  const addUser = async (user: User) => {
    setUsers(prev => [...prev, user]);
    // Skip backend sync for optimistic invites
    if (user.id.startsWith('invite-')) return;

    if (supabase) {
      const { error } = await supabase.from('users').insert([user]);
      if (error) {
        toast.error("Failed to save user to backend");
        console.error(error);
      }
    }
  };

  const updateUser = async (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (supabase) {
      const { error } = await supabase.from('users').update(updatedUser).eq('id', updatedUser.id);
      if (error) toast.error("Failed to update user in backend");
    }
  };

  const deleteUser = async (id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id)); // Optimistic
    try {
      await api.delete(`/users/${id}`);
      toast.success("User deleted successfully");
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user from backend");
      // Optionally fetch users again to revert
    }
  };

  const addWorkOrder = async (wo: WorkOrder) => {
    // Optimistic Update
    if (!workOrders.find(w => w.id === wo.id)) {
      setWorkOrders(prev => [wo, ...prev]);
    }

    try {
      // Transform and send to API
      const payload = transformWorkOrderForApi(wo);
      const response = await api.post('/work-orders', payload);

      // Transform response back to frontend format
      const createdWo = transformWorkOrderFromApi(response);

      // Update with server response (e.g. real ID, timestamps)
      setWorkOrders(prev => prev.map(w => w.id === wo.id ? createdWo : w));
      toast.success('Work Order created successfully');
    } catch (error: any) {
      console.error('Work Order sync error:', error);
      toast.error(error.message || "Failed to sync Work Order to backend");
      // Revert optimistic update
      setWorkOrders(prev => prev.filter(w => w.id !== wo.id));
    }
  };

  const updateWorkOrder = async (updatedWo: WorkOrder) => {
    const previousState = workOrders;
    setWorkOrders(prev => prev.map(w => w.id === updatedWo.id ? updatedWo : w));

    try {
      const payload = transformWorkOrderForApi(updatedWo);
      const response = await api.patch(`/work-orders/${updatedWo.id}`, payload);
      const transformed = transformWorkOrderFromApi(response);
      setWorkOrders(prev => prev.map(w => w.id === transformed.id ? transformed : w));
      toast.success('Work Order updated successfully');
    } catch (error: any) {
      console.error('Work Order update error:', error);
      toast.error(error.message || "Failed to sync update");
      setWorkOrders(previousState); // Revert to previous state
    }
  };

  const addActivityLog = (log: ActivityLogEntry) => setActivityLogs(prev => [log, ...prev]);

  const addInventoryItem = async (item: InventoryItem) => {
    setInventory(prev => [...prev, item]); // Optimistic
    try {
      await api.post('/inventory', item);
      toast.success(`${item.name} added to inventory`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to sync inventory");
      setInventory(prev => prev.filter(i => i.id !== item.id)); // Revert
    }
  };

  const updateInventoryItem = async (updatedItem: InventoryItem) => {
    setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    try {
      await api.patch(`/inventory/${updatedItem.id}`, updatedItem);
      toast.success(`Inventory updated: ${updatedItem.name}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update inventory");
      // Optionally fetch refresh or revert here
    }
  };

  const deleteInventoryItem = async (id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
    try {
      await api.delete(`/inventory/${id}`);
      toast.success("Inventory item deleted");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete inventory item");
      // Optionally fetch refresh
    }
  };

  const consumeInventory = async (inventoryId: string, quantity: number): Promise<boolean> => {
    try {
      const response = await api.post('/inventory/consume', { inventoryId, quantity });

      setInventory(prev => prev.map(item =>
        item.id === inventoryId
          ? { ...item, quantity: response.item.quantity }
          : item
      ));

      if (response.lowStock) {
        toast.error(`Low stock alert: ${response.item.name}`);
        sendBrowserNotification("Low Stock Warning", `${response.item.name} is running low.`);
      }

      return true;
    } catch (error: any) {
      console.error("Consume inventory error:", error);
      toast.error(error.message || "Failed to consume inventory");
      return false;
    }
  };

  const addAsset = async (asset: Asset) => {
    setAssets(prev => [asset, ...prev]); // Optimistic
    try {
      await api.post('/assets', asset);
      toast.success(`${asset.name} registered successfully`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to register asset");
      setAssets(prev => prev.filter(a => a.id !== asset.id)); // Revert
    }
  };

  const updateAsset = async (updatedAsset: Asset) => {
    setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
    try {
      await api.patch(`/assets/${updatedAsset.id}`, updatedAsset);
      toast.success(`${updatedAsset.name} updated successfully`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update asset");
    }
  };

  const deleteAsset = async (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    try {
      await api.delete(`/assets/${id}`);
      toast.success("Asset deleted successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete asset");
    }
  };

  const addVendor = (vendor: Vendor) => setVendors(prev => [...prev, vendor]);
  const updateVendor = (vendor: Vendor) => setVendors(prev => prev.map(v => v.id === vendor.id ? vendor : v));
  const deleteVendor = (id: string) => setVendors(prev => prev.filter(v => v.id !== id));

  const addRequest = (req: WorkRequest) => setRequests(prev => [req, ...prev]);
  const updateRequest = (req: WorkRequest) => setRequests(prev => prev.map(r => r.id === req.id ? req : r));
  const deleteRequest = (id: string) => setRequests(prev => prev.filter(r => r.id !== id));

  const addDocument = (doc: DocFile) => setDocuments(prev => [doc, ...prev]);
  const deleteDocument = (id: string) => setDocuments(prev => prev.filter(d => d.id !== id));

  const addCategory = (cat: SystemCategory) => setCategories(prev => [...prev, cat]);
  const deleteCategory = (id: string) => setCategories(prev => prev.filter(c => c.id !== id));

  const addMaterialRequest = (req: MaterialRequest) => {
    setMaterialRequests(prev => [req, ...prev]);
    addActivityLog({
      id: `log-${Date.now()}`,
      userId: req.createdBy,
      action: 'Broadcasted Material Request',
      type: 'SYSTEM',
      target: `${req.itemName} to ${req.notifiedVendorIds.length} vendors`,
      timestamp: new Date().toISOString()
    });
    sendBrowserNotification("Material Request Broadcast", `Requesting ${req.quantity}x ${req.itemName} at ${req.location}`);
  };

  const addServiceBroadcast = (req: ServiceBroadcast) => {
    setServiceBroadcasts(prev => [req, ...prev]);
    addActivityLog({
      id: `log-${Date.now()}`,
      userId: req.createdBy,
      action: 'Broadcasted Service Call',
      type: 'SYSTEM',
      target: `${req.title} to ${req.notifiedVendorIds.length} contractors`,
      timestamp: new Date().toISOString()
    });
    sendBrowserNotification("Service Help Needed!", `${req.priority} PRIORITY: ${req.title} at ${req.location}`);
  };

  const addMessage = async (msg: Message) => {
    // Optimistic
    setMessages(prev => [msg, ...prev]);

    try {
      const payload = {
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        subject: msg.subject,
        body: msg.body,
        type: msg.type,
        relatedEntityId: msg.relatedEntityId
      };
      const response = await api.post('/messages', payload);
      const savedMsg = transformMessageFromApi(response);

      // Update optimistic msg with real one (id, timestamp)
      setMessages(prev => prev.map(m => m.id === msg.id ? savedMsg : m));
      toast.success("Message sent successfully");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message to backend");
      setMessages(prev => prev.filter(m => m.id !== msg.id));
    }
  };

  const markMessageRead = async (id: string) => {
    // Optimistic
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));

    try {
      await api.patch(`/messages/${id}`, { is_read: true });
    } catch (error) {
      console.error("Failed to mark message read:", error);
      // Silent fail or revert? Silent is usually fine for read receipts
    }
  };

  return (
    <DataContext.Provider value={{
      users,
      workOrders,
      activityLogs,
      assets,
      inventory,
      vendors,
      requests,
      documents,
      categories,
      materialRequests,
      serviceBroadcasts,
      messages,
      isLoading,
      addUser,
      updateUser,
      deleteUser,
      addWorkOrder,
      updateWorkOrder,
      addActivityLog,
      addInventoryItem,
      updateInventoryItem,
      deleteInventoryItem,
      consumeInventory,
      addAsset,
      updateAsset,
      deleteAsset,
      addVendor,
      updateVendor,
      deleteVendor,
      addRequest,
      updateRequest,
      deleteRequest,
      addDocument,
      deleteDocument,
      addCategory,
      deleteCategory,
      addMaterialRequest,
      addServiceBroadcast,
      addMessage,
      markMessageRead
    }}>
      {children}
    </DataContext.Provider>
  );
};
