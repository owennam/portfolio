
import { POST } from './src/app/api/journal/generate/route.js';

// Mock Request object
class MockRequest {
    constructor(body) {
        this.body = body;
    }
    async json() {
        return this.body;
    }
}

// Mock Response object
global.Response = class {
    static json(data) {
        return { json: () => data };
    }
};

async function test() {
    const mockData = {
        holdings: [],
        stats: { totalValue: 1000000, netProfit: 50000, roi: 5.0 },
        trades: [
            {
                id: '1',
                date: new Date().toISOString().split('T')[0],
                ticker: 'AAPL',
                name: 'Apple Inc.',
                type: 'Buy',
                quantity: 10,
                price: 150.00
            },
            {
                id: '2',
                date: new Date().toISOString().split('T')[0],
                ticker: '005930.KS',
                name: 'Samsung Electronics',
                type: 'Buy',
                quantity: 100,
                price: 70000
            },
            {
                id: '3',
                date: new Date().toISOString().split('T')[0],
                ticker: 'BTC-USD',
                name: 'Bitcoin',
                type: 'Buy',
                quantity: 0.1,
                price: 40000
            }
        ],
        history: []
    };

    const req = new MockRequest(mockData);

    try {
        const res = await POST(req);
        const data = res.json();
        console.log(data.markdown);
    } catch (e) {
        console.error(e);
    }
}

test();
