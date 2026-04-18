# llama-cpp-mcp

MCP server bridging Claude Code to local llama.cpp inference. Works with **any model llama.cpp supports** -- Qwen, Llama, Mistral, DeepSeek, Phi, Gemma, CodeLlama, and anything else you can load as a GGUF. Run local LLMs alongside Claude for experimentation, testing, and cost-effective inference.

Forked from [ahays248/llama-mcp-server](https://github.com/ahays248/llama-mcp-server)

## Requirements

- Node.js 18+
- [llama.cpp](https://github.com/ggerganov/llama.cpp) with `llama-server` built
- A GGUF model file

## Installation

```bash
npm install llama-cpp-mcp
```

Or clone and build from source:

```bash
git clone https://github.com/chadsten/llama-cpp-mcp
cd llama-cpp-mcp
npm install
npm run build
```

## Configuration

Configure via environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `LLAMA_SERVER_URL` | URL of llama-server | `http://localhost:8080` |
| `LLAMA_SERVER_TIMEOUT` | Request timeout in ms | `180000` (3 minutes) |
| `LLAMA_MODEL_PATH` | Path to GGUF model file | (none) |
| `LLAMA_SERVER_PATH` | Path to llama-server binary | `llama-server` |

The default timeout of 180000ms (3 minutes) is suitable for most models up to around 30B parameters. For larger models (35B+), increase the timeout to 300000ms or higher depending on your hardware and the model's inference speed.

## Usage with Claude Code

### Option 1: Plugin Installation (Recommended)

Due to a [known bug](https://github.com/anthropics/claude-code/issues/12164) in Claude Code, non-plugin MCP servers may connect but not expose their tools. The workaround is to install llama-cpp-mcp as a plugin via a local marketplace.

**Step 1: Create the marketplace structure**

```
llama-marketplace/
  .claude-plugin/
    marketplace.json
  plugins/
    llama/
      .claude-plugin/
        plugin.json
      .mcp.json
```

**Step 2: Create marketplace.json**

```json
// llama-marketplace/.claude-plugin/marketplace.json
{
  "name": "llama-marketplace",
  "description": "Local marketplace for llama.cpp MCP plugin",
  "owner": {
    "name": "Your Name"
  },
  "plugins": [
    {
      "name": "llama",
      "description": "llama.cpp MCP server for local LLM inference",
      "source": "./plugins/llama"
    }
  ]
}
```

**Step 3: Create plugin.json**

```json
// llama-marketplace/plugins/llama/.claude-plugin/plugin.json
{
  "name": "llama",
  "version": "0.1.0",
  "description": "llama.cpp MCP server for local LLM inference"
}
```

**Step 4: Create .mcp.json**

macOS / Linux:

```json
// llama-marketplace/plugins/llama/.mcp.json
{
  "mcpServers": {
    "llama": {
      "command": "npx",
      "args": ["-y", "llama-cpp-mcp"],
      "env": {
        "LLAMA_SERVER_URL": "http://localhost:8080",
        "LLAMA_MODEL_PATH": "/path/to/your/model.gguf",
        "LLAMA_SERVER_PATH": "/path/to/llama-server"
      }
    }
  }
}
```

Windows:

```json
// llama-marketplace/plugins/llama/.mcp.json
{
  "mcpServers": {
    "llama": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "llama-cpp-mcp"],
      "env": {
        "LLAMA_SERVER_URL": "http://localhost:8080",
        "LLAMA_MODEL_PATH": "C:\\path\\to\\your\\model.gguf",
        "LLAMA_SERVER_PATH": "C:\\path\\to\\llama-server.exe"
      }
    }
  }
}
```

**Step 5: Install the plugin**

```bash
# Add the local marketplace
claude plugin marketplace add /path/to/llama-marketplace

# Install the plugin
claude plugin install llama@llama-marketplace

# Restart Claude Code
```

After restart, tools will appear as `mcp__plugin_llama_llama__*`.

### Option 2: Direct MCP Configuration

> **Note:** This method may not work due to the bug mentioned above. If tools don't appear after adding the server, use Option 1.

Add to your Claude Code MCP configuration:

macOS / Linux:

```bash
claude mcp add llama -e LLAMA_SERVER_URL=http://localhost:8080 -e LLAMA_MODEL_PATH=/path/to/model.gguf -e LLAMA_SERVER_PATH=/path/to/llama-server -- npx -y llama-cpp-mcp
```

Windows:

```bash
claude mcp add llama -e LLAMA_SERVER_URL=http://localhost:8080 -e LLAMA_MODEL_PATH=C:\path\to\model.gguf -e LLAMA_SERVER_PATH=C:\path\to\llama-server.exe -- cmd /c npx -y llama-cpp-mcp
```

Or add manually to `~/.claude.json`:

macOS / Linux:

```json
{
  "mcpServers": {
    "llama": {
      "command": "npx",
      "args": ["-y", "llama-cpp-mcp"],
      "env": {
        "LLAMA_SERVER_URL": "http://localhost:8080",
        "LLAMA_MODEL_PATH": "/path/to/your/model.gguf",
        "LLAMA_SERVER_PATH": "/path/to/llama-server"
      }
    }
  }
}
```

Windows:

```json
{
  "mcpServers": {
    "llama": {
      "command": "cmd",
      "args": ["/c", "npx", "-y", "llama-cpp-mcp"],
      "env": {
        "LLAMA_SERVER_URL": "http://localhost:8080",
        "LLAMA_MODEL_PATH": "C:\\path\\to\\your\\model.gguf",
        "LLAMA_SERVER_PATH": "C:\\path\\to\\llama-server.exe"
      }
    }
  }
}
```

## Tools

### Server Tools

| Tool | Description |
|------|-------------|
| `llama_health` | Check if llama-server is running and get status |
| `llama_props` | Get or set server properties |
| `llama_models` | List available/loaded models |
| `llama_slots` | View current slot processing state |
| `llama_metrics` | Get Prometheus-compatible metrics |

### Token Tools

| Tool | Description |
|------|-------------|
| `llama_tokenize` | Convert text to token IDs |
| `llama_detokenize` | Convert token IDs back to text |
| `llama_apply_template` | Format chat messages using model's template |

### Inference Tools

| Tool | Description |
|------|-------------|
| `llama_complete` | Generate text completion from a prompt |
| `llama_chat` | Chat completion (OpenAI-compatible) |
| `llama_embed` | Generate embeddings for text |
| `llama_infill` | Code completion with prefix and suffix context |
| `llama_rerank` | Rerank documents by relevance to a query |

### Model Management Tools

| Tool | Description |
|------|-------------|
| `llama_load_model` | Load a model (router mode only) |
| `llama_unload_model` | Unload the current model (router mode only) |

### LoRA Tools

| Tool | Description |
|------|-------------|
| `llama_lora_list` | List loaded LoRA adapters |
| `llama_lora_set` | Set LoRA adapter scales |

### Process Control Tools

| Tool | Description |
|------|-------------|
| `llama_start` | Start llama-server as a child process |
| `llama_stop` | Stop the llama-server process |

## Windows Support

llama-cpp-mcp includes platform-aware process management. On Windows, the server uses `taskkill` to terminate llama-server child processes. On Unix systems (macOS, Linux), it sends `SIGTERM`. This is handled automatically -- no configuration is needed. Both platforms are supported for starting, stopping, and monitoring the llama-server process.

## Example: Starting llama-server and Running Inference

```
User: Start llama-server with my local model

Claude: I'll start llama-server for you.
[Uses llama_start tool with model path]

User: Generate a haiku about coding

Claude: Let me use the local model for that.
[Uses llama_complete tool]

Result:
Lines of code cascade
Through the silent morning hours
Bugs flee from the light
```

## Development

```bash
# Run tests
npm test

# Type check
npm run typecheck

# Build
npm run build

# Watch mode for development
npm run dev
```

## Troubleshooting

### Tools don't appear in Claude Code

**Symptom:** Server shows "Connected" in `claude mcp list` but no `llama_*` tools are available.

**Cause:** Known bug in Claude Code where non-plugin MCP servers don't expose tools ([#12164](https://github.com/anthropics/claude-code/issues/12164)).

**Solution:** Use the plugin installation method (Option 1 above).

### HTTP 501 errors for certain tools

Some tools require specific server configurations:

| Tool | Requirement |
|------|-------------|
| `llama_metrics` | Start llama-server with `--metrics` flag |
| `llama_embed` | Start llama-server with `--embedding` flag or use an embedding model |
| `llama_infill` | Use a model with fill-in-middle support (e.g., CodeLlama, DeepSeek Coder) |
| `llama_rerank` | Use a reranker model |
| `llama_load_model` / `llama_unload_model` | llama-server must be in router mode |

### Connection refused errors

**Symptom:** `Cannot connect to llama-server at http://localhost:8080`

**Solutions:**
1. Use `llama_start` to start the server, or
2. Start llama-server manually: `llama-server -m /path/to/model.gguf`
3. Check that `LLAMA_SERVER_URL` matches where llama-server is running

### Timeout errors on large models

**Symptom:** Requests fail with timeout errors when using 35B+ parameter models.

**Solution:** Increase the `LLAMA_SERVER_TIMEOUT` environment variable. The default is 180000ms (3 minutes). For very large models, try 300000ms (5 minutes) or higher. Hardware with less VRAM or CPU-only inference will need longer timeouts.

### WSL/Windows path issues

When running in WSL, ensure paths use Linux format:
- Correct: `/home/user/models/model.gguf`
- Incorrect: `C:\Users\user\models\model.gguf`

When running natively on Windows, use Windows paths:
- Correct: `C:\Users\user\models\model.gguf`
- Incorrect: `/home/user/models/model.gguf`

## License

MIT
