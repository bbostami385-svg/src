// =======================================
// Bayojid AI - ROOM BASED ADMIN SYSTEM
// =======================================

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

auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("user-status").innerText =
      "Logged in as: " + user.email;
  } else {
    document.getElementById("chat-box").innerHTML = "";
    document.getElementById("admin-panel").innerHTML = "";
  }
});

// ================= ROOM SYSTEM =================

async function createRoom() {
  if (!auth.currentUser) return alert("Login first ❌");

  const roomId = prompt("Enter Room ID:");
  if (!roomId) return;

  await db.collection("rooms").doc(roomId).set({
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    createdBy: auth.currentUser.email,
    premium: false
  });

  joinRoom(roomId);
}

async function joinRoom(roomId) {
  if (!auth.currentUser) return;

  const roomRef = db.collection("rooms").doc(roomId);
  const snap = await roomRef.get();

  if (!snap.exists) return alert("Room not found");

  const roomData = snap.data();

  currentRoom = roomId;

  document.getElementById("current-room").innerText =
    "Current Room: " + roomId;

  loadRoomAdminPanel(roomData);

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

// ================= ROOM ADMIN PANEL =================

function loadRoomAdminPanel(roomData) {

  const panel = document.getElementById("admin-panel");

  if (roomData.createdBy !== auth.currentUser.email) {
    panel.innerHTML = "";
    return;
  }

  panel.innerHTML = `
    <h3>Room Admin Panel</h3>
    <button onclick="deleteRoom()">Delete Room</button>
    <button onclick="togglePremiumRoom()">Toggle Premium Room</button>
  `;
}

async function deleteRoom() {
  if (!currentRoom) return;

  await db.collection("rooms").doc(currentRoom).delete();

  alert("Room deleted");
  document.getElementById("chat-box").innerHTML = "";
  document.getElementById("admin-panel").innerHTML = "";
  currentRoom = null;
}

async function togglePremiumRoom() {
  const roomRef = db.collection("rooms").doc(currentRoom);
  const snap = await roomRef.get();

  const currentStatus = snap.data().premium;

  await roomRef.update({
    premium: !currentStatus
  });

  alert("Premium status changed");
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
