// server.js - Bayojid AI Backend (Demo + Future Real AI Ready)

const express = require("express");
const cors = require("cors");
require("dotenv").config(); // Load .env
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

// Initialize OpenAI (Future-ready)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Root route
app.get("/", (req, res) => {
  res.send("Bayojid AI Server is Running ✅");
});

// Chat endpoint
app.post("/chat", async (req, res) => {
  try {
    const { message, username } = req.body;

    if (!message) return res.status(400).json({ error: "No message provided" });

    // -----------------------------
    // Demo reply
    let aiReply = `Demo mode: তুমি বলেছ "${message}"`;
    // -----------------------------
    
    // Uncomment below for Real AI GPT
    /*
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are Bayojid AI, a helpful assistant." },
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

// Premium check endpoint (Future-ready)
app.post("/premium-check", (req, res) => {
  const { username } = req.body;
  const isPremium = false; // Demo
  res.json({ username, isPremium });
});

// Port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server started on port ${PORT} ✅`));
