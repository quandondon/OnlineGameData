const express = require('express');
const admin = require('firebase-admin');
const axios = require('axios');
const path = require('path');

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://onlinegamedata-87bc6-default-rtdb.asia-southeast1.firebasedatabase.app"
});

const db = admin.database();
const app = express();
app.use(express.json());
app.use(express.static('public'));

const BOT_TOKEN = '8686083637:AAG6ZPi_4f5AIvs_o8xFl0RISmR3fNPac3Y';
const CHAT_ID = '5428146683';


async function isAdmin(req, res, next) {
    const token = req.headers.authorization;
    try {
        const decodedToken = await admin.auth().verifyIdToken(token);
        const user = (await db.ref(`users/${decodedToken.uid}`).once('value')).val();
        if (user && user.role === 'admin') {
            req.uid = decodedToken.uid;
            return next();
        }
        res.status(403).send("Unauthorized");
    } catch (e) { res.status(401).send("Invalid Token"); }
}

// ROUTE: Request Topup
app.post('/api/topup', async (req, res) => {
    const { uid, username, amount, method } = req.body;
    const requestRef = db.ref('topup_requests').push();
    await requestRef.set({ uid, username, amount, method, status: 'pending', time: Date.now() });

    const msg = `🔔 *Có người nạp tiền Request*\nUser: ${username}\nAmount: ${amount}\nMethod: ${method}`;
    axios.post(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        chat_id: CHAT_ID, text: msg, parse_mode: 'Markdown'
    });
    res.json({ success: true });
});


app.post('/api/admin/update-user', isAdmin, async (req, res) => {
    const { targetUid, balanceChange, status } = req.body;
    const ref = db.ref(`users/${targetUid}`);
    if (balanceChange) await ref.child('balance').transaction(c => (c || 0) + balanceChange);
    if (status) await ref.update({ status });
    res.json({ success: true });
});


app.post('/api/admin/announce', isAdmin, async (req, res) => {
    await db.ref('announcement').set({ text: req.body.text, time: Date.now() });
    res.json({ success: true });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
