import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Fetches the latest OTP from Gmail using the Gmail API.
 * Retries up to `retries` times with `delayMs` between attempts.
 */
export async function getOtpWithRetry(retries = 10, delayMs = 5000): Promise<string> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        console.log(`[otpHelper] Attempt ${attempt}/${retries} — checking Gmail for OTP...`);
        try {
            const otp = await fetchOtpFromGmail();
            if (otp) {
                console.log(`[otpHelper] ✅ OTP found: ${otp}`);
                return otp;
            }
            // Logic inside fetchOtpFromGmail handles "No messages found" logging
        } catch (err: any) {
            console.warn(`[otpHelper] ❌ Error on attempt ${attempt}:`, err.message || err);
            if (err.response?.data) {
                console.warn(`[otpHelper] Error Details:`, JSON.stringify(err.response.data));
            }
        }

        if (attempt < retries) {
            console.log(`[otpHelper] Waiting ${delayMs / 1000}s before retry...`);
            await new Promise(res => setTimeout(res, delayMs));
        }
    }

    throw new Error('[otpHelper] OTP not found in Gmail after all retries.');
}

async function fetchOtpFromGmail(): Promise<string | null> {
    const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
    );
    oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // BROADER SEARCH: Match "NRL" anywhere in the email (subject or body)
    // and look back 5 minutes instead of 2 to be safe.
    const searchRes = await gmail.users.messages.list({
        userId: 'me',
        q: 'NRL newer_than:5m',
        maxResults: 1,
    });

    const messages = searchRes.data.messages;
    if (!messages || messages.length === 0) {
        console.log('[otpHelper] No emails found matching "NRL" in the last 5 minutes.');
        return null;
    }

    console.log(`[otpHelper] Found ${messages.length} recent email(s). Parsing for OTP...`);

    // Check each recent email for an OTP code
    for (const msgItem of messages) {
        const msgRes = await gmail.users.messages.get({
            userId: 'me',
            id: msgItem.id!,
            format: 'full',
        });

        const msg = msgRes.data;

        // Log the subject for debugging
        const subjectHeader = msg.payload?.headers?.find(
            (h: any) => h.name?.toLowerCase() === 'subject'
        );
        console.log(`[otpHelper] Email subject: "${subjectHeader?.value || '(no subject)'}"`);

        // Extract body from the email
        const body = extractBody(msg.payload);
        if (!body) {
            console.log('[otpHelper] Could not extract body from this email, skipping...');
            continue;
        }

        // Extract exactly 6-digit OTP from body
        const otpMatch = body.match(/\b(\d{6})\b/);
        if (otpMatch) {
            return otpMatch[1];
        }
    }

    return null;
}

/** Recursively extract text from email payload (handles multipart, plain text, and HTML) */
function extractBody(payload: any): string {
    if (!payload) return '';

    // Direct body (non-multipart)
    if (payload.body?.data) {
        const decoded = Buffer.from(payload.body.data, 'base64').toString('utf8');
        if (payload.mimeType === 'text/html') {
            // Strip HTML tags to get plain text
            return decoded.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
        return decoded;
    }

    // Multipart — look through all parts
    if (payload.parts) {
        // Prefer text/plain
        for (const part of payload.parts) {
            if (part.mimeType === 'text/plain' && part.body?.data) {
                return Buffer.from(part.body.data, 'base64').toString('utf8');
            }
        }
        // Fallback to text/html
        for (const part of payload.parts) {
            if (part.mimeType === 'text/html' && part.body?.data) {
                const html = Buffer.from(part.body.data, 'base64').toString('utf8');
                return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
            }
        }
        // Recurse into nested multipart
        for (const part of payload.parts) {
            const result = extractBody(part);
            if (result) return result;
        }
    }

    return '';
}

