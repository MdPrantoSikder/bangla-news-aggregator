"""Quick test: find the most similar article pair in our DB."""
from sqlalchemy import select
from app.core.database import SessionLocal
from app.models.article import Article
from app.services.embeddings import cosine_similarity

db = SessionLocal()
articles = db.scalars(select(Article)).all()
print(f"Comparing {len(articles)} articles, {len(articles)*(len(articles)-1)//2} pairs...")

best = (None, None, -1.0)
for i in range(len(articles)):
    for j in range(i + 1, len(articles)):
        a = articles[i]
        b = articles[j]
        # Skip same-source pairs (already obviously different articles
        # within one source — we want cross-source matches).
        if a.source_id == b.source_id:
            continue
        sim = cosine_similarity(a.embedding, b.embedding)
        if sim > best[2]:
            best = (a, b, sim)

a, b, sim = best
print(f"\n=== Most similar cross-source pair ===")
print(f"Similarity: {sim:.4f}")
print(f"\n[{a.source_id}] {a.headline}")
print(f"[{b.source_id}] {b.headline}")
db.close()
