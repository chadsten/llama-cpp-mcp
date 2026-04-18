/**
 * Model management tools for llama-mcp-server.
 *
 * Tools: llama_load_model, llama_unload_model
 */

import { z } from 'zod';
import type { LlamaClient } from '../client.js';
import type { Tool, ToolResult } from '../types.js';
import { formatError } from '../utils.js';

/**
 * Input schema for llama_load_model tool.
 */
const LoadModelInputSchema = z.object({
  model: z.string().describe('Model name or path to load'),
});

type LoadModelInput = z.infer<typeof LoadModelInputSchema>;

/**
 * Create the llama_load_model tool.
 *
 * Loads a model in router mode. Only works if llama-server was started in router mode.
 * May take time for large models.
 */
export function createLoadModelTool(client: LlamaClient): Tool {
  return {
    name: 'llama_load_model',
    description: 'Load a model (router mode only)',
    inputSchema: LoadModelInputSchema,
    handler: async (input: unknown): Promise<ToolResult> => {
      try {
        const parsed = LoadModelInputSchema.parse(input) as LoadModelInput;
        await client.loadModel(parsed.model);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true, model: parsed.model, message: `Model "${parsed.model}" loaded successfully` }, null, 2) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: `Error: ${formatError(message, client.baseUrl)}` }],
          isError: true,
        };
      }
    },
  };
}

/**
 * Input schema for llama_unload_model tool.
 */
const UnloadModelInputSchema = z.object({
  model: z.string().describe('Model to unload'),
});

type UnloadModelInput = z.infer<typeof UnloadModelInputSchema>;

/**
 * Create the llama_unload_model tool.
 *
 * Unloads the current model (router mode only).
 */
export function createUnloadModelTool(client: LlamaClient): Tool {
  return {
    name: 'llama_unload_model',
    description: 'Unload the current model (router mode only)',
    inputSchema: UnloadModelInputSchema,
    handler: async (input: unknown): Promise<ToolResult> => {
      try {
        const parsed = UnloadModelInputSchema.parse(input) as UnloadModelInput;
        await client.unloadModel(parsed.model);
        return {
          content: [{ type: 'text', text: JSON.stringify({ success: true, model: parsed.model, message: `Model "${parsed.model}" unloaded successfully` }, null, 2) }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text', text: `Error: ${formatError(message, client.baseUrl)}` }],
          isError: true,
        };
      }
    },
  };
}
