"""Embedding service for the Bangla News Aggregator."""

from sentence_transformers import SentenceTransformer


print("Loading sentence-transformer model... (first time downloads ~480MB)")
_model = SentenceTransformer("paraphrase-multilingual-MiniLM-L12-v2")
print("Model loaded.")


def compute_embedding(text: str) -> list[float]:
    """Compute the 384-dim embedding for a piece of text."""
    vector = _model.encode(text, convert_to_numpy=True)
    return vector.tolist()


def cosine_similarity(a, b) -> float:
    """Cosine similarity between two embedding vectors."""
    dot = sum(x * y for x, y in zip(a, b))
    mag_a = sum(x * x for x in a) ** 0.5
    mag_b = sum(y * y for y in b) ** 0.5
    if mag_a == 0 or mag_b == 0:
        return 0.0
    return dot / (mag_a * mag_b)


if __name__ == "__main__":
    print("--- Running smoke test ---")
    text_en = "Bangladesh Bank eases lending limits for big businesses"
    text_bn = "Bangladesh Bank loosens loan limits for big businesses"
    text_other = "Cricket players celebrate after winning the match"
    emb_en = compute_embedding(text_en)
    emb_bn = compute_embedding(text_bn)
    emb_other = compute_embedding(text_other)
    print(f"Embedding dimensions: {len(emb_en)}")
    sim_en_bn = cosine_similarity(emb_en, emb_bn)
    sim_en_other = cosine_similarity(emb_en, emb_other)
    print(f"Similarity EN-BN (same story):    {sim_en_bn:.4f}")
    print(f"Similarity EN-OTHER (unrelated):  {sim_en_other:.4f}")
