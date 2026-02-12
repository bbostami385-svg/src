const express = require("express");
const cors = require("cors");
require("dotenv").config();
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// OpenAI setup
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const freeUsers = {}; // username -> { startTime, secondsUsed }

app.post("/chat", async (req, res) => {
  const { username, message } = req.body;

  if (!message || !username) {
    return res.status(400).json({ error: "Message & username required" });
  }

  const now = Date.now();
  const limit = 3600; // 1 hour free limit

  if (!freeUsers[username]) {
    freeUsers[username] = { startTime: now, secondsUsed: 0 };
  }

  const user = freeUsers[username];
  const elapsed = Math.floor((now - user.startTime) / 1000);
  const remaining = limit - (user.secondsUsed + elapsed);

  if (remaining <= 0) {
    return res.json({ error: "Free 1-hour limit over. Please upgrade!" });
  }

  user.secondsUsed += elapsed;
  user.startTime = now;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: message }],
    });

    res.json({
      reply: response.choices[0].message.content,
      timeLeft: remaining,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Chat API error" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
