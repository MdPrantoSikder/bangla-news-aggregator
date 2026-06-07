# Bangla News Aggregator with AI Summarization

> One feed for all Bangladeshi news. Scrapes major BD news sites every 30 minutes, uses AI embeddings to detect when multiple sources cover the same story, and generates bilingual summaries in Bangla and English.

<p align="center">
  <img src="https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif" alt="news overload" width="400"/>
</p>

> 🚧 **Live demo GIF coming after Phase 10 (frontend) ships.** Backend API is live and functional today.

---

## The Problem

Bangladeshi readers who follow news daily — including BCS, bank job, and other competitive exam aspirants — open 5+ different news sites every morning (Prothom Alo, The Daily Star, BDNews24, Jugantor, Kaler Kantho) and read the same event reported in slightly different words across each. There is no clean unified way to follow Bangladeshi news, and the Bangla/English split adds another friction layer.

<p align="center">
  <img src="https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif" alt="this is fine" width="400"/>
</p>

> Me, maintaining scrapers for 5 different BD news sites that keep changing their HTML.

---

## The Solution

This app:

- **Scrapes** 5+ Bangladeshi news sites every 30 minutes.
- **Deduplicates** stories using sentence-transformer embeddings — when 4 sites cover the same event, it groups them as one story.
- **Summarizes** each story in Bangla AND English using the Gemini API.
- **Serves** a clean unified feed via a REST API and React frontend.

## Key Features

- Multi-source scraping (Daily Star, Prothom Alo, BDNews24, Jugantor, Kaler Kantho).
- Semantic deduplication using `paraphrase-multilingual-MiniLM-L12-v2`.
- Bilingual AI summaries (Gemini API).
- Hybrid search — keyword + semantic.
- REST API with auto-generated OpenAPI docs.
- Layered architecture (routers → services → repositories → models).
- Idempotent scrapers — safe to re-run any number of times.
- Background jobs via Celery for scheduled scraping.
- Redis cache layer to control LLM costs.

## Tech Stack

**Backend**
- Python 3.13 · FastAPI · Uvicorn.
- SQLAlchemy 2.0 · Alembic · PostgreSQL.
- Redis (Memurai locally, Upstash in production) · Celery.
- BeautifulSoup4 · Requests.
- sentence-transformers · Google Gemini API · Pydantic v2.

**Frontend** *(Phase 10+)*
- React 18 (Vite) · Tailwind CSS · Axios · React Router.

**Deployment** *(Phase 12)*
- Backend: Render (Docker) · Frontend: Vercel.
- Database: Supabase (PostgreSQL) · Redis: Upstash.
- CI/CD: GitHub Actions · Monitoring: Sentry · Uptime: UptimeRobot.

## Architecture


### System Overview

```mermaid
flowchart TB
    subgraph SOURCES["📰 News Sources"]
        direction LR
        N1[Daily Star]
        N2[Prothom Alo]
        N3[Jugantor]
        N4[Business Standard]
        N5["BDNews24 (deferred — Cloudflare)"]
    end

    subgraph INGEST["⚙️ Ingestion Layer"]
        direction TB
        BEAT["Celery Beat(dispatches every 30 min)"]
        WORKER["Celery Worker(BeautifulSoup4 + Requests)"]
        BEAT --> WORKER
    end

    subgraph PROCESS["🧠 Processing Pipeline"]
        direction TB
        EMB["Embeddingsparaphrase-multilingual-MiniLM-L12-v2 (384-dim)"]
        DEDUP["Semantic Dedup / Clusteringcosine ≥ 0.92 + category filter"]
        SUM["Bilingual SummariesGemini API (Bangla + English)"]
        EMB --> DEDUP --> SUM
    end

    subgraph STORE["💾 Storage"]
        direction LR
        PG[("PostgreSQLarticles · stories · users · bookmarks")]
        REDIS[("Redis / Memuraibroker + cache")]
    end

    subgraph API["🚀 API Layer — FastAPI (layered)"]
        direction TB
        ROUTERS["Routers/articles · /search · /auth · /bookmarks · /admin"]
        SERVICES["Services(business logic)"]
        REPOS["Repositories(DB access)"]
        MODELS["Models(SQLAlchemy 2.0)"]
        ROUTERS --> SERVICES --> REPOS --> MODELS.
    end

    subgraph CLIENT["💻 Frontend"]
        REACT["React 18 + ViteTailwind · Axios · React Router"]
    end

    SOURCES --> WORKER
    WORKER --> PG
    WORKER --> EMB
    SUM --> PG
    INGEST  REDIS
    API  PG
    API  REDIS
    REACT -->|REST / JSON| ROUTERS.
```

### Layered Backend

The backend follows a strict **routers → services → repositories → models** flow.
Each layer only talks to the one directly beneath it, which keeps business logic
out of the HTTP layer and database access out of the business logic.

| Layer | Responsibility | Example |
|-------|----------------|---------|
| **Routers** | HTTP endpoints, request/response validation (Pydantic v2), auth guards | `GET /articles`, `POST /auth/login` |
| **Services** | Business logic, orchestration, LLM/embedding calls | dedup grouping, summary generation, search ranking |
| **Repositories** | All database reads/writes | `ArticleRepository.get_recent()` |
| **Models** | SQLAlchemy ORM tables + relationships | `Article`, `Story`, `User`, `Bookmark` |

### Data Flow (Scrape → Serve)

1. **Schedule** — Celery Beat fires every 30 minutes and dispatches scrape tasks to the worker.
2. **Scrape** — The worker fetches and parses each source with BeautifulSoup4. Scrapers are **idempotent**: duplicate articles (by URL) are skipped, so re-runs are safe.
3. **Persist** — New articles are written to PostgreSQL.
4. **Embed** — Each article is encoded into a 384-dim vector using the multilingual MiniLM model.
5. **Deduplicate** — Articles above a **0.92 cosine threshold** (within the same category) are clustered into a single *story*, so one event reported by four sites becomes one entry.
6. **Summarize** — Each story is summarized in **both Bangla and English** via the Gemini API. Results are cached in Redis to control LLM cost.
7. **Serve** — FastAPI exposes a unified feed and hybrid search (keyword + semantic) over a REST API with auto-generated OpenAPI docs.
8. **Render** — The React frontend consumes the API and presents the clean, bilingual feed.

### Why Redis Sits in Two Places

Redis plays **two distinct roles**: it's the **Celery message broker** for background scraping jobs, and it's the **cache layer** that stores generated summaries and hot query results so the same LLM call never runs twice.
