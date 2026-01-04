const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = {
    projectId: 'portfolio-f6831',
    clientEmail: 'firebase-adminsdk-fbsvc@portfolio-f6831.iam.gserviceaccount.com',
    privateKey: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCnwxfLUu/zSobR
ferppRtzy6Q1g7Dp1KXdWkhC1OwaMTxy52KTjDKrF8wF52rAbEPXQrkodQfkXnsT
u2JxrnKmM6zqn82H0bNxRQlctoW8i5emxtURJtxik0F2ue3mwmgiXY2EQlbJJtS6
CJA31NXS11+I2yyBDZ7ffR4MaQrHbs7neViat4oJn3YOm+csKY3TSV4LgPzlpTaP
Oo9UGLKd7eP3XXlntyHQSmwqB3wTe2XsG3VDvNKTb+cldp40oBZcQQ2VdSA9EY81
5S8ETW9gYApwG5U/xPh5vtT2nF5i07R46lZ3FXpbyqnCPhcEESSMj+GrexRZHfSQ
W6d0ZH3lAgMBAAECggEACEpjJuRsoMaWVoyFOzIyYtzVuuJM8CVW5BNF3m2k1F+K
B/io3bdQOrXUmpcW5rcC/ESbH2V3NCE6Ll20jf8rwcxsd3TZxKRHnKmnfooznj98
yVxqo6wauJFj6xDhsaV6XXZnm7lmjg7J9P6e1+9/+Kk1mq8QKjmI2C0X+s+HHZdn
C7kFBLFkxjVTDbhlv7k2V0ecBI0+U1FMYj4vLFzZYOj5Yrwu+CMOzzqqDC8lKabS
4iQi4HuhQM5cmH1ivii96a6sxgDzL8i46w3r9M6jP1advp5LvzlX3x5HpJTVoXEu
eJ9Knyoh/bqWNTvxinMTOfbvQoqwu6LLkl2wOVPSmQKBgQDT+KtRiAqOrcb8636z
ZRZSpCdHQShBFBDQEPuY60/4a5S5CqlELEzA1k7YjQ2l7B1gnH/Pc/Tso7VvapXG
3/vufeLZ40nQn2IXbfwblIZr8zVSPd1P/3Zg+M2+b6iLR29IXyZWWpm01D8uUjYD
3ct7fVSYawj9JMS8HJHAOXEMWQKBgQDKm6WE1UQxg8tAmSYOt3yrU6el3W9ANeov
ed+anfpoDPkCKVgWTQwCwu+306iIh66aJsLU7nf8qpObLDUaKGXxfj609NgLSOEw
ipsKP+PH2Yuelm1FqiNjKRz5xDtwwX7yr8SnK/m724+tK3MtBlRjUiDtZ+RYWXoG
0gbWkhycbQKBgQCUoRt3Or20V7Ncar/XiD0Dy2hjNRPFtg0n55CTJARZ+w04Rnpz
e+CBooN8okL8obfjoziXPQZy20OAESteXHWpP4nOH+oFJ4y/QvZwXE945/ruZMSG
sGjQDAUvz9lNd9RW2ajnCfYW7nAyyaBoS5+/Qh0MFpkh7yMnh5zHPT/AWQKBgDM+
qt6uElFzxDTSh42xWxb6UaziFQFooZLggG3bBzrKDTE+w8jgM+l+5KLaJgZiSwcy
RpUUu8RsYGkfBU9YaHBsPfAG/Z3dERf19sDg5/vkSiwSYBD+t3SdMXb66w3Z4wH+
8v5VYRTis7RZCQiaUT3NyAZEAL1X5EVVWeVrj1EBAoGAVDCPgPqbY/8AuKdBOt/J
nxs1KInbnmB8pq3MTiKMjdk890dj51BZdINGdO4jJCS9VvpzPWhFfsEw38NFMEvN
R8K6yfIJlS/ZeiCNMkbpRDpFyTWREqWlB7onDPDvMIFRs5Bml7s7tarwXzg9912x
BcWXeSoIeLrE6ytUJVIlHjo=
-----END PRIVATE KEY-----`
};

initializeApp({
    credential: cert(serviceAccount)
});

const db = getFirestore();

async function checkLatestJournal() {
    console.log("Querying journals...");
    const snapshot = await db.collection('journals').orderBy('date', 'desc').limit(5).get();

    if (snapshot.empty) {
        console.log("No journals found.");
        return;
    }

    snapshot.docs.forEach(doc => {
        console.log(`ID: ${doc.id}, Date: ${doc.data().date}`);
    });

    console.log("\nQuerying trades...");
    const tradesSnapshot = await db.collection('trades').orderBy('date', 'desc').limit(5).get();

    if (tradesSnapshot.empty) {
        console.log("No trades found.");
    } else {
        tradesSnapshot.docs.forEach(doc => {
            const data = doc.data();
            console.log(`ID: ${doc.id}, Date: ${data.date}, Ticker: ${data.ticker}, Type: ${data.type}`);
        });
    }
}

checkLatestJournal();
