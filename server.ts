import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: '.env.local' });

// Verify keys
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.error('The backend cannot run without these credentials.');
    process.exit(1);
}

const app = express();
const PORT = 3005;

const frontendUrl = process.env.FRONTEND_URL;

if (frontendUrl) {
    app.use(cors({
        origin: frontendUrl,
        credentials: true
    }));
    console.log(`CORS enabled for: ${frontendUrl}`);
} else {
    app.use(cors());
    console.warn('WARNING: CORS is allowing all origins. Set FRONTEND_URL in .env.local for production security.');
}
app.use(express.json());

// Root Check
app.get('/', (req, res) => {
    res.send('CMMS Backend API is Running on Port 3005');
});

// Request Adapter
const adapt = (handlerModule: any) => async (req: express.Request, res: express.Response) => {
    // Vercel puts route params in query
    // In Express 5, req.query might be read-only/getter. We use Object.assign if possible, or defineProperty.
    // Try simplest first: mix params into a new object and override via defineProperty
    const combined = { ...req.query, ...req.params };
    Object.defineProperty(req, 'query', {
        value: combined,
        configurable: true,
        writable: true
    });

    // Check if handler is default export or the module itself
    const handler = handlerModule.default || handlerModule;

    if (typeof handler !== 'function') {
        console.error('Handler is not a function', handler);
        res.status(500).json({ error: 'Invalid Handler Setup' });
        return;
    }

    try {
        await handler(req, res);
    } catch (error: any) {
        console.error('Handler Error:', error);
        if (!res.headersSent) {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
};

const start = async () => {
    try {
        console.log("--- STARTING SERVER ON PORT " + PORT + " ---");
        console.log("Loading modules...");
        // Dynamic Imports
        const loginHandler = await import('./api/auth/login');
        const signupHandler = await import('./api/auth/signup');
        const inviteHandler = await import('./api/auth/invite');
        const verifyInvitationHandler = await import('./api/auth/verify-invitation');
        const usersHandler = await import('./api/users/index');
        const workOrdersHandler = await import('./api/work-orders/index');
        // Handle [id] path
        const workOrderByIdHandler = await import('./api/work-orders/[id]');
        const inventoryConsumeHandler = await import('./api/inventory/consume');
        const kpiHandler = await import('./api/reports/kpi');
        const assetsHandler = await import('./api/assets/index');
        const inventoryHandler = await import('./api/inventory/index');

        console.log("Modules loaded.");

        // Map Routes
        app.post('/api/auth/login', adapt(loginHandler));
        app.post('/api/auth/signup', adapt(signupHandler));
        app.post('/api/auth/invite', adapt(inviteHandler));
        app.get('/api/auth/verify-invitation', adapt(verifyInvitationHandler));

        app.get('/api/users', adapt(usersHandler));
        app.post('/api/users', adapt(usersHandler));

        const userByIdHandler = await import('./api/users/[id]');
        app.delete('/api/users/:id', adapt(userByIdHandler));

        app.get('/api/work-orders', adapt(workOrdersHandler));
        app.post('/api/work-orders', adapt(workOrdersHandler));

        app.get('/api/work-orders/:id', adapt(workOrderByIdHandler));
        app.patch('/api/work-orders/:id', adapt(workOrderByIdHandler));
        app.delete('/api/work-orders/:id', adapt(workOrderByIdHandler));

        app.post('/api/inventory/consume', adapt(inventoryConsumeHandler));

        // Assets
        app.get('/api/assets', adapt(assetsHandler));
        app.post('/api/assets', adapt(assetsHandler));
        // Dynamic Asset Routes (Lazy load if needed, or reuse handler)
        const assetByIdHandler = await import('./api/assets/[id]');
        app.get('/api/assets/:id', adapt(assetByIdHandler));
        app.patch('/api/assets/:id', adapt(assetByIdHandler));
        app.delete('/api/assets/:id', adapt(assetByIdHandler));

        // Inventory
        app.get('/api/inventory', adapt(inventoryHandler));
        app.post('/api/inventory', adapt(inventoryHandler));
        // Dynamic Inventory Routes
        const inventoryByIdHandler = await import('./api/inventory/[id]');
        app.get('/api/inventory/:id', adapt(inventoryByIdHandler));
        app.patch('/api/inventory/:id', adapt(inventoryByIdHandler));
        app.delete('/api/inventory/:id', adapt(inventoryByIdHandler));

        const messagesHandler = await import('./api/messages/index');
        const messageByIdHandler = await import('./api/messages/[id]');

        app.get('/api/reports/kpi', adapt(kpiHandler));

        // Messages
        app.get('/api/messages', adapt(messagesHandler));
        app.post('/api/messages', adapt(messagesHandler));
        app.patch('/api/messages/:id', adapt(messageByIdHandler));

        // Integrations
        const integrationStatusHandler = await import('./api/integrations/status');
        const qbAuthUrlHandler = await import('./api/integrations/quickbooks/auth-url');
        const qbCallbackHandler = await import('./api/integrations/quickbooks/callback');
        const qbSyncInvoiceHandler = await import('./api/integrations/quickbooks/sync-invoice');

        app.get('/api/integrations/status', adapt(integrationStatusHandler));
        app.post('/api/integrations/quickbooks/auth-url', adapt(qbAuthUrlHandler));
        app.get('/api/integrations/quickbooks/callback', adapt(qbCallbackHandler)); // Callback is GET
        app.post('/api/integrations/quickbooks/sync-invoice', adapt(qbSyncInvoiceHandler));

        app.listen(PORT, () => {
            console.log(`\nLocal API Server running at http://localhost:${PORT}`);
            console.log(`Ensure your frontend VITE_API_URL is set to http://localhost:${PORT}\n`);
        });

    } catch (e: any) {
        console.error("Failed to start server:", e);
        if (e.message && e.message.includes('Missing Supabase environment variables')) {
            console.error("\n*** CHECK YOUR .env.local FILE FOR MISSING VARIABLES ***\n");
        }
        process.exit(1);
    }
};

start();
