import dotenv from 'dotenv';
import path from 'path';

// Load .env.local from the current working directory
// This works locally but is optional on Vercel (where env vars are injected)
try {
    const result = dotenv.config({ path: '.env.local' });
    if (!result.error) {
        console.log('Environment variables loaded from .env.local');
    }
} catch (error) {
    // Silently ignore - on Vercel, env vars are already in process.env
    console.log('No .env.local file found (expected on Vercel)');
}
