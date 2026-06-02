"""
Scraper for Prothom Alo English (https://en.prothomalo.com).

Same two-stage pattern as the Bangla scraper. Different domain, same structure.
"""
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin


HOMEPAGE_URL = "https://en.prothomalo.com"

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; BanglaNewsAggregator/1.0)"
}


def _fetch_utf8(url: str) -> str:
    response = requests.get(url, headers=HEADERS, timeout=15)
    response.raise_for_status()
    response.encoding = "utf-8"
    return response.text


def fetch_homepage_html() -> str:
    return _fetch_utf8(HOMEPAGE_URL)


def parse_homepage_headlines(html: str) -> list[dict]:
    """Extract article links from en.prothomalo.com homepage."""
    soup = BeautifulSoup(html, "lxml")

    candidates = []
    for selector in ["a.title-link", "h2 a", "h3 a", "a[data-track-position]"]:
        candidates.extend(soup.select(selector))

    articles_by_url: dict[str, dict] = {}

    for link in candidates:
        href = link.get("href")
        if not href:
            continue
        headline = link.get_text(strip=True, separator=" ")
        if not headline or len(headline) < 10:
            continue

        absolute_url = urljoin(HOMEPAGE_URL, href)
        if not absolute_url.startswith(HOMEPAGE_URL):
            continue
        path_segments = [p for p in absolute_url.replace(HOMEPAGE_URL, "").split("/") if p]
        if len(path_segments) < 2:
            continue

        articles_by_url[absolute_url] = {
            "url": absolute_url,
            "headline": headline,
        }

    return list(articles_by_url.values())


def fetch_article_html(article_url: str) -> str:
    return _fetch_utf8(article_url)


def extract_og_image(soup: BeautifulSoup) -> str | None:
    meta_tag = soup.find("meta", property="og:image")
    if meta_tag is None:
        return None
    image_url = meta_tag.get("content")
    if not image_url:
        return None
    return urljoin(HOMEPAGE_URL, image_url)


def parse_article(html: str) -> dict | None:
    soup = BeautifulSoup(html, "lxml")

    headline_tag = soup.select_one("h1")
    if headline_tag is None:
        return None
    headline = headline_tag.get_text(strip=True)

    paragraphs = []
    for selector in ["div.story-element-text p", "div.story-content p", "article p"]:
        found = soup.select(selector)
        if found:
            paragraphs = found
            break

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
    print(f"Found {len(articles)} unique articles\n")

    for i, article in enumerate(articles[:5], start=1):
        print(f"{i}. {article['headline']}")
        print(f"   {article['url']}")

    if articles:
        first_url = articles[0]["url"]
        print(f"\n--- Parsing first article: {first_url} ---")
        article_html = fetch_article_html(first_url)
        parsed = parse_article(article_html)
        if parsed is None:
            print("Could not parse - selectors may need adjustment.")
        else:
            print(f"Headline: {parsed['headline']}")
            print(f"Image:    {parsed['image_url']}")
            print(f"Body ({len(parsed['body'])} chars):")
            print(parsed['body'][:300])
