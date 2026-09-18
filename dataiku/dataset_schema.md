# Dataset schemas

Two datasets back the app:

- `PROMETHEUS_DASHBOARDS` — the dashboard catalogue (read-only for the app).
- `PROMETHEUS_SUBMISSIONS` — user form submissions (append-only from the app).

Column names are case-insensitive; the Dataiku adapter accepts both
snake_case and UPPERCASE variants (see
`backend/app/repositories/dataiku_dashboards.py`).

---

## 1. `PROMETHEUS_DASHBOARDS`

| Column                  | Type        | Nullable | Notes                                           |
|-------------------------|-------------|----------|-------------------------------------------------|
| `dashboard_id`          | STRING      | No       | Stable, unique ID. Used by pinning & routing.   |
| `dashboard_name`        | STRING      | No       | Displayed on card + suggestions                 |
| `dashboard_description` | STRING      | Yes      | Optional 1-line description                     |
| `tableau_url`           | STRING      | No       | **HTTPS**, hostname on Tableau allowlist        |
| `platform`              | STRING      | No       | Grouping key; drives section headers            |
| `category`              | STRING      | Yes      | Filter chip value                               |
| `subcategory`           | STRING      | Yes      | Included in full-text search                    |
| `market`                | STRING      | Yes      | Filter chip value (e.g. `Germany`, `Global`)    |
| `country_code`          | STRING(2-8) | Yes      | ISO-alpha-2 or similar (optional)               |
| `display_order`         | INTEGER     | No       | Ascending sort within a platform                |
| `is_active`             | BOOLEAN     | No       | Only `true` rows are displayed by default       |
| `owner_name`            | STRING      | Yes      | Displayed in access-request emails (optional)   |
| `owner_email`           | STRING      | Yes      | Must be a valid email if provided               |
| `tags`                  | STRING      | Yes      | Comma-separated list; searchable                |
| `last_updated_at`       | TIMESTAMP   | Yes      | Latest source refresh; drives footer timestamp  |

### Notes

- The adapter validates each row with Pydantic. **Malformed rows are
  skipped and logged** rather than crashing the endpoint.
- `tableau_url` values whose host is **not** in `ALLOWED_TABLEAU_HOSTS`
  are silently dropped from the response — the frontend never sees them.
- Platform accent colors and blurbs may either come from `platforms`
  metadata in the local JSON dataset, or be provided by an additional
  Dataiku dataset (see below).

### Optional companion dataset — `PROMETHEUS_PLATFORMS`

If you want to configure platform accents / display labels from
Dataiku instead of code, add a small dataset with columns:

| Column   | Type    | Notes                                    |
|----------|---------|------------------------------------------|
| `name`   | STRING  | Matches `dashboard.platform` exactly     |
| `label`  | STRING  | Display label                            |
| `accent` | STRING  | CSS color, e.g. `#0093D0`                |
| `blurb`  | STRING  | Short section subtitle                   |

To wire this in, extend `DataikuDashboardRepository` to expose a
`platforms_metadata()` method (mirroring the local repo) and the
service will surface these values via `available_filters.platforms`.

---

## 2. `PROMETHEUS_SUBMISSIONS`

Append-only table for form submissions. Backing store may be
Snowflake, Dataiku-managed dataset, or the local JSONL file used in
dev mode.

| Column               | Type        | Nullable | Notes                                              |
|----------------------|-------------|----------|----------------------------------------------------|
| `request_id`         | STRING      | No       | Server-generated `REQ-<hex>` id                    |
| `submission_type`    | STRING      | No       | `access` \| `feedback` \| `contact`                |
| `submitted_at_utc`   | TIMESTAMP   | No       | UTC ISO-8601                                       |
| `status`             | STRING      | No       | `received` on write                                |
| `user_name`          | STRING      | Yes      | Never used for auth — just for reply-to context    |
| `user_email`         | STRING      | Yes      | Validated via Pydantic `EmailStr`                  |
| `user_identifier`    | STRING      | Yes      | For future auth-linked identity                    |
| `platform`           | STRING      | Yes      | Present only on `access` submissions               |
| `dashboard_id`       | STRING      | Yes      | Present when submitter references a dashboard      |
| `reason`             | STRING(2k)  | Yes      | Access submission body                             |
| `subject`            | STRING(256) | Yes      | Contact submission subject line                    |
| `message`            | STRING(4k)  | Yes      | Feedback / contact body                            |
| `rating`             | INTEGER     | Yes      | 0-5 (only `feedback`)                              |

The backend caps each string field to the maximum shown above via
Pydantic validators.

---

## 3. Sample source SQL (Snowflake)

The dashboard catalogue can be materialised in Snowflake with
something like:

```sql
CREATE OR REPLACE VIEW PROMETHEUS_DASHBOARDS AS
SELECT
  d.dashboard_id,
  d.dashboard_name,
  d.dashboard_description,
  d.tableau_url,
  p.name          AS platform,
  d.category,
  d.subcategory,
  m.name          AS market,
  m.country_code,
  d.display_order,
  d.is_active,
  o.owner_name,
  o.owner_email,
  ARRAY_TO_STRING(d.tags, ',') AS tags,
  d.last_updated_at
FROM  ANALYTICS.PORTAL_DASHBOARDS      d
LEFT JOIN ANALYTICS.PORTAL_PLATFORMS   p USING (platform_id)
LEFT JOIN ANALYTICS.PORTAL_MARKETS     m USING (market_id)
LEFT JOIN ANALYTICS.PORTAL_OWNERS      o USING (owner_id)
WHERE d.is_active = TRUE
;
```

Then import as a Dataiku Snowflake dataset named
`PROMETHEUS_DASHBOARDS`.
