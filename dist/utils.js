/**
 * Shared utility functions for llama-cpp-mcp.
 */
/**
 * Format error messages to be more helpful.
 */
export function formatError(message, baseUrl) {
    if (message.includes('ECONNREFUSED') || message.includes('fetch failed')) {
        return `Cannot connect to llama-server at ${baseUrl}. Is it running? Use llama_start or start it manually.`;
    }
    if (message.includes('abort') || message.includes('timeout')) {
        return `Request timed out. Try reducing max_tokens or check server load.`;
    }
    return message;
}
