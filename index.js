// ===============================
// Bayojid AI - FINAL Frontend
// ===============================

// 🔹 Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBYpQsXTHmvq0bvBYF2zKUrxdMEDoEs7qw",
  authDomain: "bayojidaichat.firebaseapp.com",
  projectId: "bayojidaichat",
  storageBucket: "bayojidaichat.firebasestorage.app",
  messagingSenderId: "982053349033",
  appId: "1:982053349033:web:b89d9c88b4516293bfebb8"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

// 🔹 Backend URL (Only change this if needed)
const API_BASE = "https://src-4-a535.onrender.com";

// ===============================
// 🔐 AUTH SECTION
// ===============================

function signup() {
  const email = emailInput().value;
  const password = passwordInput().value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => alert("Signup Successful ✅"))
    .catch(err => alert(err.message));
}

function login() {
  const email = emailInput().value;
  const password = passwordInput().value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => alert("Login Successful ✅"))
    .catch(err => alert(err.message));
}

function logout() {
  auth.signOut();
}

// ===============================
// 👤 USER STATE
// ===============================

auth.onAuthStateChanged(user => {
  const status = document.getElementById("user-status");

  if (user) {
    status.innerText = "Logged in as: " + user.email;
    loadUserData(user.email);
  } else {
    status.innerText = "Not logged in";
    document.getElementById("chat-box").innerHTML = "";
  }
});

// ===============================
// 💾 LOAD USER DATA
// ===============================

async function loadUserData(email) {
  const chatBox = document.getElementById("chat-box");
  chatBox.innerHTML = "";

  const snapshot = await db.collection("users").doc(email).get();

  if (!snapshot.exists) {
    // First time user
    await db.collection("users").doc(email).set({
      freeUsage: 3600,
      premium: false
    });
    return;
  }

  // Load chats
  db.collection("chats")
    .where("user", "==", email)
    .orderBy("timestamp")
    .onSnapshot(snap => {
      chatBox.innerHTML = "";
      snap.forEach(doc => {
        const data = doc.data();
        chatBox.innerHTML += `
          <div><b>You:</b> ${data.message}</div>
          <div><b>AI:</b> ${data.reply}</div>
        `;
      });
      chatBox.scrollTop = chatBox.scrollHeight;
    });
}

// ===============================
// 🌙 THEME TOGGLE
// ===============================

function toggleTheme() {
  document.body.classList.toggle("light");
}

// ===============================
// 💬 SEND MESSAGE
// ===============================

async function sendMessage() {

  const user = auth.currentUser;
  if (!user) {
    alert("Please login first ❌");
    return;
  }

  const input = document.getElementById("chat-input");
  const message = input.value;
  if (!message) return;

  const userDoc = await db.collection("users").doc(user.email).get();
  const userData = userDoc.data();

  if (!userData.premium && userData.freeUsage <= 0) {
    alert("Free usage finished! Upgrade to Premium 🔥");
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message,
        username: user.email
      })
    });

    const data = await res.json();

    // Save chat
    await db.collection("chats").add({
      user: user.email,
      message: message,
      reply: data.reply,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    // Reduce free usage
    if (!userData.premium) {
      await db.collection("users").doc(user.email).update({
        freeUsage: userData.freeUsage - 1
      });
    }

  } catch (err) {
    document.getElementById("chat-box").innerHTML +=
      `<div><b>System:</b> Cannot connect to backend</div>`;
  }

  input.value = "";
}

// ===============================
// 🔧 Helper
// ===============================

function emailInput() {
  return document.getElementById("email");
}

function passwordInput() {
  return document.getElementById("password");
}
