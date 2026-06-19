"""
Celery application instance for the Bangla News Aggregator.

This module creates the Celery 'app' object that:
- Connects to the message broker (Memurai/Redis on localhost:6379)
- Knows where to find task modules
- Is imported by both the worker and the beat scheduler

To run the worker:    celery -A app.workers.celery_app worker --loglevel=info -P solo
To run the scheduler: celery -A app.workers.celery_app beat --loglevel=info
"""

from celery import Celery
from celery.schedules import crontab


celery_app = Celery(
    "bangla_news_aggregator",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0",
    include=["app.workers.tasks"],
)


celery_app.conf.update(
    timezone="Asia/Dhaka",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=600,  # 10 minutes (TBS scrapes 72 articles, takes time)
)

# -----------------------------------------------------------------------------
# Beat schedule: 3 scrape windows per day at staggered times.
#
# Morning brief    (6:00 AM Dhaka)  - fresh news when users wake up
# Midday update    (12:00 PM Dhaka) - lunch-time check-in
# Evening recap    (6:00 PM Dhaka)  - end-of-day catch-up
#
# Each scraper is offset by a few minutes within its window so they don't
# all hammer the network simultaneously.
# -----------------------------------------------------------------------------
celery_app.conf.beat_schedule = {
    # ---------------- Morning window (6:00 AM) ----------------
    "scrape-daily-star-morning": {
        "task": "scrapers.daily_star",
        "schedule": crontab(hour=6, minute=0),
    },
    "scrape-prothom-alo-morning": {
        "task": "scrapers.prothom_alo",
        "schedule": crontab(hour=6, minute=5),
    },
    "scrape-tbs-morning": {
        "task": "scrapers.tbs",
        "schedule": crontab(hour=6, minute=10),
    },

    # ---------------- Midday window (12:00 PM) ----------------
    "scrape-daily-star-midday": {
        "task": "scrapers.daily_star",
        "schedule": crontab(hour=12, minute=0),
    },
    "scrape-prothom-alo-midday": {
        "task": "scrapers.prothom_alo",
        "schedule": crontab(hour=12, minute=5),
    },
    "scrape-tbs-midday": {
        "task": "scrapers.tbs",
        "schedule": crontab(hour=12, minute=10),
    },

    # ---------------- Evening window (6:00 PM) ----------------
    "scrape-daily-star-evening": {
        "task": "scrapers.daily_star",
        "schedule": crontab(hour=18, minute=0),
    },
    "scrape-prothom-alo-evening": {
        "task": "scrapers.prothom_alo",
        "schedule": crontab(hour=18, minute=5),
    },
    "scrape-tbs-evening": {
        "task": "scrapers.tbs",
        "schedule": crontab(hour=18, minute=10),
    },
}
