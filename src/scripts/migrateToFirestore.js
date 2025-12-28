
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const serviceAccount = require('../../service-account.json');

// Initialize Firebase Admin (Standalone)
if (getApps().length === 0) {
    initializeApp({
        credential: cert(serviceAccount)
    });
}
const db = getFirestore();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');

const COLLECTIONS = {
    trades: 'trades',
    history: 'history',
    journals: 'journals',
    assets: 'assets',
    liabilities: 'liabilities'
};

async function migrateCollection(filename, collectionName) {
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) {
        console.warn(`⚠️ File not found: ${filename}, skipping.`);
        return;
    }

    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        if (!Array.isArray(data)) {
            console.warn(`⚠️ Data in ${filename} is not an array, skipping.`);
            return;
        }

        console.log(`🚀 Migrating ${data.length} items from ${filename} to '${collectionName}'...`);

        const batchSize = 400; // Firestore batch limit is 500
        let batch = db.batch();
        let count = 0;
        let total = 0;

        for (const item of data) {
            // Ensure ID exists
            if (!item.id) {
                // Generate a simple ID if missing (e.g. for assets/history)
                item.id = collectionName === 'history' ? item.date : (Date.now().toString() + Math.random().toString().slice(2, 6));
            }

            const docRef = db.collection(collectionName).doc(String(item.id));
            batch.set(docRef, item);
            count++;
            total++;

            if (count >= batchSize) {
                await batch.commit();
                console.log(`   - Committed batch of ${count} items.`);
                batch = db.batch();
                count = 0;
            }
        }

        if (count > 0) {
            await batch.commit();
            console.log(`   - Committed final batch of ${count} items.`);
        }

        console.log(`✅ Finished checking ${collectionName}: Processed ${total} items.`);

    } catch (error) {
        console.error(`❌ Error migrating ${filename}:`, error);
    }
}

async function runMigration() {
    console.log('Starting Full Data Migration...');

    await migrateCollection('trades.json', COLLECTIONS.trades);
    await migrateCollection('history.json', COLLECTIONS.history);
    await migrateCollection('journals.json', COLLECTIONS.journals);
    await migrateCollection('assets.json', COLLECTIONS.assets);
    await migrateCollection('liabilities.json', COLLECTIONS.liabilities);

    console.log('🎉 Migration Complete!');
    process.exit(0);
}

runMigration();
