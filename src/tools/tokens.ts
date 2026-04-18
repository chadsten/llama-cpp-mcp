/**
 * Token manipulation tools for llama-mcp-server.
 *
 * Tools: llama_tokenize, llama_detokenize, llama_apply_template
 */

import { z } from 'zod';
import type { LlamaClient } from '../client.js';
import type { Tool, ToolResult } from '../types.js';
import { formatError } from '../utils.js';

/**
 * Input schema for llama_tokenize tool.
 */
const TokenizeInputSchema = z.object({
  content: z.string().describe('Text to tokenize'),
  add_special: z.boolean().optional().default(true).describe('Add BOS/EOS tokens'),
  with_pieces: z.boolean().optional().default(false).describe('Include token strings'),
});

type TokenizeInput = z.infer<typeof TokenizeInputSchema>;

/**
 * Create the llama_tokenize tool.
 *
 * Converts text to token IDs. Optionally includes BOS/EOS tokens
 * and can return the string representation of each token.
 */
export function createTokenizeTool(client: LlamaClient): Tool {
  return {
    name: 'llama_tokenize',
    description: 'Convert text to token IDs',
    inputSchema: TokenizeInputSchema,
    handler: async (input: unknown): Promise<ToolResult> => {
      try {
        const parsed = TokenizeInputSchema.parse(input) as TokenizeInput;
        const result = await client.tokenize(parsed.content, {
          add_special: parsed.add_special,
          with_pieces: parsed.with_pieces,
        });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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
 * Input schema for llama_detokenize tool.
 */
const DetokenizeInputSchema = z.object({
  tokens: z.array(z.number()).describe('Token IDs to convert'),
});

type DetokenizeInput = z.infer<typeof DetokenizeInputSchema>;

/**
 * Create the llama_detokenize tool.
 *
 * Converts token IDs back to text.
 */
export function createDetokenizeTool(client: LlamaClient): Tool {
  return {
    name: 'llama_detokenize',
    description: 'Convert token IDs back to text',
    inputSchema: DetokenizeInputSchema,
    handler: async (input: unknown): Promise<ToolResult> => {
      try {
        const parsed = DetokenizeInputSchema.parse(input) as DetokenizeInput;
        const result = await client.detokenize(parsed.tokens);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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
 * Input schema for llama_apply_template tool.
 */
const ApplyTemplateInputSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']).describe('Message role'),
    content: z.string().describe('Message content'),
  })).describe('Chat messages to format'),
});

type ApplyTemplateInput = z.infer<typeof ApplyTemplateInputSchema>;

/**
 * Create the llama_apply_template tool.
 *
 * Formats chat messages using the model's template without running inference.
 * Useful for seeing how the chat template formats messages.
 */
export function createApplyTemplateTool(client: LlamaClient): Tool {
  return {
    name: 'llama_apply_template',
    description: 'Format chat messages using model\'s template without inference',
    inputSchema: ApplyTemplateInputSchema,
    handler: async (input: unknown): Promise<ToolResult> => {
      try {
        const parsed = ApplyTemplateInputSchema.parse(input) as ApplyTemplateInput;
        const result = await client.applyTemplate(parsed.messages);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
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
