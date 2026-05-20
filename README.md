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
- Semantic deduplication using `paraphrase-multilingual-MiniLM-L12-v2`
- Bilingual AI summaries (Gemini API).
- Hybrid search — keyword + semantic.
- REST API with auto-generated OpenAPI docs.
- Layered architecture (routers → services → repositories → models).
- Idempotent scrapers — safe to re-run any number of times.
- Background jobs via Celery for scheduled scraping.
- Redis cache layer to control LLM costs.

## Tech Stack

**Backend**
- Python 3.13 · FastAPI · Uvicorn
- SQLAlchemy 2.0 · Alembic · PostgreSQL
- Redis (Memurai locally, Upstash in production) · Celery
- BeautifulSoup4 · Requests
- sentence-transformers · Google Gemini API · Pydantic v2

**Frontend** *(Phase 10+)*
- React 18 (Vite) · Tailwind CSS · Axios · React Router

**Deployment** *(Phase 12)*
- Backend: Render (Docker) · Frontend: Vercel
- Database: Supabase (PostgreSQL) · Redis: Upstash
- CI/CD: GitHub Actions · Monitoring: Sentry · Uptime: UptimeRobot

## Architecture
