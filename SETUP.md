# Setup Guide

Get the AI Business Analyst running locally in ~5 minutes.

## 1. Prerequisites

| Tool | Version | Check | Get it |
|------|---------|-------|--------|
| **Node.js** | 18+ | `node -v` | [nodejs.org](https://nodejs.org) |
| **npm** | (with Node) | `npm -v` | — |
| **Git** | any | `git --version` | [git-scm.com](https://git-scm.com) |

Plus an **API key** from any supported provider (Anthropic, OpenRouter, OpenAI, Groq, Together…) — or run fully local with **Ollama** (no key needed). See the full list in [docs/LOCAL_MODELS.md](docs/LOCAL_MODELS.md).

## 2. Clone & install

```bash
git clone https://github.com/Anik2901/ai-business-analyst.git
cd ai-business-analyst
npm install
```

## 3. Configure your provider

```bash
cp .env.example .env
```

Edit `.env` — four values (pick a row from the [provider table](docs/LOCAL_MODELS.md#provider-presets)):

```ini
LLM_API_KEY=your-key-here
LLM_BASE_URL=https://openrouter.ai/api/v1   # your provider's base URL
VITE_LLM_PROTOCOL=openai                     # "anthropic" or "openai"
VITE_MODEL=anthropic/claude-3.5-sonnet       # a model your endpoint supports
```

**Examples:**
- **OpenRouter:** `LLM_BASE_URL=https://openrouter.ai/api/v1`, `VITE_LLM_PROTOCOL=openai`
- **Anthropic:** `LLM_BASE_URL=https://api.anthropic.com`, `VITE_LLM_PROTOCOL=anthropic`
- **Ollama (local):** `LLM_BASE_URL=http://localhost:11434/v1`, `VITE_LLM_PROTOCOL=openai`, `LLM_API_KEY=ollama`

> Your key never reaches the browser — the dev-server proxy injects it server-side. That's why you run with `npm run dev` (not a static build).

## 4. Run

```bash
npm run dev
# open http://localhost:5173
```

## 5. Use it

1. **Describe your product idea** in the chat.
2. **Answer the questions** — the analyst interviews you one at a time across 5 areas: users, problem, features, constraints, integrations.
3. Click **Generate Documents** → watch the 7 docs build (BRD → FRD → NFR → user stories → architecture → flows → risk).
4. **Refine by chat** — e.g. "tighten the stakeholder map" edits just that section.
5. **Export** to PDF. Past runs are saved under **History**.

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Model 'X' is not available` | `VITE_MODEL` must match a model your endpoint lists (`curl <LLM_BASE_URL>/models`). |
| 401 / auth error | Check `LLM_API_KEY`, and that `VITE_LLM_PROTOCOL` matches the provider. |
| Empty / wrong responses | Wrong protocol — OpenRouter/OpenAI/Groq/Ollama use `openai`; Anthropic uses `anthropic`. |
| Changes to `.env` ignored | Restart `npm run dev` — env is read at startup. |
| `Port 5173 in use` | `npm run dev -- --port 5174`. |
| Blank page | Open the console (F12); confirm `npm install` finished cleanly. |

## Privacy

Your key lives only in `.env` (git-ignored) and is used server-side by the dev proxy. All data — chat, documents, sessions — stays in your browser's `localStorage`. Nothing is sent anywhere except your chosen LLM endpoint.
