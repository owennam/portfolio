import { google } from 'googleapis';
import path from 'path';

const SPREADSHEET_ID = '1LYFonjcvhuz-4uarvsTMw6gRRxKQrnjpTZHF34nGm_0';
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

async function getAuth() {
    try {
        const keyFile = path.join(process.cwd(), 'service-account.json');
        const auth = new google.auth.GoogleAuth({
            keyFile,
            scopes: SCOPES,
        });
        return await auth.getClient();
    } catch (error) {
        console.error('Google Auth Error:', error.message);
        return null;
    }
}

export async function appendTradeToSheet(trade) {
    const auth = await getAuth();
    if (!auth) {
        console.warn('Skipping Google Sheets upload: No valid auth found.');
        return;
    }

    const sheets = google.sheets({ version: 'v4', auth });

    const currency = trade.currency || (['US Stock', 'Crypto'].includes(trade.assetClass) ? 'USD' : 'KRW');
    const exchangeRate = trade.exchangeRate || (currency === 'USD' ? 1400 : 1); // Default/Approx

    const values = [
        [
            trade.date || new Date().toISOString().split('T')[0],
            trade.type,
            trade.assetClass,
            trade.ticker,
            trade.name,
            trade.price,
            trade.quantity,
            trade.amount || (trade.price * trade.quantity),
            currency,
            exchangeRate,
            trade.fee || 0,
            trade.strategy || '',
            trade.reason || '',
            new Date().toISOString() // Timestamp
        ]
    ];

    try {
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Trading_History!A:N', // Extended range for new columns
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values,
            },
        });
        console.log('Trade appended to Google Sheet');
    } catch (error) {
        console.error('Error appending to Google Sheet:', error.message);
    }
}
