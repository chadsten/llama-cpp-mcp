/**
 * HTTP client for llama-server communication.
 *
 * Provides a typed interface for all llama-server endpoints.
 */

import type { Config } from './config.js';
import type {
  HealthResponse,
  PropsResponse,
  ModelsResponse,
  SlotsResponse,
  TokenizeOptions,
  TokenizeResponse,
  DetokenizeResponse,
  ApplyTemplateResponse,
  CompletionOptions,
  CompletionResponse,
  ChatMessage,
  ChatOptions,
  ChatResponse,
  EmbedResponse,
  InfillOptions,
  InfillResponse,
  RerankResponse,
  LoraAdapter,
  LoraAdapterUpdate,
} from './types.js';

/**
 * Interface for llama-server HTTP client.
 */
export interface LlamaClient {
  baseUrl: string;
  timeout: number;

  // Server endpoints
  health(): Promise<HealthResponse>;
  props(settings?: Record<string, unknown>): Promise<PropsResponse>;
  models(): Promise<ModelsResponse>;
  slots(): Promise<SlotsResponse>;
  metrics(): Promise<string>;

  // Token endpoints
  tokenize(content: string, options?: TokenizeOptions): Promise<TokenizeResponse>;
  detokenize(tokens: number[]): Promise<DetokenizeResponse>;
  applyTemplate(messages: ChatMessage[]): Promise<ApplyTemplateResponse>;

  // Inference endpoints
  complete(prompt: string, options?: CompletionOptions): Promise<CompletionResponse>;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  embed(content: string): Promise<EmbedResponse>;
  infill(prefix: string, suffix: string, options?: InfillOptions): Promise<InfillResponse>;
  rerank(query: string, documents: string[]): Promise<RerankResponse>;

  // Model management
  loadModel(model: string): Promise<void>;
  unloadModel(model: string): Promise<void>;

  // LoRA
  loraList(): Promise<LoraAdapter[]>;
  loraSet(adapters: LoraAdapterUpdate[]): Promise<LoraAdapter[]>;
}

/**
 * Create an HTTP client for llama-server.
 *
 * @param config - Configuration with server URL and timeout
 * @returns LlamaClient instance
 */
export function createClient(config: Config): LlamaClient {
  const baseUrl = config.serverUrl;
  const timeout = config.timeout;

  /**
   * Fetch JSON from llama-server with timeout.
   */
  async function fetchJson<T>(path: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json() as Promise<T>;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetch text from llama-server with timeout.
   */
  async function fetchText(path: string): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(`${baseUrl}${path}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.text();
    } finally {
      clearTimeout(timeoutId);
    }
  }

  return {
    baseUrl,
    timeout,

    // Server endpoints
    health: () => fetchJson<HealthResponse>('/health'),

    props: (settings?: Record<string, unknown>) => {
      if (settings) {
        return fetchJson<PropsResponse>('/props', {
          method: 'POST',
          body: JSON.stringify({ default_generation_settings: settings }),
        });
      }
      return fetchJson<PropsResponse>('/props');
    },

    models: () => fetchJson<ModelsResponse>('/v1/models'),

    slots: () => fetchJson<SlotsResponse>('/slots'),

    metrics: () => fetchText('/metrics'),

    // Token endpoints
    tokenize: (content: string, options?: TokenizeOptions) =>
      fetchJson<TokenizeResponse>('/tokenize', {
        method: 'POST',
        body: JSON.stringify({
          content,
          add_special: options?.add_special ?? true,
          with_pieces: options?.with_pieces ?? false,
        }),
      }),

    detokenize: (tokens: number[]) =>
      fetchJson<DetokenizeResponse>('/detokenize', {
        method: 'POST',
        body: JSON.stringify({ tokens }),
      }),

    applyTemplate: (messages: ChatMessage[]) =>
      fetchJson<ApplyTemplateResponse>('/apply-template', {
        method: 'POST',
        body: JSON.stringify({ messages }),
      }),

    // Inference endpoints
    complete: (prompt: string, options?: CompletionOptions) =>
      fetchJson<CompletionResponse>('/completion', {
        method: 'POST',
        body: JSON.stringify({
          prompt,
          n_predict: options?.max_tokens ?? 4096,
          temperature: options?.temperature ?? 0.7,
          top_p: options?.top_p ?? 0.9,
          top_k: options?.top_k ?? 40,
          stop: options?.stop,
          seed: options?.seed,
        }),
      }),

    chat: (messages: ChatMessage[], options?: ChatOptions) =>
      fetchJson<ChatResponse>('/v1/chat/completions', {
        method: 'POST',
        body: JSON.stringify({
          messages,
          max_tokens: options?.max_tokens ?? 4096,
          temperature: options?.temperature ?? 0.7,
          top_p: options?.top_p ?? 0.9,
          stop: options?.stop,
          seed: options?.seed,
          ...(options?.thinking_budget_tokens !== undefined && { thinking_budget_tokens: options.thinking_budget_tokens }),
        }),
      }),

    embed: (content: string) =>
      fetchJson<EmbedResponse>('/embedding', {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),

    infill: (prefix: string, suffix: string, options?: InfillOptions) =>
      fetchJson<InfillResponse>('/infill', {
        method: 'POST',
        body: JSON.stringify({
          input_prefix: prefix,
          input_suffix: suffix,
          n_predict: options?.max_tokens ?? 4096,
          temperature: options?.temperature ?? 0.7,
          stop: options?.stop,
        }),
      }),

    rerank: (query: string, documents: string[]) =>
      fetchJson<RerankResponse>('/reranking', {
        method: 'POST',
        body: JSON.stringify({ query, documents }),
      }),

    // Model management
    loadModel: async (model: string) => {
      await fetchJson<void>('/models/load', {
        method: 'POST',
        body: JSON.stringify({ model }),
      });
    },

    unloadModel: async (model: string) => {
      await fetchJson<void>('/models/unload', {
        method: 'POST',
        body: JSON.stringify({ model }),
      });
    },

    // LoRA
    loraList: () => fetchJson<LoraAdapter[]>('/lora-adapters'),

    loraSet: (adapters: LoraAdapterUpdate[]) =>
      fetchJson<LoraAdapter[]>('/lora-adapters', {
        method: 'POST',
        body: JSON.stringify(adapters),
      }),
  };
}
