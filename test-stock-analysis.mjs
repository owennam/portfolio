async function test() {
    const sampleData = {
        name: "Palantir Technologies Inc.",
        assetClass: "US Stock",
        intrinsicValue: {
            lower: 130,
            upper: 150,
            midpoint: 140,
            method: "DCF (60%) + PEG (40%)",
            lastUpdated: "2025-12-04"
        },
        moat: {
            totalScore: 17,
            rating: "MODERATE",
            breakdown: { brand: 2, network: 4, switchingCost: 5, scale: 3, thiel10x: 3 }
        },
        capitalAllocation: {
            roe: { current: 12, grade: "B" },
            roic: { current: 8, grade: "B" },
            debtEquity: { current: 0.05, grade: "A+" },
            overallGrade: "B-"
        },
        investmentThesis: {
            original: [
                { hypothesis: "AI Platform Monopoly", status: "valid", confidence: 80 },
                { hypothesis: "Gov Contract Growth", status: "valid", confidence: 90 }
            ],
            overallStatus: "valid",
            validCount: "2/2"
        },
        recommendation: {
            action: "HOLD",
            reason: "Overheated but thesis valid.",
            targetPrice: 150
        },
        alerts: {
            marginOfSafety: {
                threshold: -20,
                triggered: true,
                message: "Overheated! Avoid new buys."
            },
            moatWeakening: {
                threshold: 15,
                triggered: false
            }
        },
        nextActions: [
            { action: "Consider Taking Profit", condition: "Price > $180" },
            { action: "Prepare to Buy", condition: "Price < $150" }
        ],
        priceHistory: [
            { date: "2025-11-04", price: 170 },
            { date: "2025-12-04", price: 176 }
        ]
    };

    try {
        // 1. POST Analysis
        console.log('Posting analysis for PLTR...');
        const resPost = await fetch('http://localhost:3000/api/stock-analysis/PLTR', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sampleData)
        });
        console.log('POST Status:', resPost.status);

        if (!resPost.ok) {
            const errText = await resPost.text();
            console.error('POST Error Body:', errText);
            return; // Stop if POST fails
        }

        // 2. GET Analysis
        console.log('Getting analysis for PLTR...');
        const resGet = await fetch('http://localhost:3000/api/stock-analysis/PLTR');
        const dataGet = await resGet.json();
        console.log('GET Result:', dataGet.name);

        // 3. GET Alerts
        console.log('Getting Value Alerts...');
        const resAlerts = await fetch('http://localhost:3000/api/value-alerts');
        const dataAlerts = await resAlerts.json();
        console.log('Alerts:', JSON.stringify(dataAlerts, null, 2));

    } catch (e) {
        console.error('Test Failed:', e);
    }
}

test();
