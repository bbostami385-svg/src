// =======================================
// index_realAI_full.js - Bayojid AI Backend (Future-Ready)
// Step 1: Real OpenAI Integration
// =======================================

const express = require("express");
const cors = require("cors");
require("dotenv").config(); // Load OpenAI API key from .env
const { Configuration, OpenAIApi } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

// =============== OpenAI Setup ===============
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY, // <-- শুধু এখানে API key বসাতে হবে
});
const openai = new OpenAIApi(configuration);

// =============== Firebase Setup ===============
const firebase = require("firebase/compat/app");
require("firebase/compat/auth");
require("firebase/compat/firestore");

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

// =============== Global Variables ===============
let currentRoom = null;
let unsubscribe = null;

// =============== ROUTES ===============

// Root route
app.get("/", (req, res) => {
  res.send("Bayojid AI Server is Running ✅");
});

// ================= AUTH ROUTES =================
app.post("/signup", async (req, res) => {
  const { email, password } = req.body;
  try {
    await auth.createUserWithEmailAndPassword(email, password);
    res.json({ message: "Signup Successful ✅" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    await auth.signInWithEmailAndPassword(email, password);
    res.json({ message: "Login Successful ✅" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post("/logout", async (req, res) => {
  try {
    await auth.signOut();
    res.json({ message: "Logout Successful ✅" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ================= ROOM SYSTEM =================
app.post("/create-room", async (req, res) => {
  if (!auth.currentUser) return res.status(401).json({ error: "Login first ❌" });

  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: "Room ID required" });

  try {
    await db.collection("rooms").doc(roomId).set({
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdBy: auth.currentUser.email,
      premium: false
    });
    res.json({ message: `Room ${roomId} created ✅` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/join-room", async (req, res) => {
  const { roomId } = req.body;
  if (!roomId) return res.status(400).json({ error: "Room ID required" });

  try {
    const roomRef = db.collection("rooms").doc(roomId);
    const snap = await roomRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Room not found" });

    currentRoom = roomId;
    res.json({ message: `Joined Room: ${roomId} ✅`, roomData: snap.data() });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/delete-room", async (req, res) => {
  if (!currentRoom) return res.status(400).json({ error: "No active room" });

  try {
    await db.collection("rooms").doc(currentRoom).delete();
    currentRoom = null;
    res.json({ message: "Room deleted ✅" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/toggle-premium", async (req, res) => {
  if (!currentRoom) return res.status(400).json({ error: "No active room" });

  try {
    const roomRef = db.collection("rooms").doc(currentRoom);
    const snap = await roomRef.get();
    const currentStatus = snap.data().premium;
    await roomRef.update({ premium: !currentStatus });
    res.json({ message: `Premium status changed to ${!currentStatus} ✅` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ================= CHAT ROUTE (OpenAI) =================
app.post("/chat", async (req, res) => {
  try {
    const { message, username } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided" });

    // Call OpenAI GPT
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: message }]
    });

    const aiReply = response.data.choices[0].message.content;

    // Save chat to Firebase if room exists
    if (currentRoom) {
      await db.collection("rooms").doc(currentRoom)
        .collection("messages")
        .add({
          sender: username || "Anonymous",
          text: message,
          reply: aiReply,
          timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
    }

    res.json({ reply: aiReply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ================= PREMIUM CHECK =================
app.post("/premium-check", (req, res) => {
  const { username } = req.body;
  const isPremium = false; // Demo logic
  res.json({ username, isPremium });
});

// ================= TODOs =================
// TODO: Step 2 - Add Searchable Chat History
// TODO: Step 3 - Add Typing Indicator Backend
// TODO: Step 4 - Add Video Meeting Signaling

// ================= SERVER START =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT} ✅`));
