# Providers & Local Models

The app is plug-and-play with any LLM that speaks the **Anthropic Messages API** or the **OpenAI Chat Completions API**. You configure it with four values in `.env`:

```ini
LLM_API_KEY=...          # your provider key (or any string for local Ollama)
LLM_BASE_URL=...         # the endpoint base URL
VITE_LLM_PROTOCOL=...    # "anthropic" or "openai"
VITE_MODEL=...           # a model id your endpoint supports
```

> The key is read **only** by the dev-server proxy and added server-side — it never reaches the browser. After editing `.env`, **restart `npm run dev`**.

## Provider presets

| Provider | `LLM_BASE_URL` | `VITE_LLM_PROTOCOL` | Example `VITE_MODEL` |
|----------|----------------|---------------------|----------------------|
| Anthropic | `https://api.anthropic.com` | `anthropic` | `claude-sonnet-4-5-20250929` |
| OpenRouter | `https://openrouter.ai/api/v1` | `openai` | `anthropic/claude-3.5-sonnet` |
| OpenAI | `https://api.openai.com/v1` | `openai` | `gpt-4o` |
| Groq | `https://api.groq.com/openai/v1` | `openai` | `llama-3.3-70b-versatile` |
| Together | `https://api.together.xyz/v1` | `openai` | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |
| Ollama (local) | `http://localhost:11434/v1` | `openai` | `qwen2.5:14b` |
| LiteLLM / other gateway | your URL | `anthropic` or `openai` | gateway-specific |

Not sure which models an endpoint has? `curl <LLM_BASE_URL>/models -H "Authorization: Bearer YOUR_KEY"`

---

## Fully local with Ollama (free, private, offline)

Ollama exposes an OpenAI-compatible API, so it works **directly** — no extra bridge needed.

```bash
# 1. Install Ollama from https://ollama.com, then pull a capable instruct model
ollama pull qwen2.5:14b        # bigger = better docs (qwen2.5:32b, llama3.1:70b)
```

```ini
# 2. .env
LLM_API_KEY=ollama             # any string — local needs no real key
LLM_BASE_URL=http://localhost:11434/v1
VITE_LLM_PROTOCOL=openai
VITE_MODEL=qwen2.5:14b
```

```bash
# 3. Run
npm run dev
```

Everything runs on your machine — no API costs, nothing leaves your computer.

---

## Where do I paste my key?

Always in **`.env`**, as `LLM_API_KEY`:
- **Cloud providers** → paste the real key.
- **Local (Ollama)** → any dummy string.

`.env` is git-ignored, so your key is never committed.

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `Model 'X' is not available` / 404 | `VITE_MODEL` must match a model your endpoint lists (`/models`). |
| 401 / auth error | Wrong/missing `LLM_API_KEY`, or wrong `VITE_LLM_PROTOCOL` for this provider. |
| Wrong protocol | OpenAI-style providers (OpenRouter/OpenAI/Groq/Ollama) need `VITE_LLM_PROTOCOL=openai`; Anthropic needs `anthropic`. |
| Changed `.env`, no effect | Restart `npm run dev` — env is read at startup. |
| Local docs lower quality | Use the largest Ollama model your hardware can run. |
| `connection refused` (Ollama) | Make sure `ollama serve` is running and the port matches. |
