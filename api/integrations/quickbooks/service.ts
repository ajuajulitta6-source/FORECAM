import OAuthClient from 'intuit-oauth';
import { getQBClient } from './client';

export class QuickBooksService {
    async connect() {
        try {
            const client = await getQBClient();
            console.log("Connected to QuickBooks Realm:", client.token.realmId);
            return client;
        } catch (error) {
            console.error("QB Connection Failed:", error);
            throw error;
        }
    }

    async createInvoice(workOrder: any) {
        const client = await getQBClient();
        const realmId = client.token.realmId;
        const isSandbox = client.environment === 'sandbox';
        const baseUrl = isSandbox ? OAuthClient.environment.sandbox : OAuthClient.environment.production;

        // 1. Get or Create Customer
        // For simplicity, we'll try to find a generic customer or create one.
        // In a real app, we'd map workOrder.requestedById to a QB Customer ID.
        const customerRef = { value: '1' }; // Using generic Sandbox Customer ID 1 ("Amy's Bird Sanctuary" usually)

        // 2. Prepare Line Items
        const lineItems = [];

        // Add Service Line (The Main Work Order)
        lineItems.push({
            DetailType: "DescriptionOnly",
            DescriptionLineDetail: {
                Description: `Work Order: ${workOrder.title} - ${workOrder.description.substring(0, 50)}...`
            }
        });

        // Add Parts (if any)
        if (workOrder.partsUsed && Array.isArray(workOrder.partsUsed)) {
            // We need an ItemRef for proper SalesItemLines.
            // We'll assume an Item ID 1 exists (Services) or use DescriptionOnly for simplicity to start.
            // However, to track value, we typically need SalesItemLineDetail.
            // Let's attempt to use a known Item ID or fetch one.
            // For robust code, we'd fetch items. For this MVP, we use DescriptionOnly for parts to avoid "Item Not Found" errors,
            // OR we assume Item ID '1' is safe in sandbox.

            // BETTER STRATEGY: Create a "CMMS Part" Service Item if it doesn't exist, and use that.
            // Skipping complexity: sending as DescriptionOnly lines with amounts is not allowed in standard QB Invoice (needs SalesItem).

            // Fallback: Using Item ID '1' (Services) for all parts, changing description.
            workOrder.partsUsed.forEach((part: any) => {
                lineItems.push({
                    DetailType: "SalesItemLineDetail",
                    Amount: part.costAtTime * part.quantity,
                    SalesItemLineDetail: {
                        ItemRef: { value: "1" }, // Services
                        Qty: part.quantity,
                        UnitPrice: part.costAtTime,
                        Description: `Part: ${part.name}`
                    }
                });
            });
        }

        const invoicePayload = {
            Line: lineItems,
            CustomerRef: customerRef,
            // TxnDate: workOrder.completedAt || new Date().toISOString().split('T')[0]
        };

        const response = await client.makeApiCall({
            url: `${baseUrl}v3/company/${realmId}/invoice`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoicePayload)
        });

        return response.json;
    }
}
