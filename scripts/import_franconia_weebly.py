#!/usr/bin/env python3
import os, re, sys, json
import requests
from bs4 import BeautifulSoup
import html2text
from urllib.parse import urljoin, urlparse
from slugify import slugify

BASE = "http://www.franconianh.org/"
OUT_DIR = "src"
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "FranconiaSiteImporter/1.0"})

def fetch(url: str) -> str:
    url = force_http(url)
    r = SESSION.get(url, timeout=30)
    r.raise_for_status()
    return r.text

def is_same_site(url: str) -> bool:
    try:
        u = urlparse(url)
        return (u.netloc == "" or u.netloc.endswith("franconianh.org"))
    except Exception:
        return False

def normalize_href(href: str) -> str:
    if not href:
        return ""
    href = href.strip()
    if href.startswith("mailto:") or href.startswith("tel:") or href.startswith("#"):
        return href
    return force_http(urljoin(BASE, href))

def guess_slug(url: str) -> str:
    u = urlparse(url)
    path = u.path.strip("/")
    if not path:
        return ""  # home
    # Weebly uses *.html pages sometimes:
    path = re.sub(r"\.html?$", "", path, flags=re.I)
    return slugify(path)

def extract_main(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")

    # Weebly main content typically lives in one of these:
    candidates = [
        soup.select_one("#wsite-content"),
        soup.select_one(".wsite-section-content"),
        soup.select_one(".wsite-elements"),
        soup.select_one(".container .wsite-elements"),
    ]
    main = next((c for c in candidates if c), None)

    # Fallback: use body
    if not main:
        main = soup.body or soup

    # Remove nav/footer-ish repeated junk
    for sel in ["nav", "header", "footer", ".wsite-menu-default", ".wsite-footer", ".wsite-header-section"]:
        for el in main.select(sel):
            el.decompose()

    # Rewrite links inside main
    for a in main.select("a[href]"):
        abs_url = normalize_href(a.get("href"))
        if not abs_url:
            continue

        # Keep uploads + external URLs as-is
        if "franconianh.org/uploads/" in abs_url:
            a["href"] = abs_url
            continue

        # Rewrite internal page links to new pretty paths
        if is_same_site(abs_url):
            slug = guess_slug(abs_url)
            if slug == "":
                a["href"] = "/"
            else:
                a["href"] = f"/{slug}/"
        else:
            a["href"] = abs_url

    # Rewrite image src to absolute
    for img in main.select("img[src]"):
        img["src"] = normalize_href(img["src"])

    return str(main)

def html_to_markdown(html: str) -> str:
    h = html2text.HTML2Text()
    h.ignore_links = False
    h.body_width = 0
    h.ignore_images = False
    md = h.handle(html)
    md = re.sub(r"\n{3,}", "\n\n", md).strip() + "\n"
    return md

def write_page(slug: str, title: str, md: str):
    if slug == "":
        out_path = os.path.join(OUT_DIR, "index.md")
        permalink = "/"
    else:
        out_path = os.path.join(OUT_DIR, slug, "index.md")
        permalink = f"/{slug}/"

    os.makedirs(os.path.dirname(out_path), exist_ok=True)

    fm = f"""---
layout: base.njk
title: {title}
permalink: {permalink}
---

"""
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(fm + md)

from collections import deque
from urllib.parse import urljoin, urlparse, urldefrag

SKIP_EXTS = (".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
             ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".zip", ".mp3", ".mp4")

def force_http(url: str) -> str:
    return re.sub(r"^https://", "http://", url)

def canonicalize(url: str) -> str:
    """Normalize: force http, drop fragments, drop tracking params if desired."""
    url = force_http(url)
    url, _frag = urldefrag(url)  # drop #...
    # Optional: drop query params entirely (Weebly rarely needs them for pages)
    u = urlparse(url)
    url = u._replace(query="").geturl()
    return url

def is_html_page(url: str) -> bool:
    u = urlparse(url)
    p = u.path.lower()
    if "/uploads/" in p:
        return False
    if any(p.endswith(ext) for ext in SKIP_EXTS):
        return False
    # Allow "/" and ".html"
    return True

def extract_all_internal_links(html: str, base_url: str) -> list[str]:
    soup = BeautifulSoup(html, "html.parser")
    links = set()

    for a in soup.select("a[href]"):
        href = a.get("href")
        if not href:
            continue
        href = href.strip()
        if href.startswith(("mailto:", "tel:", "javascript:", "#")):
            continue
        abs_url = canonicalize(urljoin(base_url, href))
        if is_same_site(abs_url) and is_html_page(abs_url):
            links.add(abs_url)

    return sorted(links)

def crawl_site(start_url: str, max_pages: int = 500) -> list[str]:
    start_url = canonicalize(start_url)

    seen = set([start_url])
    q = deque([start_url])
    out = []

    while q and len(out) < max_pages:
        print(".", end="", flush=True)
        url = q.popleft()
        try:
            html = fetch(url)
        except Exception as e:
            print(f"✗ crawl fetch failed: {url}: {e}", file=sys.stderr)
            continue

        out.append(url)

        for link in extract_all_internal_links(html, url):
            if link not in seen:
                seen.add(link)
                q.append(link)

    return out


def title_from_page(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    t = soup.title.get_text(" ", strip=True) if soup.title else ""
    t = re.sub(r"\s*\|\s*.*$", "", t).strip()  # drop site suffix
    return t or "Town of Franconia, NH"

def main():
    seed = fetch(BASE)
    all_urls = crawl_site(BASE, max_pages=1000)
    print(f"Discovered {len(all_urls)} pages. Importing…")

    for url in all_urls:
        try:
            html = fetch(url)
            title = title_from_page(html)
            main_html = extract_main(html)
            md = html_to_markdown(main_html)
            slug = guess_slug(url)
            write_page(slug, title, md)
            print(f"✓ {url} -> /{slug}/")
        except Exception as e:
            print(f"✗ {url}: {e}", file=sys.stderr)

    print("Done. Review generated pages under src/")

if __name__ == "__main__":
    main()
