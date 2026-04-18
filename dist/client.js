/**
 * HTTP client for llama-server communication.
 *
 * Provides a typed interface for all llama-server endpoints.
 */
/**
 * Create an HTTP client for llama-server.
 *
 * @param config - Configuration with server URL and timeout
 * @returns LlamaClient instance
 */
export function createClient(config) {
    const baseUrl = config.serverUrl;
    const timeout = config.timeout;
    /**
     * Fetch JSON from llama-server with timeout.
     */
    async function fetchJson(path, options) {
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
            return response.json();
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    /**
     * Fetch text from llama-server with timeout.
     */
    async function fetchText(path) {
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
        }
        finally {
            clearTimeout(timeoutId);
        }
    }
    return {
        baseUrl,
        timeout,
        // Server endpoints
        health: () => fetchJson('/health'),
        props: (settings) => {
            if (settings) {
                return fetchJson('/props', {
                    method: 'POST',
                    body: JSON.stringify({ default_generation_settings: settings }),
                });
            }
            return fetchJson('/props');
        },
        models: () => fetchJson('/v1/models'),
        slots: () => fetchJson('/slots'),
        metrics: () => fetchText('/metrics'),
        // Token endpoints
        tokenize: (content, options) => fetchJson('/tokenize', {
            method: 'POST',
            body: JSON.stringify({
                content,
                add_special: options?.add_special ?? true,
                with_pieces: options?.with_pieces ?? false,
            }),
        }),
        detokenize: (tokens) => fetchJson('/detokenize', {
            method: 'POST',
            body: JSON.stringify({ tokens }),
        }),
        applyTemplate: (messages) => fetchJson('/apply-template', {
            method: 'POST',
            body: JSON.stringify({ messages }),
        }),
        // Inference endpoints
        complete: (prompt, options) => fetchJson('/completion', {
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
        chat: (messages, options) => fetchJson('/v1/chat/completions', {
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
        embed: (content) => fetchJson('/embedding', {
            method: 'POST',
            body: JSON.stringify({ content }),
        }),
        infill: (prefix, suffix, options) => fetchJson('/infill', {
            method: 'POST',
            body: JSON.stringify({
                input_prefix: prefix,
                input_suffix: suffix,
                n_predict: options?.max_tokens ?? 4096,
                temperature: options?.temperature ?? 0.7,
                stop: options?.stop,
            }),
        }),
        rerank: (query, documents) => fetchJson('/reranking', {
            method: 'POST',
            body: JSON.stringify({ query, documents }),
        }),
        // Model management
        loadModel: async (model) => {
            await fetchJson('/models/load', {
                method: 'POST',
                body: JSON.stringify({ model }),
            });
        },
        unloadModel: async (model) => {
            await fetchJson('/models/unload', {
                method: 'POST',
                body: JSON.stringify({ model }),
            });
        },
        // LoRA
        loraList: () => fetchJson('/lora-adapters'),
        loraSet: (adapters) => fetchJson('/lora-adapters', {
            method: 'POST',
            body: JSON.stringify(adapters),
        }),
    };
}
