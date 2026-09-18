# Prometheus Homepage — Tableau Dashboard Portal

A modular full-stack application that serves as a homepage and secure
redirection portal for a catalogue of Tableau dashboards. Designed to be
hosted as a Dataiku DSS webapp, backed by a Dataiku-managed dataset that
is sourced from Snowflake.

- **Frontend:** React 18 + TypeScript (strict) + Vite
- **Backend:** FastAPI + Pydantic v2
- **Repositories:** pluggable `local` (JSON, for dev) and `dataiku` (production)
- **Redirects:** HTTPS-only, hostname-allowlisted, `noopener,noreferrer`

---

## 1. Repository layout

```
prometheus-homepage/
├── frontend/               # React + TypeScript (Vite)
│   ├── public/
│   ├── src/
│   │   ├── api/            # typed fetch client + endpoints
│   │   ├── components/     # presentation components
│   │   ├── config/         # runtime config
│   │   ├── features/       # dashboards / favourites / submissions
│   │   ├── hooks/          # useDebouncedValue, useModalA11y
│   │   ├── layouts/        # Header, Footer
│   │   ├── services/       # tableau redirect service
│   │   ├── styles/         # global.css
│   │   ├── types/          # API contract types
│   │   ├── utils/          # greeting helpers
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── tests/              # vitest + testing-library
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/                # FastAPI backend
│   ├── app/
│   │   ├── api/routes/     # health, dashboards, submissions
│   │   ├── core/           # config, cache, errors, logging
│   │   ├── integrations/   # tableau URL validation
│   │   ├── models/         # Pydantic schemas
│   │   ├── repositories/   # base + local + dataiku adapters
│   │   ├── services/       # dashboard + submission services
│   │   ├── dependencies.py # factory / DI wiring
│   │   └── main.py
│   ├── data/               # synthetic sample_dashboards.json
│   ├── tests/              # pytest
│   ├── requirements.txt
│   └── pyproject.toml
├── dataiku/                # deployment + dataset docs
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## 2. Prerequisites

- Python **3.10+**
- Node.js **18+**

Optional: Docker Desktop to run the stack via docker-compose.

---

## 3. Local development

### 3.1 Environment

```powershell
Copy-Item .env.example .env
```

The default `.env.example` uses the **local synthetic dataset**
(`DASHBOARD_REPOSITORY_MODE=local`). No Snowflake or Dataiku access needed.

### 3.2 Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt

# copy .env values into the shell if needed, then:
uvicorn app.main:app --reload --port 8000
```

- Health check:  http://localhost:8000/api/health
- OpenAPI docs:  http://localhost:8000/api/docs

### 3.3 Frontend

```powershell
cd frontend
npm install
npm run dev
```

Opens at http://localhost:5173 with a Vite proxy for `/api → localhost:8000`.

### 3.4 Docker Compose (both services)

```powershell
docker compose up
```

### 3.5 Tests, lint, type-check

```powershell
# Backend
cd backend
pytest -q
ruff check .

# Frontend
cd frontend
npm run typecheck
npm run lint
npm test
npm run build
```

---

## 4. API surface

| Method | Path                                | Purpose                                      |
|-------:|-------------------------------------|----------------------------------------------|
| GET    | `/api/health`                       | Liveness + config snapshot                   |
| GET    | `/api/v1/dashboards`                | List / search / filter / paginate / sort     |
| GET    | `/api/v1/dashboards/{dashboard_id}` | Single dashboard record                      |
| GET    | `/api/v1/metadata`                  | Counts, source refresh timestamp, allowlist  |
| POST   | `/api/v1/access-requests`           | Get-access form                              |
| POST   | `/api/v1/feedback`                  | Feedback form                                |
| POST   | `/api/v1/contact`                   | Contact form                                 |

All responses are JSON. Errors follow:
```json
{ "error": { "code": "not_found", "message": "…", "details": null } }
```

### `/api/v1/dashboards` query parameters
`search`, `platform`, `category`, `market`, `page`, `page_size`,
`sort_by` (`display_order` | `name` | `platform` | `last_updated_at`),
`sort_direction` (`asc` | `desc`).

---

## 5. Configuration

All values live in `.env`; the frontend never receives secrets.

| Variable                       | Purpose                                                 |
|--------------------------------|---------------------------------------------------------|
| `APP_ENV`                      | `development` / `production`                            |
| `APP_VERSION`                  | Shown in footer + `/api/health`                         |
| `API_PREFIX`                   | Defaults to `/api`                                      |
| `API_TIMEOUT_SECONDS`          | Server-side network timeout (integrations)              |
| `LOG_LEVEL`                    | `INFO` / `WARNING` / `DEBUG`                            |
| `FRONTEND_ORIGIN`              | Origin for hints/logs                                   |
| `CORS_ALLOWED_ORIGINS`         | Comma-separated allowlist                               |
| `DASHBOARD_REPOSITORY_MODE`    | `local` (default) or `dataiku`                          |
| `DATAIKU_DATASET_NAME`         | Dashboard dataset in Dataiku                            |
| `SUBMISSION_REPOSITORY_MODE`   | `local` or `dataiku`                                    |
| `SUBMISSION_DATASET_NAME`      | Submission dataset in Dataiku                           |
| `DASHBOARD_CACHE_TTL_SECONDS`  | In-process cache TTL for repository reads               |
| `ALLOWED_TABLEAU_HOSTS`        | Comma-separated hostname allowlist for redirects        |
| `TABLEAU_OPEN_IN_NEW_TAB`      | `true` / `false`                                        |
| `DEFAULT_PAGE_SIZE`            | Default page size for `/dashboards`                     |
| `MAX_PAGE_SIZE`                | Server-enforced page size ceiling                       |
| `DATAIKU_BASE_PATH`            | If Dataiku hosts the app under a non-root path          |

Front-end build-time overrides (never secrets):

| Variable                | Purpose                                          |
|-------------------------|--------------------------------------------------|
| `VITE_API_BASE_URL`     | e.g. `/public-webapps/PROJECT/PROMETHEUS/api`    |
| `VITE_BASE_PATH`        | Vite `base` (asset URL prefix)                   |
| `VITE_API_PROXY_TARGET` | Dev-only proxy target                            |
| `VITE_APP_VERSION`      | Falls back to `0.1.0`                            |

---

## 6. Security notes

- **Tableau URLs** are validated by hostname allowlist + HTTPS check on
  both server (`app/integrations/tableau.py`) and client
  (`services/tableau.ts`). No arbitrary redirect URL is ever accepted from
  a query parameter.
- CORS is restricted to `CORS_ALLOWED_ORIGINS`.
- Baseline security headers (`X-Content-Type-Options`, `X-Frame-Options`,
  `Referrer-Policy`, `Content-Security-Policy`) are set by
  `app/main.py`.
- Sensitive form contents (feedback/contact messages) are **never** logged;
  only submission type + id + level of severity go to logs.
- No credentials are shipped in the frontend bundle.

---

## 7. Deployment to Dataiku DSS

See [`dataiku/deployment.md`](./dataiku/deployment.md) and
[`dataiku/dataset_schema.md`](./dataiku/dataset_schema.md).

---

## 8. Synthetic data disclaimer

`backend/data/sample_dashboards.json` contains **fictional, non-production**
Tableau URLs on the placeholder host `tableau.pfizer.com`. It is included
only so the app can boot in local mode without external dependencies.
Replace with a real Dataiku dataset for production.
