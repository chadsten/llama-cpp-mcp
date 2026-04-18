/**
 * Configuration loading for llama-mcp-server.
 *
 * Loads configuration from environment variables with sensible defaults.
 */
import { z } from 'zod';
/**
 * Configuration schema with validation and defaults.
 */
declare const ConfigSchema: z.ZodObject<{
    serverUrl: z.ZodDefault<z.ZodString>;
    timeout: z.ZodDefault<z.ZodNumber>;
    modelPath: z.ZodOptional<z.ZodString>;
    serverPath: z.ZodDefault<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    serverUrl: string;
    timeout: number;
    serverPath: string;
    modelPath?: string | undefined;
}, {
    serverUrl?: string | undefined;
    timeout?: number | undefined;
    modelPath?: string | undefined;
    serverPath?: string | undefined;
}>;
/**
 * Configuration type inferred from schema.
 */
export type Config = z.infer<typeof ConfigSchema>;
/**
 * Load configuration from environment variables.
 *
 * Environment variables:
 * - LLAMA_SERVER_URL: URL of llama-server (default: http://localhost:8080)
 * - LLAMA_SERVER_TIMEOUT: Request timeout in ms (default: 180000)
 * - LLAMA_MODEL_PATH: Path to GGUF model file (optional)
 * - LLAMA_SERVER_PATH: Path to llama-server binary (default: llama-server)
 */
export declare function loadConfig(): Config;
export {};
