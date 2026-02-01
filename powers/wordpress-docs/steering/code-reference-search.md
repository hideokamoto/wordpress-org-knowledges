# Code Reference Search Instructions

When the user asks about specific WordPress functions, hooks (actions/filters), classes, or methods, use the `search_wordpress_docs` tool filtered to code reference subtypes.

## Critical Limitation

**Code reference entries do NOT have a full `content` field.** Only the `excerpt` is returned. If the user needs full source code or detailed parameter documentation, direct them to the `url` in the response.

## Available Code Reference Subtypes

| Subtype | Covers |
|---------|--------|
| `wp-parser-function` | Standalone functions (e.g., `add_action`, `get_posts`, `wp_mail`) |
| `wp-parser-hook` | Action and filter hooks (e.g., `init`, `the_content`, `save_post`) |
| `wp-parser-class` | Classes (e.g., `WP_Query`, `WP_Post`, `WP_User`) |
| `wp-parser-method` | Class methods (e.g., `WP_Query::parse_query`) |

## API Parameters

- **search** – The function name, hook name, or class name to look up
- **subtype** – Comma-separated list of code reference subtypes
- **per_page** – Number of results (default 10)
- **_fields** – For retrieval, always use `id,title,excerpt,link,wp-parser-since,wp-parser-source-file`

## Metadata Fields

When retrieving a code reference entry, the response includes:

- **excerpt** – Short Markdown description of what the function/hook/class/method does
- **since** – Extracted from the `wp-parser-since` array; indicates which WordPress version introduced this item
- **source_file** – Extracted from the `wp-parser-source-file` array; the relative path to the source file in WordPress core
- **url** – Direct link to the full documentation page for source code and examples

## Response Handling

1. Present the excerpt, since version, and source file to the user as a summary
2. If the user needs full parameter lists or examples, provide the `url` and explain that the excerpt is the only content available via the API
3. For empty search results, suggest trying alternative names or checking spelling (WordPress function names are case-sensitive in practice)
4. If multiple results match, list them with titles and types so the user can select the correct one
