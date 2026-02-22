const API_URL = "https://src-4-a535.onrender.com/chat";

let chatHistory = [];

// Random simple user ID (Later Firebase UID use করবে)
const userId = "free_user_001";

sendBtn.addEventListener("click", async () => {
  const message = messageInput.value.trim();
  if (!message) return;

  appendMessage("You", message);
  messageInput.value = "";

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        message: message,
        history: chatHistory,
        userId: userId
      })
    });

    const data = await res.json();

    if (data.reply) {
      appendMessage("AI", data.reply);

      // Save local memory
      chatHistory.push({ role: "user", content: message });
      chatHistory.push({ role: "assistant", content: data.reply });

    } else if (data.error) {
      appendMessage("System", data.error);
    }

  } catch (err) {
    appendMessage("System", "⚠ Error connecting to AI backend");
  }
});
