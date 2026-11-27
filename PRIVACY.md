# Privacy Policy

This policy covers the `wordpress-org-knowledges` Claude plugin, the `mcp-wordpress-docs` MCP server, the Agent Skills and the Kiro power in this repository.

## What is collected

Nothing. The plugin has no server of its own, no account and no analytics. It doesn't store your queries, keep logs or read your conversation, memory or files.

## What is sent, and where

The software runs on your machine. When Claude uses a tool or skill, it sends a request to the public WordPress.org REST API at `https://developer.wordpress.org/wp-json/wp/v2/`:

- **Search:** the search keywords, the document types and the number of results you asked for.
- **Reading a page:** the document type and the document ID.

These requests go directly from your machine to WordPress.org, which handles them under its own privacy policy: https://wordpress.org/about/privacy/. No other destination receives data.

## Retention

The plugin keeps nothing, so there is nothing to retain or delete.

## Children

The plugin is a developer tool and isn't directed at people under 18.

## Contact

Ask questions or report problems in GitHub Issues: https://github.com/hideokamoto/wordpress-org-knowledges/issues
