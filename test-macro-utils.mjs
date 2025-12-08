import { fetchMacroData } from './src/lib/macroUtils.js';

async function test() {
    console.log('Testing fetchMacroData...');
    try {
        const data = await fetchMacroData();
        console.log('Success!');
        console.log(JSON.stringify(data, null, 2));

        if (data.rrp && data.reserves && data.sofr && data.iorb && data.spread) {
            console.log('All fields present.');
        } else {
            console.error('Missing fields!');
        }

    } catch (e) {
        console.error('Test Failed:', e);
    }
}

test();
