

import { withAuth, AuthenticatedRequest } from '../../lib/auth';
import { VercelResponse } from '@vercel/node';
import OAuthClient from 'intuit-oauth';
import { IntegrationManager } from '../manager';

export default withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
    if (req.user?.role !== 'ADMIN') {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    try {
        const config = await IntegrationManager.getConfig('QUICKBOOKS');

        if (!config || !config.clientId || !config.clientSecret) {
            return res.status(400).json({ error: 'QuickBooks integration is fully configured (missing keys)' });
        }

        const oauthClient = new OAuthClient({
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            environment: 'sandbox', // TODO: Make this configurable or 'production' later
            redirectUri: process.env.VITE_FRONTEND_URL
                ? `${process.env.VITE_FRONTEND_URL}/admin/integrations/callback/quickbooks`
                : 'http://localhost:5173/admin/integrations/callback/quickbooks'
        });

        const authUri = oauthClient.authorizeUri({
            scope: [OAuthClient.scopes.Accounting, OAuthClient.scopes.OpenId],
            state: 'intuit-test', // TODO: Generate random state for security
        });

        return res.json({ url: authUri });

    } catch (error: any) {
        console.error("QuickBooks Auth Error:", error);
        return res.status(500).json({ error: error.message });
    }
});
