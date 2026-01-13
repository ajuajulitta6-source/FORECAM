
import { Asset, InventoryItem, User, UserRole, UserPermission, WorkOrder, WorkOrderPriority, WorkOrderStatus, ActivityLogEntry, WorkOrderType, Vendor, WorkRequest, RequestStatus, DocFile, SystemCategory, Message } from "./types";

export const MOCK_USERS: User[] = [
  {
    id: 'u1',
    name: 'Admin User',
    email: 'admin@cmms.com',
    role: UserRole.ADMIN,
    avatar: 'https://picsum.photos/id/1005/200/200',
    permissions: [
      UserPermission.MANAGE_TEAM,
      UserPermission.VIEW_ANALYTICS,
      UserPermission.MANAGE_WORK_ORDERS,
      UserPermission.MANAGE_ASSETS,
      UserPermission.MANAGE_INVENTORY,
      UserPermission.SEND_MESSAGES,
      UserPermission.MESSAGE_ANYONE
    ],
    status: 'ACTIVE'
  },
  {
    id: 'u2',
    name: 'Mike Tech',
    email: 'tech@cmms.com',
    role: UserRole.TECHNICIAN,
    avatar: 'https://picsum.photos/id/1012/200/200',
    permissions: [
      UserPermission.MANAGE_WORK_ORDERS,
      UserPermission.MANAGE_ASSETS,
      UserPermission.MANAGE_INVENTORY,
      UserPermission.SEND_MESSAGES
    ],
    status: 'ACTIVE'
  },
  {
    id: 'u3',
    name: 'Sarah Client',
    email: 'client@cmms.com',
    role: UserRole.CLIENT,
    avatar: 'https://picsum.photos/id/1027/200/200',
    permissions: [
      UserPermission.MANAGE_WORK_ORDERS,
      UserPermission.SEND_MESSAGES
    ],
    status: 'ACTIVE'
  },
  {
    id: 'u4',
    name: 'Gary Contractor',
    email: 'contractor@cmms.com',
    role: UserRole.CONTRACTOR,
    avatar: 'https://picsum.photos/id/1025/200/200',
    permissions: [
      UserPermission.MANAGE_WORK_ORDERS,
      UserPermission.SEND_MESSAGES
    ],
    status: 'ACTIVE'
  },
  {
    id: 'u5',
    name: 'Sue Supplier',
    email: 'supplier@cmms.com',
    role: UserRole.VENDOR,
    avatar: 'https://picsum.photos/id/1024/200/200',
    permissions: [
      UserPermission.SEND_MESSAGES
    ],
    status: 'ACTIVE'
  }
];

export const MOCK_ACTIVITY_LOGS: ActivityLogEntry[] = [
  {
    id: 'log-1',
    userId: 'u2',
    action: 'Updated Work Order status',
    type: 'UPDATE',
    target: 'WO-101 (In Progress)',
    timestamp: '2023-11-14T09:30:00Z',
  },
  {
    id: 'log-2',
    userId: 'u1',
    action: 'Approved Asset Purchase',
    type: 'CREATE',
    target: 'Order #9921',
    timestamp: '2023-11-14T08:15:00Z',
  },
  {
    id: 'log-3',
    userId: 'u2',
    action: 'Completed Maintenance Checklist',
    type: 'UPDATE',
    target: 'Excavator CAT-320',
    timestamp: '2023-11-13T16:45:00Z',
  },
  {
    id: 'log-4',
    userId: 'u3',
    action: 'Submitted Work Request',
    type: 'CREATE',
    target: 'HVAC Filter Check',
    timestamp: '2023-11-13T14:20:00Z',
  },
  {
    id: 'log-5',
    userId: 'u1',
    action: 'User Login',
    type: 'LOGIN',
    timestamp: '2023-11-15T08:00:00Z',
  },
  {
    id: 'log-6',
    userId: 'u2',
    action: 'Added Part to Inventory',
    type: 'CREATE',
    target: 'Hydraulic Fluid (5 Gal)',
    timestamp: '2023-11-12T11:00:00Z',
  },
  {
    id: 'log-7',
    userId: 'u1',
    action: 'Modified User Permissions',
    type: 'SYSTEM',
    target: 'Mike Tech',
    timestamp: '2023-11-10T15:30:00Z',
  }
];

