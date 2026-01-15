import dotenv from 'dotenv';
import path from 'path';

// Load .env.local from the current working directory
const result = dotenv.config({ path: '.env.local' });

if (result.error) {
    console.error('Error loading .env.local:', result.error);
} else {
    console.log('Environment variables loaded from .env.local');
}
