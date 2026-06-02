# requests for fetching the HTML page over HTTP.
import requests

# BeautifulSoup for parsing HTML and extracting data with CSS selectors.
from bs4 import BeautifulSoup

# urljoin builds full URLs from a base + relative path.
from urllib.parse import urljoin


HOMEPAGE_URL = "https://www.thedailystar.net"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; BanglaNewsAggregator/1.0)"
}


def fetch_homepage_html() -> str:
    """Fetch the Daily Star homepage and return the raw HTML as a string."""
    response = requests.get(HOMEPAGE_URL, headers=HEADERS, timeout=15)
    response.raise_for_status()
    return response.text


def parse_homepage_headlines(html: str) -> list[dict]:
    """Parse the homepage HTML and extract a list of unique article headlines."""
    soup = BeautifulSoup(html, "lxml")
    headline_links = soup.select("h5.card-title a")

    articles_by_url: dict[str, dict] = {}

    for link in headline_links:
        href = link.get("href")
        if not href:
            continue

        headline = link.get_text(strip=True)
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
    """Fetch one article page and return its HTML as a string."""
    response = requests.get(article_url, headers=HEADERS, timeout=15)
    response.raise_for_status()
    return response.text


def extract_og_image(soup: BeautifulSoup) -> str | None:
    """
    Extract the og:image meta tag content.

    Standard SEO practice across all major news sites is to set
    <meta property="og:image" content="https://..."> for social sharing.
    This is what Facebook/Twitter use as preview images, so it's always
    the "best" representative image for the article.

    Returns the image URL string, or None if not found.
    """
    # property="og:image" is what we want. .find() returns the first match.
    meta_tag = soup.find("meta", property="og:image")

    # Defensive: tag might be missing on some pages (errors, paywalls).
    if meta_tag is None:
        return None

    image_url = meta_tag.get("content")
    if not image_url:
        return None

    # Some sites return relative URLs in og:image - convert to absolute.
    return urljoin(HOMEPAGE_URL, image_url)


def parse_article(html: str) -> dict | None:
    """
    Parse one article page and extract headline, body, and image URL.

    Returns a dict with 'headline', 'body', 'image_url', or None if extraction fails.
    image_url may be None if the article has no og:image.
    """
    soup = BeautifulSoup(html, "lxml")

    headline_tag = soup.select_one("h1")
    if headline_tag is None:
        return None

    headline = headline_tag.get_text(strip=True)

    body_container = soup.select_one("span.text-formatted")
    if body_container is None:
        return None

    paragraphs = body_container.select("p")
    body_parts = []
    for p in paragraphs:
        text = p.get_text(strip=True)
        if text:
            body_parts.append(text)

    body = "\n\n".join(body_parts)

    if not body:
        return None

    # Extract og:image - returns None if not found, which is fine.
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
