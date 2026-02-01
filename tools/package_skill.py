#!/usr/bin/env python3
"""
Package a skill directory into a .skill archive for distribution.

Usage:
    python package_skill.py <skill_directory> --output <output_path>

Example:
    python package_skill.py skills/wordpress-handbook --output dist/wordpress-handbook.skill
"""

import argparse
import os
import sys
import zipfile
from pathlib import Path


def validate_skill_directory(skill_dir: Path) -> bool:
    """Validate that the skill directory contains required files."""
    skill_md = skill_dir / "SKILL.md"
    if not skill_md.exists():
        print(f"ERROR: SKILL.md not found in {skill_dir}", file=sys.stderr)
        return False
    return True


def package_skill(skill_dir: Path, output_path: Path) -> bool:
    """
    Package a skill directory into a .skill archive.

    The archive structure places SKILL.md at the root level (not in a subdirectory).
    """
    if not skill_dir.exists():
        print(f"ERROR: Skill directory not found: {skill_dir}", file=sys.stderr)
        return False

    if not validate_skill_directory(skill_dir):
        return False

    # Ensure output directory exists
    output_path.parent.mkdir(parents=True, exist_ok=True)

    # Create the zip archive
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for file_path in skill_dir.rglob('*'):
            if file_path.is_file():
                resolved_file = file_path.resolve()
                resolved_output = output_path.resolve()

                # Skip the output file itself
                if resolved_file == resolved_output:
                    continue

                # Skip files under the output file's parent directory
                if resolved_output.parent in resolved_file.parents:
                    continue

                # Calculate the archive name (relative to skill_dir)
                # This ensures SKILL.md is at the root of the archive
                arcname = file_path.relative_to(skill_dir)
                zipf.write(file_path, arcname)
                print(f"  Added: {arcname}")

    print(f"Created: {output_path}")
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Package a skill directory into a .skill archive"
    )
    parser.add_argument(
        "skill_directory",
        type=Path,
        help="Path to the skill directory (e.g., skills/wordpress-handbook)"
    )
    parser.add_argument(
        "--output", "-o",
        type=Path,
        required=True,
        help="Output path for the .skill archive (e.g., dist/wordpress-handbook.skill)"
    )

    args = parser.parse_args()

    # Resolve paths
    skill_dir = args.skill_directory.resolve()
    output_path = args.output.resolve()

    # Validate output extension
    if not str(output_path).endswith('.skill'):
        print("WARNING: Output file does not have .skill extension", file=sys.stderr)

    print(f"Packaging skill: {skill_dir.name}")

    success = package_skill(skill_dir, output_path)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
