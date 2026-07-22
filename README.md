# Vigor Momentum

An AI-assisted workout planning and progress platform built for deliberate training and measurable momentum.

The Phase 1 foundation includes:

- A responsive, athletic training dashboard
- A production PostgreSQL migration and edge-preview persistence schema
- A FastAPI service shell and validated exercise contract
- Documented system architecture, trust boundaries, MVP roadmap, and authentication/profile flow

## Local development

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

The production API target is Python 3.12, FastAPI, SQLAlchemy and PostgreSQL. Install its dependencies from `backend/requirements.txt` and run `backend/app/main.py` with Uvicorn.

See `docs/ARCHITECTURE.md` for the complete Phase 1 design and implementation sequence.
