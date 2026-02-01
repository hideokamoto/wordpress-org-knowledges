---
name: wordpress-handbook
description: >
  Search WordPress official Plugin, Theme, Block Editor, REST API,
  Common APIs, Coding Standards, and Advanced Administration handbooks.
  Use when the developer asks about WordPress development concepts,
  best practices, coding standards, or architecture guidelines.
license: Apache-2.0
metadata:
  author: hideokamoto
  version: "0.3.0"
---

# WordPress Handbook Search Skill

This skill enables searching and retrieving content from WordPress official developer handbooks.

## Available Scripts

### search

Search handbooks by keywords.

```bash
python3 search.py "custom post type" "plugin-handbook,theme-handbook" 10
```

**Arguments:**
- `query` (required): Search keywords
- `subtypes` (optional): Comma-separated list of handbook types
- `per_page` (optional): Number of results (default: 5)

### get_content

Retrieve full content of a specific document.

```bash
python3 get_content.py plugin-handbook 11070
```

**Arguments:**
- `subtype` (required): Handbook type from search results
- `id` (required): Document ID from search results

## Available Handbook Types

| Subtype | Description |
|---------|-------------|
| `plugin-handbook` | Plugin development guide |
| `theme-handbook` | Theme development guide |
| `blocks-handbook` | Block Editor (Gutenberg) development |
| `rest-api-handbook` | REST API usage and extension |
| `apis-handbook` | Common WordPress APIs |
| `wpcs-handbook` | WordPress Coding Standards |
| `adv-admin-handbook` | Advanced administration |

## Usage Workflow

### Step 1: Search for Documentation

Run the search script with your query:

```bash
python3 search.py "register post type" "plugin-handbook" 5
```

Output:
```json
[
  {
    "id": 11070,
    "title": "Working with Custom Post Types",
    "url": "https://developer.wordpress.org/plugins/post-types/...",
    "subtype": "plugin-handbook"
  }
]
```

### Step 2: Retrieve Full Content

Use the ID and subtype from the search results:

```bash
python3 get_content.py plugin-handbook 11070
```

The content is returned in Markdown format for easy reading.

## Search Tips

- **Specific handbook search**: Set subtypes to target specific handbooks
- **Cross-handbook search**: Specify multiple subtypes (comma-separated)
- **No results**: Try alternative keywords or broaden the search

## Example Queries

1. "How to register a custom post type" -> Search `plugin-handbook`
2. "Theme template hierarchy" -> Search `theme-handbook`
3. "Create a custom block" -> Search `blocks-handbook`
4. "REST API authentication" -> Search `rest-api-handbook`
5. "WordPress coding standards for PHP" -> Search `wpcs-handbook`
