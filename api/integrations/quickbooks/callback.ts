

import { withAuth, AuthenticatedRequest } from '../../lib/auth';
import { VercelResponse } from '@vercel/node';
import OAuthClient from 'intuit-oauth';
import { IntegrationManager } from '../manager';

export default withAuth(async (req: AuthenticatedRequest, res: VercelResponse) => {
    // Note: This endpoint is reached by the Redirect from QuickBooks.
    // Ideally, the user should be logged in. If strict 'withAuth' fails because cookies aren't passed in redirects sometimes, 
    // we might need a looser check, but for now we assume session cookie persists.

    // Authorization Code Extraction
    // The query params will be: ?code=...&state=...&realmId=...
    const { url } = req;

    try {
        const config = await IntegrationManager.getConfig('QUICKBOOKS');
        if (!config) throw new Error("QuickBooks not configured");

        const oauthClient = new OAuthClient({
            clientId: config.clientId,
            clientSecret: config.clientSecret,
            environment: 'sandbox',
            redirectUri: process.env.VITE_FRONTEND_URL
                ? `${process.env.VITE_FRONTEND_URL}/admin/integrations/callback/quickbooks`
                : 'http://localhost:5173/admin/integrations/callback/quickbooks'
        });

        // Parse the full URL to get the response parts
        // OAuthClient expects the full redirect URL to parse code/state/realmId
        // We construct it from the request info roughly
        const protocol = req.headers['x-forwarded-proto'] || 'http';
        const host = req.headers.host;
        const fullUrl = `${protocol}://${host}${url}`;

        // Exchange Code for Token
        const authResponse = await oauthClient.createToken(fullUrl);
        const tokenData = authResponse.getJson();

        // Save Tokens
        await IntegrationManager.saveTokens('QUICKBOOKS', {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            realmId: req.query.realmId as string // Intuit sends realmId in query
        });

        // Redirect back to frontend success page
        return res.redirect('/#/integrations?status=success');

    } catch (error: any) {
        console.error("QuickBooks Callback Error:", error);
        return res.redirect('/#/integrations?status=error&message=' + encodeURIComponent(error.message));
    }
});
