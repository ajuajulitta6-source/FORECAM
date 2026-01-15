import { Resend } from 'resend';

// Initialize Resend with API Key from env
const resendApiKey = process.env.RESEND_API_KEY;

let resendClient: Resend | null = null;

if (resendApiKey && resendApiKey.startsWith('re_')) {
    resendClient = new Resend(resendApiKey);
} else {
    console.warn("⚠️ Resend API Key missing or invalid. Email will fall back or fail.");
}

export async function sendEmailResend(to: string, subject: string, html: string) {
    if (!resendClient) {
        console.error("❌ Resend client not initialized. Check RESEND_API_KEY.");
        return false;
    }

    try {
        const { data, error } = await resendClient.emails.send({
            from: 'CMMS Admin <onboarding@resend.dev>', // Default Resend testing domain. Verify your own domain for production.
            to: [to],
            subject: subject,
            html: html,
        });

        if (error) {
            console.error("❌ Resend Error:", error);
            return false;
        }

        console.log("✅ Email sent via Resend:", data?.id);
        return true;
    } catch (err) {
        console.error("❌ Unexpected Resend Exception:", err);
        return false;
    }
}
