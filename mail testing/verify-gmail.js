const { google } = require('googleapis');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

/**
 * Diagnostic script to verify Gmail API credentials and list recent emails.
 * Run with: node verify-gmail.js
 */
async function verifyGmail() {
    console.log('--- 🛡️ Gmail API Configuration Diagnostic 🛡️ ---');

    // Check for required environment variables
    const requiredVars = ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN'];
    const missingVars = requiredVars.filter(v => !process.env[v]);

    if (missingVars.length > 0) {
        console.error(`❌ Missing environment variables: ${missingVars.join(', ')}`);
        console.log('Please check your .env file.');
        return;
    }

    console.log('✅ Found required environment variables.');

    const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
    );
    oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    try {
        console.log('🔍 Testing authentication and listing recent emails...');
        const searchRes = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 5,
        });

        const messages = searchRes.data.messages;
        if (!messages || messages.length === 0) {
            console.log('ℹ️ No emails found in your inbox.');
            return;
        }

        console.log(`✅ Authentication SUCCESSFUL. Found ${messages.length} recent emails:`);

        for (const msgItem of messages) {
            const msgRes = await gmail.users.messages.get({
                userId: 'me',
                id: msgItem.id,
                format: 'metadata',
                metadataHeaders: ['From', 'Subject', 'Date'],
            });

            const headers = msgRes.data.payload.headers;
            const from = headers.find(h => h.name === 'From')?.value || '(Unknown From)';
            const subject = headers.find(h => h.name === 'Subject')?.value || '(No Subject)';
            const date = headers.find(h => h.name === 'Date')?.value || '(Unknown Date)';

            console.log(`   📧 [${date}]`);
            console.log(`      From:    ${from}`);
            console.log(`      Subject: ${subject}`);
            console.log('   -----------------------------------');
        }

        console.log('\n--- 🧪 Search Query Test 🧪 ---');
        console.log('Testing query: "NRL newer_than:5m"');
        const nrlRes = await gmail.users.messages.list({
            userId: 'me',
            q: 'NRL newer_than:5m',
            maxResults: 1,
        });

        if (nrlRes.data.messages && nrlRes.data.messages.length > 0) {
            console.log('✅ SUCCESS: Found at least one NRL email with the broadened query!');
        } else {
            console.log('ℹ️ No NRL emails found in the last 5 minutes. (Expected if no test is running)');
        }

    } catch (err) {
        console.error('\n❌ GMAIL API ERROR:');
        if (err.response && err.response.data) {
            console.error('   Status Code:', err.response.status);
            console.error('   Error Data: ', JSON.stringify(err.response.data, null, 2));

            if (err.response.data.error === 'invalid_grant') {
                console.warn('\n💡 TIP: Your GMAIL_REFRESH_TOKEN is probably expired or invalid.');
                console.warn('   Please follow the instructions in implementation_report.md to generate a new one.');
            }
        } else {
            console.error('   ', err.message);
        }
    }
}

verifyGmail().catch(err => {
    console.error('Unexpected Diagnostic Error:', err);
});
