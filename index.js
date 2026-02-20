// server.js - Bayojid AI Backend (Real AI ready)

const express = require("express");
const cors = require("cors");
require("dotenv").config(); // Load .env
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Root
app.get("/", (req, res) => {
  res.send("Bayojid AI Server is Running ✅");
});

// Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message, username } = req.body;
    if (!message) return res.status(400).json({ error: "No message provided" });

    // -----------------------------
    // Demo mode (currently)
    // Later: replace with real OpenAI call
    // -----------------------------
    let aiReply = `আমি এখন demo mode এ আছি। তুমি বলেছ: "${message}"`;

    // Uncomment below lines to enable real GPT
    /*
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are Bayojid AI, a smart helpful assistant." },
        { role: "user", content: message }
      ]
    });
    aiReply = completion.choices[0].message.content;
    */

    res.json({ reply: aiReply });

  } catch(err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Optional: Premium check (future-ready)
app.post("/premium-check", (req, res) => {
  const { username } = req.body;
  const isPremium = false; // demo
  res.json({ username, isPremium });
});

// PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT} ✅`));
