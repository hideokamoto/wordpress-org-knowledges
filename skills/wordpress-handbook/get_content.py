#!/usr/bin/env python3
"""
Get WordPress Handbook document content.

Usage: python3 get_content.py <subtype> <id>

Arguments:
    subtype - Handbook type (e.g., plugin-handbook, theme-handbook)
    id      - Document ID from search results

Example:
    python3 get_content.py plugin-handbook 12345
"""

import json
import re
import sys
import urllib.request
import urllib.error

API_BASE_URL = "https://developer.wordpress.org/wp-json/wp/v2"
REQUEST_TIMEOUT = 10

HANDBOOK_SUBTYPES = [
    "plugin-handbook",
    "theme-handbook",
    "blocks-handbook",
    "rest-api-handbook",
    "apis-handbook",
    "wpcs-handbook",
    "adv-admin-handbook",
]


def html_to_markdown(html: str) -> str:
    """Convert HTML to Markdown."""
    text = html

    # Remove scripts and styles
    text = re.sub(r"<script[^>]*>[\s\S]*?</script>", "", text, flags=re.IGNORECASE)
    text = re.sub(r"<style[^>]*>[\s\S]*?</style>", "", text, flags=re.IGNORECASE)

    # Headings
    text = re.sub(r"<h1[^>]*>(.*?)</h1>", r"# \1\n\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<h2[^>]*>(.*?)</h2>", r"## \1\n\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<h3[^>]*>(.*?)</h3>", r"### \1\n\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<h4[^>]*>(.*?)</h4>", r"#### \1\n\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<h5[^>]*>(.*?)</h5>", r"##### \1\n\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<h6[^>]*>(.*?)</h6>", r"###### \1\n\n", text, flags=re.IGNORECASE)

    # Code blocks
    text = re.sub(
        r"<pre[^>]*><code[^>]*>([\s\S]*?)</code></pre>",
        r"```\n\1\n```\n\n",
        text,
        flags=re.IGNORECASE,
    )
    text = re.sub(
        r"<pre[^>]*>([\s\S]*?)</pre>", r"```\n\1\n```\n\n", text, flags=re.IGNORECASE
    )
    text = re.sub(r"<code[^>]*>(.*?)</code>", r"`\1`", text, flags=re.IGNORECASE)

    # Links
    text = re.sub(
        r'<a[^>]*href="([^"]*)"[^>]*>(.*?)</a>', r"[\2](\1)", text, flags=re.IGNORECASE
    )

    # Bold and italic
    text = re.sub(r"<strong[^>]*>(.*?)</strong>", r"**\1**", text, flags=re.IGNORECASE)
    text = re.sub(r"<b[^>]*>(.*?)</b>", r"**\1**", text, flags=re.IGNORECASE)
    text = re.sub(r"<em[^>]*>(.*?)</em>", r"*\1*", text, flags=re.IGNORECASE)
    text = re.sub(r"<i[^>]*>(.*?)</i>", r"*\1*", text, flags=re.IGNORECASE)

    # Lists
    text = re.sub(r"<ul[^>]*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"</ul>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<ol[^>]*>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"</ol>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<li[^>]*>([\s\S]*?)</li>", r"- \1\n", text, flags=re.IGNORECASE)

    # Paragraphs and line breaks
    text = re.sub(r"<p[^>]*>([\s\S]*?)</p>", r"\1\n\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<br\s*/?>", "\n", text, flags=re.IGNORECASE)
    text = re.sub(r"<hr\s*/?>", "\n---\n\n", text, flags=re.IGNORECASE)

    # Blockquotes
    text = re.sub(
        r"<blockquote[^>]*>([\s\S]*?)</blockquote>",
        r"> \1\n\n",
        text,
        flags=re.IGNORECASE,
    )

    # Remove remaining tags
    text = re.sub(r"<[^>]+>", "", text)

    # Decode HTML entities
    text = text.replace("&nbsp;", " ")
    text = text.replace("&amp;", "&")
    text = text.replace("&lt;", "<")
    text = text.replace("&gt;", ">")
    text = text.replace("&quot;", '"')
    text = text.replace("&#39;", "'")

    # Clean up extra whitespace
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()


def get_handbook_content(subtype: str, doc_id: int) -> dict:
    """Get full content of a handbook document."""
    if subtype not in HANDBOOK_SUBTYPES:
        raise ValueError(
            f"Invalid subtype: {subtype}. Valid: {', '.join(HANDBOOK_SUBTYPES)}"
        )

    if not isinstance(doc_id, int) or doc_id < 1:
        raise ValueError("id must be a positive integer")

    url = f"{API_BASE_URL}/{subtype}/{doc_id}?_fields=id,title,content,link"

    try:
        with urllib.request.urlopen(url, timeout=REQUEST_TIMEOUT) as response:
            data = json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        if e.code == 404:
            raise RuntimeError("Document not found") from e
        raise RuntimeError(f"HTTP error {e.code}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"Network error: {e.reason}") from e

    if "code" in data:
        raise RuntimeError(data.get("message", "API error"))

    markdown_content = html_to_markdown(data["content"]["rendered"])

    return {
        "id": data["id"],
        "title": data["title"]["rendered"],
        "url": data["link"],
        "content": markdown_content,
    }


def main():
    args = sys.argv[1:]

    if len(args) < 2:
        print("Usage: get_content.py <subtype> <id>", file=sys.stderr)
        print("Example: get_content.py plugin-handbook 12345", file=sys.stderr)
        sys.exit(1)

    subtype = args[0]

    try:
        doc_id = int(args[1])
    except ValueError:
        print("Error: id must be a number", file=sys.stderr)
        sys.exit(1)

    try:
        content = get_handbook_content(subtype, doc_id)
        print(json.dumps(content, indent=2))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
