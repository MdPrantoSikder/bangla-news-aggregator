"""
BCS-aware article analysis service.

ONE Groq call per article extracts:
  - bcs_relevance: high | medium | low | skip
  - bcs_subject:   which BCS exam subject this fits
  - summary_en:    English summary (only if relevant)
  - summary_bn:    Bangla summary (only if relevant)
  - key_facts:     list of BCS-relevant facts (only if relevant)

Also tracks Groq token usage via groq_tracker.
"""
import json
import re

from groq import Groq

from app.core.config import settings
from app.services.groq_tracker import record_tokens


_MODEL = "llama-3.1-8b-instant"
_MAX_BODY_CHARS = 1500
_client: Groq | None = None


def _get_client() -> Groq:
    """Singleton Groq client, created lazily on first call."""
    global _client
    if _client is None:
        if not settings.GROQ_API_KEY:
            raise RuntimeError("GROQ_API_KEY is not set in .env")
        _client = Groq(api_key=settings.GROQ_API_KEY)
    return _client


_SYSTEM_PROMPT = (
    "You are an expert assistant for Bangladesh BCS (civil service) and "
    "government job exam aspirants. You analyze news articles, classify their "
    "relevance to competitive exams, and produce concise study materials. "
    "Always respond with valid JSON only."
)


_USER_PROMPT_TEMPLATE = """Analyze this news article for BCS / Bangladesh government job exam relevance.

ARTICLE:
Headline: {headline}

Body:
{body_snippet}

# RELEVANCE GUIDE (be STRICT - most articles are "low" or "skip")

## "high" - ONLY if it covers one of these:
- Government policy decisions (national budget, new laws, treaties, election rules)
- Bangladesh-specific governance, constitution, bureaucracy, civil service
- Bangladesh economy: monetary policy, RMG/export, remittance, GDP, inflation
- Major international relations affecting Bangladesh
- Major scientific breakthroughs (Nobel, major discoveries, climate science, space)
- Historical commemorations, national heritage, key dates
- Geography: rivers, borders, environmental policy

## "medium" - useful general awareness:
- Notable business news, corporate moves
- Education sector updates, university rankings
- Tech industry trends
- Sports diplomacy (Olympics medals for BD, etc.)
- Health/medicine general awareness

## "low" - limited exam value:
- General crime news (unless major political)
- Local accidents, road incidents
- Daily life stories
- Routine entertainment, routine sports match results

## "skip" - NO exam value:
- Celebrity gossip, dating, weddings
- Movie/TV reviews
- Restaurant openings, lifestyle, food pieces
- Astrology, horoscopes
- Sponsored content, advertorials

# BCS SUBJECTS:
- "bangladesh_affairs"  domestic politics, governance, society
- "international"       foreign affairs, world events
- "economy"             banking, trade, markets, budget
- "science_tech"        AI, climate, health, space, discoveries
- "geography"           places, rivers, borders, environment
- "history_culture"     heritage, literature, anniversaries
- "current_affairs"     general daily events
- "not_relevant"        use when relevance is "skip" or "low"

# RULES
- Return ONLY valid JSON.
- BE STRICT: only ~15 percent deserve "high". Personal/lifestyle stories are never "high".
- "skip" relevance: set summary_en, summary_bn, key_facts to empty.
- Otherwise: summary_en MAX 40 words, summary_bn MAX 30 words, 3-5 key facts (each MAX 15 words).
- Bangla summary MUST be in Bengali script.

# OUTPUT JSON FORMAT
{{
  "bcs_relevance": "high|medium|low|skip",
  "bcs_subject":   "subject_slug",
  "summary_en":    "...",
  "summary_bn":    "...",
  "key_facts":     ["fact 1", "fact 2", "fact 3"]
}}
"""


def _extract_json(raw_text: str) -> dict:
    cleaned = raw_text.strip()
    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
    cleaned = re.sub(r"\s*```$", "", cleaned)
    return json.loads(cleaned)


def analyze_article(headline: str, body: str) -> dict:
    """Run BCS analysis on an article. Tracks tokens used."""
    body_snippet = body[:_MAX_BODY_CHARS] if body else ""
    user_prompt = _USER_PROMPT_TEMPLATE.format(
        headline=headline,
        body_snippet=body_snippet,
    )

    client = _get_client()
    response = client.chat.completions.create(
        model=_MODEL,
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user",   "content": user_prompt},
        ],
        response_format={"type": "json_object"},
        temperature=0.3,
        max_tokens=1500,
    )

    # Track tokens used for this call (best-effort; ignore on failure)
    try:
        if hasattr(response, "usage") and response.usage:
            record_tokens(response.usage.total_tokens or 0)
    except Exception:
        pass

    raw_text = response.choices[0].message.content
    parsed = _extract_json(raw_text)

    return {
        "bcs_relevance": parsed.get("bcs_relevance", "low"),
        "bcs_subject":   parsed.get("bcs_subject", "not_relevant"),
        "summary_en":    parsed.get("summary_en", ""),
        "summary_bn":    parsed.get("summary_bn", ""),
        "key_facts":     parsed.get("key_facts", []) or [],
    }


def summarize_text(headline: str, body: str) -> tuple[str, str]:
    """Legacy interface. Use analyze_article() for new code."""
    result = analyze_article(headline, body)
    return result["summary_en"], result["summary_bn"]


if __name__ == "__main__":
    print("Running BCS analysis smoke test...")
    result = analyze_article(
        headline="Bangladesh Bank announces Tk60,000cr stimulus package",
        body="The Bangladesh Bank announced a Tk 60,000 crore stimulus package...",
    )
    print(f"BCS Relevance: {result['bcs_relevance']}")

