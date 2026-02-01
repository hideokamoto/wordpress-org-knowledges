#!/usr/bin/env python3
"""
Initialize a new skill from a template.

Usage:
    python init_skill.py <skill_name> [--description "description"]

Example:
    python init_skill.py my-new-skill --description "A skill for doing X"
"""

import argparse
import os
import sys
from pathlib import Path
from datetime import datetime


SKILL_TEMPLATE = '''---
name: {name}
description: >
  {description}
  Requires mcp-wordpress-docs MCP server.
license: Apache-2.0
metadata:
  author: your-name
  version: "0.1.0"
---

# {title} Skill

Brief description of what this skill does.

## Prerequisites

The `mcp-wordpress-docs` MCP server must be connected.

**Installation:**
```bash
claude mcp add wordpress-docs npx -- -y mcp-wordpress-docs
```

## Available Tools

- **search_wordpress_docs**: Search documentation
- **get_wordpress_doc_content**: Retrieve full content

## Usage Instructions

### Step 1: Search

Describe how to search...

### Step 2: Retrieve Content

Describe how to get content...

## Examples

Add example queries and expected behavior...
'''


def to_title(name: str) -> str:
    """Convert kebab-case to Title Case."""
    return ' '.join(word.capitalize() for word in name.split('-'))


def init_skill(
    skill_name: str,
    description: str,
    base_dir: Path
) -> bool:
    """Initialize a new skill directory with template files."""
    skill_dir = base_dir / "skills" / skill_name

    if skill_dir.exists():
        print(f"ERROR: Skill directory already exists: {skill_dir}", file=sys.stderr)
        return False

    # Create directory
    skill_dir.mkdir(parents=True)

    # Create SKILL.md from template
    skill_md = skill_dir / "SKILL.md"
    content = SKILL_TEMPLATE.format(
        name=skill_name,
        title=to_title(skill_name),
        description=description
    )

    skill_md.write_text(content)
    print(f"Created: {skill_md}")

    print(f"\nSkill initialized: {skill_name}")
    print(f"Edit {skill_md} to customize your skill.")

    return True


def main():
    parser = argparse.ArgumentParser(
        description="Initialize a new skill from a template"
    )
    parser.add_argument(
        "skill_name",
        type=str,
        help="Name of the skill (kebab-case, e.g., my-new-skill)"
    )
    parser.add_argument(
        "--description", "-d",
        type=str,
        default="A new skill for WordPress development assistance.",
        help="Brief description of the skill"
    )
    parser.add_argument(
        "--base-dir", "-b",
        type=Path,
        default=Path.cwd(),
        help="Base directory of the project (default: current directory)"
    )

    args = parser.parse_args()

    # Validate skill name
    if not args.skill_name.replace('-', '').isalnum():
        print("ERROR: Skill name should only contain letters, numbers, and hyphens",
              file=sys.stderr)
        sys.exit(1)

    success = init_skill(
        skill_name=args.skill_name,
        description=args.description,
        base_dir=args.base_dir.resolve()
    )

    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
