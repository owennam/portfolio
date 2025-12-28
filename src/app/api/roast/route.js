
import { generateGrokResponse } from '@/lib/grok';

export async function POST(request) {
    try {
        const { holdings, stats, mode = 'roast' } = await request.json();

        // Prepare Portfolio Context
        let context = `[Portfolio Summary]\n`;
        if (stats) {
            context += `- Total Value: ${Math.round(stats.totalValue).toLocaleString()} KRW\n`;
            context += `- Net Profit: ${Math.round(stats.netProfit).toLocaleString()} KRW\n`;
            context += `- ROI: ${(stats.roi || 0).toFixed(2)}%\n`;
        }

        context += `\n[Holdings]\n`;
        if (holdings && holdings.length > 0) {
            holdings.forEach(h => {
                const profitPercent = h.profitPercent || 0;
                const profitColor = h.profit >= 0 ? '+' : '';
                context += `- ${h.name} (${h.ticker}): ${h.quantity} shares, Avg Price: ${Math.round(h.avgPrice || 0).toLocaleString()}, Current: ${Math.round(h.currentPrice || 0).toLocaleString()} (${profitColor}${profitPercent.toFixed(2)}%)\n`;
            });
        } else {
            context += "No holdings.\n";
        }

        // Define Personas
        const prompts = {
            roast: `You are a savage, roast-master investment guru. 
Your goal is to ROAST the user's portfolio. Be mean, be funny, be sarcastic. 
Point out their terrible decisions, their "paper hands", or their boring choices.
Use Korean street slang if appropriate (but keep it safe for work-ish).
Don't hold back. If they are doing well, accuse them of just being lucky.
Language: Korean.
Output format: Markdown.`,

            advisor: `You are a wise, experienced, and warm financial advisor (like Warren Buffett met a kind grandfather).
Your goal is to provide constructive, actionable advice based on the portfolio.
Analyze the diversification, risk management, and asset quality.
If they are doing poorly, encourage them with wisdom. If doing well, remind them of humility and risk control.
Language: Korean.
Output format: Markdown.`
        };

        const systemPrompt = prompts[mode] || prompts.roast;

        const response = await generateGrokResponse([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: context }
        ]);

        if (!response) {
            return Response.json({ error: 'Failed to generate response' }, { status: 500 });
        }

        return Response.json({ markdown: response });

    } catch (error) {
        console.error("Roast API Error:", error);
        return Response.json({
            error: 'Internal Server Error',
            details: error.message,
            stack: error.stack
        }, { status: 500 });
    }
}
