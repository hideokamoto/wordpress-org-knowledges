# Code Reference Search Steering

Use this guide when the user asks about specific WordPress functions, hooks, classes, or methods.

## Available Code Reference Types

| Subtype | Use For |
|---------|---------|
| `wp-parser-function` | Core functions like `get_post()`, `wp_insert_post()`, `register_post_type()` |
| `wp-parser-hook` | Actions (`init`, `wp_enqueue_scripts`) and filters (`the_content`, `query_vars`) |
| `wp-parser-class` | Core classes like `WP_Query`, `WP_Post`, `WP_User` |
| `wp-parser-method` | Class methods like `WP_Query::query()`, `WP_Query::get_posts()` |

## Important: Content Limitation

**Code references do NOT have full content.** The `get_wordpress_doc_content` tool returns:

- `excerpt`: Brief description of the function/hook/class/method
- `since`: WordPress version when introduced
- `source_file`: Location in WordPress core (e.g., `wp-includes/post.php`)

For full source code or detailed parameter information, direct users to the returned URL.

## Search Workflow

### Step 1: Identify the Reference Type

- "How does get_post work?" → `wp-parser-function`
- "What is the init action?" → `wp-parser-hook`
- "WP_Query class" → `wp-parser-class`
- "query method in WP_Query" → `wp-parser-method`

### Step 2: Search for References

```json
{
  "tool": "search_wordpress_docs",
  "arguments": {
    "query": "<function/hook/class name>",
    "subtypes": ["<appropriate-type>"],
    "per_page": 5
  }
}
```

### Step 3: Get Details

```json
{
  "tool": "get_wordpress_doc_content",
  "arguments": {
    "subtype": "<from search result>",
    "id": <from search result>
  }
}
```

### Step 4: Present Information

Provide the user with:
- Function/hook/class name and description
- WordPress version since (for compatibility)
- Source file location
- URL for full documentation

## Response Format Example

When presenting a function reference:

```
**register_post_type()**

Description: Registers a custom post type.

- Since: WordPress 2.9.0
- Source: wp-includes/post.php
- Full documentation: [URL]

[Excerpt from the documentation]
```

## Distinguishing Actions vs Filters

Both are returned as `wp-parser-hook`. Help users understand:

- **Actions**: Execute code at specific points (`do_action`)
- **Filters**: Modify data before use (`apply_filters`)

Common actions: `init`, `wp_enqueue_scripts`, `admin_menu`, `save_post`
Common filters: `the_content`, `the_title`, `query_vars`, `posts_where`

## When to Direct to URL

Always provide the URL when:
- User needs full parameter documentation
- User wants to see usage examples from core
- User needs return value details
- User wants to see the actual source code
