const freeUsers = {}; // username -> { startTime: timestamp, secondsUsed: number }

app.post("/chat", async (req, res) => {
  const { username, message } = req.body;
  if (!message || !username) return res.status(400).json({ error: "Message & username required" });

  const now = Date.now();
  const limit = 3600; // 1 hour in seconds

  if (!freeUsers[username]) {
    freeUsers[username] = { startTime: now, secondsUsed: 0 };
  }

  const user = freeUsers[username];
  const elapsed = Math.floor((now - user.startTime) / 1000);
  const remaining = limit - (user.secondsUsed + elapsed);

  if (remaining <= 0) {
    return res.json({ error: "Free 1-hour limit over. Please upgrade to Premium!" });
  }

  // Update user's used time
  user.secondsUsed += elapsed;
  user.startTime = now;

  // AI response
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: message }]
    });
    res.json({ reply: response.choices[0].message.content, timeLeft: remaining });
  } catch {
    res.status(500).json({ error: "Chat API error" });
  }
});