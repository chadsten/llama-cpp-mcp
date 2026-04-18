/**
 * LoRA adapter management tools for llama-mcp-server.
 *
 * Tools: llama_lora_list, llama_lora_set
 */
import { z } from 'zod';
import { formatError } from '../utils.js';
/**
 * Input schema for llama_lora_list tool.
 */
const LoraListInputSchema = z.object({});
/**
 * Input schema for llama_lora_set tool.
 */
const LoraSetInputSchema = z.object({
    adapters: z.array(z.object({
        id: z.number().describe('Adapter ID'),
        scale: z.number().describe('Scale factor (0 to disable)'),
    })).describe('Adapters to update with new scale values'),
});
/**
 * Create the llama_lora_list tool.
 *
 * Lists all loaded LoRA adapters with their IDs, paths, and scale factors.
 */
export function createLoraListTool(client) {
    return {
        name: 'llama_lora_list',
        description: 'List loaded LoRA adapters',
        inputSchema: LoraListInputSchema,
        handler: async () => {
            try {
                const adapters = await client.loraList();
                return {
                    content: [{ type: 'text', text: JSON.stringify(adapters, null, 2) }],
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
 * Create the llama_lora_set tool.
 *
 * Sets LoRA adapter scale factors. Scale 0 effectively disables an adapter.
 * Multiple adapters can be active simultaneously.
 */
export function createLoraSetTool(client) {
    return {
        name: 'llama_lora_set',
        description: 'Set LoRA adapter scales',
        inputSchema: LoraSetInputSchema,
        handler: async (input) => {
            try {
                const parsed = LoraSetInputSchema.parse(input);
                const adapters = await client.loraSet(parsed.adapters);
                return {
                    content: [{ type: 'text', text: JSON.stringify(adapters, null, 2) }],
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
