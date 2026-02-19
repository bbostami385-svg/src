// Firebase Setup
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

// Login/Signup
function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => alert("Signup Successful ✅"))
    .catch(err => alert(err.message));
}

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => alert("Login Successful ✅"))
    .catch(err => alert(err.message));
}

function logout() { auth.signOut(); }

auth.onAuthStateChanged(user => {
  document.getElementById("user-status").innerText = user ? "Logged in as: " + user.email : "Not logged in";
});

// Theme toggle
function toggleTheme() {
  document.body.classList.toggle("light");
}

// Chat
const API_BASE = "https://src-4-a535.onrender.com"; // backend URL
async function sendMessage() {
  if (!auth.currentUser) { alert("Please login first ❌"); return; }

  const input = document.getElementById("chat-input");
  const message = input.value;
  if (!message) return;

  try {
    const res = await fetch(`${API_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type":"application/json" },
      body: JSON.stringify({ message, username: auth.currentUser.email })
    });
    const data = await res.json();
    document.getElementById("chat-box").innerHTML += `
      <div><b>You:</b> ${message}</div>
      <div><b>AI:</b> ${data.reply}</div>
    `;
  } catch {
    document.getElementById("chat-box").innerHTML += `<div><b>System:</b> Cannot connect to backend</div>`;
  }

  input.value="";
}
