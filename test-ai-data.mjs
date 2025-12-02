
async function test() {
    try {
        const res = await fetch('http://localhost:3000/api/ai-data');
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        console.log('AI Data Endpoint Response:');
        console.log(JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

test();
