require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Server test route
app.get("/", (req, res) => {
  res.send("Bayojid AI Server is Running ✅");
});

// Chat route (Demo mode)
app.post("/chat", async (req, res) => {
  try {
    const message = req.body.message || "";

    let reply;

    if (message.toLowerCase().includes("hello")) {
      reply = "Hello! আমি Bayojid AI 😊";
    } else if (message.toLowerCase().includes("bangladesh")) {
      reply = "বাংলাদেশ একটি সুন্দর দেশ 🇧🇩";
    } else {
      reply = "আমি এখন demo mode এ আছি। Premium এ গেলে full AI চালু হবে 🔥";
    }

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
