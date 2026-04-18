/**
 * Process control tools for llama-mcp-server.
 *
 * Tools: llama_start, llama_stop
 */

import { z } from 'zod';
import { spawn, type ChildProcess } from 'child_process';
import type { LlamaClient } from '../client.js';
import type { Config } from '../config.js';
import type { Tool, ToolResult } from '../types.js';

/**
 * State for process management.
 * Tracks the currently running llama-server process.
 */
export interface ProcessState {
  process: ChildProcess | null;
  pid: number | null;
}

/**
 * Create a new process state object.
 */
export function createProcessState(): ProcessState {
  return {
    process: null,
    pid: null,
  };
}

function killProcess(childProcess: ChildProcess): void {
  if (childProcess.pid === undefined) {
    return;
  }
  if (process.platform === 'win32') {
    spawn('taskkill', ['/pid', childProcess.pid.toString(), '/t', '/f']);
  } else {
    childProcess.kill('SIGTERM');
  }
}

/**
 * Input schema for llama_start tool.
 */
const StartInputSchema = z.object({
  model: z.string().describe('Path to GGUF model file'),
  port: z.number().optional().default(8080).describe('Port to listen on'),
  ctx_size: z.number().optional().default(2048).describe('Context size'),
  n_gpu_layers: z.number().optional().default(-1).describe('GPU layers (-1 = all)'),
  threads: z.number().optional().describe('CPU threads'),
});

type StartInput = z.infer<typeof StartInputSchema>;

/**
 * Wait for the server to become healthy.
 *
 * @param client - LlamaClient to check health
 * @param maxAttempts - Maximum number of health check attempts
 * @param delayMs - Delay between attempts in milliseconds
 */
async function waitForHealth(
  client: LlamaClient,
  maxAttempts: number = 30,
  delayMs: number = 1000
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const health = await client.health();
      if (health.status === 'ok') {
        return true;
      }
      // If loading model, continue waiting
      if (health.status === 'loading_model') {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
    } catch {
      // Server not ready yet, continue waiting
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  return false;
}

/**
 * Create the llama_start tool.
 *
 * Starts llama-server as a child process with the specified model and options.
 * Waits for the server to become healthy before returning.
 */
export function createStartTool(
  client: LlamaClient,
  config: Config,
  state: ProcessState
): Tool {
  return {
    name: 'llama_start',
    description: 'Start llama-server as a child process with the specified model',
    inputSchema: StartInputSchema,
    handler: async (input: unknown): Promise<ToolResult> => {
      try {
        const parsed = StartInputSchema.parse(input) as StartInput;

        // Check if already running
        if (state.process !== null && state.pid !== null) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: llama-server is already running with PID ${state.pid}. Use llama_stop first.`,
              },
            ],
            isError: true,
          };
        }

        // Build command arguments
        const args: string[] = [
          '-m', parsed.model,
          '--port', String(parsed.port ?? 8080),
          '-c', String(parsed.ctx_size ?? 2048),
          '-ngl', String(parsed.n_gpu_layers ?? -1),
        ];

        if (parsed.threads !== undefined) {
          args.push('-t', String(parsed.threads));
        }

        // Spawn the process
        const serverProcess = spawn(config.serverPath, args, {
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: false,
        });

        // Handle spawn errors
        if (!serverProcess.pid) {
          return {
            content: [
              {
                type: 'text',
                text: `Error: Failed to start llama-server at ${config.serverPath}. Check that the binary exists and is executable.`,
              },
            ],
            isError: true,
          };
        }

        // Store process state
        state.process = serverProcess;
        state.pid = serverProcess.pid;

        // Handle process exit
        serverProcess.on('exit', () => {
          state.process = null;
          state.pid = null;
        });

        // Wait for server to become healthy
        const healthy = await waitForHealth(client);

        if (!healthy) {
          // Clean up if server didn't become healthy
          killProcess(serverProcess);
          state.process = null;
          state.pid = null;

          return {
            content: [
              {
                type: 'text',
                text: 'Error: llama-server started but did not become healthy within 30 seconds. Check model path and server logs.',
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'started',
                  pid: state.pid,
                  model: parsed.model,
                  port: parsed.port ?? 8080,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    },
  };
}

/**
 * Input schema for llama_stop tool.
 */
const StopInputSchema = z.object({});

/**
 * Create the llama_stop tool.
 *
 * Stops the running llama-server process gracefully.
 */
export function createStopTool(state: ProcessState): Tool {
  return {
    name: 'llama_stop',
    description: 'Stop the running llama-server process',
    inputSchema: StopInputSchema,
    handler: async (): Promise<ToolResult> => {
      try {
        // Check if server is running
        if (state.process === null || state.pid === null) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: llama-server is not running. Nothing to stop.',
              },
            ],
            isError: true,
          };
        }

        const pid = state.pid;

        // Send SIGTERM to stop the process
        killProcess(state.process);

        // Clear stored state
        state.process = null;
        state.pid = null;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  status: 'stopped',
                  pid: pid,
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: `Error: ${message}` }],
          isError: true,
        };
      }
    },
  };
}
