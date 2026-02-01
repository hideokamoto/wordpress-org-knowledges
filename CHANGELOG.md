# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-02-01

### Added

- `packages/mcp-wordpress-docs` — TypeScript MCP server with two tools:
  - `search_wordpress_docs`: searches `developer.wordpress.org` REST API with subtype filtering (`HANDBOOK_SUBTYPES`, `CODE_REF_SUBTYPES`) and per-page control
  - `get_wordpress_doc_content`: retrieves handbook full content or code-reference excerpt via `httpGetJson`, converts HTML to Markdown using Turndown
- `skills/wordpress-handbook/SKILL.md` — guided usage instructions for handbook subtypes
- `skills/wordpress-code-reference/SKILL.md` — usage guide highlighting excerpt-only constraint and metadata fields (`since`, `source_file`)
- `powers/wordpress-docs/` — Kiro power with keyword-triggered MCP activation (`POWER.md`, `mcp.json`, steering files)
- `tools/package_skill.py` — `package_skill()` utility to zip a skill directory into a `.skill` archive with `SKILL.md` at the root
- `tools/init_skill.py` — `init_skill()` scaffolding utility to generate a new skill directory with template `SKILL.md`
- `.github/workflows/ci.yml` — CI validation for MCP server build and skill/power file presence
- `.github/workflows/release.yml` — automated npm publish and GitHub release with `.skill` assets on `v*` tags
- `LICENSE` — Apache-2.0
