# Dataiku integration overview

This folder contains everything a Dataiku administrator needs to deploy
and configure the Prometheus Homepage inside a DSS instance.

- [`deployment.md`](./deployment.md) — step-by-step deployment guide.
- [`dataset_schema.md`](./dataset_schema.md) — dashboard and submission
  dataset column contracts.

## Data flow

```
Snowflake table/view
   │
   ▼
Dataiku Snowflake dataset  (PROMETHEUS_DASHBOARDS)
   │
   ▼
FastAPI DataikuDashboardRepository
   │
   ▼
JSON  /api/v1/dashboards, /api/v1/metadata, /api/v1/dashboards/{id}
   │
   ▼
React frontend (never talks to Snowflake directly)
```

Form submissions travel the same layers in reverse:

```
React form
   │
   ▼
POST /api/v1/access-requests | /feedback | /contact
   │
   ▼
FastAPI submission service (Pydantic validation + server-generated id)
   │
   ▼
DataikuSubmissionRepository → PROMETHEUS_SUBMISSIONS
```
