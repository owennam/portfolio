
const apiKey = process.env.GROK_API_KEY;

async function testGrok() {
    console.log("Testing Grok API...");
    try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: 'You are a test assistant.' },
                    { role: 'user', content: 'Testing. Just say "Hello Grok!"' }
                ],
                model: 'grok-3', // Updated to grok-3 based on API error message
                stream: false,
                temperature: 0
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`API Error ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        console.log("Success!");
        console.log("Response:", data.choices[0].message.content);
    } catch (error) {
        console.error("Test Failed:", error.message);
    }
}

testGrok();
