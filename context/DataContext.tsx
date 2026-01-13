
import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { User, WorkOrder, ActivityLogEntry, Asset, InventoryItem, Vendor, WorkRequest, DocFile, SystemCategory, MaterialRequest, ServiceBroadcast, Message } from '../types';
import { MOCK_USERS, MOCK_WORK_ORDERS, MOCK_ACTIVITY_LOGS, MOCK_ASSETS, MOCK_INVENTORY, MOCK_VENDORS, MOCK_REQUESTS, MOCK_DOCUMENTS, MOCK_CATEGORIES, MOCK_MESSAGES } from '../constants';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabaseClient';

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

export const DataProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  
  // Data State
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(MOCK_WORK_ORDERS);
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>(MOCK_ACTIVITY_LOGS);
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [inventory, setInventory] = useState<InventoryItem[]>(MOCK_INVENTORY);
  const [vendors, setVendors] = useState<Vendor[]>(MOCK_VENDORS);
  const [requests, setRequests] = useState<WorkRequest[]>(MOCK_REQUESTS);
  const [documents, setDocuments] = useState<DocFile[]>(MOCK_DOCUMENTS);
  const [categories, setCategories] = useState<SystemCategory[]>(MOCK_CATEGORIES);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [serviceBroadcasts, setServiceBroadcasts] = useState<ServiceBroadcast[]>([]);
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);

  // Initial Fetch & Realtime Subscriptions
  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch Users
        const { data: usersData } = await supabase.from('users').select('*');
        if (usersData && usersData.length > 0) setUsers(usersData);

        // Fetch Work Orders
        const { data: woData } = await supabase.from('work_orders').select('*');
        if (woData && woData.length > 0) setWorkOrders(woData);
        
        // Fetch Assets
        const { data: assetsData } = await supabase.from('assets').select('*');
        if (assetsData && assetsData.length > 0) setAssets(assetsData);

        // Fetch Inventory
        const { data: invData } = await supabase.from('inventory').select('*');
        if (invData && invData.length > 0) setInventory(invData);

      } catch (error) {
        console.error("Error connecting to Supabase, falling back to mocks", error);
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
      };
    }
  }, []);

  // --- Actions with Supabase Integration ---

  const addUser = async (user: User) => {
    setUsers(prev => [...prev, user]);
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
    setUsers(prev => prev.filter(u => u.id !== id));
    if (supabase) {
      const { error } = await supabase.from('users').delete().eq('id', id);
      if (error) toast.error("Failed to delete user from backend");
    }
  };

  const addWorkOrder = async (wo: WorkOrder) => {
    // We let the realtime subscription update the state for inserts to avoid duplicates if possible, 
    // but for instant feedback we can optimistically update. 
    // However, since we have optimistic update + realtime, we might get a blip. 
    // Best practice with realtime is often to just wait or handle deduplication.
    // For this prototype, we'll optimistically update and let React key reconciliation handle it or simple state filter.
    
    // Check if ID exists to prevent dupes from optimistic + realtime race
    if (!workOrders.find(w => w.id === wo.id)) {
        setWorkOrders(prev => [wo, ...prev]);
    }
    
    if (supabase) {
      const { error } = await supabase.from('work_orders').insert([wo]);
      if (error) {
        console.error(error);
        toast.error("Failed to sync Work Order to backend");
      }
    }
  };

  const updateWorkOrder = async (updatedWo: WorkOrder) => {
    setWorkOrders(prev => prev.map(w => w.id === updatedWo.id ? updatedWo : w));
    if (supabase) {
      const { error } = await supabase.from('work_orders').update(updatedWo).eq('id', updatedWo.id);
      if (error) toast.error("Failed to sync update");
    }
  };

  const addActivityLog = (log: ActivityLogEntry) => setActivityLogs(prev => [log, ...prev]);

  const addInventoryItem = (item: InventoryItem) => {
    setInventory(prev => [...prev, item]);
    if (supabase) supabase.from('inventory').insert([item]);
    toast.success(`${item.name} added to inventory`);
  };

  const updateInventoryItem = (updatedItem: InventoryItem) => {
    setInventory(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
    if (supabase) supabase.from('inventory').update(updatedItem).eq('id', updatedItem.id);
    toast.success(`Inventory updated: ${updatedItem.name}`);
  };

  const deleteInventoryItem = (id: string) => {
    setInventory(prev => prev.filter(i => i.id !== id));
    if (supabase) supabase.from('inventory').delete().eq('id', id);
    toast.success("Inventory item deleted");
  };

  const consumeInventory = (inventoryId: string, quantity: number): boolean => {
    let success = false;
    let itemReference: InventoryItem | undefined;

    setInventory(prev => {
      return prev.map(item => {
        if (item.id === inventoryId) {
          if (item.quantity >= quantity) {
            success = true;
            itemReference = { ...item, quantity: item.quantity - quantity };
            return itemReference;
          } else {
            return item;
          }
        }
        return item;
      });
    });

    if (success && itemReference) {
      if (supabase) {
        supabase.from('inventory')
          .update({ quantity: itemReference.quantity })
          .eq('id', inventoryId)
          .then(({ error }) => {
             if (error) console.error("Inventory sync error", error);
          });
      }

      if (itemReference.quantity <= itemReference.minQuantity) {
        const isCritical = itemReference.quantity === 0;
        const msg = isCritical 
          ? `CRITICAL: ${itemReference.name} is OUT OF STOCK!` 
          : `LOW STOCK: ${itemReference.name} fell below minimum (${itemReference.quantity} left)`;

        toast(msg, {
          icon: isCritical ? '🚨' : '⚠️',
          duration: 5000,
          style: {
            border: '1px solid #f59e0b',
            padding: '16px',
            color: '#713200',
          },
        });

        addActivityLog({
          id: `sys-alert-${Date.now()}`,
          userId: 'sys',
          action: isCritical ? 'Stock Depleted' : 'Low Stock Warning',
          type: 'SYSTEM',
          target: `${itemReference.name} (Qty: ${itemReference.quantity} / Min: ${itemReference.minQuantity}) - Admin Notified`,
          timestamp: new Date().toISOString()
        });
      }
    } else {
      toast.error("Insufficient stock available.");
    }

    return success;
  };

  const addAsset = (asset: Asset) => {
    setAssets(prev => [asset, ...prev]);
    if (supabase) supabase.from('assets').insert([asset]);
    toast.success(`${asset.name} registered successfully`);
  };

  const updateAsset = (updatedAsset: Asset) => {
    setAssets(prev => prev.map(a => a.id === updatedAsset.id ? updatedAsset : a));
    if (supabase) supabase.from('assets').update(updatedAsset).eq('id', updatedAsset.id);
    toast.success(`${updatedAsset.name} updated successfully`);
  };

  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
    if (supabase) supabase.from('assets').delete().eq('id', id);
    toast.success("Asset deleted successfully");
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

  const addMessage = (msg: Message) => {
    setMessages(prev => [msg, ...prev]);
    toast.success("Message sent successfully");
  };

  const markMessageRead = (id: string) => {
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
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
