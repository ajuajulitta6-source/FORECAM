import { WorkOrder } from '../types';

/**
 * Transform frontend WorkOrder to backend API format
 * Converts camelCase fields to match backend schema expectations
 */
export function transformWorkOrderForApi(wo: WorkOrder) {
    return {
        title: wo.title,
        description: wo.description,
        assetId: wo.assetId,
        assignedToId: wo.assignedToId,
        priority: wo.priority,
        type: wo.type,
        dueDate: wo.dueDate,
        status: wo.status,
        location: wo.location,
        frequency: wo.frequency
    };
}

/**
 * Transform backend work order response to frontend format
 * Converts snake_case database fields to camelCase for frontend
 */
export function transformWorkOrderFromApi(data: any): WorkOrder {
    return {
        id: data.id,
        title: data.title,
        description: data.description,
        assetId: data.asset_id || data.assetId,
        assignedToId: data.assigned_to_id || data.assignedToId,
        requestedById: data.requested_by_id || data.requestedById,
        status: data.status,
        priority: data.priority,
        type: data.type,
        dueDate: data.due_date || data.dueDate,
        createdAt: data.created_at || data.createdAt,
        location: data.location,
        frequency: data.frequency,
        partsUsed: data.parts_used || data.partsUsed
    };
}

import { Message } from '../types';

export function transformMessageFromApi(data: any): Message {
    return {
        id: data.id,
        senderId: data.sender_id,
        receiverId: data.receiver_id,
        subject: data.subject,
        body: data.body,
        type: data.type,
        isRead: data.is_read,
        relatedEntityId: data.related_entity_id,
        createdAt: data.created_at
    };
}
