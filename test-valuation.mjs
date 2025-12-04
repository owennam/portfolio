import { fetchFinancialData } from './src/lib/valuation/fetchData.js';
import { runValuationModels } from './src/lib/valuation/models.js';

async function test() {
    try {
        console.log('Fetching data for GOOGL...');
        const data = await fetchFinancialData('GOOGL');
        console.log('Data fetched:', data);

        if (data) {
            console.log('Running models...');
            const result = runValuationModels(data);
            console.log('Result:', result);
        }
    } catch (error) {
        console.error('Test Error:', error);
    }
}

test();
