"""
Category extraction service.

Parses URLs from each source and maps them to a BCS-aligned taxonomy:
  bangladesh, world, economy, sports, science_tech,
  education, opinion, lifestyle, other

Why URL-based: source sites already organize articles by section in
their URL paths. Free, instant, no LLM call needed.

For V2 we could replace this with a Gemini classification pass for
higher accuracy and consistency, but URL parsing covers 90%+ of cases.
"""
from urllib.parse import urlparse


# Map URL path keywords to our canonical category names.
# Order matters — first match wins (more specific keywords first).
_KEYWORD_TO_CATEGORY = [
    # Economy
    ("economy", "economy"),
    ("business", "economy"),
    ("finance", "economy"),
    ("banking", "economy"),
    # Sports
    ("sport", "sports"),
    ("cricket", "sports"),
    ("football", "sports"),
    # Science / tech
    ("technology", "science_tech"),
    ("tech", "science_tech"),
    ("science", "science_tech"),
    ("health", "science_tech"),
    # Education / jobs
    ("education", "education"),
    ("chakri", "education"),
    ("career", "education"),
    ("job", "education"),
    # World
    ("world", "world"),
    ("international", "world"),
    ("global", "world"),
    ("asia", "world"),
    ("europe", "world"),
    ("america", "world"),
    ("middle-east", "world"),
    ("china", "world"),
    # Opinion / editorial
    ("opinion", "opinion"),
    ("editorial", "opinion"),
    ("views", "opinion"),
    ("analysis", "opinion"),
    # Lifestyle / entertainment
    ("lifestyle", "lifestyle"),
    ("entertainment", "lifestyle"),
    ("culture", "lifestyle"),
    ("shopping", "lifestyle"),
    ("food", "lifestyle"),
    ("travel", "lifestyle"),
    # Bangladesh (last, since many URLs include "bangladesh" generically)
    ("bangladesh", "bangladesh"),
    ("politics", "bangladesh"),
    ("country", "bangladesh"),
    ("national", "bangladesh"),
    ("dhaka", "bangladesh"),
]


VALID_CATEGORIES = {
    "bangladesh", "world", "economy", "sports", "science_tech",
    "education", "opinion", "lifestyle", "other",
}


def extract_category(url: str) -> str:
    """
    Return the BCS-aligned category for a given article URL.
    Returns 'other' if no keyword matches.
    """
    if not url:
        return "other"

    try:
        path = urlparse(url).path.lower()
    except Exception:
        return "other"

    for keyword, category in _KEYWORD_TO_CATEGORY:
        if keyword in path:
            return category

    return "other"


if __name__ == "__main__":
    # Smoke test on real URLs from our DB.
    test_urls = [
        "https://www.thedailystar.net/business/economy/news/bb-eases-lending",
        "https://www.thedailystar.net/sports/cricket/abc",
        "https://www.thedailystar.net/opinion/views/xyz",
        "https://www.prothomalo.com/sports/football/abc",
        "https://www.prothomalo.com/world/china/news",
        "https://www.prothomalo.com/chakri/job",
        "https://www.prothomalo.com/lifestyle/shopping/abc",
        "https://www.prothomalo.com/bangladesh/politics/xyz",
        "https://example.com/random/url",
    ]
    for url in test_urls:
        print(f"{extract_category(url):14}  {url}")