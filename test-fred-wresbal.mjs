async function test() {
    const id = 'WRESBAL';
    try {
        const url = `https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`;
        const res = await fetch(url);
        if (res.ok) {
            const text = await res.text();
            const lines = text.trim().split('\n');
            const lastLine = lines[lines.length - 1];
            console.log(`[SUCCESS] ${id}: ${lastLine}`);
        } else {
            console.log(`[FAILED] ${id}: Status ${res.status}`);
        }
    } catch (e) {
        console.log(`[FAILED] ${id}: ${e.message}`);
    }
}

test();
