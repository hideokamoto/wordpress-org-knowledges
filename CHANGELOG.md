# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Claude plugin bundle: `.claude-plugin/plugin.json` declares the MCP server and both Agent Skills, and `.claude-plugin/marketplace.json` makes it installable with `/plugin install`
- Root `package.json` and `package-lock.json` so Claude Code installs the server's runtime dependencies when it installs the plugin
- `title` and `annotations` (`readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint`) on both MCP tools
- The server sends a `User-Agent` header and retries a 429 or 503 answer from developer.wordpress.org up to twice, waiting for `Retry-After` (at most 5 seconds)
- `.circleci/config.yml`, which runs the plugin checks below on CircleCI
- `scripts/verify-plugin.mjs`, run in CircleCI, which starts the server as the plugin declares it and checks the tool annotations
- PRIVACY.md, and README sections on usage examples, what the plugin sends, troubleshooting and support

### Changed

- Node.js 20 or later is required, because `@modelcontextprotocol/sdk` 1.32.2 depends on `@hono/node-server`, which requires Node.js 20
- The MCP server source is now plain JavaScript (`src/index.js`, type-checked with `checkJs`) so the plugin runs it without a build step
- Updated `@modelcontextprotocol/sdk` to 1.32.2 and `turndown` to 7.2.5, pinned to exact versions
- The server reports its name and version from `package.json`

## [0.1.0] - 2026-02-01

### Added

- Initial release of mcp-wordpress-docs MCP server
- `search_wordpress_docs` tool for searching WordPress documentation
- `get_wordpress_doc_content` tool for retrieving document content
- Support for all WordPress handbook types:
  - plugin-handbook
  - theme-handbook
  - blocks-handbook
  - rest-api-handbook
  - apis-handbook
  - wpcs-handbook
  - adv-admin-handbook
- Support for WordPress code reference types:
  - wp-parser-function
  - wp-parser-hook
  - wp-parser-class
  - wp-parser-method
- HTML to Markdown conversion for retrieved content
- Agent Skills for Claude Code:
  - wordpress-handbook
  - wordpress-code-reference
- Kiro Power integration (wordpress-docs)
- CI/CD workflows for testing and releases
- Build tools for packaging skills
