// server.ts — Express server serving the UI and the /ask endpoint.

import { config } from "./config.js";
import express from "express";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { runAgent } from "./agent.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/ask", async (req, res) => {
  const question = req.body?.question;
  if (!question) {
    res.status(400).json({ error: "Missing 'question' in request body." });
    return;
  }

  try {
    const result = await runAgent(question);
    res.json(result);
  } catch (err) {
    console.error("Agent error:", err);
    res.status(500).json({
      error: err instanceof Error ? err.message : "Agent failed"
    });
  }
});

app.listen(config.port, () => {
  console.log(`Server running at http://localhost:${config.port}`);
});
