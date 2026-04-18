/**
 * MCP server setup for llama-mcp-server.
 *
 * Creates and configures the McpServer with all 19 llama.cpp tools.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { LlamaClient } from './client.js';
import type { Config } from './config.js';
import type { Tool } from './types.js';

// Import tool factories from each category
import {
  createHealthTool,
  createPropsTool,
  createModelsTool,
  createSlotsTool,
  createMetricsTool,
} from './tools/server.js';

import {
  createTokenizeTool,
  createDetokenizeTool,
  createApplyTemplateTool,
} from './tools/tokens.js';

import {
  createCompleteTool,
  createChatTool,
  createEmbedTool,
  createInfillTool,
  createRerankTool,
} from './tools/inference.js';

import {
  createLoadModelTool,
  createUnloadModelTool,
} from './tools/models.js';

import {
  createLoraListTool,
  createLoraSetTool,
} from './tools/lora.js';

import {
  createStartTool,
  createStopTool,
  createProcessState,
  type ProcessState,
} from './tools/process.js';

/**
 * Extract the shape from a ZodObject schema for MCP tool registration.
 * MCP SDK expects the raw shape (the object passed to z.object()).
 */
function extractShape(schema: z.ZodType): z.ZodRawShape {
  if (schema instanceof z.ZodObject) {
    return schema.shape;
  }
  // For non-object schemas, return empty shape
  return {};
}

/**
 * Register a tool with the MCP server.
 *
 * The MCP SDK expects tools to be registered with:
 * - name: string
 * - description: string (optional, passed as annotation)
 * - paramsSchema: ZodRawShape (the shape object, not wrapped in z.object)
 * - callback: async function receiving parsed args
 */
function registerTool(server: McpServer, tool: Tool): void {
  const shape = extractShape(tool.inputSchema);

  // Use the server.tool() method with description
  server.tool(
    tool.name,
    tool.description,
    shape,
    async (args: Record<string, unknown>) => {
      const result = await tool.handler(args);
      // MCP SDK expects content array with isError as separate property
      return {
        content: result.content,
        isError: result.isError,
      };
    }
  );
}

/**
 * Create and configure the MCP server with all tools.
 *
 * @param client - LlamaClient for HTTP communication with llama-server
 * @param config - Configuration settings
 * @returns Configured McpServer instance and process state
 */
export function createServer(
  client: LlamaClient,
  config: Config
): { server: McpServer; processState: ProcessState } {
  const server = new McpServer({
    name: 'llama-mcp-server',
    version: '0.1.1',
  });

  // Create process state for start/stop tools
  const processState = createProcessState();

  // Create all tools
  const tools: Tool[] = [
    // Server tools
    createHealthTool(client),
    createPropsTool(client),
    createModelsTool(client),
    createSlotsTool(client),
    createMetricsTool(client),

    // Token tools
    createTokenizeTool(client),
    createDetokenizeTool(client),
    createApplyTemplateTool(client),

    // Inference tools
    createCompleteTool(client),
    createChatTool(client),
    createEmbedTool(client),
    createInfillTool(client),
    createRerankTool(client),

    // Model management tools
    createLoadModelTool(client),
    createUnloadModelTool(client),

    // LoRA tools
    createLoraListTool(client),
    createLoraSetTool(client),

    // Process control tools
    createStartTool(client, config, processState),
    createStopTool(processState),
  ];

  // Register all tools with the server
  for (const tool of tools) {
    registerTool(server, tool);
  }

  return { server, processState };
}
