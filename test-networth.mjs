
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:3000/api';

async function testNetWorthAPI() {
    console.log('--- Testing Assets API ---');
    // 1. Add Asset
    const newAsset = {
        category: 'Real Estate',
        name: 'Test Apartment',
        value: 1000000000,
        memo: 'Test Memo'
    };
    const assetRes = await fetch(`${BASE_URL}/assets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAsset)
    });
    const assetData = await assetRes.json();
    console.log('Added Asset:', assetData);

    // 2. Get Assets
    const assetsRes = await fetch(`${BASE_URL}/assets`);
    const assets = await assetsRes.json();
    console.log('All Assets:', assets);

    console.log('\n--- Testing Liabilities API ---');
    // 3. Add Liability
    const newLiability = {
        name: 'Test Loan',
        amount: 500000000,
        interestRate: 3.5,
        maturityDate: '2030-01-01'
    };
    const liabilityRes = await fetch(`${BASE_URL}/liabilities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLiability)
    });
    const liabilityData = await liabilityRes.json();
    console.log('Added Liability:', liabilityData);

    // 4. Get Liabilities
    const liabilitiesRes = await fetch(`${BASE_URL}/liabilities`);
    const liabilities = await liabilitiesRes.json();
    console.log('All Liabilities:', liabilities);

    // Cleanup (Optional: Delete created items)
    await fetch(`${BASE_URL}/assets?id=${assetData.id}`, { method: 'DELETE' });
    await fetch(`${BASE_URL}/liabilities?id=${liabilityData.id}`, { method: 'DELETE' });
    console.log('\nCleaned up test data.');
}

testNetWorthAPI();
