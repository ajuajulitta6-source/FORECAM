
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
}

const API_URL = 'http://localhost:3005/api';

async function runTests() {
    console.log("--- DEBUGGING API ---");

    // 1. Login to get Token
    console.log("\n1. Logging in as Admin...");
    let token = '';
    try {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@fotabong.com', password: 'admin123' })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        token = data.session.access_token;
        console.log("✅ Login successful. Token obtained.");
    } catch (e: any) {
        console.error("❌ Login failed:", e.message);
        return;
    }

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // 2. Create Asset (Required for Work Order)
    console.log("\n2. Creating Test Asset...");
    let assetId = '';
    try {
        const assetData = {
            name: "Test Asset",
            category: "Heavy Machinery",
            location: "Site A",
            status: "OPERATIONAL"
        };
        const res = await fetch(`${API_URL}/assets`, {
            method: 'POST',
            headers,
            body: JSON.stringify(assetData)
        });
        const data = await res.json();

        // If 404, maybe endpoint is missing or path wrong
        if (res.status === 404) console.warn("⚠️ Asset endpoint not found (404)");
        else if (!res.ok) throw new Error(JSON.stringify(data));
        else {
            assetId = data.id;
            console.log("✅ Asset created:", assetId);
        }
    } catch (e: any) {
        console.error("❌ Asset creation failed:", e.message);
    }

    // 3. Create Work Order
    console.log("\n3. Testing Work Order Creation...");
    if (!assetId) {
        console.warn("⚠️ Skipping Work Order test (No Asset ID)");
    } else {
        try {
            const woData = {
                title: "Test Work Order",
                description: "Fix the thing",
                assetId: assetId,
                priority: "MEDIUM",
                type: "REACTIVE",
                dueDate: "2026-12-31"
            };
            const res = await fetch(`${API_URL}/work-orders`, {
                method: 'POST',
                headers,
                body: JSON.stringify(woData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(JSON.stringify(data));
            console.log("✅ Work Order created successfully.");
        } catch (e: any) {
            console.error("❌ Work Order creation failed:", e.message);
        }
    }

    // 4. Test Invite
    console.log("\n4. Testing Invite User...");
    try {
        const inviteData = {
            email: `test_invite_${Date.now()}@example.com`,
            role: "TECHNICIAN",
            permissions: ["MANAGE_WORK_ORDERS"]
        };
        const res = await fetch(`${API_URL}/auth/invite`, {
            method: 'POST',
            headers,
            body: JSON.stringify(inviteData)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(JSON.stringify(data));
        console.log("✅ Invite created successfully.");
        console.log("   Link:", data.inviteLink);
    } catch (e: any) {
        console.error("❌ Invite failed:", e.message);
    }
}

runTests();
