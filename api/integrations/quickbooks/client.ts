
import OAuthClient from 'intuit-oauth';
import { IntegrationManager } from '../manager';
import { createAdminClient } from '../../../lib/supabaseAdmin';

export const getQBClient = async () => {
    const config = await IntegrationManager.getConfig('QUICKBOOKS');

    if (!config || !config.clientId || !config.clientSecret || !config.accessToken) {
        throw new Error('QuickBooks not configured or disconnected');
    }

    const oauthClient = new OAuthClient({
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        environment: 'sandbox', // TODO: Switch to production based on env
        redirectUri: process.env.VITE_FRONTEND_URL
            ? `${process.env.VITE_FRONTEND_URL}/admin/integrations/callback/quickbooks`
            : 'http://localhost:5173/admin/integrations/callback/quickbooks'
    });

    // Set existing tokens
    oauthClient.token.setToken({
        access_token: config.accessToken,
        refresh_token: config.refreshToken,
        realmId: config.realmId
    });

    // Check validity and refresh if needed
    if (!oauthClient.isAccessTokenValid()) {
        try {
            console.log("QB Access Token expired, refreshing...");
            const authResponse = await oauthClient.refresh();
            const tokenData = authResponse.getJson();

            // Save new tokens
            await IntegrationManager.saveTokens('QUICKBOOKS', {
                accessToken: tokenData.access_token,
                refreshToken: tokenData.refresh_token
            });

            console.log("QB Token Refreshed Successfully");
        } catch (error) {
            console.error("Failed to refresh QB Token:", error);
            throw new Error("QuickBooks session expired. Please reconnect.");
        }
    }

    return oauthClient;
};
