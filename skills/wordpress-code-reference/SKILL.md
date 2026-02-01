---
name: wordpress-code-reference
description: >
  Search WordPress Code Reference for functions, hooks, classes, and methods.
  Use when the developer asks about specific WordPress functions, actions,
  filters, or class implementations. Provides API signatures, descriptions,
  version information, and source file locations.
license: Apache-2.0
metadata:
  author: hideokamoto
  version: "0.2.0"
scripts:
  search:
    description: Search WordPress code reference by keywords
    command: npx ts-node scripts/search.ts
    args:
      - name: query
        description: Search keywords (required)
        required: true
      - name: subtypes
        description: "Comma-separated types: wp-parser-function,wp-parser-hook,wp-parser-class,wp-parser-method"
        required: false
      - name: per_page
        description: Number of results (1-100, default 5)
        required: false
  get_content:
    description: Get details of a code reference entry
    command: npx ts-node scripts/get_content.ts
    args:
      - name: subtype
        description: Reference type from search results
        required: true
      - name: id
        description: Document ID from search results
        required: true
---

# WordPress Code Reference Search Skill

This skill enables searching and retrieving information from the WordPress Code Reference.

## Available Scripts

### search

Search code references by keywords.

```bash
npx ts-node scripts/search.ts "register_post_type" "wp-parser-function" 5
```

**Arguments:**
- `query` (required): Search keywords
- `subtypes` (optional): Comma-separated list of reference types
- `per_page` (optional): Number of results (default: 5)

### get_content

Retrieve details of a specific code reference entry.

```bash
npx ts-node scripts/get_content.ts wp-parser-function 12345
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
npx ts-node scripts/search.ts "add_action" "wp-parser-function,wp-parser-hook" 5
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
npx ts-node scripts/get_content.ts wp-parser-function 12345
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

1. "wp_insert_post function" → Search `wp-parser-function`
2. "init action hook" → Search `wp-parser-hook`
3. "the_content filter" → Search `wp-parser-hook`
4. "WP_Query class" → Search `wp-parser-class`
5. "query method" → Search `wp-parser-method`

## When to Direct Users to URL

Always provide the URL when:
- User needs full parameter documentation
- User wants to see usage examples from core
- User needs return value details
- User wants to see the actual source code
