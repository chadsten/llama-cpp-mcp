/**
 * Server management tools for llama-mcp-server.
 *
 * Tools: llama_health, llama_props, llama_models, llama_slots, llama_metrics
 */
import { z } from 'zod';
import { formatError } from '../utils.js';
/**
 * Create the llama_health tool.
 *
 * Checks if llama-server is running and returns status information.
 */
export function createHealthTool(client) {
    return {
        name: 'llama_health',
        description: 'Check if llama-server is running and get status',
        inputSchema: z.object({}),
        handler: async () => {
            try {
                const health = await client.health();
                return {
                    content: [{ type: 'text', text: JSON.stringify(health, null, 2) }],
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
 * Input schema for llama_props tool.
 */
const PropsInputSchema = z.object({
    default_generation_settings: z
        .object({
        temperature: z.number().optional().describe('Sampling temperature (0-2)'),
        top_p: z.number().optional().describe('Nucleus sampling threshold'),
        top_k: z.number().optional().describe('Top-k sampling'),
    })
        .passthrough()
        .optional()
        .describe('Generation settings to update. If omitted, returns current settings.'),
});
/**
 * Create the llama_props tool.
 *
 * Gets or sets server properties. If default_generation_settings is provided,
 * updates the settings via POST. Otherwise returns current settings via GET.
 */
export function createPropsTool(client) {
    return {
        name: 'llama_props',
        description: 'Get or set server properties and default generation settings',
        inputSchema: PropsInputSchema,
        handler: async (input) => {
            try {
                const parsed = PropsInputSchema.parse(input);
                const props = await client.props(parsed.default_generation_settings);
                return {
                    content: [{ type: 'text', text: JSON.stringify(props, null, 2) }],
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
 * Create the llama_models tool.
 *
 * Lists available/loaded models in OpenAI-compatible format.
 */
export function createModelsTool(client) {
    return {
        name: 'llama_models',
        description: 'List available/loaded models',
        inputSchema: z.object({}),
        handler: async () => {
            try {
                const models = await client.models();
                return {
                    content: [{ type: 'text', text: JSON.stringify(models, null, 2) }],
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
 * Create the llama_slots tool.
 *
 * Views current slot processing state. Each slot handles one inference request.
 * Useful for monitoring concurrent requests.
 */
export function createSlotsTool(client) {
    return {
        name: 'llama_slots',
        description: 'View current slot processing state',
        inputSchema: z.object({}),
        handler: async () => {
            try {
                const slots = await client.slots();
                return {
                    content: [{ type: 'text', text: JSON.stringify(slots, null, 2) }],
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
 * Create the llama_metrics tool.
 *
 * Gets Prometheus-compatible metrics from llama-server.
 * Returns raw text format useful for monitoring/alerting.
 */
export function createMetricsTool(client) {
    return {
        name: 'llama_metrics',
        description: 'Get Prometheus-compatible metrics (tokens processed, latency, etc.)',
        inputSchema: z.object({}),
        handler: async () => {
            try {
                const metrics = await client.metrics();
                return {
                    content: [{ type: 'text', text: metrics }],
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
