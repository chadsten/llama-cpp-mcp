/**
 * Shared TypeScript types for llama-mcp-server.
 *
 * Defines the core Tool and ToolResult interfaces used by all MCP tools.
 */
import { z } from 'zod';
/**
 * Result returned by a tool handler.
 */
export interface ToolResult {
    content: Array<{
        type: 'text';
        text: string;
    }>;
    isError?: boolean;
}
/**
 * Tool definition with name, description, schema, and handler.
 */
export interface Tool {
    name: string;
    description: string;
    inputSchema: z.ZodType;
    handler: (input: unknown) => Promise<ToolResult>;
}
/**
 * Chat message format for chat-based tools.
 */
export interface ChatMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}
/**
 * Health response from llama-server.
 */
export interface HealthResponse {
    status: 'ok' | 'loading_model' | 'error';
    slots_idle: number;
    slots_processing: number;
}
/**
 * Properties response from llama-server.
 */
export interface PropsResponse {
    default_generation_settings?: Record<string, unknown>;
    [key: string]: unknown;
}
/**
 * Model information in OpenAI-compatible format.
 */
export interface ModelInfo {
    id: string;
    object: 'model';
    created: number;
    owned_by: string;
}
/**
 * Models list response from llama-server.
 */
export interface ModelsResponse {
    object: 'list';
    data: ModelInfo[];
}
/**
 * Slot state information.
 */
export interface SlotInfo {
    id: number;
    state: string;
    [key: string]: unknown;
}
/**
 * Slots response from llama-server.
 */
export type SlotsResponse = SlotInfo[];
/**
 * Tokenize options.
 */
export interface TokenizeOptions {
    add_special?: boolean;
    with_pieces?: boolean;
}
/**
 * Tokenize response from llama-server.
 */
export interface TokenizeResponse {
    tokens: number[];
    pieces?: string[];
}
/**
 * Detokenize response from llama-server.
 */
export interface DetokenizeResponse {
    content: string;
}
/**
 * Apply template response from llama-server.
 */
export interface ApplyTemplateResponse {
    prompt: string;
}
/**
 * Completion options.
 */
export interface CompletionOptions {
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    top_k?: number;
    stop?: string[];
    seed?: number;
}
/**
 * Completion response from llama-server.
 */
export interface CompletionResponse {
    content: string;
    stop: boolean;
    generation_settings: Record<string, unknown>;
    timings: {
        prompt_n: number;
        predicted_n: number;
        [key: string]: unknown;
    };
}
/**
 * Chat options.
 */
export interface ChatOptions {
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
    stop?: string[];
    seed?: number;
    thinking_budget_tokens?: number;
}
/**
 * Chat completion response in OpenAI-compatible format.
 */
export interface ChatResponse {
    id: string;
    object: 'chat.completion';
    created: number;
    model: string;
    choices: Array<{
        index: number;
        message: {
            role: 'assistant';
            content: string;
        };
        finish_reason: 'stop' | 'length';
    }>;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}
/**
 * Embed response from llama-server.
 */
export interface EmbedResponse {
    embedding: number[];
}
/**
 * Infill options.
 */
export interface InfillOptions {
    max_tokens?: number;
    temperature?: number;
    stop?: string[];
}
/**
 * Infill response from llama-server.
 */
export interface InfillResponse {
    content: string;
}
/**
 * Rerank result for a single document.
 */
export interface RerankResult {
    index: number;
    relevance_score: number;
}
/**
 * Rerank response from llama-server.
 */
export interface RerankResponse {
    results: RerankResult[];
}
/**
 * LoRA adapter information.
 */
export interface LoraAdapter {
    id: number;
    path: string;
    scale: number;
}
/**
 * LoRA adapter update request.
 */
export interface LoraAdapterUpdate {
    id: number;
    scale: number;
}
