

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
