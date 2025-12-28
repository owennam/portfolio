
import { POST } from './src/app/api/roast/route.js';

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
    static json(data, options) {
        return { data, status: options?.status || 200 };
    }
};

async function test() {
    const mockData = {
        stats: { totalValue: 50000000, netProfit: -2500000, roi: -5.0 },
        holdings: [
            { name: 'Samsung Electronics', ticker: '005930.KS', quantity: 100, avgPrice: 80000, currentPrice: 58000, profit: -2200000, profitPercent: -27.5 },
            { name: 'Tesla', ticker: 'TSLA', quantity: 10, avgPrice: 200, currentPrice: 250, profit: 500, profitPercent: 25.0 },
            { name: 'Dogecoin', ticker: 'DOGE-USD', quantity: 5000, avgPrice: 0.1, currentPrice: 0.08, profit: -100, profitPercent: -20.0 }
        ]
    };

    console.log("=== Testing ROAST Mode ===");
    const reqRoast = new MockRequest({ ...mockData, mode: 'roast' });
    try {
        const res = await POST(reqRoast);
        console.log(res.data.markdown);
    } catch (e) { console.error(e); }

    console.log("\n\n=== Testing ADVISOR Mode ===");
    const reqAdvisor = new MockRequest({ ...mockData, mode: 'advisor' });
    try {
        const res = await POST(reqAdvisor);
        console.log(res.data.markdown);
    } catch (e) { console.error(e); }
}

test();
