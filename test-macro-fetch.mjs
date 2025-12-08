import fetch from 'node-fetch';

async function testFredFetch() {
    const id = 'RRPONTSYD';
    const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`;
    console.log(`Fetching ${url}...`);

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        if (!response.ok) {
            console.error(`Failed: ${response.status} ${response.statusText}`);
            console.log(await response.text());
            return;
        }

        const text = await response.text();
        console.log('--- Response Start ---');
        console.log(text.slice(0, 200));
        console.log('--- Response End ---');

        const lines = text.trim().split('\n');
        const lastLine = lines[lines.length - 1];
        console.log(`Last Line: ${lastLine}`);

    } catch (e) {
        console.error('Error:', e);
    }
}

testFredFetch();
