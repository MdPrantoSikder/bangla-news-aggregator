"""
Scraper for Prothom Alo (https://www.prothomalo.com).

Two-stage pattern (same as Daily Star):
1. Fetch homepage, parse out article URLs + headline texts.
2. For each article URL, fetch the page and extract clean body + image.

Important: we force r.encoding = 'utf-8' on every requests.get() because
Prothom Alo's server doesn't always declare charset, and requests defaults
to Latin-1 - which would mojibake all Bangla text.
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin


HOMEPAGE_URL = "https://www.prothomalo.com"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; BanglaNewsAggregator/1.0)"
}


def _fetch_utf8(url: str) -> str:
    """Helper: fetch a URL and return text correctly decoded as UTF-8."""
    response = requests.get(url, headers=HEADERS, timeout=15)
    response.raise_for_status()
    response.encoding = "utf-8"
    return response.text


def fetch_homepage_html() -> str:
    """Fetch the Prothom Alo homepage."""
    return _fetch_utf8(HOMEPAGE_URL)


def parse_homepage_headlines(html: str) -> list[dict]:
    """Extract a list of unique article headlines from the homepage HTML."""
    soup = BeautifulSoup(html, "lxml")
    headline_links = soup.select("a.title-link")

    articles_by_url: dict[str, dict] = {}

    for link in headline_links:
        href = link.get("href")
        if not href:
            continue

        headline = link.get_text(strip=True, separator=" ")
        if not headline:
            continue

        absolute_url = urljoin(HOMEPAGE_URL, href)

        if not absolute_url.startswith(HOMEPAGE_URL):
            continue

        articles_by_url[absolute_url] = {
            "url": absolute_url,
            "headline": headline,
        }

    return list(articles_by_url.values())


def fetch_article_html(article_url: str) -> str:
    """Fetch one article page."""
    return _fetch_utf8(article_url)


def extract_og_image(soup: BeautifulSoup) -> str | None:
    """
    Extract the og:image meta tag content.

    Prothom Alo sets <meta property="og:image" content="..."> on every
    article page (standard SEO/social-sharing practice).

    Returns the image URL string, or None if not found.
    """
    meta_tag = soup.find("meta", property="og:image")

    if meta_tag is None:
        return None

    image_url = meta_tag.get("content")
    if not image_url:
        return None

    # Some sites return relative URLs - convert to absolute.
    return urljoin(HOMEPAGE_URL, image_url)


def parse_article(html: str) -> dict | None:
    """
    Parse an article page and extract its headline, body, and image URL.

    Returns a dict with 'headline', 'body', 'image_url', or None if extraction fails.
    image_url may be None if the article has no og:image.
    """
    soup = BeautifulSoup(html, "lxml")

    headline_tag = soup.select_one("h1")
    if headline_tag is None:
        return None

    headline = headline_tag.get_text(strip=True)

    paragraphs = soup.select("div.story-element-text p")

    body_parts = []
    for p in paragraphs:
        text = p.get_text(strip=True)
        if text:
            body_parts.append(text)

    body = "\n\n".join(body_parts)

    if not body:
        return None

    image_url = extract_og_image(soup)

    return {
        "headline": headline,
        "body": body,
        "image_url": image_url,
    }


if __name__ == "__main__":
    print(f"Fetching {HOMEPAGE_URL} ...")
    html = fetch_homepage_html()
    print(f"Got {len(html)} characters of HTML")

    articles = parse_homepage_headlines(html)
    print(f"Found {len(articles)} unique articles")
    print()

    for i, article in enumerate(articles[:5], start=1):
        print(f"{i}. {article['headline']}")
        print(f"   {article['url']}")
    print()

    if articles:
        first_url = articles[0]["url"]
        print(f"--- Fetching full article: {first_url} ---")
        article_html = fetch_article_html(first_url)
        parsed = parse_article(article_html)

        if parsed is None:
            print("Could not parse article. Selectors may have changed.")
        else:
            print(f"Headline: {parsed['headline']}")
            print(f"Image:    {parsed['image_url']}")
            print()
            print(f"Body ({len(parsed['body'])} chars):")
            print(parsed['body'][:500])
            print("...")
