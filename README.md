# VibeMint

Describe any app in plain English — watch it appear in seconds.

---

## What it does

Type a description of any web app. The AI streams back a complete, working single-file HTML app with React and Tailwind — no setup required. Preview it instantly in the browser, copy the code, or download it as an `.html` file.

## Features

- Streaming code generation via Claude Sonnet 4.6
- Live preview in an iframe
- Code tab with real-time streaming
- Stop button to cancel generation mid-stream
- Copy code / Download `.html`
- Session history (last 3 generations)
- Example prompts to get started

## Stack

- [Next.js 16](https://nextjs.org)
- [Tailwind CSS v4](https://tailwindcss.com)
- [Anthropic SDK](https://github.com/anthropic-ai/anthropic-sdk-python) (Claude Sonnet 4.6)
- TypeScript

## Getting started

```bash
git clone https://github.com/Tatopapi3/VibeMint
cd VibeMint
npm install
cp .env.local.example .env.local
# Add your ANTHROPIC_API_KEY to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic API key from [console.anthropic.com](https://console.anthropic.com) |

## Built by

Juan Fernandez & Andres Ballares
