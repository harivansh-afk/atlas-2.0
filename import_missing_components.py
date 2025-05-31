#!/usr/bin/env python3
"""
Import Missing Landing Page Components Script
===========================================

This script imports landing page components from Atlas that don't exist in Suna.
It only adds NEW components and never overwrites existing ones.

Key Features:
- Imports ONLY missing components (never overwrites existing)
- Focuses on landing page and home components
- Safe operation - preserves all existing code
- Detailed logging of what gets imported

Usage:
    python import_missing_components.py [options]

Options:
    --dry-run           Show what would be imported without applying
    --atlas-root        Path to Atlas repository (default: ~/Documents/GitHub/Atlas)
    --suna-root         Path to Suna repository (default: current directory)
"""

import os
import sys
import shutil
import argparse
from pathlib import Path
from typing import List, Set

class ComponentImporter:
    def __init__(self, suna_root: str, atlas_root: str, dry_run: bool = False):
        self.suna_root = Path(suna_root)
        self.atlas_root = Path(atlas_root)
        self.dry_run = dry_run
        self.imported_components = []
        
        # Validate paths
        if not self.suna_root.exists():
            raise FileNotFoundError(f"Suna repository not found: {suna_root}")
        if not self.atlas_root.exists():
            raise FileNotFoundError(f"Atlas repository not found: {atlas_root}")
    
    def log(self, message: str, level: str = "INFO"):
        """Log messages with color coding"""
        colors = {
            "INFO": "\033[94m",    # Blue
            "SUCCESS": "\033[92m", # Green
            "WARNING": "\033[93m", # Yellow
            "ERROR": "\033[91m",   # Red
            "RESET": "\033[0m"     # Reset
        }
        print(f"{colors.get(level, '')}{level}: {message}{colors['RESET']}")
    
    def find_missing_components(self) -> List[Path]:
        """Find components that exist in Atlas but not in Suna"""
        missing_components = []
        
        # Define areas to search for landing page components
        search_paths = [
            "frontend/src/components/home",
            "frontend/src/components/ui",
            "frontend/src/components/landing",  # if it exists
            "frontend/src/app/(home)",
        ]
        
        for search_path in search_paths:
            atlas_path = self.atlas_root / search_path
            suna_path = self.suna_root / search_path
            
            if not atlas_path.exists():
                continue
            
            self.log(f"Scanning: {search_path}", "INFO")
            
            # Find all component files in Atlas
            for atlas_file in atlas_path.rglob("*"):
                if atlas_file.is_file() and atlas_file.suffix in {'.tsx', '.ts', '.jsx', '.js'}:
                    # Calculate relative path from the search path
                    rel_path = atlas_file.relative_to(atlas_path)
                    suna_file = suna_path / rel_path
                    
                    # If file doesn't exist in Suna, it's missing
                    if not suna_file.exists():
                        missing_components.append({
                            'atlas_file': atlas_file,
                            'suna_file': suna_file,
                            'relative_path': search_path + "/" + str(rel_path)
                        })
        
        return missing_components
    
    def import_missing_components(self) -> bool:
        """Import all missing components from Atlas to Suna"""
        self.log("=== IMPORTING MISSING LANDING PAGE COMPONENTS ===", "INFO")
        
        missing_components = self.find_missing_components()
        
        if not missing_components:
            self.log("No missing components found - all components already exist!", "INFO")
            return False
        
        self.log(f"Found {len(missing_components)} missing components:", "INFO")
        for comp in missing_components:
            self.log(f"  - {comp['relative_path']}", "INFO")
        
        if self.dry_run:
            self.log("DRY RUN - Would import the above components", "WARNING")
            return True
        
        # Import each missing component
        imported_count = 0
        for comp in missing_components:
            try:
                # Create parent directories if they don't exist
                comp['suna_file'].parent.mkdir(parents=True, exist_ok=True)
                
                # Copy the component file
                shutil.copy2(comp['atlas_file'], comp['suna_file'])
                
                self.log(f"✓ Imported: {comp['relative_path']}", "SUCCESS")
                self.imported_components.append(comp['relative_path'])
                imported_count += 1
                
            except Exception as e:
                self.log(f"✗ Failed to import {comp['relative_path']}: {e}", "ERROR")
        
        self.log(f"Successfully imported {imported_count} components", "SUCCESS")
        return imported_count > 0
    
    def find_missing_dependencies(self) -> Set[str]:
        """Analyze imported components for potential missing dependencies"""
        missing_deps = set()
        
        for comp_path in self.imported_components:
            comp_file = self.suna_root / comp_path
            
            if not comp_file.exists():
                continue
            
            try:
                with open(comp_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Look for common import patterns that might be missing
                import_patterns = [
                    'framer-motion',
                    'lucide-react',
                    '@radix-ui',
                    'react-icons',
                    'next/image',
                    'next/link',
                ]
                
                for pattern in import_patterns:
                    if pattern in content and 'import' in content:
                        missing_deps.add(pattern)
                        
            except Exception as e:
                self.log(f"Warning: Could not analyze {comp_path}: {e}", "WARNING")
        
        return missing_deps
    
    def run_import(self) -> None:
        """Run the complete import process"""
        self.log("🚀 Starting missing component import process", "INFO")
        self.log(f"Suna root: {self.suna_root}", "INFO")
        self.log(f"Atlas root: {self.atlas_root}", "INFO")
        self.log(f"Dry run: {self.dry_run}", "INFO")
        
        print("\n" + "="*60)
        
        # Import missing components
        imported_any = self.import_missing_components()
        
        if imported_any and not self.dry_run:
            # Analyze for potential missing dependencies
            self.log("\n=== DEPENDENCY ANALYSIS ===", "INFO")
            missing_deps = self.find_missing_dependencies()
            
            if missing_deps:
                self.log("Imported components may require these dependencies:", "WARNING")
                for dep in sorted(missing_deps):
                    self.log(f"  - {dep}", "WARNING")
                self.log("Consider running: npm install <package-name>", "INFO")
            else:
                self.log("No obvious missing dependencies detected", "INFO")
        
        # Summary
        print(f"\n{'='*60}")
        self.log("🎉 Import process completed!", "SUCCESS")
        
        if self.imported_components:
            self.log("Components imported:", "SUCCESS")
            for comp in self.imported_components:
                self.log(f"  ✓ {comp}", "SUCCESS")
        else:
            self.log("No new components were imported", "INFO")
        
        if not self.dry_run and self.imported_components:
            self.log("Next steps:", "INFO")
            self.log("1. Check for any TypeScript errors", "INFO")
            self.log("2. Install any missing dependencies if needed", "INFO")
            self.log("3. Test the landing page", "INFO")
            self.log("4. Commit the new components", "INFO")


def main():
    parser = argparse.ArgumentParser(description="Import missing landing page components from Atlas")
    parser.add_argument("--suna-root", default=".", help="Path to Suna repository root")
    parser.add_argument("--atlas-root", default="~/Documents/GitHub/Atlas", 
                       help="Path to Atlas repository root")
    parser.add_argument("--dry-run", action="store_true", 
                       help="Show what would be imported without applying")
    
    args = parser.parse_args()
    
    # Expand user path
    atlas_root = os.path.expanduser(args.atlas_root)
    
    try:
        importer = ComponentImporter(
            suna_root=args.suna_root,
            atlas_root=atlas_root,
            dry_run=args.dry_run
        )
        importer.run_import()
    except Exception as e:
        print(f"\033[91mERROR: {e}\033[0m")
        sys.exit(1)


if __name__ == "__main__":
    main()
