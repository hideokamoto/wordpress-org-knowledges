# Handbook Search Steering

Use this guide when the user asks about WordPress development concepts, best practices, or documentation from official handbooks.

## Available Handbooks

| Subtype | Use For |
|---------|---------|
| `plugin-handbook` | Plugin architecture, hooks, custom post types, meta boxes, settings API |
| `theme-handbook` | Theme structure, template hierarchy, customizer, theme functions |
| `blocks-handbook` | Block Editor, custom blocks, block patterns, Gutenberg development |
| `rest-api-handbook` | REST API endpoints, authentication, custom endpoints |
| `apis-handbook` | Options API, Transients API, Rewrite API, and other core APIs |
| `wpcs-handbook` | PHP/JS/CSS coding standards, documentation standards |
| `adv-admin-handbook` | Server configuration, performance, security, multisite |

## Search Workflow

### Step 1: Identify the Right Handbook

Based on the user's question, determine which handbook(s) to search:

- "How do I create a plugin?" → `plugin-handbook`
- "Template hierarchy" → `theme-handbook`
- "Create a custom block" → `blocks-handbook`
- "REST API authentication" → `rest-api-handbook`
- "Options API usage" → `apis-handbook`
- "Code formatting standards" → `wpcs-handbook`

### Step 2: Search for Documents

```json
{
  "tool": "search_wordpress_docs",
  "arguments": {
    "query": "<user's search terms>",
    "subtypes": ["<appropriate-handbook>"],
    "per_page": 5
  }
}
```

### Step 3: Retrieve Relevant Content

For each relevant result, fetch the full content:

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

- Extract the most relevant sections from the Markdown content
- Summarize key points for the user
- Include code examples if present
- Provide the URL for further reading

## Response Guidelines

1. **Be concise**: Don't dump entire documents; extract relevant sections
2. **Include examples**: If code examples exist, include them
3. **Cite sources**: Always mention which handbook the information comes from
4. **Suggest next steps**: Point to related documentation if helpful

## Common Query Patterns

| User Query | Recommended Subtypes |
|------------|---------------------|
| "custom post type" | `plugin-handbook` |
| "theme template" | `theme-handbook` |
| "gutenberg block" | `blocks-handbook` |
| "REST endpoint" | `rest-api-handbook` |
| "transient cache" | `apis-handbook` |
| "PHP standards" | `wpcs-handbook` |
