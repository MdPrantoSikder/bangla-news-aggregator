from sqlalchemy import select, func
from app.core.database import SessionLocal
from app.models.article import Article

db = SessionLocal()
stmt = (
    select(Article.story_cluster_id, func.count(Article.id).label("n"))
    .where(Article.story_cluster_id.is_not(None))
    .group_by(Article.story_cluster_id)
    .having(func.count(Article.id) > 1)
    .order_by(func.count(Article.id).desc())
)

for cluster_id, n in db.execute(stmt).all():
    print(f"\n=== Cluster {cluster_id} ({n} articles) ===")
    arts = db.scalars(select(Article).where(Article.story_cluster_id == cluster_id)).all()
    for a in arts:
        print(f"  [src={a.source_id}, lang={a.language}] {a.headline[:80]}")
db.close()
