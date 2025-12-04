async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/daily-changes');
        if (!res.ok) {
            throw new Error(`Status ${res.status}`);
        }
        const data = await res.json();
        console.log('--- Daily Changes ---');
        data.forEach(item => {
            if (item.error) {
                console.log(`[FAILED] ${item.ticker}: ${item.error}`);
            } else {
                const change = item.changePercent ? item.changePercent.toFixed(2) + '%' : 'N/A';
                console.log(`[${item.ticker}] ${item.shortName}: ${item.price} (${change})`);
            }
        });
    } catch (e) {
        console.error('Test Failed:', e.message);
    }
}

test();
