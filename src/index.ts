#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import say from "say";
import { promisify } from "util";
import pkg from "../package.json" with { type: "json" };

const { version, description } = pkg;

// Check if the --help flag is passed
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log(
    `
@passelin/mcp-server-speak v${version}
Usage: npx @passelin/mcp-server-speak [--help|-h]
Options:
  --help, -h    Show this help message and exit

${description}
It provides two tools:
  - speak: Speaks the provided text using the system's TTS engine.
  - stop: Stops any ongoing speech.

Example usage in a MCP host:
{
  "servers": {
    "speak": {
      "type": "stdio",
      "command": "npx",
      "args": ["@passelin/mcp-server-speak"],
    }
  }
}
`
  );
  process.exit(0);
}

const speak = promisify(say.speak.bind(say));

// Create a new MCP server
const server = new McpServer({
  name: "Speak",
  version,
  description,
});

// Define a "speak" tool that takes text and speaks it
server.tool(
  "speak",
  "A tool to speak text using the system's TTS engine. Do not provide a voice unless explicitly asked to.",
  {
    text: z.string().describe("The text to be spoken"),
    voice: z
      .string()
      .optional()
      .describe("Optional voice to use for speech. Varies based on the os."),
    speed: z
      .number()
      .min(0.1)
      .max(1.9)
      .optional()
      .describe("Speed of speech (defaults to 1.0). Min: 0.1, Max: 1.9"),
  },
  async ({ text, voice, speed }) => {
    try {
      await speak(text, voice, speed);
      return {
        content: [
          {
            type: "text",
            text: `Successfully spoke. You can wait for an answer from the user now or continue speaking if you were not done.`,
          },
        ],
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          { type: "text", text: `Error speaking "${text}": ${errorMessage}` },
        ],
      };
    }
  }
);

server.tool(
  "stop",
  "A tool to stop any ongoing speech. Does not require to be used unless you are asked to stop speaking.",
  {}, // Empty parameter schema
  async () => {
    try {
      say.stop();
      return {
        content: [{ type: "text" as const, text: "Speech stopped" }],
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      return {
        content: [
          {
            type: "text" as const,
            text: `Error stopping speech: ${errorMessage}`,
          },
        ],
      };
    }
  }
);

// TODO: Add a tool to reliably list available voices

const transport = new StdioServerTransport();

// Log when server starts (to stderr so we don't interfere with the MCP protocol)
console.error(`Text-to-Speech MCP Server v${version} starting...`);

server
  .connect(transport)
  .then(() => {
    console.error("Server connected successfully to transport");
  })
  .catch((error: Error) => {
    console.error("Failed to connect server to transport:", error.message);
    process.exit(1);
  });
