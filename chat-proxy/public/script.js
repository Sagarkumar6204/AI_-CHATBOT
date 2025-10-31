const promptEl = document.querySelector("#prompt");
const btn = document.querySelector("#btn");
const chatContainer = document.querySelector("#chat-container");

function appendMessage(text, cls) {
  const div = document.createElement("div");
  div.className = cls;
  div.textContent = text;
  chatContainer.appendChild(div);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

async function sendMessage(message) {
  // show user message
  appendMessage(message, "user-chat");

  // show loading AI message
  const loadingEl = document.createElement("div");
  loadingEl.className = "ai-chat";
  loadingEl.textContent = "Typing...";
  chatContainer.appendChild(loadingEl);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  try {
    const resp = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });

    const data = await resp.json();
    // remove loading
    loadingEl.remove();

    if (!resp.ok) {
      appendMessage("Error: " + (data.error || resp.statusText), "ai-chat");
      console.error("Backend error", data);
      return;
    }

    appendMessage(data.reply || "No reply", "ai-chat");
  } catch (err) {
    loadingEl.remove();
    appendMessage("Network error: " + err.message, "ai-chat");
    console.error("Fetch error:", err);
  }
}

promptEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const txt = promptEl.value.trim();
    if (!txt) return;
    promptEl.value = "";
    sendMessage(txt);
  }
});

btn.addEventListener("click", () => {
  const txt = promptEl.value.trim();
  if (!txt) return;
  promptEl.value = "";
  sendMessage(txt);
});
