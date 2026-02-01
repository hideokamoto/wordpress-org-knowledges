---
name: wordpress-code-reference
description: Search and retrieve WordPress code reference documentation for functions, hooks, classes, and methods
license: Apache-2.0
metadata:
  version: "0.1.0"
  author: hideokamoto
---

# WordPress Code Reference Skill

## Critical Constraint

**Code reference entries do NOT have a full content field — only the excerpt is available.**
When full source code or detailed documentation is needed, use the `url` field from the response to visit the documentation page directly.

## Available Subtypes

| Subtype | Description |
|---------|-------------|
| `wp-parser-function` | WordPress core functions |
| `wp-parser-hook` | Actions and filters (hooks) |
| `wp-parser-class` | WordPress core classes |
| `wp-parser-method` | Class methods |

## Available Tools

| Tool | Purpose |
|------|---------|
| `search_wordpress_docs` | Search code references by keyword |
| `get_wordpress_doc_content` | Retrieve code reference excerpt and metadata |

## Usage Instructions

### Step 1: Search for code references

Use `search_wordpress_docs` with one or more code reference subtypes to locate functions, hooks, classes, or methods:

```json
{
  "query": "add_action",
  "subtypes": ["wp-parser-function", "wp-parser-hook"],
  "per_page": 10
}
```

### Step 2: Retrieve code reference details

Use `get_wordpress_doc_content` with the `id` and `subtype` from search results:

```json
{
  "id": 67890,
  "subtype": "wp-parser-hook"
}
```

The response includes:

- **excerpt** – A short description of the function, hook, class, or method (converted to Markdown)
- **since** – The WordPress version when this item was introduced
- **source_file** – The path to the source file in WordPress core where this item is defined
- **url** – Direct link to the full documentation page

### Step 3: Get full source when needed

Since only the excerpt is returned, visit the `url` in the response for:

- Complete function signatures and all parameters
- Full source code listings
- Usage examples and detailed descriptions

## Returned Metadata Fields

| Field | Description |
|-------|-------------|
| `since` | WordPress version(s) when this item was introduced (extracted from array field) |
| `source_file` | Path(s) to the source file(s) in WordPress core (extracted from array field) |
| `url` | Direct link to the full documentation page on developer.wordpress.org |
| `excerpt` | Short Markdown description of the code reference |
