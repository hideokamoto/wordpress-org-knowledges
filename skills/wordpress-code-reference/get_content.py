#!/usr/bin/env python3
"""
Get WordPress Code Reference content.

Usage: python3 get_content.py <subtype> <id>

Arguments:
    subtype - Reference type: wp-parser-function, wp-parser-hook, wp-parser-class, wp-parser-method
    id      - Document ID from search results

Example:
    python3 get_content.py wp-parser-function 12345
"""

import json
import re
import sys
import urllib.request
import urllib.error

API_BASE_URL = "https://developer.wordpress.org/wp-json/wp/v2"
REQUEST_TIMEOUT = 10

CODE_REF_SUBTYPES = [
    "wp-parser-function",
    "wp-parser-hook",
    "wp-parser-class",
    "wp-parser-method",
]


def html_to_text(html: str) -> str:
    """Convert HTML to plain text."""
    text = html

    # Remove all HTML tags
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


def get_code_ref_content(subtype: str, doc_id: int) -> dict:
    """Get details of a code reference entry."""
    if subtype not in CODE_REF_SUBTYPES:
        raise ValueError(
            f"Invalid subtype: {subtype}. Valid: {', '.join(CODE_REF_SUBTYPES)}"
        )

    if not isinstance(doc_id, int) or doc_id < 1:
        raise ValueError("id must be a positive integer")

    url = f"{API_BASE_URL}/{subtype}/{doc_id}?_fields=id,title,excerpt,link,wp-parser-since,wp-parser-source-file"

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

    excerpt_text = html_to_text(data["excerpt"]["rendered"])

    since_list = data.get("wp-parser-since", [])
    source_file_list = data.get("wp-parser-source-file", [])

    return {
        "id": data["id"],
        "title": data["title"]["rendered"],
        "url": data["link"],
        "excerpt": excerpt_text,
        "since": since_list[0] if since_list else None,
        "source_file": source_file_list[0] if source_file_list else None,
    }


def main():
    args = sys.argv[1:]

    if len(args) < 2:
        print("Usage: get_content.py <subtype> <id>", file=sys.stderr)
        print("Example: get_content.py wp-parser-function 12345", file=sys.stderr)
        sys.exit(1)

    subtype = args[0]

    try:
        doc_id = int(args[1])
    except ValueError:
        print("Error: id must be a number", file=sys.stderr)
        sys.exit(1)

    try:
        content = get_code_ref_content(subtype, doc_id)
        print(json.dumps(content, indent=2))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
