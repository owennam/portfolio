

async function getStockFNG() {
    try {
        // CNN Fear & Greed API (unofficial endpoint often used)
        const response = await fetch('https://production.dataviz.cnn.io/index/fearandgreed/graphdata', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = await response.json();
        console.log('Stock FNG:', data.fear_and_greed.score, data.fear_and_greed.rating);
        return data.fear_and_greed;
    } catch (error) {
        console.error('Failed to fetch Stock FNG:', error.message);
        return null;
    }
}

async function getCryptoFNG() {
    try {
        const response = await fetch('https://api.alternative.me/fng/');
        if (!response.ok) throw new Error(`Status ${response.status}`);
        const data = await response.json();
        console.log('Crypto FNG:', data.data[0].value, data.data[0].value_classification);
        return data.data[0];
    } catch (error) {
        console.error('Failed to fetch Crypto FNG:', error.message);
        return null;
    }
}

(async () => {
    console.log('Testing Fear & Greed APIs...');
    await getStockFNG();
    await getCryptoFNG();
})();
