
import { IntegrationManager } from '../manager';
import { Client } from '@hubspot/api-client';

export class HubSpotService {
    private client: Client | null = null;

    async connect() {
        const config = await IntegrationManager.getConfig('HUBSPOT');
        if (!config || !config.isEnabled || !config.accessToken) {
            throw new Error('HubSpot integration is not enabled or credentials missing');
        }

        this.client = new Client({ accessToken: config.accessToken });
        console.log("HubSpot Client Initialized");
    }

    async testConnection() {
        if (!this.client) await this.connect();
        // Simple call to verify token
        return await this.client!.crm.contacts.basicApi.getPage(1);
    }

    async syncContact(user: any) {
        if (!this.client) await this.connect();

        try {
            const properties = {
                email: user.email,
                firstname: user.name.split(' ')[0],
                lastname: user.name.split(' ').slice(1).join(' ') || '',
                phone: user.phone || ''
            };

            await this.client!.crm.contacts.basicApi.create({
                properties,
                associations: []
            });
            console.log(`Synced user ${user.email} to HubSpot`);
        } catch (error: any) {
            console.error("HubSpot Sync Error:", error.message);
            // If error is "Contact already exists", we might want to update instead
        }
    }
}
