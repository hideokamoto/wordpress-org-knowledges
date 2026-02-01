# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
