import { sendEmail } from './api/lib/email';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function testEmail() {
    console.log('Testing email configuration...');
    console.log(`Host: ${process.env.SMTP_HOST}`);
    console.log(`Port: ${process.env.SMTP_PORT}`);
    console.log(`User: ${process.env.SMTP_USER}`);

    try {
        const result = await sendEmail(
            process.env.SMTP_USER || 'test@example.com', // Send to self
            'Test Email from CMMS',
            '<h1>It Works!</h1><p>This is a test email to verify SMTP configuration.</p>'
        );

        if (result) {
            console.log('✅ Email sent successfully!');
        } else {
            console.log('❌ Failed to send email.');
        }
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

testEmail();
