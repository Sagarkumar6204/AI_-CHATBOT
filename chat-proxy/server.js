// server.js (ES module)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("🚨 GEMINI_API_KEY not found in .env — add GEMINI_API_KEY=your_key");
  process.exit(1);
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const app = express();
app.use(cors());            // Allow cross-origin (you can restrict in production)
app.use(express.json());    // Parse JSON bodies
app.use(express.static(path.join(__dirname, "public"))); // Serve frontend

// Health check
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body?.message;
    if (!userMessage) return res.status(400).json({ error: "Missing message" });

    // DEBUG logging
    console.log("➡️  Received message:", userMessage);

    // Use the SDK to call Gemini
    // NOTE: model name can be gemini-1.5-flash, gemini-2.5-flash, etc depending on availability in your account.
    const modelName = "models/gemini-2.0-flash";



    // SDK call: generateContent
    const response = await ai.models.generateContent({
      model: modelName,
      // contents can be either a string or the structured format:
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
    });

    // Try to extract text safely. SDKs vary — try common fields.
    let replyText = "";

    // preferred: response.response.text() if SDK returns such a helper
    if (typeof response?.response?.text === "function") {
      replyText = response.response.text();
    } else if (typeof response?.text === "string") {
      replyText = response.text;
    } else {
      // fallback: attempt to inspect structured result
      try {
        // many responses include candidates[0].content.parts[0].text
        replyText =
          response?.candidates?.[0]?.content?.parts?.[0]?.text ||
          JSON.stringify(response).slice(0, 1000); // short fallback for debugging
      } catch (e) {
        replyText = "No text found in model response";
      }
    }

    console.log("⬅️  Reply:", replyText);
    res.json({ reply: replyText });
  } catch (err) {
    console.error("❌ Error in /chat:", err);
    // Return the error details for easier debugging (do not expose in prod)
    res.status(500).json({ error: err.message || String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
