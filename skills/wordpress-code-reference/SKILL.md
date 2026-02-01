---
name: wordpress-code-reference
description: >
  Search WordPress Code Reference for functions, hooks, classes, and methods.
  Use when the developer asks about specific WordPress functions, actions,
  filters, or class implementations. Provides API signatures, descriptions,
  version information, and source file locations.
  Requires mcp-wordpress-docs MCP server.
license: Apache-2.0
metadata:
  author: hideokamoto
  version: "0.1.0"
---

# WordPress Code Reference Search Skill

This skill enables searching and retrieving information from the WordPress Code Reference.

## Prerequisites

The `mcp-wordpress-docs` MCP server must be connected.

**Installation:**
```bash
claude mcp add wordpress-docs npx -- -y mcp-wordpress-docs
```

## Available Tools

- **search_wordpress_docs**: Search code references by keywords
- **get_wordpress_doc_content**: Retrieve details of a specific function/hook/class/method

## Available Code Reference Types

| Subtype | Description |
|---------|-------------|
| `wp-parser-function` | WordPress functions (e.g., `get_post`, `wp_insert_post`) |
| `wp-parser-hook` | Actions and filters (e.g., `init`, `the_content`) |
| `wp-parser-class` | WordPress classes (e.g., `WP_Query`, `WP_Post`) |
| `wp-parser-method` | Class methods (e.g., `WP_Query::query`) |

## Important Constraint

Code references do **not** have a `content` field. The `get_wordpress_doc_content` tool returns:

- **excerpt**: Description/summary of the function/hook/class/method
- **since**: WordPress version when this API was introduced
- **source_file**: Source file path (e.g., `wp-includes/post.php`)

For full source code, direct the user to the returned URL.

## Usage Instructions

### Step 1: Search for Code Reference

Use `search_wordpress_docs` with code reference subtypes:

```json
{
  "query": "register_post_type",
  "subtypes": ["wp-parser-function"],
  "per_page": 5
}
```

### Step 2: Retrieve Details

Use `get_wordpress_doc_content` with the ID and subtype from search results:

```json
{
  "subtype": "wp-parser-function",
  "id": 12345
}
```

### Response Format

```json
{
  "id": 12345,
  "title": "register_post_type()",
  "url": "https://developer.wordpress.org/reference/functions/register_post_type/",
  "excerpt": "Registers a post type...",
  "since": "2.9.0",
  "source_file": "wp-includes/post.php"
}
```

## Search Tips

- **Find functions**: Use `wp-parser-function` subtype
- **Find hooks (actions/filters)**: Use `wp-parser-hook` subtype
- **Find classes**: Use `wp-parser-class` subtype
- **Find methods**: Use `wp-parser-method` subtype
- **Combined search**: Specify multiple subtypes to search across types

## Example Queries

1. "wp_insert_post function" → Search `wp-parser-function`
2. "init action hook" → Search `wp-parser-hook`
3. "the_content filter" → Search `wp-parser-hook`
4. "WP_Query class" → Search `wp-parser-class`
5. "query method" → Search `wp-parser-method`

## When to Direct Users to URL

- When full source code is needed
- When looking for usage examples in core
- When checking all parameters and return values in detail
