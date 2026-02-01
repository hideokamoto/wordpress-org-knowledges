# wordpress-org-knowledges

MCP tools, skills, and powers for accessing WordPress developer documentation from [developer.wordpress.org](https://developer.wordpress.org).

## MCP Server

The `mcp-wordpress-docs` server provides two tools:

- **`search_wordpress_docs`** – Search WordPress developer documentation by keyword, with optional filtering by subtype (handbook entries or code references).
- **`get_wordpress_doc_content`** – Retrieve the full content of a documentation entry by ID. Returns Markdown-converted content for handbook entries, or excerpt and metadata for code references.

### Installation

Run directly with npx (no global install required):

```bash
npx mcp-wordpress-docs
```

Or install globally:

```bash
npm install -g mcp-wordpress-docs
```

### MCP Client Configuration

Add the following to your MCP client configuration (e.g., Claude Desktop `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "wordpress-docs": {
      "command": "npx",
      "args": ["mcp-wordpress-docs"]
    }
  }
}
```

## Skill Installation for Claude

Skills provide guided instructions that teach Claude how to use the MCP tools effectively.

Available skills:

| Skill | Description |
|-------|-------------|
| `wordpress-handbook` | Search and retrieve WordPress handbook documentation |
| `wordpress-code-reference` | Search WordPress code references (functions, hooks, classes, methods) |

Package a skill for installation:

```bash
python3 tools/package_skill.py skills/wordpress-handbook
python3 tools/package_skill.py skills/wordpress-code-reference
```

This generates `.skill` files in the `dist/` directory. Follow your Claude client's skill installation instructions to load them.

## Power Installation for Kiro

Powers enable automatic MCP tool activation based on keyword detection. The `wordpress-docs` power activates when WordPress-related keywords (e.g., `add_action`, `WP_Query`, `register_post_type`) are detected in your conversation.

To install, add the `powers/wordpress-docs` directory to your Kiro powers configuration. The power references `mcp.json` for the MCP server command and includes steering files that guide tool usage for handbook and code reference searches.

## License

This project is licensed under the [Apache License 2.0](LICENSE).
