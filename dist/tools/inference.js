/**
 * Inference tools for llama-mcp-server.
 *
 * Tools: llama_complete, llama_chat, llama_embed, llama_infill, llama_rerank
 */
import { z } from 'zod';
import { formatError } from '../utils.js';
/**
 * Input schema for llama_complete tool.
 */
const CompleteInputSchema = z.object({
    prompt: z.string().describe('The prompt to complete'),
    max_tokens: z.number().optional().default(4096).describe('Maximum tokens to generate'),
    temperature: z.number().optional().default(0.7).describe('Sampling temperature (0-2)'),
    top_p: z.number().optional().default(0.9).describe('Nucleus sampling threshold'),
    top_k: z.number().optional().default(40).describe('Top-k sampling'),
    stop: z.array(z.string()).optional().describe('Stop sequences'),
    seed: z.number().optional().describe('Random seed for reproducibility'),
});
/**
 * Create the llama_complete tool.
 *
 * Generates text completion from a prompt.
 */
export function createCompleteTool(client) {
    return {
        name: 'llama_complete',
        description: 'Generate text completion from a prompt',
        inputSchema: CompleteInputSchema,
        handler: async (input) => {
            try {
                const parsed = CompleteInputSchema.parse(input);
                const result = await client.complete(parsed.prompt, {
                    max_tokens: parsed.max_tokens,
                    temperature: parsed.temperature,
                    top_p: parsed.top_p,
                    top_k: parsed.top_k,
                    stop: parsed.stop,
                    seed: parsed.seed,
                });
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                };
            }
            catch (error) {
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
 * Schema for chat message.
 */
const ChatMessageSchema = z.object({
    role: z.enum(['system', 'user', 'assistant']).describe('Message role'),
    content: z.string().describe('Message content'),
});
/**
 * Input schema for llama_chat tool.
 */
const ChatInputSchema = z.object({
    messages: z.array(ChatMessageSchema).describe('Chat messages'),
    max_tokens: z.number().optional().default(4096).describe('Maximum tokens to generate'),
    temperature: z.number().optional().default(0.7).describe('Sampling temperature (0-2)'),
    top_p: z.number().optional().default(0.9).describe('Nucleus sampling threshold'),
    stop: z.array(z.string()).optional().describe('Stop sequences'),
    seed: z.number().optional().describe('Random seed for reproducibility'),
    thinking_budget_tokens: z.number().optional().describe('Token budget for model reasoning/thinking (-1=unlimited, 0=disabled, N=limit). Controls Qwen/DeepSeek thinking mode.'),
});
/**
 * Create the llama_chat tool.
 *
 * Chat completion using OpenAI-compatible format.
 */
export function createChatTool(client) {
    return {
        name: 'llama_chat',
        description: 'Chat completion (OpenAI-compatible format)',
        inputSchema: ChatInputSchema,
        handler: async (input) => {
            try {
                const parsed = ChatInputSchema.parse(input);
                const result = await client.chat(parsed.messages, {
                    max_tokens: parsed.max_tokens,
                    temperature: parsed.temperature,
                    top_p: parsed.top_p,
                    stop: parsed.stop,
                    seed: parsed.seed,
                    thinking_budget_tokens: parsed.thinking_budget_tokens,
                });
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                };
            }
            catch (error) {
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
 * Input schema for llama_embed tool.
 */
const EmbedInputSchema = z.object({
    content: z.string().describe('Text to embed'),
});
/**
 * Create the llama_embed tool.
 *
 * Generates embeddings for text.
 */
export function createEmbedTool(client) {
    return {
        name: 'llama_embed',
        description: 'Generate embeddings for text',
        inputSchema: EmbedInputSchema,
        handler: async (input) => {
            try {
                const parsed = EmbedInputSchema.parse(input);
                const result = await client.embed(parsed.content);
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                };
            }
            catch (error) {
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
 * Input schema for llama_infill tool.
 */
const InfillInputSchema = z.object({
    input_prefix: z.string().describe('Code before cursor'),
    input_suffix: z.string().describe('Code after cursor'),
    max_tokens: z.number().optional().default(4096).describe('Maximum tokens to generate'),
    temperature: z.number().optional().default(0.7).describe('Sampling temperature (0-2)'),
    stop: z.array(z.string()).optional().describe('Stop sequences'),
});
/**
 * Create the llama_infill tool.
 *
 * Code completion with prefix and suffix context (fill-in-middle).
 */
export function createInfillTool(client) {
    return {
        name: 'llama_infill',
        description: 'Code completion with prefix and suffix context (fill-in-middle)',
        inputSchema: InfillInputSchema,
        handler: async (input) => {
            try {
                const parsed = InfillInputSchema.parse(input);
                const result = await client.infill(parsed.input_prefix, parsed.input_suffix, {
                    max_tokens: parsed.max_tokens,
                    temperature: parsed.temperature,
                    stop: parsed.stop,
                });
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                };
            }
            catch (error) {
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
 * Input schema for llama_rerank tool.
 */
const RerankInputSchema = z.object({
    query: z.string().describe('Search query'),
    documents: z.array(z.string()).describe('Documents to rerank'),
});
/**
 * Create the llama_rerank tool.
 *
 * Reranks documents by relevance to a query.
 */
export function createRerankTool(client) {
    return {
        name: 'llama_rerank',
        description: 'Rerank documents by relevance to a query',
        inputSchema: RerankInputSchema,
        handler: async (input) => {
            try {
                const parsed = RerankInputSchema.parse(input);
                const result = await client.rerank(parsed.query, parsed.documents);
                return {
                    content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
                };
            }
            catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                return {
                    content: [{ type: 'text', text: `Error: ${formatError(message, client.baseUrl)}` }],
                    isError: true,
                };
            }
        },
    };
}
