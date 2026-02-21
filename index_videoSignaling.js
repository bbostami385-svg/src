// =======================================
// index_videoSignaling.js - Bayojid AI Backend
// Step 4: Video Meeting Signaling
// =======================================

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { Configuration, OpenAIApi } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

// =============== OpenAI Setup ===============
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
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

let currentRoom = null;

// =============== ROUTES ===============

// Root
app.get("/", (req, res) => {
  res.send("Bayojid AI Server with Video Signaling ✅");
});

// ================= CHAT ROUTE =================
app.post("/chat", async (req, res) => {
  try {
    const { message, username } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided" });

    // Call OpenAI
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: message }]
    });

    const aiReply = response.data.choices[0].message.content;

    // Save chat
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

// ================= VIDEO MEETING SIGNALING =================
// Simple signaling via Firestore
app.post("/start-call", async (req, res) => {
  try {
    const { callId, username } = req.body;
    if (!callId || !currentRoom) return res.status(400).json({ error: "CallId or room missing" });

    const callRef = db.collection("rooms").doc(currentRoom)
      .collection("calls").doc(callId);

    await callRef.set({ host: username || "Anonymous", createdAt: firebase.firestore.FieldValue.serverTimestamp() });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/signal", async (req, res) => {
  try {
    const { callId, signalData, username } = req.body;
    if (!callId || !currentRoom) return res.status(400).json({ error: "CallId or room missing" });

    const signalsRef = db.collection("rooms").doc(currentRoom)
      .collection("calls").doc(callId).collection("signals");

    await signalsRef.add({
      sender: username || "Anonymous",
      signal: signalData,
      timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ================= GET SIGNALS =================
app.get("/signals/:callId", async (req, res) => {
  try {
    const { callId } = req.params;
    if (!callId || !currentRoom) return res.status(400).json({ error: "CallId or room missing" });

    const signalsSnap = await db.collection("rooms").doc(currentRoom)
      .collection("calls").doc(callId).collection("signals")
      .orderBy("timestamp")
      .get();

    const signals = [];
    signalsSnap.forEach(doc => {
      signals.push(doc.data());
    });

    res.json({ signals });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ================= SERVER =================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT} ✅`));
