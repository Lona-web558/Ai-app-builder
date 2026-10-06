# Ai-app-builder

# App Builder AI

My own AI chat that builds web apps with HTML5, CSS3, Bootstrap 5, JavaScript and Node.js. A small Express backend streams replies from the Claude API, and a Bootstrap chat UI shows them. Each code block gets Copy, Download and (for HTML) a live Preview button.

## Project structure

```
app-builder-ai/
├── server.js           Express server, /api/chat endpoint, streaming
├── system-prompt.txt   Instructions that shape how the AI builds apps
├── public/index.html   Chat UI (Bootstrap, markdown, code toolbar, preview)
├── package.json
├── .env.example        Copy to .env and fill in
└── .gitignore
```

## Run locally

1. Install Node.js 18 or newer.
2. Install dependencies:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and set:
   - `ANTHROPIC_API_KEY`: from https://console.anthropic.com
   - `APP_PASSWORD`: a long access code that only you know
   - `MODEL`: optional, defaults to `claude-sonnet-5-5`
4. Start the app:
   ```
   npm start
   ```
5. Open http://localhost:3000 and enter your access code when asked.

## Deploy to Render

1. Push the folder to GitHub (`.env` is git-ignored, so your key stays private).
2. In Render, create a **Web Service** from the repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Under **Environment**, add `ANTHROPIC_API_KEY`, `APP_PASSWORD` and `MODEL`.
5. Deploy, open the URL and enter your access code.

## Customize

- **Change how it builds:** edit `system-prompt.txt`. Restart the server to apply changes.
- **Change the model:** set `MODEL` in `.env` or Render's environment.
- **Change the look:** colors and fonts are CSS variables at the top of `public/index.html`.

## Security notes

- Always set `APP_PASSWORD` before deploying. Without it, anyone with the URL can spend your API credit.
- Requests are rate limited to 40 per 15 minutes per IP (edit `server.js` to change).
- The API key lives only on the server. Never put it in front-end code.
- Chat history is stored in your browser's localStorage. The server stores nothing.

## Troubleshooting

| Problem | Fix |
|---|---|
| "Wrong or missing access code" | Click **Access code** and re-enter the `APP_PASSWORD` value |
| "AI API error 401" | Check `ANTHROPIC_API_KEY` |
| "AI API error 404" | Check the `MODEL` name |
| Reply cuts off or stalls on Render | Free instances sleep; retry after it wakes |
| Preview is blank | Preview only runs a single self-contained HTML file |
