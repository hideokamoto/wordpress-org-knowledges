---
name: wordpress-handbook
description: >
  Search WordPress official Plugin, Theme, Block Editor, REST API,
  Common APIs, Coding Standards, and Advanced Administration handbooks.
  Use when the developer asks about WordPress development concepts,
  best practices, coding standards, or architecture guidelines.
  Requires mcp-wordpress-docs MCP server.
license: Apache-2.0
metadata:
  author: hideokamoto
  version: "0.1.0"
---

# WordPress Handbook Search Skill

This skill enables searching and retrieving content from WordPress official developer handbooks.

## Prerequisites

The `mcp-wordpress-docs` MCP server must be connected.

**Installation:**
```bash
claude mcp add wordpress-docs npx -- -y mcp-wordpress-docs
```

## Available Tools

- **search_wordpress_docs**: Search handbooks by keywords
- **get_wordpress_doc_content**: Retrieve full content of a specific document

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

## Usage Instructions

### Step 1: Search for Documentation

Use `search_wordpress_docs` with `subtypes` parameter to search handbooks:

```json
{
  "query": "custom post type",
  "subtypes": ["plugin-handbook", "theme-handbook"],
  "per_page": 10
}
```

### Step 2: Retrieve Full Content

Use `get_wordpress_doc_content` with the ID and subtype from search results:

```json
{
  "subtype": "plugin-handbook",
  "id": 11070
}
```

The content is returned in Markdown format for easy reading.

## Search Tips

- **Specific handbook search**: Set `subtypes` to target specific handbooks
- **Cross-handbook search**: Specify multiple subtypes to search across handbooks
- **No results**: If no results are found, suggest alternative keywords
- **Broad search**: Omit `subtypes` to search all documentation types

## Example Queries

1. "How to register a custom post type" → Search `plugin-handbook`
2. "Theme template hierarchy" → Search `theme-handbook`
3. "Create a custom block" → Search `blocks-handbook`
4. "REST API authentication" → Search `rest-api-handbook`
5. "WordPress coding standards for PHP" → Search `wpcs-handbook`