export const MOCK_ASSETS: Asset[] = [
  {
    id: 'a1',
    name: 'Excavator CAT-320',
    category: 'Heavy Machinery',
    status: 'OPERATIONAL',
    location: 'Site A - North',
    model: 'CAT 320 GC',
    serialNumber: 'CAT320-998877',
    image: 'https://picsum.photos/id/1070/400/300',
    healthScore: 92,
  },
  {
    id: 'a2',
    name: 'Luxury Villa Project',
    category: 'Construction Site',
    status: 'UNDER_CONSTRUCTION',
    location: '123 Palm Ave, Beverly Hills',
    model: 'Residential',
    serialNumber: 'PRJ-2023-001',
    image: 'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?auto=format&fit=crop&q=80&w=1000',
    healthScore: 100,
    projectProgress: 45, // 45% Completed
    clientId: 'u3' // Assigned to Sarah Client
  },
  {
    id: 'a3',
    name: 'Hydraulic Press',
    category: 'Shop Tools',
    status: 'DOWN',
    location: 'Workshop B',
    model: 'PressMaster 50T',
    serialNumber: 'PM50-3344',
    image: 'https://picsum.photos/id/1072/400/300',
    healthScore: 40,
  },
  {
    id: 'a4',
    name: 'Generator 500kW',
    category: 'Power',
    status: 'OPERATIONAL',
    location: 'Site A - Backup',
    model: 'Cummins C500D6',
    serialNumber: 'CUM-5566',
    image: 'https://picsum.photos/id/1073/400/300',
    healthScore: 98,
  },
];

export const MOCK_WORK_ORDERS: WorkOrder[] = [
  {
    id: 'wo-101',
    title: 'Hydraulic Leak Repair',
    description: 'Oil leaking from main cylinder seal. Needs immediate replacement.',
    assetId: 'a3',
    assignedToId: 'u2',
    requestedById: 'u1',
    status: WorkOrderStatus.IN_PROGRESS,
    priority: WorkOrderPriority.HIGH,
    type: WorkOrderType.REACTIVE,
    dueDate: '2023-11-15',
    createdAt: '2023-11-10',
  },
  {
    id: 'wo-102',
    title: 'Quarterly Generator Service',
    description: 'Routine maintenance: oil change, filter replacement, load test.',
    assetId: 'a4',
    assignedToId: 'u2',
    requestedById: 'u1',
    status: WorkOrderStatus.PENDING,
    priority: WorkOrderPriority.MEDIUM,
    type: WorkOrderType.PREVENTIVE,
    frequency: 'QUARTERLY',
    dueDate: '2023-11-20',
    createdAt: '2023-11-12',
  },
  {
    id: 'wo-103',
    title: 'Drywall Inspection',
    description: 'Check drywall installation in master bedroom.',
    assetId: 'a2',
    assignedToId: 'u2',
    requestedById: 'u3',
    status: WorkOrderStatus.COMPLETED,
    priority: WorkOrderPriority.LOW,
    type: WorkOrderType.PREVENTIVE,
    frequency: 'ONE_TIME',
    dueDate: '2023-11-05',
    createdAt: '2023-11-01',
  },
  {
    id: 'wo-104',
    title: 'Excavator Track Tension',
    description: 'Tracks are loose, verify tension and adjust.',
    assetId: 'a1',
    assignedToId: 'u2',
    requestedById: 'u1',
    status: WorkOrderStatus.REVIEW,
    priority: WorkOrderPriority.HIGH,
    type: WorkOrderType.REACTIVE,
    dueDate: '2023-11-14',
    createdAt: '2023-11-08',
  },
];

export const MOCK_INVENTORY: InventoryItem[] = [
  {
    id: 'inv-1',
    name: 'Hydraulic Fluid (5 Gal)',
    sku: 'FL-HYD-05',
    quantity: 12,
    minQuantity: 10,
    unitPrice: 45.00,
    location: 'Shelf A1',
    category: 'Fluids',
  },
  {
    id: 'inv-2',
    name: 'Air Filter Type C',
    sku: 'FIL-AIR-C',
    quantity: 4,
    minQuantity: 5,
    unitPrice: 15.50,
    location: 'Shelf B2',
    category: 'Filters',
  },
  {
    id: 'inv-3',
    name: 'M12 Bolt Set',
    sku: 'FAS-M12-SET',
    quantity: 500,
    minQuantity: 100,
    unitPrice: 0.50,
    location: 'Bin 33',
    category: 'Fasteners',
  },
];

