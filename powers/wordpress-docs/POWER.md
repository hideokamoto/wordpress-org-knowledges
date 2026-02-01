---
name: "wordpress-docs"
displayName: "WordPress Developer Documentation"
description: >
  Search WordPress official handbooks and code references via
  developer.wordpress.org REST API. Covers plugin development,
  theme development, block editor, REST API, coding standards,
  and function/hook/class references.
keywords:
  - "wordpress"
  - "wp plugin"
  - "wp theme"
  - "register_post_type"
  - "add_action"
  - "add_filter"
  - "wp hook"
  - "wordpress function"
  - "wordpress handbook"
  - "gutenberg"
  - "block editor"
  - "wp coding standards"
  - "WP_Query"
  - "wp_insert_post"
  - "get_post"
mcpServers:
  - "wordpress-docs"
---

# WordPress Developer Documentation Power

This power provides access to the official WordPress developer documentation through the `mcp-wordpress-docs` MCP server.

## Onboarding

When this power is activated, you have access to two tools for searching and retrieving WordPress documentation:

1. **search_wordpress_docs** - Search across handbooks and code references
2. **get_wordpress_doc_content** - Get full content of a specific document

## When to Use This Power

Activate this power when the user:

- Asks about WordPress development concepts or best practices
- Needs to look up WordPress functions, hooks, classes, or methods
- Wants to understand WordPress APIs (REST API, Settings API, etc.)
- Is working on plugin or theme development
- Needs WordPress coding standards information
- Asks about Block Editor (Gutenberg) development

## Steering Files

Based on the user's query, consult the appropriate steering file:

- **Handbook questions** → See `steering/handbook-search.md`
- **Code reference questions** → See `steering/code-reference-search.md`

## Quick Reference

### Handbook Subtypes
- `plugin-handbook` - Plugin development
- `theme-handbook` - Theme development
- `blocks-handbook` - Block Editor/Gutenberg
- `rest-api-handbook` - REST API
- `apis-handbook` - Common APIs
- `wpcs-handbook` - Coding Standards
- `adv-admin-handbook` - Advanced Administration

### Code Reference Subtypes
- `wp-parser-function` - Functions
- `wp-parser-hook` - Actions and Filters
- `wp-parser-class` - Classes
- `wp-parser-method` - Methods
