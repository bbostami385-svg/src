// ===============================
// Bayojid AI - GROUP CHAT VERSION (FINAL)
// ===============================

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

// ===============================
// AUTH
// ===============================

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
    document.getElementById("user-status").innerText = "Logged in as: " + user.email;
    joinRoom("global-room"); // default public room
  } else {
    document.getElementById("user-status").innerText = "Not logged in";
    document.getElementById("chat-box").innerHTML = "";
  }
});

// ===============================
// JOIN ROOM
// ===============================

async function joinRoom(roomId) {
  currentRoom = roomId;

  const roomRef = db.collection("rooms").doc(roomId);
  const roomDoc = await roomRef.get();

  if (!roomDoc.exists) {
    await roomRef.set({
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: auth.currentUser.email
    });
  }

  roomRef.collection("messages")
    .orderBy("timestamp")
    .onSnapshot(snapshot => {
      const chatBox = document.getElementById("chat-box");
      chatBox.innerHTML = "";

      snapshot.forEach(doc => {
        const data = doc.data();
        chatBox.innerHTML += `
          <div><b>${data.sender}:</b> ${data.text}</div>
        `;
      });

      chatBox.scrollTop = chatBox.scrollHeight;
    });
}

// ===============================
// SEND MESSAGE
// ===============================

async function sendMessage() {

  if (!auth.currentUser) {
    alert("Login first ❌");
    return;
  }

  if (!currentRoom) {
    alert("No room joined ❌");
    return;
  }

  const input = document.getElementById("chat-input");
  const message = input.value;
  if (!message) return;

  const roomRef = db.collection("rooms").doc(currentRoom);

  // Save user message
  await roomRef.collection("messages").add({
    sender: auth.currentUser.email,
    text: message,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });

  // AI Reply (Demo backend)
  const res = await fetch(`${API_BASE}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message })
  });

  const data = await res.json();

  // Save AI message
  await roomRef.collection("messages").add({
    sender: "Bayojid AI",
    text: data.reply,
    timestamp: firebase.firestore.FieldValue.serverTimestamp()
  });

  input.value = "";
}

// ===============================
// THEME
// ===============================

function toggleTheme() {
  document.body.classList.toggle("light");
}

// ===============================
// HELPERS
// ===============================

function emailInput() {
  return document.getElementById("email");
}

function passwordInput() {
  return document.getElementById("password");
}
