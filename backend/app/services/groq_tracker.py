"""
Lightweight Groq token usage tracker.

Stores per-day usage in a JSON file. No DB schema change needed.
Resets automatically on UTC date change (matches Groq's daily quota reset).
"""
import json
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock


USAGE_FILE = Path(__file__).resolve().parent.parent.parent / "groq_usage.json"
DAILY_LIMIT = 100_000   # Groq free tier: 100k tokens/day

_lock = Lock()


def _today_key() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def _load() -> dict:
    if not USAGE_FILE.exists():
        return {}
    try:
        with open(USAGE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _save(data: dict) -> None:
    try:
        with open(USAGE_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
    except Exception:
        pass


def record_tokens(tokens: int) -> None:
    """Add `tokens` to today's usage."""
    if tokens <= 0:
        return
    with _lock:
        data = _load()
        key  = _today_key()
        data[key] = data.get(key, 0) + tokens
        _save(data)


def get_today_usage() -> dict:
    """Return today's usage + limit + remaining."""
    data  = _load()
    key   = _today_key()
    used  = data.get(key, 0)
    return {
        "date":      key,
        "used":      used,
        "limit":     DAILY_LIMIT,
        "remaining": max(DAILY_LIMIT - used, 0),
        "pct_used":  round((used / DAILY_LIMIT) * 100, 1) if DAILY_LIMIT else 0,
    }


def get_history(days: int = 7) -> list[dict]:
    """Last N days of usage, newest first."""
    data = _load()
    items = [{"date": k, "used": v} for k, v in data.items()]
    items.sort(key=lambda x: x["date"], reverse=True)
    return items[:days]
