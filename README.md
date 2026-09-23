# Custom Agent

A small LangGraph agent with a Groq chat model and Tavily web search, behind an Express server with a chat UI in the browser.

## What it does

- You ask a question in the browser.
- The agent sends it to Groq.
- If Groq decides it needs to search the web, it calls Tavily, reads the results, and answers.
- The conversation is remembered for the thread (in memory while the server runs).

## Stack

- **LangGraph** — the graph that runs the agent loop
- **Groq** (`@langchain/groq`) — the chat model (`openai/gpt-oss-20b`)
- **Tavily** (`@langchain/tavily`) — web search tool
- **Express** — serves the UI and the `/ask` endpoint
- **TypeScript + tsx** — no build step

## Prerequisites

- Node.js 20+
- A Groq API key — https://console.groq.com
- A Tavily API key — https://tavily.com

## Run

```bash
npm run dev
```

Open http://localhost:3000 and ask a question.

## API

| Method | Path      | Body                    | Description    |
| ------ | --------- | ----------------------- | -------------- |
| GET    | `/health` | —                       | Health check   |
| POST   | `/ask`    | `{ "question": "..." }` | Runs the agent |

Example:

```bash
curl -X POST http://localhost:3000/ask \
  -H "Content-Type: application/json" \
  -d '{"question":"What is the weather in Delhi?"}'
```

## How it works

```
Browser → POST /ask → runAgent(question)
                            │
                     LangGraph graph
                            │
                     ┌── agent node ──┐
                     │  send messages  │
                     │  to Groq        │
                     └────────────────┘
                            │
                  Groq wants a tool?
                   /              \
                yes                no
                 │                  │
          tools node             __end__
          (Tavily search)          │
                 │                 ▼
                 └─► back to agent  answer
```

The `MemorySaver` checkpointer stores all messages for the thread, so the agent remembers earlier turns. Memory is lost when the server restarts.
