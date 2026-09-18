# Architecture overview

## Layers

**Frontend (React + TypeScript)**

- `src/api/` — typed fetch client with abort + timeout.
- `src/services/tableau.ts` — client-side URL allowlist check + safe
  `window.open('_blank', 'noopener,noreferrer')`.
- `src/features/` — feature-scoped hooks & modals (dashboards,
  favourites, submissions).
- `src/components/` — pure presentation (card, filter bar, modal, toast,
  skeleton, error boundary).
- `src/layouts/` — Header (masthead + nav + hero) and Footer.
- `src/hooks/` — shared cross-feature hooks (debounce, modal a11y).
- `src/config/app-config.ts` — build-time env values, never secrets.

**Backend (FastAPI + Pydantic v2)**

- `app/api/routes/` — thin route handlers, no business logic.
- `app/services/` — pure business logic; independent of transport.
- `app/repositories/` — `DashboardRepository` and
  `SubmissionRepository` abstract bases with `Local*` and `Dataiku*`
  implementations selected via env.
- `app/integrations/tableau.py` — the authoritative URL validator
  (mirrored on the client but also enforced here).
- `app/core/` — configuration, logging, cache, and unified error
  responses.

## Data-driven UI

The frontend never hardcodes platform, category or market names:

- Platform accents / labels come from
  `available_filters.platforms[*]` in the API response.
- Category and market chips come from
  `available_filters.categories` / `markets` (with counts).
- Sections are grouped by whatever platforms the backend returns, in
  their configured order.

## Security posture

- **Redirect safety.** Only HTTPS URLs whose hostname exactly matches a
  configured allowlist may be opened. Enforced twice (server filters
  the list; client re-validates before `window.open`).
- **No secrets in bundles.** All configuration for credentials lives on
  the backend / Dataiku code environment.
- **CORS + security headers** default to safe values via middleware in
  `app/main.py`.
- **Form inputs** are Pydantic-validated with hard length caps.
- **Sensitive body content** (feedback / contact `message`) is never
  logged — only type + generated request id.

## Scalability

- Backend caches the full dataset in-process for
  `DASHBOARD_CACHE_TTL_SECONDS` seconds; filtering, sorting and
  pagination happen in Python for the current dataset size.
- The service is structured to grow into repository-level filtering
  when a dataset outgrows in-memory work (extend
  `DashboardRepository.list_all` with `list_page(**params)` and let the
  service delegate).
- Frontend cancels superseded requests and debounces search.

## Known assumptions & limitations

- Snowflake and Dataiku environments are **not** available in this
  workspace; production adapters were built and unit-covered but not
  end-to-end tested against a real Dataiku dataset. The synthetic
  local dataset is clearly labelled and only used when
  `DASHBOARD_REPOSITORY_MODE=local`.
- The greeting is time-based only. Wiring an authenticated display
  name requires a small server-side hook once the Dataiku user context
  is available (documented in `dataiku/deployment.md` §7).
- Tableau `tableau_url` values are trusted after allowlist + HTTPS
  validation. If the source of truth becomes untrusted, add a
  server-side HEAD check.
- The app is a single-page portal (no client-side routing) to keep
  DSS webapp base-path handling trivial.
