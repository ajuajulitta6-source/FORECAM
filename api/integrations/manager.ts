
import { createAdminClient } from '../../lib/supabaseAdmin';

export type ServiceName = 'QUICKBOOKS' | 'HUBSPOT';

export interface IntegrationConfig {
    clientId: string;
    clientSecret: string;
    accessToken?: string;
    refreshToken?: string;
    realmId?: string;
    isEnabled: boolean;
}

export class IntegrationManager {
    static async getConfig(service: ServiceName): Promise<IntegrationConfig | null> {
        const supabase = createAdminClient();
        const { data, error } = await supabase
            .from('integration_settings')
            .select('*')
            .eq('service_name', service)
            .single();

        if (error || !data) return null;

        return {
            clientId: data.client_id,
            clientSecret: data.client_secret,
            accessToken: data.access_token,
            refreshToken: data.refresh_token,
            realmId: data.realm_id,
            isEnabled: data.is_enabled
        };
    }

    static async saveTokens(service: ServiceName, tokens: Partial<IntegrationConfig>) {
        const supabase = createAdminClient();

        const updateData: any = { used_at: new Date().toISOString() };
        if (tokens.accessToken) updateData.access_token = tokens.accessToken;
        if (tokens.refreshToken) updateData.refresh_token = tokens.refreshToken;
        if (tokens.realmId) updateData.realm_id = tokens.realmId;

        await supabase
            .from('integration_settings')
            .update(updateData)
            .eq('service_name', service);
    }
}
