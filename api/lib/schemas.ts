import { z } from 'zod';

// --- Assets ---
export const AssetBaseSchema = z.object({
    name: z.string().min(1, "Name is required"),
    category: z.string().min(1, "Category is required"),
    status: z.enum(['OPERATIONAL', 'DOWN', 'MAINTENANCE', 'UNDER_CONSTRUCTION']).optional().default('OPERATIONAL'),
    location: z.string().min(1, "Location is required"),
    model: z.string().optional().default(''),
    serialNumber: z.string().optional().default(''),
    image: z.string().optional(),
    healthScore: z.number().min(0).max(100).optional().default(100),
    clientId: z.string().optional(),
});

export const AssetSchema = AssetBaseSchema.transform(data => ({
    name: data.name,
    category: data.category,
    status: data.status,
    location: data.location,
    model: data.model,
    serial_number: data.serialNumber,
    image: data.image,
    health_score: data.healthScore,
    client_id: data.clientId
}));

// --- Inventory ---
export const InventoryBaseSchema = z.object({
    name: z.string().min(1, "Name is required"),
    sku: z.string().min(1, "SKU is required"),
    quantity: z.number().int().min(0, "Quantity must be positive"),
    minQuantity: z.number().int().min(0).optional().default(0),
    unitPrice: z.number().min(0).optional().default(0),
    location: z.string().min(1, "Location is required"),
    category: z.string().min(1, "Category is required"),
});

export const InventorySchema = InventoryBaseSchema.transform(data => ({
    name: data.name,
    sku: data.sku,
    quantity: data.quantity,
    min_quantity: data.minQuantity,
    unit_price: data.unitPrice,
    location: data.location,
    category: data.category
}));

// --- Work Orders ---
export const WorkOrderSchema = z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    assetId: z.string().min(1),
    assignedToId: z.string().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    type: z.enum(['REACTIVE', 'PREVENTIVE']),
    dueDate: z.string(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'REVIEW', 'COMPLETED']).optional().default('PENDING'),
    location: z.string().optional(),
    partsUsed: z.array(z.any()).optional(), // TODO: specialized schema
    frequency: z.enum(['ONE_TIME', 'WEEKLY', 'MONTHLY', 'QUARTERLY']).optional(),
}).transform(data => ({
    title: data.title,
    description: data.description,
    asset_id: data.assetId,
    assigned_to_id: data.assignedToId,
    priority: data.priority,
    type: data.type,
    due_date: data.dueDate,
    status: data.status,
    location: data.location,
    // parts_used: data.partsUsed, // Store as JSONB?
    frequency: data.frequency
}));
