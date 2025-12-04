async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/ai-data');
        if (!res.ok) {
            throw new Error(`Status ${res.status}`);
        }
        const data = await res.json();
        console.log('--- AI Data Holdings ---');

        if (data.holdings && data.holdings.length > 0) {
            data.holdings.forEach(h => {
                console.log(`[${h.ticker}] ${h.name}: Daily Change ${h.dailyChange}%`);
            });
        } else {
            console.log('No holdings found.');
        }

    } catch (e) {
        console.error('Test Failed:', e.message);
    }
}

test();
