# WordPress Skills

MCP server and Agent Skills for searching WordPress developer documentation.

## Overview

This monorepo provides tools for AI agents to search and retrieve content from the official WordPress developer documentation at [developer.wordpress.org](https://developer.wordpress.org/).

### Components

- **mcp-wordpress-docs**: MCP server that provides search and content retrieval tools
- **Agent Skills**: Python scripts for Claude Code and similar AI assistants
- **Kiro Power**: Integration for Kiro IDE

## Quick Start

### For Claude Code Users (plugin)

Install the plugin, which bundles the MCP server and both Agent Skills:

```
/plugin install wordpress-org-knowledges --marketplace hideokamoto/wordpress-org-knowledges
```

On Claude Code versions older than 2.1.275, add the marketplace first:

```
/plugin marketplace add hideokamoto/wordpress-org-knowledges
/plugin install wordpress-org-knowledges@wordpress-org-knowledges
```

The plugin needs Node.js 20 or later on your `PATH` for the MCP server, and Python 3 as `python3` for the two Agent Skills. When Claude Code installs the plugin, it installs the server's npm dependencies from the lockfile in this repository, so there is no separate build or `npx` download.

### For Kiro IDE Users

Install the WordPress Docs power from the Powers panel.

## Examples

Ask Claude questions like these after installing the plugin:

1. "How do I register a custom post type in WordPress?" Claude searches the Plugin Handbook and reads the matching page.
2. "What does wp_insert_post do, and since which version is it available?" Claude looks up the function in the code reference and reads its description, `since` version and source file. The tool does not return the full parameter list; Claude gives you the function's page URL on developer.wordpress.org for that.
3. "Explain the template hierarchy in WordPress themes." Claude searches the Theme Handbook and summarizes the page.
4. "Which hook should I use to enqueue scripts in the block editor?" Claude searches the hooks reference and the Block Editor Handbook.

## How it works

The plugin adds two read-only tools (described below) and two Agent Skills. Both call the public WordPress.org REST API at `https://developer.wordpress.org/wp-json/wp/v2/`:

- A search sends your search keywords, the document types you chose and the number of results to `https://developer.wordpress.org/wp-json/wp/v2/search`.
- Reading a page sends the document type and ID to `https://developer.wordpress.org/wp-json/wp/v2/<type>/<id>`, and converts the returned HTML to Markdown on your machine.

Nothing else is sent anywhere. The plugin needs no account or API key, stores nothing, and keeps no logs. See [PRIVACY.md](PRIVACY.md).

The MCP server runs locally with `node ${CLAUDE_PLUGIN_ROOT}/packages/mcp-wordpress-docs/src/index.js`. Its source is plain JavaScript in [packages/mcp-wordpress-docs/src/index.js](packages/mcp-wordpress-docs/src/index.js), with no build step. Its only runtime dependencies are `@modelcontextprotocol/sdk` and `turndown`, pinned in [package-lock.json](package-lock.json).

This is an unofficial community project. It is not affiliated with or endorsed by the WordPress Foundation or WordPress.org.

## Troubleshooting

- **The `wordpress-docs` MCP server doesn't start**: check that `node --version` prints 18 or later. Then run `/plugin` and look for a note that the plugin's packages aren't installed; if there is one, update or reinstall the plugin so Claude Code installs them again.
- **A tool returns `Network error` or `Request timeout`**: your network can't reach `developer.wordpress.org`. If you use a proxy or a sandbox allowlist, allow that host.
- **A tool returns `Document not found (404)`**: the ID doesn't exist for that document type. Run a search first and pass the `subtype` and `id` from its results.
- **A tool returns `Invalid subtype`**: use one of the document types listed below.

## Support

Report problems and ask questions in [GitHub Issues](https://github.com/hideokamoto/wordpress-org-knowledges/issues).

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
wordpress-org-knowledges/
├── .claude-plugin/
│   ├── plugin.json              # Claude plugin manifest (MCP server + skills)
│   └── marketplace.json         # Marketplace entry for /plugin install
├── package.json                 # Runtime dependencies installed by Claude Code
├── package-lock.json
├── packages/
│   └── mcp-wordpress-docs/      # MCP server (TypeScript)
├── skills/                       # Agent Skills (Python)
│   ├── wordpress-handbook/
│   │   ├── SKILL.md
│   │   ├── search.py
│   │   └── get_content.py
│   └── wordpress-code-reference/
│       ├── SKILL.md
│       ├── search.py
│       └── get_content.py
├── powers/                       # Kiro Power
│   └── wordpress-docs/
├── scripts/
│   └── verify-plugin.mjs        # Plugin checks run in CI
└── tools/                        # Build utilities
```

## Development

### Type-checking the MCP Server

The server is plain JavaScript checked by TypeScript (`checkJs`), so there is nothing to build:

```bash
cd packages/mcp-wordpress-docs
npm install
npm run typecheck
```

### Testing Locally

```bash
# Load this checkout as a plugin
claude --plugin-dir /path/to/wordpress-org-knowledges

# Or add only the MCP server
claude mcp add wordpress-docs node -- /path/to/packages/mcp-wordpress-docs/src/index.js

# Test search
# Ask: "Search for register_post_type in the plugin handbook"
```

### Verifying the Plugin

The root `package.json` lists the server's runtime dependencies, which Claude Code installs from `package-lock.json` when it installs the plugin. Keep them identical to `packages/mcp-wordpress-docs/package.json`. CI checks this, validates the manifest, and starts the server the way Claude Code does:

```bash
cd /path/to/wordpress-org-knowledges   # run from the repository root
npm ci --omit=dev --ignore-scripts
npx -y @anthropic-ai/claude-code@2.1.332 plugin validate .
npm run verify:plugin -- --live
```

### Testing Skills

Skills are Python scripts that require no build step:

```bash
# Search handbooks
python3 skills/wordpress-handbook/search.py "custom post type" "plugin-handbook" 5

# Get content
python3 skills/wordpress-handbook/get_content.py plugin-handbook 11067

# Search code reference
python3 skills/wordpress-code-reference/search.py "add_action" "wp-parser-function" 5
```

### Packaging Skills

```bash
# Package as .skill archives (no build step required)
python3 tools/package_skill.py skills/wordpress-handbook --output dist/wordpress-handbook.skill
python3 tools/package_skill.py skills/wordpress-code-reference --output dist/wordpress-code-reference.skill
```

## License

MIT
