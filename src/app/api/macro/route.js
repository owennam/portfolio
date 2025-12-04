import { NextResponse } from 'next/server';

export async function GET() {
    const series = {
        'RRP': 'RRPONTSYD',
        'Reserves': 'WRESBAL',
        'SOFR': 'SOFR',
        'IORB': 'IORB'
    };

    try {
        const results = {};

        await Promise.all(Object.entries(series).map(async ([key, id]) => {
            try {
                // Fetch CSV directly from FRED
                const response = await fetch(`https://fred.stlouisfed.org/graph/fredgraph.csv?id=${id}`, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                    }
                });

                if (!response.ok) throw new Error(`Failed to fetch ${id}`);

                const text = await response.text();
                const lines = text.trim().split('\n');

                // Get last line
                const lastLine = lines[lines.length - 1];
                const [date, value] = lastLine.split(',');

                let parsedValue = parseFloat(value);

                // Normalize Reserves (Millions -> Billions)
                if (key === 'Reserves') {
                    parsedValue = parsedValue / 1000;
                }

                results[key] = {
                    value: parsedValue,
                    date: date
                };
            } catch (error) {
                console.error(`Error fetching ${key}:`, error);
                results[key] = null;
            }
        }));

        // Calculate Spread
        let spread = null;
        if (results.SOFR && results.IORB) {
            spread = results.SOFR.value - results.IORB.value;
        }

        return NextResponse.json({
            rrp: results.RRP,
            reserves: results.Reserves,
            sofr: results.SOFR,
            iorb: results.IORB,
            spread: spread !== null ? { value: spread, date: results.SOFR.date } : null
        });

    } catch (error) {
        console.error('Macro API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch macro data' }, { status: 500 });
    }
}
