// config.ts — loads env vars.

import "dotenv/config";

export const config = {
  groqApiKey: process.env.GROQ_API_KEY ?? "",
  chatModel: "openai/gpt-oss-20b",
  tavilyApiKey: process.env.TAVILY_API_KEY ?? "",
  port: Number(process.env.PORT ?? 3000)
} as const;
