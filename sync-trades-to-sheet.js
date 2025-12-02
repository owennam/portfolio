
import { google } from 'googleapis';
import path from 'path';
import fs from 'fs/promises';
import yahooFinance from 'yahoo-finance2';

const yf = new yahooFinance({ suppressNotices: ['yahooSurvey'] });

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

async function formatHeader(auth) {
    const sheets = google.sheets({ version: 'v4', auth });
    try {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            requestBody: {
                requests: [{
                    repeatCell: {
                        range: {
                            sheetId: 0, // Assuming first sheet
                            startRowIndex: 0,
                            endRowIndex: 1,
                            startColumnIndex: 0,
                            endColumnIndex: 14 // A to N
                        },
                        cell: {
                            userEnteredFormat: {
                                backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
                                textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true }
                            }
                        },
                        fields: "userEnteredFormat(backgroundColor,textFormat)"
                    }
                }]
            }
        });
        console.log('Header formatted.');
    } catch (error) {
        console.error('Header formatting failed (maybe sheetId mismatch):', error.message);
    }
}

async function syncTrades() {
    const auth = await getAuth();
    if (!auth) {
        console.error('Authentication failed.');
        return;
    }

    const sheets = google.sheets({ version: 'v4', auth });

    // Read local trades
    const tradesPath = path.join(process.cwd(), 'data', 'trades.json');
    const fileContent = await fs.readFile(tradesPath, 'utf8');
    const trades = JSON.parse(fileContent);

    console.log(`Found ${trades.length} trades to sync.`);

    // Fetch Historical Exchange Rates
    console.log('Fetching historical exchange rates...');
    const dates = trades.map(t => t.date).sort();
    const minDate = dates[0];
    const maxDate = new Date().toISOString().split('T')[0]; // Today

    // Fetch a bit more buffer before minDate to handle weekends/holidays
    const startDate = new Date(minDate);
    startDate.setDate(startDate.getDate() - 5);
    const queryPeriod1 = startDate.toISOString().split('T')[0];

    let rateMap = {};
    try {
        const historicalRates = await yf.historical('KRW=X', { period1: queryPeriod1, period2: maxDate });
        historicalRates.forEach(r => {
            const dateStr = r.date.toISOString().split('T')[0];
            rateMap[dateStr] = r.close;
        });
        console.log(`Fetched ${historicalRates.length} exchange rate records.`);
    } catch (e) {
        console.error('Failed to fetch historical rates:', e.message);
    }

    // Helper to get rate
    const getRate = (date) => {
        if (rateMap[date]) return rateMap[date];
        // Fallback to previous days if missing (e.g. weekend)
        const d = new Date(date);
        for (let i = 0; i < 5; i++) {
            d.setDate(d.getDate() - 1);
            const prevDate = d.toISOString().split('T')[0];
            if (rateMap[prevDate]) return rateMap[prevDate];
        }
        return 1400; // Final fallback
    };

    // Transform to rows
    const values = trades.map(trade => {
        let currency = trade.currency;
        if (!currency) {
            if (trade.assetClass === 'US Stock' || trade.assetClass === 'Crypto') {
                currency = 'USD';
            } else {
                currency = 'KRW';
            }
        }

        // Determine Exchange Rate
        let exchangeRate = trade.exchangeRate;
        if (currency === 'USD') {
            // If explicit rate is missing or looks like default, try to use historical
            if (!exchangeRate || exchangeRate === 1 || exchangeRate === 1400) {
                exchangeRate = getRate(trade.date);
            }
        } else {
            exchangeRate = 1;
        }

        // Calculate Fee
        let fee = trade.fee;
        if (fee === undefined || fee === '') {
            const price = parseFloat(trade.price) || 0;
            const qty = parseFloat(trade.quantity) || 0;
            const amount = price * qty;
            let rate = 0;

            if (trade.assetClass === 'Crypto') {
                rate = 0.001; // Binance 0.1%
            } else if (trade.assetClass === 'US Stock') {
                rate = 0.0007; // Samsung US 0.07%
            } else if (trade.assetClass === 'Domestic Stock') {
                if (trade.account === 'General') {
                    const baseFee = 0.000036396;
                    const tax = trade.type === 'Sell' ? 0.0018 : 0;
                    rate = baseFee + tax;
                } else {
                    rate = 0.000036396; // Pension/IRP
                }
            }

            if (['US Stock', 'Crypto'].includes(trade.assetClass)) {
                fee = (amount * rate).toFixed(2);
            } else {
                fee = Math.floor(amount * rate);
            }
        }

        return [
            trade.date,
            trade.type,
            trade.assetClass,
            trade.ticker,
            trade.name,
            trade.price,
            trade.quantity,
            trade.amount || (trade.price * trade.quantity),
            currency,
            exchangeRate,
            fee,
            trade.strategy || '',
            trade.reason || '',
            trade.createdAt || new Date().toISOString()
        ];
    });

    try {
        // Optional: Clear existing data first? 
        // For now, let's just append. The user asked to "save", and it's a new sheet setup.
        // But to be safe against duplicates if they run it twice, maybe we should clear?
        // The user said "save the records so far", implying a one-time sync.
        // Let's just append.

        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Trading_History!A:N',
            valueInputOption: 'USER_ENTERED',
            requestBody: {
                values,
            },
        });
        console.log('Successfully synced trades to Google Sheet.');
        await formatHeader(auth);
    } catch (error) {
        console.error('Error syncing to Google Sheet:', error.message);
    }
}

syncTrades();
