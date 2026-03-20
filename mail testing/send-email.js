const { google } = require('googleapis');
const dotenv = require('dotenv');
dotenv.config();

/**
 * Script to send an email notification about CI run status.
 */
async function sendEmail() {
    console.log('--- 📧 Sending CI Status Email Notification 📧 ---');

    const requiredVars = ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'USER_EMAIL'];
    const missingVars = requiredVars.filter(v => !process.env[v]);

    if (missingVars.length > 0) {
        console.error(`❌ Missing environment variables: ${missingVars.join(', ')}`);
        process.exit(1);
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET
    );
    oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Build the email content
    const recipient = process.env.USER_EMAIL;
    const subject = `🚀 CI Scheduled Run Status: ${process.env.CI_STATUS || 'Completed'}`;
    const runId = process.env.GITHUB_RUN_ID;
    const repo = process.env.GITHUB_REPOSITORY;
    const runUrl = `https://github.com/${repo}/actions/runs/${runId}`;

    const messageParts = [
        `From: "CI Bot" <${recipient}>`,
        `To: ${recipient}`,
        `Subject: ${subject}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        '<h2>CI Scheduled Run Status</h2>',
        `<p>The scheduled CI run for <strong>${repo}</strong> has completed.</p>`,
        `<p><strong>Status:</strong> ${process.env.CI_STATUS || 'Check GitHub'}</p>`,
        `<p><strong>Run details:</strong> <a href="${runUrl}">${runUrl}</a></p>`,
        '<br>',
        '<p>This is an automated notification.</p>',
    ];
    const message = messageParts.join('\n');

    // The body needs to be base64url encoded
    const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    try {
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });
        console.log('✅ Email notification sent successfully to:', recipient);
    } catch (err) {
        console.error('❌ Failed to send email notification:', err.message);
        process.exit(1);
    }
}

sendEmail().catch(err => {
    console.error('Unexpected Error:', err);
    process.exit(1);
});
