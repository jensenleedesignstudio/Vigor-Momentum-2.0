# Vigor Momentum architecture

## System shape

The production target is a Next.js TypeScript client, FastAPI application service, PostgreSQL system of record, private S3-compatible photo storage, and an optional Redis layer for throttling and short-lived cache entries. The Sites preview uses D1 as an edge-compatible persistence adapter; it mirrors the ownership rules of the PostgreSQL design without replacing the production schema.

```text
Browser / mobile web
  -> Next.js UI + protected server routes
      -> FastAPI REST API
          -> authentication verifier
          -> profile / exercise / plan / session services
          -> analytics and progression services
          -> validated AI gateway
              -> LLM provider (structured JSON only)
          -> PostgreSQL
          -> Redis (rate limits/cache)
          -> private object storage (signed access)
```

## Trust boundaries

- Identity comes from a verified session or bearer token; client-supplied user IDs are never trusted.
- Every private query is scoped by the authenticated principal.
- AI output is untrusted input. Pydantic validates structure and deterministic rules validate exercises, equipment, schedule, duration, and safety constraints.
- Photos are private objects referenced by opaque keys; access uses short-lived signed URLs.
- Request logs exclude journal text, prompts, photos, and access tokens.

## Initial delivery sequence

1. Foundation: project shells, identity, profile, database, dashboard.
2. Exercise library: at least 75 seeded exercises, search, filters, custom entries.
3. Manual plans before AI: schedules, planned sessions, exercise ordering.
4. Logging: active workout, sets, completion, history.
5. Analytics: volume, records, consistency, muscle emphasis and heat map.
6. AI: plans, substitutions, adjustments, summaries, with deterministic fallback.
7. Journal and private photos.
8. Security/evaluation suites, CI, deployment and portfolio documentation.

## Authentication and profile flow

1. The public landing page starts sign-in using the selected identity provider.
2. The frontend sends the provider token; FastAPI validates signature, issuer, audience and expiry.
3. The backend upserts the user by stable provider subject and derives ownership from that principal.
4. A user without a completed profile is redirected through six onboarding steps.
5. `POST /profile` validates preferences and commits the profile in one transaction.
6. Protected pages fetch only server-authorized records. Account deletion removes relational records and queues private blobs for deletion.

## Frontend folders

`app/` owns routes and layouts; `components/` owns feature and UI components; `lib/` owns validation and formatting; `services/` owns typed API clients; `types/` owns shared contracts; `tests/` owns UI and integration tests.

## Backend folders

`backend/app/api/` owns HTTP routes; `models/` ORM entities; `schemas/` Pydantic contracts; `services/` use cases; `ai/` prompts, schemas and validators; `analytics/` pure calculations; `security/` identity and authorization; `database/` sessions/configuration; `tests/` unit, integration, security and AI evaluations.
