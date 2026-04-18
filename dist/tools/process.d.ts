/**
 * Process control tools for llama-mcp-server.
 *
 * Tools: llama_start, llama_stop
 */
import { type ChildProcess } from 'child_process';
import type { LlamaClient } from '../client.js';
import type { Config } from '../config.js';
import type { Tool } from '../types.js';
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
export declare function createProcessState(): ProcessState;
/**
 * Create the llama_start tool.
 *
 * Starts llama-server as a child process with the specified model and options.
 * Waits for the server to become healthy before returning.
 */
export declare function createStartTool(client: LlamaClient, config: Config, state: ProcessState): Tool;
/**
 * Create the llama_stop tool.
 *
 * Stops the running llama-server process gracefully.
 */
export declare function createStopTool(state: ProcessState): Tool;
