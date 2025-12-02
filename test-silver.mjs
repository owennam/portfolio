import yahooFinance from 'yahoo-finance2';

const yf = new yahooFinance({ suppressNotices: ['yahooSurvey'] });

async function testSilver() {
    try {
        const quote = await yf.quote('SI=F');
        console.log('Silver Quote:', quote);
    } catch (error) {
        console.error('Error fetching Silver quote:', error);
    }
}

testSilver();
