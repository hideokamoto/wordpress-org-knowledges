# Handbook Search Instructions

When the user asks about WordPress plugin development, theme development, block editing, the REST API, core APIs, coding standards, or administration topics, use the `search_wordpress_docs` tool filtered to handbook subtypes.

## Available Handbook Subtypes

| Subtype | Covers |
|---------|--------|
| `plugin-handbook` | Plugin registration, activation, deactivation, settings, shortcodes |
| `theme-handbook` | Theme structure, template hierarchy, customizer, child themes |
| `blocks-handbook` | Block registration, block attributes, block editor API |
| `rest-api-handbook` | REST endpoints, authentication, custom routes, requests |
| `apis-handbook` | Core APIs: Options, Transients, Taxonomy, Query, Hooks |
| `wpcs-handbook` | Coding standards for PHP, JavaScript, CSS, HTML |
| `adv-admin-handbook` | Advanced admin: multisite, performance, security, deployment |

## API Parameters

- **search** – The keyword or phrase to search for
- **subtype** – Comma-separated list of handbook subtypes to filter results
- **per_page** – Number of results (default 10, adjust based on query specificity)
- **_fields** – Always set to `id,title,link,type` for search; set to `id,title,content,link,excerpt` when retrieving handbook content

## Response Handling

1. If the search returns an array of results, present the `title` and `url` to the user and ask which entry they want to explore
2. If the array is empty, suggest broadening the query or trying a different subtype
3. When retrieving content via `get_wordpress_doc_content`, the `content` field contains the full handbook page rendered as Markdown
4. For non-array responses (API errors), surface the error code and message to the user
