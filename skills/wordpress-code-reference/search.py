#!/usr/bin/env python3
"""
Search WordPress Code Reference.

Usage: python3 search.py <query> [subtypes] [per_page]

Arguments:
    query    - Search keywords (required)
    subtypes - Comma-separated list: wp-parser-function,wp-parser-hook,wp-parser-class,wp-parser-method
    per_page - Number of results (1-100, default: 5)

Example:
    python3 search.py "register_post_type" "wp-parser-function" 5
"""

import json
import sys
import urllib.request
import urllib.error
import urllib.parse
from typing import List, Optional

API_BASE_URL = "https://developer.wordpress.org/wp-json/wp/v2"
REQUEST_TIMEOUT = 10

CODE_REF_SUBTYPES = [
    "wp-parser-function",
    "wp-parser-hook",
    "wp-parser-class",
    "wp-parser-method",
]


def search_code_reference(
    query: str, subtypes: Optional[List[str]] = None, per_page: int = 5
) -> List[dict]:
    """Search WordPress Code Reference."""
    # Validate subtypes
    if subtypes:
        invalid = [s for s in subtypes if s not in CODE_REF_SUBTYPES]
        if invalid:
            raise ValueError(
                f"Invalid subtypes: {', '.join(invalid)}. "
                f"Valid: {', '.join(CODE_REF_SUBTYPES)}"
            )

    # Build query parameters
    params = {
        "search": query,
        "per_page": str(min(max(1, per_page), 100)),
        "_fields": "id,title,url,subtype",
        "subtype": ",".join(subtypes) if subtypes else ",".join(CODE_REF_SUBTYPES),
    }

    url = f"{API_BASE_URL}/search?{urllib.parse.urlencode(params)}"

    try:
        with urllib.request.urlopen(url, timeout=REQUEST_TIMEOUT) as response:
            data = json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        raise RuntimeError(f"HTTP error {e.code}") from e
    except urllib.error.URLError as e:
        raise RuntimeError(f"Network error: {e.reason}") from e

    if not isinstance(data, list):
        raise RuntimeError(data.get("message", "Unexpected API response"))

    return [
        {
            "id": item["id"],
            "title": item["title"],
            "url": item["url"],
            "subtype": item["subtype"],
        }
        for item in data
    ]


def main():
    args = sys.argv[1:]

    if not args:
        print("Usage: search.py <query> [subtypes] [per_page]", file=sys.stderr)
        print(
            'Example: search.py "add_action" "wp-parser-function,wp-parser-hook" 5',
            file=sys.stderr,
        )
        sys.exit(1)

    query = args[0]
    subtypes = [s.strip() for s in args[1].split(",")] if len(args) > 1 else None
    per_page = int(args[2]) if len(args) > 2 else 5

    try:
        results = search_code_reference(query, subtypes, per_page)

        if not results:
            print("No results found. Try different keywords.")
        else:
            print(json.dumps(results, indent=2))
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