export const MOCK_VENDORS: Vendor[] = [
  {
    id: 'v1',
    name: 'FastParts Industrial',
    type: 'SUPPLIER',
    contactName: 'John Supplier',
    email: 'orders@fastparts.com',
    phone: '555-0101',
    category: 'Parts',
    status: 'ACTIVE',
    rating: 4.5
  },
  {
    id: 'v2',
    name: 'Sparky Electric Services',
    type: 'CONTRACTOR',
    contactName: 'Steve Spark',
    email: 'steve@sparkyelec.com',
    phone: '555-0202',
    category: 'Electrical',
    status: 'ACTIVE',
    rating: 4.8
  },
  {
    id: 'v3',
    name: 'Reliable Plumbing Co',
    type: 'CONTRACTOR',
    contactName: 'Mario P.',
    email: 'mario@reliableplumbing.com',
    phone: '555-0303',
    category: 'Plumbing',
    status: 'INACTIVE',
    rating: 3.5
  }
];

export const MOCK_REQUESTS: WorkRequest[] = [
  {
    id: 'req-1',
    title: 'AC Making Noise',
    description: 'The AC unit in the server room is making a loud rattling noise.',
    priority: WorkOrderPriority.HIGH,
    status: RequestStatus.PENDING,
    requestedBy: 'u3',
    createdAt: '2023-11-15',
    location: 'Server Room B',
    assetId: 'a2'
  },
  {
    id: 'req-2',
    title: 'Leaky Faucet',
    description: 'Bathroom sink on 2nd floor leaking.',
    priority: WorkOrderPriority.LOW,
    status: RequestStatus.APPROVED,
    requestedBy: 'u3',
    createdAt: '2023-11-10',
    location: '2nd Floor Bath',
  }
];

export const MOCK_DOCUMENTS: DocFile[] = [
  { id: 'd1', name: 'Safety_Manual_2023.pdf', type: 'PDF', size: '2.4 MB', uploadedBy: 'Admin User', uploadedAt: '2023-10-01', category: 'Safety' },
  { id: 'd2', name: 'Excavator_Maintenance_Guide.pdf', type: 'PDF', size: '5.1 MB', uploadedBy: 'Mike Tech', uploadedAt: '2023-10-15', category: 'Manuals' },
  { id: 'd3', name: 'Site_Plan_North.jpg', type: 'IMG', size: '1.2 MB', uploadedBy: 'Admin User', uploadedAt: '2023-11-05', category: 'Blueprints' },
];

export const MOCK_CATEGORIES: SystemCategory[] = [
  { id: 'c1', name: 'Heavy Machinery', type: 'ASSET', count: 12 },
  { id: 'c2', name: 'Facilities', type: 'ASSET', count: 5 },
  { id: 'c3', name: 'Electrical', type: 'VENDOR', count: 2 },
  { id: 'c4', name: 'Plumbing', type: 'VENDOR', count: 1 },
  { id: 'c5', name: 'Fasteners', type: 'INVENTORY', count: 150 },
  { id: 'c6', name: 'Construction Site', type: 'ASSET', count: 3 },
];

export const MOCK_MESSAGES: Message[] = [
  {
    id: 'm1',
    senderId: 'u2',
    receiverId: 'ADMIN',
    subject: 'Completed Generator Service',
    body: 'Just finished the quarterly service on the backup generator. Everything looks good, oil changed.',
    type: 'TASK_COMPLETION',
    relatedEntityId: 'wo-102',
    isRead: false,
    createdAt: '2023-11-15T14:30:00Z'
  },
  {
    id: 'm2',
    senderId: 'u4',
    receiverId: 'ADMIN',
    subject: 'Issue with Site Access',
    body: 'Hi Admin, I am trying to access Site A for the electrical repair but the gate code is not working.',
    type: 'PROBLEM',
    relatedEntityId: 'wo-101',
    isRead: true,
    createdAt: '2023-11-14T09:15:00Z'
  }
];
