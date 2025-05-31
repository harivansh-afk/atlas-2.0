#!/usr/bin/env python3
"""
Atlas Complete Rebrand & Component Update Script
===============================================

This script completely rebrands your Atlas repository to Atlas, updating all references
throughout frontend and backend, plus selectively updating existing components.

Key Features:
- Complete rebrand: Atlas → Atlas (frontend + backend)
- Full UI merge: Landing page and auth pages from Atlas
- Updates ONLY existing components (no new components added)
- Interactive diff review for each component
- Dry-run mode for safe previewing
- Comprehensive text replacement across all files
- Preserves all Atlas functionality while updating UI

Usage:
    python merge_atlas_changes.py [options]

Options:
    --dry-run           Show what would be changed without applying
    --non-interactive   Run without prompting (uses defaults)
    --atlas-root        Path to Atlas repository (default: ~/Documents/GitHub/Atlas)
    --Atlas-root         Path to Atlas repository (default: current directory)
"""

import os
import sys
import shutil
import json
import argparse
import re
from pathlib import Path
from typing import List
import difflib


class AtlasMerger:
    def __init__(
        self,
        suna_root: str,
        atlas_root: str,
        dry_run: bool = False,
        interactive: bool = True,
    ):
        self.suna_root = Path(suna_root)
        self.atlas_root = Path(atlas_root)
        self.dry_run = dry_run
        self.interactive = interactive
        self.changes_applied = []

        # Define comprehensive branding replacements
        self.branding_replacements = {
            # Names and titles
            r"\bSuna\b": "Atlas",
            r"\bsuna\b": "atlas",
            r"\bKortix\b": "Atlas",
            r"\bkortix\b": "atlas",
            # URLs and domains
            r"Atlas\.so": "atlasagents.ai",
            r"Atlas\.ai": "atlasagents.ai",
            # Social handles
            r"@atlasagents_ai": "@atlasagents_ai",
            r"Atlas-ai": "atlas-ai",
            r"atlasagents_ai": "atlasagents_ai",
            # GitHub organizations
            r"github\.com/Atlas-ai": "github.com/atlas-ai",
            # LinkedIn
            r"linkedin\.com/company/Atlas": "linkedin.com/company/atlas-ai",
            # Descriptions
            r"Atlas AI": "The Generalist AI Agents",
            r"Atlas Team": "Atlas Team",
        }

        # Validate paths
        if not self.suna_root.exists():
            raise FileNotFoundError(f"Atlas repository not found: {suna_root}")
        if not self.atlas_root.exists():
            raise FileNotFoundError(f"Atlas repository not found: {atlas_root}")

    def log(self, message: str, level: str = "INFO"):
        """Log messages with color coding"""
        colors = {
            "INFO": "\033[94m",  # Blue
            "SUCCESS": "\033[92m",  # Green
            "WARNING": "\033[93m",  # Yellow
            "ERROR": "\033[91m",  # Red
            "RESET": "\033[0m",  # Reset
        }
        print(f"{colors.get(level, '')}{level}: {message}{colors['RESET']}")

    def replace_text_in_file(self, file_path: Path, replacements: dict) -> bool:
        """Replace text in a file with multiple replacements"""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            original_content = content
            for old_text, new_text in replacements.items():
                content = re.sub(old_text, new_text, content, flags=re.IGNORECASE)

            if content != original_content:
                if not self.dry_run:
                    with open(file_path, "w", encoding="utf-8") as f:
                        f.write(content)
                return True
            return False
        except Exception as e:
            self.log(f"Error processing {file_path}: {e}", "ERROR")
            return False

    def comprehensive_rebrand(self) -> bool:
        """Replace all Atlas/Atlas branding with Atlas throughout the repository"""
        self.log("=== COMPREHENSIVE REBRANDING ===", "INFO")
        self.log("Replacing all Atlas/Atlas references with Atlas", "INFO")

        # File extensions to process
        text_extensions = {
            ".py",
            ".ts",
            ".tsx",
            ".js",
            ".jsx",
            ".json",
            ".md",
            ".txt",
            ".yml",
            ".yaml",
            ".toml",
            ".cfg",
            ".ini",
        }

        files_changed = 0
        total_files = 0

        # Process all text files in the repository
        for file_path in self.suna_root.rglob("*"):
            if file_path.is_file() and file_path.suffix in text_extensions:
                # Skip certain directories
                if any(
                    skip in str(file_path)
                    for skip in [".git", "node_modules", "__pycache__", ".next"]
                ):
                    continue

                total_files += 1
                if self.replace_text_in_file(file_path, self.branding_replacements):
                    files_changed += 1
                    self.log(
                        f"Updated: {file_path.relative_to(self.suna_root)}", "SUCCESS"
                    )

        self.log(
            f"Processed {total_files} files, updated {files_changed} files", "INFO"
        )

        if files_changed > 0:
            self.changes_applied.append(f"rebranded {files_changed} files")
            return True
        return False

    def show_diff(self, file1: Path, file2: Path, context_lines: int = 3) -> str:
        """Generate and display a unified diff between two files"""
        try:
            with open(file1, "r", encoding="utf-8") as f1, open(
                file2, "r", encoding="utf-8"
            ) as f2:
                diff = list(
                    difflib.unified_diff(
                        f1.readlines(),
                        f2.readlines(),
                        fromfile=str(file1),
                        tofile=str(file2),
                        n=context_lines,
                    )
                )
                return "".join(diff)
        except Exception as e:
            return f"Error generating diff: {e}"

    def prompt_user(self, message: str, default: str = "n") -> bool:
        """Prompt user for yes/no confirmation"""
        if not self.interactive:
            return default.lower() == "y"

        response = input(f"{message} [y/N]: ").strip().lower()
        return response in ["y", "yes"]

    def merge_globals_css(self) -> bool:
        """Merge globals.css changes"""
        suna_css = self.suna_root / "frontend/src/app/globals.css"
        atlas_css = self.atlas_root / "frontend/src/app/globals.css"

        if not atlas_css.exists():
            self.log("Atlas globals.css not found", "WARNING")
            return False

        self.log("=== GLOBALS.CSS CHANGES ===", "INFO")
        diff = self.show_diff(suna_css, atlas_css)
        print(diff[:2000] + "..." if len(diff) > 2000 else diff)

        if self.prompt_user("Apply globals.css changes?"):
            if not self.dry_run:
                shutil.copy2(atlas_css, suna_css)
                self.changes_applied.append("globals.css")
            self.log("Applied globals.css changes", "SUCCESS")
            return True
        return False

    def merge_package_json(self) -> bool:
        """Merge package.json dependencies selectively"""
        suna_pkg = self.suna_root / "frontend/package.json"
        atlas_pkg = self.atlas_root / "frontend/package.json"

        if not atlas_pkg.exists():
            self.log("Atlas package.json not found", "WARNING")
            return False

        self.log("=== PACKAGE.JSON CHANGES ===", "INFO")

        # Load both package.json files
        with open(suna_pkg, "r") as f:
            suna_data = json.load(f)
        with open(atlas_pkg, "r") as f:
            atlas_data = json.load(f)

        # Show dependency differences
        suna_deps = set(suna_data.get("dependencies", {}).keys())
        atlas_deps = set(atlas_data.get("dependencies", {}).keys())

        added_deps = atlas_deps - suna_deps
        removed_deps = suna_deps - atlas_deps

        if added_deps:
            self.log(f"New dependencies in Atlas: {', '.join(added_deps)}", "INFO")
        if removed_deps:
            self.log(
                f"Dependencies removed in Atlas: {', '.join(removed_deps)}", "WARNING"
            )

        if self.prompt_user("Apply package.json changes?"):
            if not self.dry_run:
                shutil.copy2(atlas_pkg, suna_pkg)
                self.changes_applied.append("package.json")
            self.log("Applied package.json changes", "SUCCESS")
            return True
        return False

    def merge_site_config(self) -> bool:
        """Apply Atlas site configuration"""
        suna_site = self.suna_root / "frontend/src/lib/site.ts"
        atlas_site = self.atlas_root / "frontend/src/lib/site.ts"

        if not atlas_site.exists():
            self.log("Atlas site.ts not found", "WARNING")
            return False

        self.log("=== APPLYING ATLAS SITE CONFIG ===", "INFO")

        if self.prompt_user("Apply Atlas site configuration?"):
            if not self.dry_run:
                shutil.copy2(atlas_site, suna_site)
                self.changes_applied.append("site.ts (Atlas branding)")
            self.log("Applied Atlas site configuration", "SUCCESS")
            return True

        return False

    def merge_layout_tsx(self) -> bool:
        """Merge layout.tsx with branding options"""
        suna_layout = self.suna_root / "frontend/src/app/layout.tsx"
        atlas_layout = self.atlas_root / "frontend/src/app/layout.tsx"

        if not atlas_layout.exists():
            self.log("Atlas layout.tsx not found", "WARNING")
            return False

        self.log("=== LAYOUT.TSX CHANGES ===", "INFO")
        diff = self.show_diff(suna_layout, atlas_layout)
        print(diff[:1500] + "..." if len(diff) > 1500 else diff)

        if self.prompt_user("Apply layout.tsx changes (includes branding)?"):
            if not self.dry_run:
                shutil.copy2(atlas_layout, suna_layout)
                self.changes_applied.append("layout.tsx")
            self.log("Applied layout.tsx changes", "SUCCESS")
            return True
        return False

    def merge_assets(self) -> bool:
        """Merge public assets"""
        suna_public = self.suna_root / "frontend/public"
        atlas_public = self.atlas_root / "frontend/public"

        if not atlas_public.exists():
            self.log("Atlas public directory not found", "WARNING")
            return False

        self.log("=== PUBLIC ASSETS ===", "INFO")
        atlas_files = list(atlas_public.glob("*"))

        for file in atlas_files:
            if file.is_file():
                self.log(f"Atlas asset: {file.name}", "INFO")

        if self.prompt_user("Copy Atlas assets to public directory?"):
            if not self.dry_run:
                for file in atlas_files:
                    if file.is_file():
                        dest = suna_public / file.name
                        shutil.copy2(file, dest)
                self.changes_applied.append("public assets")
            self.log("Copied Atlas assets", "SUCCESS")
            return True
        return False

    def merge_components_json(self) -> bool:
        """Merge components.json configuration"""
        suna_comp = self.suna_root / "frontend/components.json"
        atlas_comp = self.atlas_root / "frontend/components.json"

        if not atlas_comp.exists():
            self.log("Atlas components.json not found", "WARNING")
            return False

        # Check if files are different
        if suna_comp.exists():
            diff = self.show_diff(suna_comp, atlas_comp)
            if not diff.strip():
                self.log("components.json files are identical", "INFO")
                return False

            self.log("=== COMPONENTS.JSON CHANGES ===", "INFO")
            print(diff)

            if self.prompt_user("Apply components.json changes?"):
                if not self.dry_run:
                    shutil.copy2(atlas_comp, suna_comp)
                    self.changes_applied.append("components.json")
                self.log("Applied components.json changes", "SUCCESS")
                return True
        else:
            if self.prompt_user("Copy Atlas components.json?"):
                if not self.dry_run:
                    shutil.copy2(atlas_comp, suna_comp)
                    self.changes_applied.append("components.json")
                self.log("Copied components.json", "SUCCESS")
                return True
        return False

    def selective_component_merge(self) -> bool:
        """Update existing components only - no new components added"""
        atlas_components = self.atlas_root / "frontend/src/components"
        suna_components = self.suna_root / "frontend/src/components"

        if not atlas_components.exists():
            self.log("Atlas components directory not found", "WARNING")
            return False

        self.log("=== EXISTING COMPONENT UPDATE ANALYSIS ===", "INFO")
        self.log("Only updating components that already exist in Atlas", "INFO")

        # Find only existing components that have been modified
        existing_modified_components = []

        for atlas_comp in atlas_components.rglob("*.tsx"):
            rel_path = atlas_comp.relative_to(atlas_components)
            suna_comp = suna_components / rel_path

            # Only process if component exists in Atlas
            if suna_comp.exists():
                # Check if significantly different
                diff = self.show_diff(suna_comp, atlas_comp)
                if (
                    len(diff.strip()) > 100
                ):  # Arbitrary threshold for meaningful changes
                    existing_modified_components.append(rel_path)

        if not existing_modified_components:
            self.log("No existing components have significant changes", "INFO")
            return False

        self.log(
            f"Existing components with updates: {len(existing_modified_components)}",
            "INFO",
        )
        for comp in existing_modified_components[:10]:  # Show first 10
            self.log(f"  - {comp}", "INFO")
        if len(existing_modified_components) > 10:
            self.log(f"  ... and {len(existing_modified_components) - 10} more", "INFO")

        if self.prompt_user("Review and update existing components individually?"):
            return self._update_existing_components(existing_modified_components)

        return False

    def _update_existing_components(self, existing_modified_components: List) -> bool:
        """Update existing components only - interactive review"""
        updated_any = False

        self.log(
            f"\nReviewing {len(existing_modified_components)} existing components...",
            "INFO",
        )

        for i, comp in enumerate(existing_modified_components, 1):
            atlas_comp = self.atlas_root / "frontend/src/components" / comp
            suna_comp = self.suna_root / "frontend/src/components" / comp

            print(f"\n{'='*80}")
            self.log(
                f"[{i}/{len(existing_modified_components)}] UPDATING EXISTING COMPONENT: {comp}",
                "INFO",
            )
            print(f"{'='*80}")

            # Show the diff
            diff = self.show_diff(suna_comp, atlas_comp)

            # Truncate very long diffs for readability
            if len(diff) > 2000:
                lines = diff.split("\n")
                if len(lines) > 50:
                    truncated_diff = (
                        "\n".join(lines[:25])
                        + "\n\n... [DIFF TRUNCATED - showing first 25 lines] ...\n\n"
                        + "\n".join(lines[-25:])
                    )
                    print(truncated_diff)
                else:
                    print(diff[:2000] + "\n\n... [TRUNCATED] ...")
            else:
                print(diff)

            # Prompt for this specific component
            choice = (
                input(f"\nUpdate {comp}? [y]es/[n]o/[s]kip remaining/[q]uit: ")
                .strip()
                .lower()
            )

            if choice in ["y", "yes"]:
                if not self.dry_run:
                    shutil.copy2(atlas_comp, suna_comp)
                    self.changes_applied.append(f"updated component: {comp}")
                self.log(f"✓ Updated {comp}", "SUCCESS")
                updated_any = True

            elif choice in ["s", "skip"]:
                self.log("Skipping remaining components", "INFO")
                break

            elif choice in ["q", "quit"]:
                self.log("Quitting component update process", "INFO")
                break

            else:
                self.log(f"Skipped {comp}", "INFO")

        return updated_any

    def merge_landing_page(self) -> bool:
        """Merge Atlas landing page UI while preserving Atlas functionality"""
        self.log("=== LANDING PAGE UI MERGE ===", "INFO")
        self.log("Merging Atlas landing page UI components", "INFO")

        # Define landing page paths to merge
        landing_page_paths = [
            "frontend/src/app/(home)",
            "frontend/src/components/home",
        ]

        merged_any = False

        for path in landing_page_paths:
            atlas_path = self.atlas_root / path
            suna_path = self.suna_root / path

            if not atlas_path.exists():
                self.log(f"Atlas path not found: {path}", "WARNING")
                continue

            self.log(f"Processing landing page path: {path}", "INFO")

            if self.prompt_user(f"Merge Atlas landing page from {path}?"):
                if not self.dry_run:
                    if suna_path.exists():
                        # Remove existing Atlas landing page
                        if suna_path.is_dir():
                            shutil.rmtree(suna_path)
                        else:
                            suna_path.unlink()

                    # Copy Atlas landing page
                    if atlas_path.is_dir():
                        shutil.copytree(atlas_path, suna_path)
                    else:
                        suna_path.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(atlas_path, suna_path)

                    self.changes_applied.append(f"landing page: {path}")
                    merged_any = True

                self.log(f"✓ Merged landing page: {path}", "SUCCESS")

        return merged_any

    def merge_auth_pages(self) -> bool:
        """Merge Atlas auth pages UI while preserving Atlas functionality"""
        self.log("=== AUTH PAGES UI MERGE ===", "INFO")
        self.log("Merging Atlas auth page UI components", "INFO")

        # Define auth page paths to merge
        auth_page_paths = [
            "frontend/src/app/auth",
        ]

        # Also check for individual auth-related components
        auth_component_files = [
            "frontend/src/components/header-auth.tsx",
            "frontend/src/components/AuthProvider.tsx",
            "frontend/src/components/GoogleSignIn.tsx",
        ]

        merged_any = False

        for path in auth_page_paths:
            atlas_path = self.atlas_root / path
            suna_path = self.suna_root / path

            if not atlas_path.exists():
                self.log(f"Atlas auth path not found: {path}", "WARNING")
                continue

            self.log(f"Processing auth page path: {path}", "INFO")

            if self.prompt_user(f"Merge Atlas auth pages from {path}?"):
                if not self.dry_run:
                    if suna_path.exists():
                        # Remove existing Atlas auth pages
                        if suna_path.is_dir():
                            shutil.rmtree(suna_path)
                        else:
                            suna_path.unlink()

                    # Copy Atlas auth pages
                    if atlas_path.is_dir():
                        shutil.copytree(atlas_path, suna_path)
                    else:
                        suna_path.parent.mkdir(parents=True, exist_ok=True)
                        shutil.copy2(atlas_path, suna_path)

                    self.changes_applied.append(f"auth pages: {path}")
                    merged_any = True

                self.log(f"✓ Merged auth pages: {path}", "SUCCESS")

        # Handle individual auth component files
        for file_path in auth_component_files:
            atlas_file = self.atlas_root / file_path
            suna_file = self.suna_root / file_path

            if not atlas_file.exists():
                continue

            self.log(f"Processing auth component: {file_path}", "INFO")

            if self.prompt_user(f"Merge Atlas auth component {atlas_file.name}?"):
                if not self.dry_run:
                    suna_file.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(atlas_file, suna_file)
                    self.changes_applied.append(f"auth component: {file_path}")
                    merged_any = True

                self.log(f"✓ Merged auth component: {atlas_file.name}", "SUCCESS")

        return merged_any

    def run_merge(self) -> None:
        """Run the complete merge process"""
        self.log("🚀 Starting Atlas → Atlas merge process", "INFO")
        self.log(f"Atlas root: {self.suna_root}", "INFO")
        self.log(f"Atlas root: {self.atlas_root}", "INFO")
        self.log(f"Dry run: {self.dry_run}", "INFO")

        if self.dry_run:
            self.log("DRY RUN MODE - No changes will be applied", "WARNING")

        print("\n" + "=" * 60)

        # Run merge operations
        merge_operations = [
            ("Comprehensive Rebranding", self.comprehensive_rebrand),
            ("Landing Page UI", self.merge_landing_page),
            ("Auth Pages UI", self.merge_auth_pages),
            ("Design System (globals.css)", self.merge_globals_css),
            ("Dependencies (package.json)", self.merge_package_json),
            ("Site Configuration", self.merge_site_config),
            ("Layout & Metadata", self.merge_layout_tsx),
            ("Component Configuration", self.merge_components_json),
            ("Public Assets", self.merge_assets),
            ("Existing Components Update", self.selective_component_merge),
        ]

        for name, operation in merge_operations:
            print(f"\n{'='*60}")
            self.log(f"Processing: {name}", "INFO")
            try:
                operation()
            except Exception as e:
                self.log(f"Error in {name}: {e}", "ERROR")
                if self.prompt_user("Continue with next operation?"):
                    continue
                else:
                    break

        # Summary
        print(f"\n{'='*60}")
        self.log("🎉 Merge process completed!", "SUCCESS")

        if self.changes_applied:
            self.log("Changes applied:", "SUCCESS")
            for change in self.changes_applied:
                self.log(f"  ✓ {change}", "SUCCESS")
        else:
            self.log("No changes were applied", "INFO")

        if not self.dry_run and self.changes_applied:
            self.log("Next steps:", "INFO")
            self.log("1. Test your application", "INFO")
            self.log("2. Run 'npm install' if package.json was updated", "INFO")
            self.log("3. Commit changes when satisfied", "INFO")


def main():
    parser = argparse.ArgumentParser(
        description="Merge Atlas changes into Atlas repository"
    )
    parser.add_argument("--Atlas-root", default=".", help="Path to Atlas repository root")
    parser.add_argument(
        "--atlas-root",
        default="~/Documents/GitHub/Atlas",
        help="Path to Atlas repository root",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be changed without applying",
    )
    parser.add_argument(
        "--non-interactive",
        action="store_true",
        help="Run without prompting (uses defaults)",
    )

    args = parser.parse_args()

    # Expand user path
    atlas_root = os.path.expanduser(args.atlas_root)

    try:
        merger = AtlasMerger(
            suna_root=args.suna_root,
            atlas_root=atlas_root,
            dry_run=args.dry_run,
            interactive=not args.non_interactive,
        )
        merger.run_merge()
    except Exception as e:
        print(f"\033[91mERROR: {e}\033[0m")
        sys.exit(1)


if __name__ == "__main__":
    main()
