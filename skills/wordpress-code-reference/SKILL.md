---
name: wordpress-code-reference
description: >
  Search WordPress Code Reference for functions, hooks, classes, and methods.
  Use when the developer asks about specific WordPress functions, actions,
  filters, or class implementations. Provides API signatures, descriptions,
  version information, and source file locations.
license: MIT
metadata:
  author: hideokamoto
  version: "0.3.0"
---

# WordPress Code Reference Search Skill

This skill enables searching and retrieving information from the WordPress Code Reference.

## Available Scripts

### search

Search code references by keywords.

```bash
python3 search.py "register_post_type" "wp-parser-function" 5
```

**Arguments:**
- `query` (required): Search keywords
- `subtypes` (optional): Comma-separated list of reference types
- `per_page` (optional): Number of results (default: 5)

### get_content

Retrieve details of a specific code reference entry.

```bash
python3 get_content.py wp-parser-function 12345
```

**Arguments:**
- `subtype` (required): Reference type from search results
- `id` (required): Document ID from search results

## Available Code Reference Types

| Subtype | Description |
|---------|-------------|
| `wp-parser-function` | WordPress functions (e.g., `get_post`, `wp_insert_post`) |
| `wp-parser-hook` | Actions and filters (e.g., `init`, `the_content`) |
| `wp-parser-class` | WordPress classes (e.g., `WP_Query`, `WP_Post`) |
| `wp-parser-method` | Class methods (e.g., `WP_Query::query`) |

## Important Constraint

Code references do **not** have full content. The `get_content` script returns:

- **excerpt**: Description/summary of the function/hook/class/method
- **since**: WordPress version when this API was introduced
- **source_file**: Source file path (e.g., `wp-includes/post.php`)

For full source code, direct the user to the returned URL.

## Usage Workflow

### Step 1: Search for Code Reference

Run the search script:

```bash
python3 search.py "add_action" "wp-parser-function,wp-parser-hook" 5
```

Output:
```json
[
  {
    "id": 12345,
    "title": "add_action()",
    "url": "https://developer.wordpress.org/reference/functions/add_action/",
    "subtype": "wp-parser-function"
  }
]
```

### Step 2: Get Details

Use the ID and subtype from search results:

```bash
python3 get_content.py wp-parser-function 12345
```

Output:
```json
{
  "id": 12345,
  "title": "add_action()",
  "url": "https://developer.wordpress.org/reference/functions/add_action/",
  "excerpt": "Adds a callback function to an action hook.",
  "since": "1.2.0",
  "source_file": "wp-includes/plugin.php"
}
```

## Search Tips

- **Find functions**: Use `wp-parser-function` subtype
- **Find hooks (actions/filters)**: Use `wp-parser-hook` subtype
- **Find classes**: Use `wp-parser-class` subtype
- **Find methods**: Use `wp-parser-method` subtype
- **Combined search**: Specify multiple subtypes (comma-separated)

## Example Queries

1. "wp_insert_post function" -> Search `wp-parser-function`
2. "init action hook" -> Search `wp-parser-hook`
3. "the_content filter" -> Search `wp-parser-hook`
4. "WP_Query class" -> Search `wp-parser-class`
5. "query method" -> Search `wp-parser-method`

## When to Direct Users to URL

Always provide the URL when:
- User needs full parameter documentation
- User wants to see usage examples from core
- User needs return value details
- User wants to see the actual source code
