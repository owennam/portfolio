import * as yfAll from 'yahoo-finance2';
import yfDefault from 'yahoo-finance2';

console.log("Keys in * export:", Object.keys(yfAll));
console.log("Type of default export:", typeof yfDefault);
console.log("Is default export an instance?", yfDefault instanceof Object);
console.log("Does default export have quote?", typeof yfDefault.quote);

try {
    console.log("Trying to call default export as function...");
    new yfDefault();
} catch (e) {
    console.log("Cannot instantiate default export:", e.message);
}
