# Atlas → Atlas Component Update Script Guide

## 🎯 Overview

The `merge_atlas_changes.py` script provides a **safe, selective way** to update existing components and frontend files from the Atlas repository into your Atlas repository. It focuses on **updating components that already exist** rather than adding new ones, giving you granular control over changes while maintaining your current architecture.

## 🚀 Quick Start

### Basic Usage

```bash
# Interactive mode (recommended for first run)
python merge_atlas_changes.py

# Dry run to see what would change
python merge_atlas_changes.py --dry-run

# Specify custom paths
python merge_atlas_changes.py --atlas-root ~/path/to/atlas --Atlas-root .
```

### Advanced Usage

```bash
# Non-interactive mode (uses defaults)
python merge_atlas_changes.py --non-interactive

# Dry run with custom Atlas path
python merge_atlas_changes.py --dry-run --atlas-root ~/Documents/GitHub/Atlas
```

## 📋 What the Script Does

The script processes these categories in order:

### 1. **Design System (globals.css)**

- Shows diff of CSS changes
- Includes color scheme, typography, animations
- **Impact**: Visual appearance changes

### 2. **Dependencies (package.json)**

- Lists added/removed packages
- Shows version differences
- **Impact**: May require `npm install`

### 3. **Site Configuration (site.ts)**

- Branding changes (name, URLs, social links)
- **Options**: Keep Atlas branding OR switch to Atlas
- **Impact**: Site metadata and branding

### 4. **Layout & Metadata (layout.tsx)**

- Page titles, descriptions, OpenGraph data
- **Impact**: SEO and social sharing

### 5. **Component Configuration (components.json)**

- shadcn/ui configuration
- **Impact**: Component styling and behavior

### 6. **Public Assets**

- Logos, favicons, images
- **Impact**: Visual branding assets

### 7. **Components**

- Interactive review of new/modified components
- **Impact**: UI functionality and appearance

## 🛡️ Safety Features

### Automatic Backups

- Creates `.backup` files before modifying anything
- You can restore with: `mv file.backup file`

### Dry Run Mode

- See exactly what would change
- No files are modified
- Perfect for planning

### Interactive Prompts

- Review each change before applying
- Skip categories you don't want
- Granular control over components

## 📊 Example Output

```
🚀 Starting Atlas → Atlas merge process
INFO: Atlas root: /Users/you/Atlas
INFO: Atlas root: /Users/you/Documents/GitHub/Atlas
INFO: Dry run: False

============================================================
INFO: Processing: Design System (globals.css)
=== GLOBALS.CSS CHANGES ===
--- frontend/src/app/globals.css
+++ /Users/you/Documents/GitHub/Atlas/frontend/src/app/globals.css
@@ -225,20 +225,30 @@
   --foreground: oklch(0 0 0); /* pure black */
...

Apply globals.css changes? [y/N]: y
INFO: Created backup: frontend/src/app/globals.css.backup
SUCCESS: Applied globals.css changes
```

## 🎛️ Decision Points

### Design System

- **Apply**: Get Atlas's clean black/white theme
- **Skip**: Keep your current design system

### Dependencies

- **Apply**: Get new packages (CodeMirror, motion utils, etc.)
- **Skip**: Keep current dependencies
- **Note**: May need to run `npm install` after

### Branding

- **Option 1**: Keep Atlas branding with structural updates
- **Option 2**: Full switch to Atlas branding
- **Option 3**: Skip entirely

### Components

- **Review individually**: See each component diff
- **Skip**: Keep current components

## 🔧 Post-Merge Steps

1. **Test the application**

   ```bash
   npm run dev
   ```

2. **Install new dependencies** (if package.json changed)

   ```bash
   npm install
   ```

3. **Review changes**

   ```bash
   git diff
   ```

4. **Commit when satisfied**
   ```bash
   git add .
   git commit -m "Merge Atlas design system and components"
   ```

## 🆘 Troubleshooting

### Script Errors

- Check that Atlas repository exists at specified path
- Ensure you're in the Atlas repository root
- Verify Python 3.6+ is installed

### Restore from Backup

```bash
# Restore a specific file
mv frontend/src/app/globals.css.backup frontend/src/app/globals.css

# Find all backups
find . -name "*.backup"
```

### Dependency Issues

```bash
# Clear node_modules and reinstall
rm -rf frontend/node_modules frontend/package-lock.json
cd frontend && npm install
```

## 💡 Tips

- **Start with `--dry-run`** to understand changes
- **Use interactive mode** for first-time merging
- **Review diffs carefully** before applying
- **Test thoroughly** after merging
- **Commit incrementally** if doing partial merges

## 🎨 Customization

You can modify the script to:

- Add custom merge logic for specific files
- Change the order of operations
- Add new file types to merge
- Customize diff display options

The script is designed to be readable and extensible!
