// agent.ts — LangGraph agent with Groq + Tavily search.

import { AIMessage, HumanMessage } from "@langchain/core/messages";
import {
  MemorySaver,
  MessagesAnnotation,
  StateGraph
} from "@langchain/langgraph";

import { ChatGroq } from "@langchain/groq";
import { TavilySearch } from "@langchain/tavily";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { config } from "./config.js";

// In-memory checkpointer. Stores message history per thread.
const checkpointer = new MemorySaver();
const THREAD_ID = "1";

const webSearchTool = new TavilySearch({ maxResults: 5, topic: "general" });
const tools = [webSearchTool];

const groq = new ChatGroq({
  apiKey: config.groqApiKey,
  model: config.chatModel
}).bindTools(tools);

const toolNode = new ToolNode(tools);

// Agent node: send all messages to Groq, get back an AIMessage.
async function callModel(state: typeof MessagesAnnotation.State) {
  const response = await groq.invoke(state.messages);
  return { messages: [response] };
}

// After the agent responds, decide where to go next.
function getNextStep(state: typeof MessagesAnnotation.State) {
  const lastMessage = state.messages.at(-1);
  if (lastMessage instanceof AIMessage && lastMessage.tool_calls?.length) {
    return "tools";
  }
  return "__end__";
}

const workflow = new StateGraph(MessagesAnnotation)
  .addNode("agent", callModel)
  .addNode("tools", toolNode)
  .addEdge("__start__", "agent")
  .addEdge("tools", "agent") // after tools, go back to agent
  .addConditionalEdges("agent", getNextStep);

const app = workflow.compile({ checkpointer });

export async function runAgent(question: string) {
  const finalState = await app.invoke(
    { messages: [new HumanMessage(question)] },
    { configurable: { thread_id: THREAD_ID } }
  );

  const lastMessage = finalState.messages.at(-1);
  return {
    question,
    threadId: THREAD_ID,
    result: typeof lastMessage?.content === "string" ? lastMessage.content : ""
  };
}
