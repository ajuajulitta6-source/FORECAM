
export enum UserRole {
  ADMIN = 'ADMIN',
  TECHNICIAN = 'TECHNICIAN',
  CLIENT = 'CLIENT',
  CONTRACTOR = 'CONTRACTOR',
}

export enum UserPermission {
  MANAGE_TEAM = 'MANAGE_TEAM',
  VIEW_ANALYTICS = 'VIEW_ANALYTICS',
  MANAGE_WORK_ORDERS = 'MANAGE_WORK_ORDERS',
  MANAGE_ASSETS = 'MANAGE_ASSETS',
  MANAGE_INVENTORY = 'MANAGE_INVENTORY',
  SEND_MESSAGES = 'SEND_MESSAGES',
}

export enum WorkOrderStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
}

export enum WorkOrderPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export enum WorkOrderType {
  REACTIVE = 'REACTIVE',
  PREVENTIVE = 'PREVENTIVE',
}

export enum RequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
}

export type ActivityType = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'SYSTEM';

export interface ActivityLogEntry {
  id: string;
  userId: string;
  action: string;
  type: ActivityType;
  target?: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar: string;
  permissions: UserPermission[];
  status?: 'ACTIVE' | 'INACTIVE' | 'PENDING';
}

export interface Asset {
  id: string;
  name: string;
  category: string;
  status: 'OPERATIONAL' | 'DOWN' | 'MAINTENANCE' | 'UNDER_CONSTRUCTION';
  location: string;
  model: string;
  serialNumber: string;
  image: string;
  healthScore: number; // 0-100 (Condition for machines)
  projectProgress?: number; // 0-100 (Completion for projects)
  clientId?: string; // Linked Client ID
}

export interface PartUsage {
  inventoryId: string;
  name: string;
  quantity: number;
  costAtTime: number;
}

export interface WorkOrder {
  id: string;
  title: string;
  description: string;
  assetId: string;
  assignedToId?: string;
  requestedById: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  type: WorkOrderType;
  dueDate: string;
  createdAt: string;
  partsUsed?: PartUsage[];
  frequency?: 'ONE_TIME' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'; // For PM
  location?: string;
  image?: string;
}

export interface WorkRequest {
  id: string;
  title: string;
  description: string;
  assetId?: string;
  requestedBy: string; // userId or Name if guest
  priority: WorkOrderPriority;
  status: RequestStatus;
  createdAt: string;
  image?: string;
  location?: string;
}

export interface Vendor {
  id: string;
  name: string;
  type: 'SUPPLIER' | 'CONTRACTOR';
  contactName: string;
  email: string;
  phone: string;
  category: string; // e.g., 'Plumbing', 'Electrical', 'Parts'
  status: 'ACTIVE' | 'INACTIVE' | 'INVITED';
  rating: number; // 1-5
}

export interface MaterialRequest {
  id: string;
  itemName: string;
  quantity: number;
  qualitySpecs: string;
  location: string;
  status: 'OPEN' | 'CLOSED';
  notifiedVendorIds: string[]; // List of Vendor IDs
  createdAt: string;
  createdBy: string;
}

export interface ServiceBroadcast {
  id: string;
  title: string;
  description: string;
  location: string;
  priority: WorkOrderPriority;
  status: 'OPEN' | 'CLOSED';
  notifiedVendorIds: string[]; // List of Contractor IDs
  createdAt: string;
  createdBy: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  minQuantity: number;
  unitPrice: number;
  location: string;
  category: string;
}

export interface KpiData {
  totalWorkOrders: number;
  openWorkOrders: number;
  completedToday: number;
  downtimeHours: number;
  lowStockItems: number;
}

export interface DocFile {
  id: string;
  name: string;
  type: 'PDF' | 'IMG' | 'DOC' | 'SHEET';
  size: string;
  uploadedBy: string;
  uploadedAt: string;
  category: string;
}

export interface SystemCategory {
  id: string;
  name: string;
  type: 'ASSET' | 'WORK_ORDER' | 'INVENTORY' | 'VENDOR';
  count: number;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string; // 'ADMIN' for generic admin inbox, or specific userId
  subject: string;
  body: string;
  type: 'TASK_COMPLETION' | 'PROBLEM' | 'GENERAL';
  relatedEntityId?: string; // Optional WorkOrder ID or Asset ID
  isRead: boolean;
  createdAt: string;
}
