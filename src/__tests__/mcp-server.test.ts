import { randomUUID } from "crypto";
import { spawn } from "child_process";
import { promisify } from "util";
import type { ChildProcess } from "child_process";
import * as path from "path";

const sleep = promisify(setTimeout);

// Interface for MCP response
interface McpResponse {
  id: string;
  result?: {
    content: Array<{
      type: string;
      text: string;
    }>;
  };
  error?: {
    code: number;
    message: string;
  };
}

// Class to manage MCP server communication
class McpServerTester {
  serverProcess: ChildProcess | null;

  constructor() {
    this.serverProcess = null;
  }

  // Start the MCP server
  async startServer() {
    // Using a relative path approach that works with Jest
    const serverPath = path.resolve(process.cwd(), "dist", "index.js");
    this.serverProcess = spawn("node", [serverPath], {
      stdio: ["pipe", "pipe", "inherit"],
    });

    // Give the server a moment to start
    return sleep(1000);
  }

  // Stop the server and clean up resources
  stopServer() {
    if (this.serverProcess) {
      try {
        // Try to end all streams gracefully
        if (this.serverProcess.stdin) {
          this.serverProcess.stdin.end();
        }

        if (this.serverProcess.stdout) {
          this.serverProcess.stdout.destroy();
        }

        // Kill the process
        this.serverProcess.kill("SIGTERM");
      } catch (err) {
        console.error("Error cleaning up server process:", err);
      }

      this.serverProcess = null;
    }
  }

  // Send a request to the server and wait for response
  async sendRequest(name: string, toolArgs = {}): Promise<McpResponse> {
    return new Promise((resolve, reject) => {
      if (
        !this.serverProcess ||
        !this.serverProcess.stdin ||
        !this.serverProcess.stdout
      ) {
        reject(new Error("Server process is not running properly"));
        return;
      }

      const request = {
        jsonrpc: "2.0",
        id: randomUUID(),
        method: "tools/call",
        params: {
          name,
          arguments: toolArgs,
        },
      };

      // Send request to server
      this.serverProcess.stdin.write(JSON.stringify(request) + "\n");

      // Set up response handler
      const responseHandler = (data: Buffer) => {
        try {
          // Get response as string
          const rawResponse = data.toString();

          const response = JSON.parse(rawResponse) as McpResponse;

          // Check if this is the response to our request
          if (response.id === request.id) {
            // Clear timeout to prevent memory leaks
            clearTimeout(timeoutId);

            // Remove the listener to avoid handling other responses
            if (this.serverProcess && this.serverProcess.stdout) {
              this.serverProcess.stdout.removeListener("data", responseHandler);
            }
            resolve(response);
          }
        } catch (error) {
          reject(
            new Error(
              `Error processing response: ${error instanceof Error ? error.message : String(error)}`
            )
          );
        }
      };

      // Listen for response
      this.serverProcess.stdout.on("data", responseHandler);

      // Set timeout
      const timeoutId = setTimeout(() => {
        if (this.serverProcess && this.serverProcess.stdout) {
          this.serverProcess.stdout.removeListener("data", responseHandler);
        }
        reject(new Error("Request timed out after 10 seconds"));
      }, 10000);
    });
  }
}

// Create a single tester instance for all tests
const tester = new McpServerTester();

// Set up Jest hooks
beforeAll(async () => {
  await tester.startServer();
});

// Make sure to terminate all processes after all tests
afterAll(async () => {
  // First stop our server
  tester.stopServer();
});

// Test Cases
describe("MCP Text-to-Speech Server", () => {
  // Test 1: Basic speech with default parameters
  test("Basic speech functionality", async () => {
    const response = await tester.sendRequest("speak", {
      text: "This is a basic test of the speech functionality.",
    });

    expect(response.result?.content?.[0]?.text).toContain("Successfully spoke");
  }, 15000); // Longer timeout for speech tests

  // Test 2: Speech with custom voice
  test("Speech with custom voice", async () => {
    const response = await tester.sendRequest("speak", {
      text: "This is a test using a custom voice.",
      voice: "Daniel",
    });

    expect(response.result?.content?.[0]?.text).toContain("Successfully spoke");
  }, 15000);

  // Test 3: Speech with different speed
  test("Speech with adjusted speed", async () => {
    const response = await tester.sendRequest("speak", {
      text: "This is a test with increased speech speed.",
      speed: 1.5,
    });

    expect(response.result?.content?.[0]?.text).toContain("Successfully spoke");
  }, 15000);

  // Test 4: Stop functionality
  test("Stopping speech mid-playback", async () => {
    // Start a long speech - but make sure to await and store the promise
    const speakPromise = tester.sendRequest("speak", {
      text: "This is a very long speech that should be interrupted. It continues for a while to ensure we have time to stop it.",
      speed: 0.8,
    });

    // Wait a moment for speech to start
    await sleep(1500);

    // Stop the speech
    const stopResponse = await tester.sendRequest("stop");

    expect(stopResponse.result?.content?.[0]?.text).toContain("Speech stopped");

    // Make sure the first request completes or is handled
    await speakPromise;
  }, 15000);

  // Test 5: Error handling (invalid parameters)
  test("Error handling for invalid parameters", async () => {
    // Missing required 'text' parameter
    const response = await tester.sendRequest("speak", {
      voice: "Alex",
      speed: 1.0,
    });

    // Should get an error response
    expect(response.error).toBeDefined();
  });

  // Test 7: Multiple voices in sequence
  test("Multiple voices in sequence", async () => {
    const voices = ["Organ", "Samantha", "Fred"];

    for (const voice of voices) {
      const response = await tester.sendRequest("speak", {
        text: `This is the ${voice} voice.`,
        voice,
      });

      expect(response.result?.content?.[0]?.text).toContain(
        "Successfully spoke"
      );
    }
  }, 30000); // Longer timeout for multiple speeches
});
