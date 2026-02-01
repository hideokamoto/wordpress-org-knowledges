#!/usr/bin/env python3
"""Package a skill directory into a .skill zip archive."""

import argparse
import os
import zipfile


def package_skill(skill_dir: str, output_path: str | None = None) -> str:
    """Create a .skill zip archive from a skill directory.

    Places SKILL.md at the archive root (not in a subdirectory).
    All other files are included relative to the skill directory root.
    """
    if not os.path.isdir(skill_dir):
        raise ValueError(
            f"skill_dir does not exist or is not a directory: {skill_dir}"
        )

    skill_md_path = os.path.join(skill_dir, "SKILL.md")
    if not os.path.exists(skill_md_path):
        raise FileNotFoundError(
            f"SKILL.md not found in skill_dir: {skill_md_path}"
        )

    skill_name = os.path.basename(os.path.normpath(skill_dir))

    if output_path is None:
        output_path = os.path.join("dist", f"{skill_name}.skill")

    output_dir = os.path.dirname(output_path)
    if output_dir:
        os.makedirs(output_dir, exist_ok=True)

    with zipfile.ZipFile(output_path, "w", zipfile.ZIP_DEFLATED) as zf:
        # Write SKILL.md first at archive root
        zf.write(skill_md_path, "SKILL.md")

        # Write remaining files
        for root, _dirs, files in os.walk(skill_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, skill_dir)
                if arcname != "SKILL.md":
                    zf.write(file_path, arcname)

    return output_path


def main():
    parser = argparse.ArgumentParser(
        description="Package a skill directory into a .skill archive"
    )
    parser.add_argument("skill_dir", help="Path to the skill directory")
    parser.add_argument(
        "-o", "--output", help="Output path for the .skill file", default=None
    )
    args = parser.parse_args()

    output = package_skill(args.skill_dir, args.output)
    print(f"Packaged skill to: {output}")


if __name__ == "__main__":
    main()
