// 1. Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCMieWQnJawxpBmngd9PNF9iMGf6Avz3XQ",
  authDomain: "onlinegamedata-87bc6.firebaseapp.com",
  databaseURL: "https://onlinegamedata-87bc6-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "onlinegamedata-87bc6",
  storageBucket: "onlinegamedata-87bc6.firebasestorage.app",
  messagingSenderId: "463532803565",
  appId: "1:463532803565:web:f8eff1bee0563a0b0b53e4",
  measurementId: "G-FP5WMDXC28"
};

// 2. Initialize Firebase immediately
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// 3. Global State
let isLoginMode = true;

// 4. Auth Functions
window.toggleAuth = function() {
    isLoginMode = !isLoginMode;
    document.getElementById('form-title').innerText = isLoginMode ? "Login" : "Register";
    document.getElementById('register-fields').style.display = isLoginMode ? "none" : "block";
    document.getElementById('auth-btn').innerText = isLoginMode ? "Sign In" : "Register Now";
};

window.handleAuth = async function() {
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
                password: password, 
                email: email,
                balance: 0,
                role: 'client',
                status: 'active',
                createTime: Date.now(),
                lastLogin: Date.now(),
                lastUsernameChange: 0,
                lastPasswordChange: 0
            });
            window.location.href = "client.html";
        }
    } catch (e) { alert(e.message); }
};

async function checkRedirect(uid) {
    const snap = await db.ref('users/' + uid).once('value');
    const userData = snap.val();
    if (userData.role === 'admin') window.location.href = "admin.html";
    else window.location.href = "client.html";
}

// 5. Dashboard Logic (Runs only on client.html / admin.html)
auth.onAuthStateChanged(user => {
    if (user) {
        // If on client page
        const balanceEl = document.getElementById('balance-display');
        if (balanceEl) {
            db.ref('users/' + user.uid).on('value', snap => {
                const data = snap.val();
                if (data) {
                    balanceEl.innerText = `$${data.balance}`;
                    if (document.getElementById('user-display')) {
                        document.getElementById('user-display').innerText = `User: ${data.username}`;
                    }
                }
            });
        }
        
        // Load Announcements
        const announceBar = document.getElementById('announcement-bar');
        if (announceBar) {
            db.ref('announcement').on('value', snap => {
                if (snap.exists()) announceBar.innerText = snap.val().text;
            });
        }
    }
});

window.requestTopup = async function() {
    const amount = document.getElementById('topup-amount').value;
    if (!amount || amount <= 0) return alert("Enter valid amount");
    
    const user = auth.currentUser;
    const userSnap = await db.ref('users/' + user.uid).once('value');
    
    // Secure call to your Node.js server
    const response = await fetch('/api/topup', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            uid: user.uid,
            username: userSnap.val().username,
            amount: parseInt(amount),
            method: 'Banking/QR'
        })
    });
    
    if (response.ok) alert("Top-up request sent! Admin will review it.");
};
