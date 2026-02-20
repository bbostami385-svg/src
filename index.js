// =======================================
// Bayojid AI - ADMIN PANEL VERSION
// =======================================

const ADMIN_EMAIL = "admin@bayojid.com"; // CHANGE IF NEEDED

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
const API_BASE = "https://src-4-a535.onrender.com";

let currentRoom = null;
let unsubscribe = null;

// ================= AUTH =================

function signup() {
  auth.createUserWithEmailAndPassword(emailInput().value, passwordInput().value)
    .then(() => alert("Signup Successful ✅"))
    .catch(err => alert(err.message));
}

function login() {
  auth.signInWithEmailAndPassword(emailInput().value, passwordInput().value)
    .then(() => alert("Login Successful ✅"))
    .catch(err => alert(err.message));
}

function logout() {
  auth.signOut();
}

auth.onAuthStateChanged(async user => {
  if (user) {

    document.getElementById("user-status").innerText =
      "Logged in as: " + user.email;

    const userRef = db.collection("users").doc(user.email);
    const snap = await userRef.get();

    if (!snap.exists) {
      await userRef.set({ premium: false });
    }

    if (user.email === ADMIN_EMAIL) {
      loadAdminPanel();
    }

    joinRoom("global-room");

  } else {
    document.getElementById("chat-box").innerHTML = "";
    document.getElementById("admin-panel").innerHTML = "";
  }
});

// ================= ADMIN PANEL =================

async function loadAdminPanel() {

  const panel = document.getElementById("admin-panel");
  panel.innerHTML = "<h3>Admin Panel</h3>";

  const users = await db.collection("users").get();

  users.forEach(doc => {
    const data = doc.data();

    panel.innerHTML += `
      <div style="margin-bottom:5px;">
        ${doc.id} | Premium: ${data.premium}
        <button onclick="togglePremium('${doc.id}', ${data.premium})">
          Toggle Premium
        </button>
      </div>
    `;
  });
}

async function togglePremium(email, currentStatus) {
  await db.collection("users").doc(email).update({
    premium: !currentStatus
  });
  loadAdminPanel();
}

// ================= ROOM SYSTEM =================

async function createRoom() {
  if (!auth.currentUser) return alert("Login first ❌");

  const roomId = prompt("Enter Room ID:");
  if (!roomId) return;

  const isPremiumRoom = confirm("Premium Room?");

  await db.collection("rooms").doc(roomId).set({
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    createdBy: auth.currentUser.email,
    premium: isPremiumRoom
  });

  joinRoom(roomId);
}

async function joinRoom(roomId) {
  if (!auth.currentUser) return;

  const roomRef = db.collection("rooms").doc(roomId);
  const snap = await roomRef.get();

  if (!snap.exists) return alert("Room not found");

  const roomData = snap.data();
  const userSnap = await db.collection("users")
    .doc(auth.currentUser.email).get();

  if (roomData.premium && !userSnap.data().premium) {
    return alert("Premium room 🔒");
  }

  currentRoom = roomId;
  document.getElementById("current-room").innerText =
    "Current Room: " + roomId;

  if (unsubscribe) unsubscribe();

  unsubscribe = roomRef.collection("messages")
    .orderBy("timestamp")
    .onSnapshot(snapshot => {

      const chatBox = document.getElementById("chat-box");
      chatBox.innerHTML = "";

      snapshot.forEach(doc => {
        const data = doc.data();
        const div = document.createElement("div");
        div.className = "message " +
          (data.sender === auth.currentUser.email ? "user" : "ai");
        div.innerText = data.sender + ": " + data.text;
        chatBox.appendChild(div);
      });

      chatBox.scrollTop = chatBox.scrollHeight;
    });
}

// ================= SEND MESSAGE =================

async function sendMessage() {
  if (!auth.currentUser || !currentRoom) return;

  const input = document.getElementById("chat-input");
  const message = input.value;
  if (!message) return;

  const roomRef = db.collection("rooms").doc(currentRoom);

  await roomRef.collection("messages").add({
    sender: auth.currentUser.email,
    text: message,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });

  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });

  const data = await res.json();

  await roomRef.collection("messages").add({
    sender: "Bayojid AI",
    text: data.reply,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });

  input.value = "";
}

// ================= HELPERS =================

function emailInput() {
  return document.getElementById("email");
}

function passwordInput() {
  return document.getElementById("password");
}
