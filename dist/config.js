/**
 * Configuration loading for llama-mcp-server.
 *
 * Loads configuration from environment variables with sensible defaults.
 */
import { z } from 'zod';
/**
 * Configuration schema with validation and defaults.
 */
const ConfigSchema = z.object({
    serverUrl: z.string().url().default('http://localhost:8080'),
    timeout: z.number().positive().default(180000),
    modelPath: z.string().optional(),
    serverPath: z.string().default('llama-server'),
});
/**
 * Load configuration from environment variables.
 *
 * Environment variables:
 * - LLAMA_SERVER_URL: URL of llama-server (default: http://localhost:8080)
 * - LLAMA_SERVER_TIMEOUT: Request timeout in ms (default: 180000)
 * - LLAMA_MODEL_PATH: Path to GGUF model file (optional)
 * - LLAMA_SERVER_PATH: Path to llama-server binary (default: llama-server)
 */
export function loadConfig() {
    return ConfigSchema.parse({
        serverUrl: process.env.LLAMA_SERVER_URL ?? 'http://localhost:8080',
        timeout: process.env.LLAMA_SERVER_TIMEOUT
            ? parseInt(process.env.LLAMA_SERVER_TIMEOUT, 10)
            : 180000,
        modelPath: process.env.LLAMA_MODEL_PATH,
        serverPath: process.env.LLAMA_SERVER_PATH ?? 'llama-server',
    });
}
