---
name: wordpress-handbook
description: Search and retrieve WordPress developer handbook documentation using MCP tools
license: Apache-2.0
metadata:
  version: "0.1.0"
  author: hideokamoto
---

# WordPress Handbook Skill

## Prerequisites

Install the MCP server to enable WordPress documentation access:

```bash
npx mcp-wordpress-docs
```

## Available Tools

| Tool | Purpose |
|------|---------|
| `search_wordpress_docs` | Search WordPress developer documentation |
| `get_wordpress_doc_content` | Retrieve full handbook content by ID and subtype |

## Usage Instructions

### Step 1: Search for handbook entries

Use `search_wordpress_docs` with handbook-specific subtypes to find relevant documentation:

- `plugin-handbook` – Plugin development guides
- `theme-handbook` – Theme development guides
- `blocks-handbook` – Block editor documentation
- `rest-api-handbook` – REST API usage guides
- `apis-handbook` – Core API documentation
- `wpcs-handbook` – WordPress Coding Standards
- `adv-admin-handbook` – Advanced administration topics

Example:
```json
{
  "query": "creating a plugin",
  "subtypes": ["plugin-handbook"],
  "per_page": 5
}
```

### Step 2: Retrieve full content

Use `get_wordpress_doc_content` with the `id` and `type` from search results to fetch the complete handbook entry. The `type` field in search results corresponds to the `subtype` parameter.

Example:
```json
{
  "id": 12345,
  "subtype": "plugin-handbook"
}
```

The response includes the full `content` field converted to Markdown.

### Step 3: Handle empty results

If a search returns no results, try:

- Broadening the query to use fewer or simpler keywords
- Removing the subtype filter to search across all documentation
- Using different terminology (e.g., "hook" instead of "action")

## Search Hints

- Filter by `subtypes` to narrow results to a specific handbook area
- Use `per_page` to control the number of results returned (default: 10)
- Search results include `id`, `title`, `url`, and `type` fields
- Use the `id` and `type` from results directly in `get_wordpress_doc_content`
- Handbook entries return full rendered content converted to Markdown
