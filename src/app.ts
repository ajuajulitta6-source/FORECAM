
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Load env vars
// Load env vars - handled in env-loader via server.ts
// dotenv.config({ path: '.env.local' });

// Static Handlers Imports
import loginHandler from '../handlers/auth/login';
import signupHandler from '../handlers/auth/signup';
import inviteHandler from '../handlers/auth/invite';
import verifyInvitationHandler from '../handlers/auth/verify-invitation';
import usersHandler from '../handlers/users/index';
import userByIdHandler from '../handlers/users/[id]';
import workOrdersHandler from '../handlers/work-orders/index';
import workOrderByIdHandler from '../handlers/work-orders/[id]';
import inventoryHandler from '../handlers/inventory/index';
import inventoryConsumeHandler from '../handlers/inventory/consume';
import inventoryByIdHandler from '../handlers/inventory/[id]';
import assetsHandler from '../handlers/assets/index';
import assetByIdHandler from '../handlers/assets/[id]';
import messagesHandler from '../handlers/messages/index';
import messageByIdHandler from '../handlers/messages/[id]';
import kpiHandler from '../handlers/reports/kpi';
import integrationStatusHandler from '../handlers/integrations/status';
import qbAuthUrlHandler from '../handlers/integrations/quickbooks/auth-url';
import qbCallbackHandler from '../handlers/integrations/quickbooks/callback';
import qbSyncInvoiceHandler from '../handlers/integrations/quickbooks/sync-invoice';

const app = express();

const frontendUrl = process.env.FRONTEND_URL;

if (frontendUrl) {
    app.use(cors({
        origin: frontendUrl,
        credentials: true
    }));
} else {
    app.use(cors());
}

app.use(express.json());

// Request Adapter
const adapt = (handler: any) => async (req: express.Request, res: express.Response) => {
    // Vercel/Express compat for query
    const combined = { ...req.query, ...req.params };
    Object.defineProperty(req, 'query', {
        value: combined,
        configurable: true,
        writable: true
    });

    const finalHandler = handler.default || handler;

    if (typeof finalHandler !== 'function') {
        console.error('Handler is not a function', finalHandler);
        res.status(500).json({ error: 'Invalid Handler Setup' });
        return;
    }

    try {
        await finalHandler(req, res);
    } catch (error: any) {
        console.error('Handler Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

// Routes Registration (Synchronous)
app.get('/api', (req, res) => {
    res.send('CMMS Backend API (Static Monolith) is Running');
});

// Auth
app.post('/api/auth/login', adapt(loginHandler));
app.post('/api/auth/signup', adapt(signupHandler));
app.post('/api/auth/invite', adapt(inviteHandler));
app.get('/api/auth/verify-invitation', adapt(verifyInvitationHandler));

// Users
app.get('/api/users', adapt(usersHandler));
app.post('/api/users', adapt(usersHandler));
app.delete('/api/users/:id', adapt(userByIdHandler));

// Work Orders
app.get('/api/work-orders', adapt(workOrdersHandler));
app.post('/api/work-orders', adapt(workOrdersHandler));
app.get('/api/work-orders/:id', adapt(workOrderByIdHandler));
app.patch('/api/work-orders/:id', adapt(workOrderByIdHandler));
app.delete('/api/work-orders/:id', adapt(workOrderByIdHandler));

// Inventory
app.get('/api/inventory', adapt(inventoryHandler));
app.post('/api/inventory', adapt(inventoryHandler));
app.post('/api/inventory/consume', adapt(inventoryConsumeHandler));
app.get('/api/inventory/:id', adapt(inventoryByIdHandler));
app.patch('/api/inventory/:id', adapt(inventoryByIdHandler));
app.delete('/api/inventory/:id', adapt(inventoryByIdHandler));

// Assets
app.get('/api/assets', adapt(assetsHandler));
app.post('/api/assets', adapt(assetsHandler));
app.get('/api/assets/:id', adapt(assetByIdHandler));
app.patch('/api/assets/:id', adapt(assetByIdHandler));
app.delete('/api/assets/:id', adapt(assetByIdHandler));

// Messages
app.get('/api/messages', adapt(messagesHandler));
app.post('/api/messages', adapt(messagesHandler));
app.patch('/api/messages/:id', adapt(messageByIdHandler));

// Reports
app.get('/api/reports/kpi', adapt(kpiHandler));

// Integrations
app.get('/api/integrations/status', adapt(integrationStatusHandler));
app.post('/api/integrations/quickbooks/auth-url', adapt(qbAuthUrlHandler));
app.get('/api/integrations/quickbooks/callback', adapt(qbCallbackHandler));
app.post('/api/integrations/quickbooks/sync-invoice', adapt(qbSyncInvoiceHandler));

export default app;
