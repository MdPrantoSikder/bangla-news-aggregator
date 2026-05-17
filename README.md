# Bangla News Aggregator with AI Summarization

A web application that aggregates news from major Bangladeshi news sources,
uses AI to detect when multiple sites cover the same story, and generates
bilingual (Bangla + English) summaries.

## The problem

Bangladeshi readers who follow news daily — including BCS, bank job, and
other competitive exam aspirants — open 5+ different news sites (Prothom
Alo, The Daily Star, BDNews24, Jugantor, Kaler Kantho) and read the same
event reported in slightly different words across each. There's no clean
unified way to follow Bangladeshi news, and language barriers make
cross-source reading harder.

## The solution

This app:
- **Scrapes** 5+ Bangladeshi news sites every 30 minutes
- **Deduplicates** stories using sentence-transformer embeddings — when 4 sites
  cover the same event, it groups them as one story
- **Summarizes** each story in Bangla AND English using the Gemini API
- **Serves** a clean unified feed via a REST API and React frontend

## Tech stack

**Backend**  
FastAPI · SQLAlchemy 2.0 · Alembic · PostgreSQL · Redis · Celery ·
BeautifulSoup4 · sentence-transformers · Gemini API · Pydantic v2

**Frontend**  
React 18 (Vite) · Tailwind CSS · Axios

**Deployment**  
Render (backend) · Vercel (frontend) · Supabase (Postgres) ·
Upstash (Redis) · UptimeRobot · Sentry · GitHub Actions

## Architecture

Layered architecture — routers → services → repositories → models.  
Scrapers run as Celery background jobs on a 30-minute schedule.  
Embeddings cluster articles across sources.  
LLM summaries cached in Redis to control API costs.

## Roadmap

**V1 (MVP)** — aggregation, dedup, bilingual summaries, deployment ✅  
**V2** — user accounts, save/bookmark, personalized feed for BCS/bank
job aspirants, NER tags, Bangla↔English translation, audio digests  
**V3** — spaced repetition for facts, source bias indicator, mobile app
