"""
Admin-only endpoints for BanglaBrief.
"""
from pathlib import Path
from typing import Annotated
from fastapi import Body
from fastapi import APIRouter, Depends, BackgroundTasks, status
from sqlalchemy import select, func
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, BackgroundTasks, status, Body, HTTPException
from app.core.database import get_db
from app.models import User, Article
from app.routers.auth import get_current_admin


router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/run-daily-brief", status_code=status.HTTP_202_ACCEPTED)
def trigger_daily_brief(
    background_tasks: BackgroundTasks,
    admin: Annotated[User, Depends(get_current_admin)],
):
    """Trigger the daily-brief job. Returns 202 immediately."""
    from app.scripts.daily_brief import run_daily_brief
    background_tasks.add_task(run_daily_brief)
    return {
        "status":       "queued",
        "message":      "Daily brief job started. Check daily_brief.log for progress.",
        "triggered_by": admin.email,
    }


@router.get("/stats")
def admin_stats(
    admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    """High-level stats for the admin dashboard."""
    total_articles = db.scalar(select(func.count(Article.id)))
    total_users    = db.scalar(select(func.count(User.id)))
    bcs_classified = db.scalar(
        select(func.count(Article.id)).where(Article.bcs_relevance.is_not(None))
    )
    by_relevance_rows = db.execute(
        select(Article.bcs_relevance, func.count())
        .where(Article.bcs_relevance.is_not(None))
        .group_by(Article.bcs_relevance)
    ).all()
    by_source_rows = db.execute(
        select(Article.source_id, func.count())
        .group_by(Article.source_id)
    ).all()
    return {
        "total_articles":  total_articles,
        "total_users":     total_users,
        "bcs_classified":  bcs_classified,
        "by_relevance":    {row[0]: row[1] for row in by_relevance_rows},
        "by_source":       {row[0]: row[1] for row in by_source_rows},
    }


@router.get("/daily-brief-log")
def daily_brief_log(
    admin: Annotated[User, Depends(get_current_admin)],
    lines: int = 50,
):
    """Return the last N lines of the daily_brief.log file."""
    log_path = Path(__file__).resolve().parent.parent.parent / "daily_brief.log"
    if not log_path.exists():
        return {"lines": [], "exists": False, "total_lines": 0}
    try:
        with open(log_path, "r", encoding="utf-8") as f:
            all_lines = f.readlines()
        tail = all_lines[-lines:] if len(all_lines) > lines else all_lines
        return {
            "lines":       [line.rstrip() for line in tail],
            "exists":      True,
            "total_lines": len(all_lines),
        }
    except Exception as e:
        return {"lines": [f"Error: {e}"], "exists": True, "error": str(e)}


@router.get("/users")
def list_all_users(
    admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    """List all users (admin only)."""
    users = db.scalars(select(User).order_by(User.created_at.desc())).all()
    return [
        {
            "id":            u.id,
            "email":         u.email,
            "full_name":     u.full_name,
            "is_active":     u.is_active,
            "is_admin":      u.is_admin,
            "created_at":    u.created_at.isoformat() if u.created_at else None,
            "last_login_at": u.last_login_at.isoformat() if u.last_login_at else None,
        }
        for u in users
    ]


@router.get("/sources")
def list_all_sources(
    admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    """List sources with article counts."""
    rows = db.execute(
        select(Article.source_id, func.count())
        .group_by(Article.source_id)
        .order_by(func.count().desc())
    ).all()
    SOURCE_NAMES = {1: "The Daily Star", 2: "Prothom Alo", 6: "The Business Standard"}
    return [
        {"id": sid, "name": SOURCE_NAMES.get(sid, f"Source {sid}"), "article_count": count}
        for sid, count in rows
    ]
@router.get("/groq-usage")
def groq_usage(
    admin: Annotated[User, Depends(get_current_admin)],
):
    """Today's Groq token usage + last 7 days history."""
    from app.services.groq_tracker import get_today_usage, get_history
    return {
        "today":   get_today_usage(),
        "history": get_history(7),
    }
    

@router.post("/users/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
    send_email: bool = Body(False, embed=True),
):
    """Soft-delete a user (set is_active=False). Optionally send notification email."""
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if not user.is_active:
        return {"status": "already_inactive", "user_id": user.id, "email": user.email}

    user.is_active = False
    db.commit()

    email_status = "skipped"
    if send_email:
        # TODO: integrate real SMTP here. For now, log it.
        email_status = "logged_only"
        print(f"[Admin] Would send deactivation email to {user.email}")

    return {
        "status": "deactivated",
        "user_id": user.id,
        "email": user.email,
        "email_status": email_status,
    }


@router.post("/users/{user_id}/reactivate")
def reactivate_user(
    user_id: int,
    admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    """Reactivate a previously deactivated user."""
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    db.commit()
    return {"status": "reactivated", "user_id": user.id, "email": user.email}


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    admin: Annotated[User, Depends(get_current_admin)],
    db: Annotated[Session, Depends(get_db)],
):
    """
    PERMANENTLY delete a user + all their saved articles, bookmarks, folders.
    Cannot be undone. The Bookmark FK has ondelete=CASCADE so related rows
    are removed automatically.
    """
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    email = user.email
    db.delete(user)
    db.commit()

    return {
        "status":  "deleted",
        "user_id": user_id,
        "email":   email,
    }