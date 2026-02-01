# WordPress Skills

MCP server and Agent Skills for searching WordPress developer documentation.

## Overview

This monorepo provides tools for AI agents to search and retrieve content from the official WordPress developer documentation at [developer.wordpress.org](https://developer.wordpress.org/).

### Components

- **mcp-wordpress-docs**: MCP server that provides search and content retrieval tools
- **Agent Skills**: Instruction files for Claude Code and similar AI assistants
- **Kiro Power**: Integration for Kiro IDE

## Quick Start

### For Claude Code Users

Add the MCP server:

```bash
claude mcp add wordpress-docs npx -- -y mcp-wordpress-docs
```

Then ask questions about WordPress development:

```
"How do I register a custom post type in WordPress?"
"What parameters does wp_insert_post accept?"
"Explain the template hierarchy in WordPress themes"
```

### For Kiro IDE Users

Install the WordPress Docs power from the Powers panel.

## MCP Server Tools

### search_wordpress_docs

Search WordPress documentation by keywords.

**Parameters:**
- `query` (required): Search keywords
- `subtypes` (optional): Filter by document types
- `per_page` (optional): Number of results (1-100, default: 5)

**Document Types:**

Handbooks:
- `plugin-handbook` - Plugin development
- `theme-handbook` - Theme development
- `blocks-handbook` - Block Editor (Gutenberg)
- `rest-api-handbook` - REST API
- `apis-handbook` - Common APIs
- `wpcs-handbook` - Coding Standards
- `adv-admin-handbook` - Advanced Administration

Code References:
- `wp-parser-function` - Functions
- `wp-parser-hook` - Actions and Filters
- `wp-parser-class` - Classes
- `wp-parser-method` - Methods

### get_wordpress_doc_content

Retrieve full content of a specific document.

**Parameters:**
- `subtype` (required): Document type from search results
- `id` (required): Document ID from search results

## Project Structure

```
wordpress-skills/
├── packages/
│   └── mcp-wordpress-docs/      # MCP server (TypeScript)
├── skills/                       # Agent Skills
│   ├── wordpress-handbook/
│   └── wordpress-code-reference/
├── powers/                       # Kiro Power
│   └── wordpress-docs/
└── tools/                        # Build utilities
```

## Development

### Building the MCP Server

```bash
cd packages/mcp-wordpress-docs
npm install
npm run build
```

### Testing Locally

```bash
# Add local build to Claude Code
claude mcp add wordpress-docs node -- /path/to/packages/mcp-wordpress-docs/dist/index.js

# Test search
# Ask: "Search for register_post_type in the plugin handbook"
```

### Packaging Skills

```bash
python tools/package_skill.py skills/wordpress-handbook --output dist/wordpress-handbook.skill
```

## License

Apache-2.0
