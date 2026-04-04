const firebaseConfig = {
    apiKey: "...",
    authDomain: "...",
    databaseURL: "...",
    projectId: "...",
    storageBucket: "...",
    messagingSenderId: "...",
    appId: "..."
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

let isLoginMode = true;

function toggleAuth() {
    isLoginMode = !isLoginMode;
    document.getElementById('form-title').innerText = isLoginMode ? "Login" : "Register";
    document.getElementById('register-fields').style.display = isLoginMode ? "none" : "block";
    document.getElementById('auth-btn').innerText = isLoginMode ? "Sign In" : "Register Now";
}

async function handleAuth() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        if (isLoginMode) {
            const res = await auth.signInWithEmailAndPassword(email, password);
            checkRedirect(res.user.uid);
        } else {
            const username = document.getElementById('reg-username').value;
            const res = await auth.createUserWithEmailAndPassword(email, password);
            await db.ref('users/' + res.user.uid).set({
                username: username,
                password: password, // For your requirement
                email: email,
                balance: 0,
                role: 'client',
                status: 'active',
                createTime: Date.now(),
                lastLogin: Date.now(),
                lastUsernameChange: 0,
                lastPasswordChange: 0
            });
            location.href = "client.html";
        }
    } catch (e) { alert(e.message); }
}

async function checkRedirect(uid) {
    const snap = await db.ref('users/' + uid).once('value');
    if (snap.val().role === 'admin') location.href = "admin.html";
    else location.href = "client.html";
}

// Cooldown Logic
async function changeUsername() {
    const newName = document.getElementById('new-username').value;
    const uid = auth.currentUser.uid;
    const snap = await db.ref('users/' + uid).once('value');
    const lastChange = snap.val().lastUsernameChange || 0;

    if (Date.now() - lastChange < 3 * 24 * 60 * 60 * 1000) {
        return alert("You can change username every 3 days.");
    }
    await db.ref('users/' + uid).update({ username: newName, lastUsernameChange: Date.now() });
    alert("Username updated!");
}

async function requestTopup() {
    const amount = document.getElementById('topup-amount').value;
    const uid = auth.currentUser.uid;
    const userSnap = await db.ref('users/' + uid).once('value');
    
    await fetch('/api/topup', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            uid: uid,
            username: userSnap.val().username,
            amount: parseInt(amount),
            method: 'Banking/QR'
        })
    });
    alert("Request Sent to Admin!");
}
