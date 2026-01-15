
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

export async function sendEmail(to: string, subject: string, html: string) {
    // Try Resend first
    if (process.env.RESEND_API_KEY) {
        try {
            const { sendEmailResend } = await import('./resend');
            const success = await sendEmailResend(to, subject, html);
            if (success) return true;
        } catch (e) {
            console.error("Resend import/execution failed:", e);
        }
    }

    // Fallback to Nodemailer (or if Resend key is missing)
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn("⚠️ SMTP Credentials missing and Resend failed/skipped.");
        console.log(`--- EMAIL TO: ${to} ---\nSUBJECT: ${subject}\n${html}\n-----------------------`);
        return false;
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_FROM || '"CMMS Admin" <no-reply@cmms.com>',
            to,
            subject,
            html,
        });
        console.log("✅ Email sent (SMTP): %s", info.messageId);
        return true;
    } catch (error) {
        console.error("❌ Error sending email (SMTP):", error);
        return false;
    }
}
