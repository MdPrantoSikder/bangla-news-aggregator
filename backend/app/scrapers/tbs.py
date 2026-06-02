"""
Scraper for The Business Standard (https://www.tbsnews.net).

Two-stage pattern (same as Daily Star and Prothom Alo):
1. Fetch homepage, parse out article URLs + headline texts.
2. For each article URL, fetch the page and extract clean body + image.

TBS article URLs always end with a numeric ID, e.g.:
    /economy/banking/cenbank-announces-tk60000cr-stimulus-1446631
The numeric suffix lets us distinguish real article links from
navigation/category links like /economy or /bangladesh.
"""

import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin


HOMEPAGE_URL = "https://www.tbsnews.net"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; BanglaNewsAggregator/1.0)"
}

# Article URLs end with -<digits>. Navigation URLs do not.
# Examples that match:
#   /bangladesh/court/ex-cj-khairul-haque-shown-arrested-1446641
#   /economy/banking/cenbank-stimulus-package-1446631
# Examples that DO NOT match:
#   /economy, /bangladesh, /sports, /world
ARTICLE_URL_PATTERN = re.compile(r"-\d+$")


def fetch_homepage_html() -> str:
    """Fetch the TBS homepage and return raw HTML."""
    response = requests.get(HOMEPAGE_URL, headers=HEADERS, timeout=15)
    response.raise_for_status()
    return response.text


def parse_homepage_headlines(html: str) -> list[dict]:
    """
    Extract a list of unique article URLs + headlines from the homepage.

    TBS uses <a href="/path/...-12345">Headline</a> for every article card.
    We filter for links whose path ends with -<digits> to keep only real
    articles (not nav links like /economy or /sports).
    """
    soup = BeautifulSoup(html, "lxml")

    # Grab every anchor with an href
    all_links = soup.find_all("a", href=True)

    articles_by_url: dict[str, dict] = {}

    for link in all_links:
        href = link.get("href")
        if not href:
            continue

        # Build absolute URL.
        absolute_url = urljoin(HOMEPAGE_URL, href)

        # Skip if not on tbsnews.net.
        if not absolute_url.startswith(HOMEPAGE_URL):
            continue

        # Skip if URL doesn't end with -<digits> (= not an article).
        # We split on "?" first to ignore query strings.
        path_only = absolute_url.split("?")[0]
        if not ARTICLE_URL_PATTERN.search(path_only):
            continue

        # Get the headline text. Sometimes the <a> wraps an <img> instead
        # of text - skip those (they're duplicate image-only links).
        headline = link.get_text(strip=True)
        if not headline:
            continue

        # Some headlines on TBS are very short (just "Read more") - filter.
        if len(headline) < 15:
            continue

        articles_by_url[absolute_url] = {
            "url": absolute_url,
            "headline": headline,
        }

    return list(articles_by_url.values())


def fetch_article_html(article_url: str) -> str:
    """Fetch one article page."""
    response = requests.get(article_url, headers=HEADERS, timeout=15)
    response.raise_for_status()
    return response.text


def extract_og_image(soup: BeautifulSoup) -> str | None:
    """
    Extract the og:image meta tag content.

    TBS sets <meta property="og:image" content="..."> on every article.
    """
    meta_tag = soup.find("meta", property="og:image")

    if meta_tag is None:
        return None

    image_url = meta_tag.get("content")
    if not image_url:
        return None

    return urljoin(HOMEPAGE_URL, image_url)


def parse_article(html: str) -> dict | None:
    """
    Parse an article page and extract its headline, body, and image URL.

    Returns a dict with 'headline', 'body', 'image_url', or None if extraction fails.
    """
    soup = BeautifulSoup(html, "lxml")

    # Headline is the first <h1> on the page.
    headline_tag = soup.select_one("h1")
    if headline_tag is None:
        return None

    headline = headline_tag.get_text(strip=True)

    # TBS body lives inside <div class="print-body">.
    # All <p> tags directly inside contain the article paragraphs.
    paragraphs = soup.select("div.print-body p")

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
