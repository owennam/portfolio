
const GROK_API_KEY = process.env.GROK_API_KEY;
const GROK_API_URL = 'https://api.x.ai/v1/chat/completions';
const GROK_MODEL = 'grok-3';

/**
 * Generates a response from Grok xAI based on the provided system and user messages.
 * @param {Array<{role: string, content: string}>} messages 
 * @returns {Promise<string>} The generated content.
 */
export async function generateGrokResponse(messages) {
    try {
        const response = await fetch(GROK_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROK_API_KEY}`
            },
            body: JSON.stringify({
                messages,
                model: GROK_MODEL,
                stream: false,
                temperature: 0.7 // slightly creative for witty journal
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Grok API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error("Failed to call Grok API:", error);
        throw error; // Propagate error for debugging
    }
}
