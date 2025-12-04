export function calculateGrahamNumber(eps, bvps) {
    if (!eps || !bvps || eps < 0 || bvps < 0) return null;
    return Math.sqrt(22.5 * eps * bvps);
}

export function calculatePeterLynchValue(eps, growthRate) {
    if (!eps || !growthRate) return null;
    // Lynch Fair Value = PEG 1.0 = EPS * Growth Rate
    // Adjusted for dividend yield could be added, but keeping it simple.
    // Cap growth rate at 25% to be conservative.
    const adjustedGrowth = Math.min(growthRate * 100, 25);
    if (adjustedGrowth <= 0) return null;
    return eps * adjustedGrowth;
}

export function calculateSimplifiedDCF(freeCashflow, sharesOutstanding, growthRate = 0.10, discountRate = 0.10, terminalGrowth = 0.03, years = 5) {
    if (!freeCashflow || !sharesOutstanding || freeCashflow < 0) return null;

    let futureCashFlows = [];
    let sumPv = 0;

    // Project 5 years
    for (let i = 1; i <= years; i++) {
        const fcf = freeCashflow * Math.pow(1 + growthRate, i);
        const pv = fcf / Math.pow(1 + discountRate, i);
        sumPv += pv;
        futureCashFlows.push(fcf);
    }

    // Terminal Value
    const lastFcf = futureCashFlows[years - 1];
    const terminalValue = (lastFcf * (1 + terminalGrowth)) / (discountRate - terminalGrowth);
    const pvTerminal = terminalValue / Math.pow(1 + discountRate, years);

    const totalValue = sumPv + pvTerminal;
    return totalValue / sharesOutstanding;
}

export function runValuationModels(data) {
    const {
        epsTrailingTwelveMonths,
        bookValuePerShare,
        earningsGrowth,
        pegRatio,
        freeCashflow,
        marketCap,
        currentPrice
    } = data;

    // Estimate shares outstanding
    const sharesOutstanding = (marketCap && currentPrice) ? marketCap / currentPrice : null;

    // 1. Graham Number
    const grahamNumber = calculateGrahamNumber(epsTrailingTwelveMonths, bookValuePerShare);

    // 2. Peter Lynch Value
    // Use earnings growth or derive from PEG if available (Growth = PE / PEG)
    let growthRate = earningsGrowth;
    if (!growthRate && pegRatio && data.peTrailing) {
        growthRate = (data.peTrailing / pegRatio) / 100;
    }
    // Default fallback if no growth data
    if (!growthRate) growthRate = 0.10;

    const peterLynchValue = calculatePeterLynchValue(epsTrailingTwelveMonths, growthRate);

    // 3. Simplified DCF
    const dcfValue = calculateSimplifiedDCF(freeCashflow, sharesOutstanding, growthRate);

    // 4. Consensus Target
    const consensusTarget = data.targetMeanPrice || null;

    // Calculate AI Fair Value (Average of valid models)
    const validValues = [grahamNumber, peterLynchValue, dcfValue, consensusTarget].filter(v => v !== null && v > 0);
    const aiFairValue = validValues.length > 0
        ? validValues.reduce((a, b) => a + b, 0) / validValues.length
        : null;

    return {
        aiFairValue,
        details: {
            grahamNumber,
            peterLynchValue,
            dcfValue,
            consensusTarget
        },
        inputs: {
            eps: epsTrailingTwelveMonths,
            bvps: bookValuePerShare,
            growthRate: (growthRate * 100).toFixed(2) + '%'
        }
    };
}
