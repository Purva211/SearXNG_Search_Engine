# NEXORA Search

**Explore Beyond the Ordinary.** A custom React search interface powered by your self-hosted SearXNG instance and an Express API.

## Architecture

```text
Browser (React + Vite :5173)
          |
          v
Express API (:5000)
   |              |
   v              v
SearXNG (:54321)  Groq API (optional)
   |
   v
Valkey (Docker internal network)
```

SearXNG is a metasearch engine: it queries supported upstream search engines. NEXORA supplies its own frontend and API; it does not independently crawl or index the entire web.

## Requirements

- Windows 10/11
- Node.js 20 or newer and npm
- Docker Desktop with its Linux/WSL2 engine running
- Internet access for Docker image pulls and upstream search engines

## 1. Start SearXNG

Open **CMD** in this folder (or run `start-searxng.cmd`):

```cmd
docker info
docker compose config
docker compose up -d
docker compose ps
```

SearXNG is published at `http://localhost:54321`. Jenkins can remain on host port `8080`; NEXORA maps host `54321` to container port `8080`.

Open `http://localhost:54321` to verify the SearXNG page. If Docker reports it cannot connect to `dockerDesktopLinuxEngine`, start Docker Desktop and wait until its engine is running before retrying.

### SearXNG configuration

`core-config/settings.yml` enables the JSON output format needed by the Express API and configures Valkey. Replace the example `server.secret_key` with a long random secret before exposing the instance beyond your own machine. For local development, `limiter: false` simplifies testing; do not expose this configuration publicly without adding appropriate rate limiting and access controls.

To generate a secret in CMD (requires Python):

```cmd
python -c "import secrets; print(secrets.token_urlsafe(48))"
```

Put the generated value in `core-config/settings.yml`, then restart SearXNG:

```cmd
docker compose restart core
```

## 2. Start the Express backend

Open a **second CMD** window:

```cmd
cd /d D:\NEXORA\backend
copy .env.example .env
npm install
npm run dev
```

If `.env` already exists, answer `N` when CMD asks whether to overwrite it.

Backend: `http://localhost:5000`

Health check: `http://localhost:5000/api/health`

The backend defaults to `SEARXNG_URL=http://localhost:54321` because it runs directly on Windows. If you later put the backend inside Docker Compose, change this to `http://core:8080` (the Compose service name and internal port).

### Render deployment configuration

For the deployed frontend, set `VITE_API_URL` to `https://searxng-searchengine.onrender.com`. On the backend service, set `CLIENT_ORIGIN` to `https://searxng-search-engine-3.onrender.com` and `SEARXNG_URL` to the base URL of a SearXNG instance reachable by the backend. Do not use `localhost` for a service hosted separately on Render. Check `/api/health`; its `searxng` field shows the configured upstream URL.

The repository-root `render.yaml` adds a private SearXNG service and a Valkey Key Value service. Create a Render Blueprint from this repository and make the `region` in `render.yaml` match the existing backend service's region. After both services are live, copy the SearXNG private service address from Render's **Connect** panel and set the backend's `SEARXNG_URL` to `http://<private-service-host>:8080`. Redeploy the backend, then confirm `/api/health` reports that URL and `/api/search?q=test&category=general` returns JSON results.

## 3. Start the React frontend

Open a **third CMD** window:

```cmd
cd /d D:\NEXORA\frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

The Vite development server proxies `/api` requests to Express on port `5000`. To change the backend URL, edit `frontend/vite.config.js` and restart Vite.

## 4. Optional: enable actual AI-generated answers

AI Search always retrieves web results from SearXNG. To generate a synthesized answer, add a Groq API key to `backend/.env`:

```env
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile
```

Restart the backend after editing `.env`. Keep the key on the server; never put it in a `VITE_` variable or commit it to Git. The configured model must be available to your Groq account; change `GROQ_MODEL` if necessary. Without a key, the app clearly displays a search overview rather than pretending it generated an AI answer.

## Features

- Web, image, and news search through SearXNG JSON results
- AI Search grounded in retrieved snippets when Groq is configured
- Source links and result metadata
- Search history stored locally in the browser
- Dark/light theme preference stored locally
- Responsive layout, loading and error states
- Express validation, Helmet headers, CORS allow-list and API rate limiting

## API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | API health and configured SearXNG URL |
| GET | `/api/search?q=react&category=general` | Web search |
| GET | `/api/search?q=cats&category=images` | Image search |
| GET | `/api/search?q=technology&category=news` | News search |
| POST | `/api/ai-search` | Retrieve sources and optionally generate an AI answer |

Example CMD test:

```cmd
curl "http://localhost:5000/api/search?q=docker&category=general"
```

AI request body:

```json
{"query":"What is Docker Compose?"}
```

## Troubleshooting

### `dockerDesktopLinuxEngine` pipe not found

Docker Desktop's Linux engine is not running or the selected Docker context is unavailable. Start Docker Desktop, wait for the engine to become ready, then run `docker info`. Do not troubleshoot SearXNG ports until `docker info` can reach the server.

### Port 54321 is occupied

Change the host side of the mapping in `docker-compose.yml`, for example `54322:8080`, then open the new host port. Keep the container-side port `8080`.

### SearXNG opens but search returns an error

Check `docker compose ps` and `docker compose logs --tail=100 core`. Confirm `json` is listed under `search.formats` in `core-config/settings.yml`, then run `docker compose restart core`.

### Backend cannot reach SearXNG

Check `http://localhost:54321` in the browser and verify `SEARXNG_URL` in `backend/.env`. The backend is configured to run on Windows host, not inside Docker.

### Groq AI fails

Check that the key is valid, the selected model is available to your account, and your account has API access. Ordinary web search does not require Groq.

## Security and privacy notes

- Search queries are sent to SearXNG and then to the upstream engines selected by its configuration. Do not describe this as guaranteed anonymity.
- Browser history is stored in localStorage on this device/browser and is not synchronized to an account.
- Configure a strong SearXNG secret, HTTPS, restrictive CORS, authentication if needed, rate limiting, and abuse protection before public deployment.
- Never commit `.env` files or API credentials.

## Current scope

This is a local development implementation. It includes the requested core UI and search integration. It does not yet include accounts, cloud-synced history, a proprietary crawler/index, or a production deployment configuration.
