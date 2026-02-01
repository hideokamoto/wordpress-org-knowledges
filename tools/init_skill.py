#!/usr/bin/env python3
"""Initialize a new skill directory with template files."""

import argparse
import os

SKILL_TEMPLATE = """\
---
name: {name}
description: ""
license: Apache-2.0
metadata:
  version: "0.1.0"
  author: ""
---

# {title}

## Prerequisites

_Document any prerequisites here._

## Available Tools

_List available tools and their purposes._

## Usage Instructions

_Provide step-by-step usage instructions._
"""


def init_skill(name: str) -> str:
    """Create a new skill directory with a template SKILL.md."""
    skill_dir = os.path.join("skills", name)
    os.makedirs(skill_dir, exist_ok=True)

    title = name.replace("-", " ").title()
    skill_md = SKILL_TEMPLATE.format(name=name, title=title)

    skill_md_path = os.path.join(skill_dir, "SKILL.md")
    with open(skill_md_path, "w") as f:
        f.write(skill_md)

    return skill_dir


def main():
    parser = argparse.ArgumentParser(
        description="Initialize a new skill directory"
    )
    parser.add_argument(
        "name", help="Name of the skill (used as directory name)"
    )
    args = parser.parse_args()

    skill_dir = init_skill(args.name)
    print(f"Initialized skill at: {skill_dir}")


if __name__ == "__main__":
    main()
