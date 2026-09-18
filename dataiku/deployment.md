# Dataiku DSS — deployment guide

This project is designed to run as a **Dataiku DSS webapp** where:

- The React bundle is served under a non-root Dataiku URL.
- The FastAPI backend runs in a Dataiku code environment.
- Dashboards are read from a Dataiku dataset that is refreshed from Snowflake.
- Form submissions are appended to a second Dataiku dataset (also
  syncable back to Snowflake).

The React frontend **never** connects to Snowflake directly. All data
access goes through the backend repository layer.

---

## 1. Create the Dataiku project

1. In your DSS instance, create a project (e.g. `PROMETHEUS_HOMEPAGE`).
2. Grant the project **read** access to your Snowflake connection.
3. Import this repository as a project library, or upload the
   `backend/` and `frontend/dist/` directories into the project's
   webapp folder.

## 2. Create the dashboards dataset

Create a Snowflake dataset — either as:

- A Snowflake **table/view** connected via a Dataiku Snowflake
  connection and imported as a Dataiku dataset, or
- A **prepared/recipe output** dataset that materialises the same
  columns in Snowflake.

Name it (default): `PROMETHEUS_DASHBOARDS`. Column contract lives in
[`dataset_schema.md`](./dataset_schema.md).

## 3. Create the submissions dataset

A writable Snowflake dataset (or a Dataiku-managed dataset) with columns
matching the submission schema in [`dataset_schema.md`](./dataset_schema.md).
Name it (default): `PROMETHEUS_SUBMISSIONS`.

## 4. Build a Python code environment

Include the pinned versions from `backend/requirements.txt`:
`fastapi`, `uvicorn`, `pydantic>=2.6`, `pydantic-settings`,
`python-dotenv`, `httpx`.

The `dataiku` package is available inside the DSS code environment
automatically. Do **not** vendor it.

## 5. Configure the webapp

Create a **Standard Web app** or **Python-backed web app** and:

1. Copy the frontend production build (`frontend/dist/`) into the
   webapp's static folder.
2. Copy the `backend/` package into the webapp's Python folder.
3. Point the entry point at `app.main:app` (uvicorn / ASGI).

Set the following environment variables in the webapp's config:

```
APP_ENV=production
APP_VERSION=0.1.0
DASHBOARD_REPOSITORY_MODE=dataiku
DATAIKU_DATASET_NAME=PROMETHEUS_DASHBOARDS
SUBMISSION_REPOSITORY_MODE=dataiku
SUBMISSION_DATASET_NAME=PROMETHEUS_SUBMISSIONS
DASHBOARD_CACHE_TTL_SECONDS=120
ALLOWED_TABLEAU_HOSTS=tableau.pfizer.com,tableau-internal.pfizer.com
TABLEAU_OPEN_IN_NEW_TAB=true
CORS_ALLOWED_ORIGINS=https://<your-dataiku-host>
DATAIKU_BASE_PATH=/public-webapps/PROMETHEUS_HOMEPAGE/PROMETHEUS/
```

## 6. Rebuild the frontend for the Dataiku base path

Before deploying to a non-root base path, rebuild with:

```powershell
cd frontend
$env:VITE_BASE_PATH="/public-webapps/PROMETHEUS_HOMEPAGE/PROMETHEUS/"
$env:VITE_API_BASE_URL="/public-webapps/PROMETHEUS_HOMEPAGE/PROMETHEUS/api"
npm run build
```

Copy the resulting `dist/` into the DSS webapp's static assets folder.

## 7. Authenticated user greeting (optional)

`app/dependencies.py` intentionally does not embed a display name.
If your Dataiku setup exposes the authenticated user via a request
header (e.g. `X-DKU-USER`), add a small FastAPI dependency in
`app/api/routes/health.py` (or a new `/me` route) to surface it as a
plain JSON object. The frontend then reads it and, when available,
appends the name after the time-based greeting. Never trust a user
name that came from the client bundle itself.

## 8. Verification checklist

- `/api/health` returns 200 and shows `dashboard_repository_mode: "dataiku"`.
- `/api/v1/metadata` returns non-zero counts.
- `/api/v1/dashboards` returns items matching the Snowflake dataset.
- Clicking a card opens the Tableau URL in a new tab **only** for hosts
  in `ALLOWED_TABLEAU_HOSTS`.
- Submitting each form writes a row to `PROMETHEUS_SUBMISSIONS`.
- Refreshing the browser under the Dataiku base path still loads the
  app (no SPA routing 404s).

---

## Known constraints

- Some DSS webapp modes proxy only certain paths — always deploy with a
  non-root `DATAIKU_BASE_PATH` and rebuild the frontend accordingly.
- If DSS does not support history-based routing under the base path,
  keep the app single-page (no client-side routes) — this is already the
  default: a single URL renders the whole portal.
