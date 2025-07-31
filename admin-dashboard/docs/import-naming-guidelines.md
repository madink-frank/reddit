# Import Naming Guidelines and Best Practices

## Overview

This document establishes guidelines for consistent import naming to prevent TypeScript case sensitivity issues in the admin dashboard project.

## Core Principles

### 1. Exact File Name Matching
**Rule**: Import paths MUST exactly match the actual file names, including case sensitivity.

```typescript
// ✅ Correct - matches Button.tsx
import { Button } from '../ui/Button';

// ❌ Incorrect - doesn't match Button.tsx
import { Button } from '../ui/button';
```

### 2. Consistent Naming Convention
**Rule**: Follow the established naming patterns for each component category.

#### UI Components Naming Patterns:

**Lowercase Components** (simple, single-purpose):
```typescript
// File: card.tsx
import { Card } from '../ui/card';

// File: label.tsx  
import { Label } from '../ui/label';

// File: dialog.tsx
import { Dialog } from '../ui/dialog';
```

**PascalCase Components** (complex, interactive):
```typescript
// File: Button.tsx
import { Button } from '../ui/Button';

// File: Input.tsx
import { Input } from '../ui/Input';

// File: Select.tsx
import { Select } from '../ui/Select';
```

## Development Guidelines

### Before Creating New Components

1. **Check Existing Patterns**: Review similar components to follow established naming
2. **Choose Consistent Naming**: Decide between lowercase or PascalCase based on component complexity
3. **Document the Choice**: Update this guide if introducing new patterns

### Before Writing Imports

1. **Verify File Name**: Check the actual file name in the file system
2. **Match Exactly**: Ensure import path matches file name exactly
3. **Use IDE Autocomplete**: Let your IDE suggest the correct import path

### Code Review Checklist

- [ ] All import paths match actual file names exactly
- [ ] No case sensitivity mismatches
- [ ] Consistent with established patterns
- [ ] TypeScript compilation passes

## Automated Prevention

### ESLint Configuration

Add the following ESLint rules to prevent case sensitivity issues:

```json
{
  "rules": {
    "import/no-unresolved": ["error", { "caseSensitive": true }],
    "import/case-sensitive": "error"
  }
}
```

### TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node"
  }
}
```

### Pre-commit Hooks

Add a pre-commit hook to check TypeScript compilation:

```bash
#!/bin/sh
# .git/hooks/pre-commit
echo "Checking TypeScript compilation..."
npx tsc --noEmit --forceConsistentCasingInFileNames
if [ $? -ne 0 ]; then
  echo "TypeScript compilation failed. Please fix errors before committing."
  exit 1
fi
```

### VS Code Settings

Add to `.vscode/settings.json`:

```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "typescript.suggest.includeAutomaticOptionalChainCompletions": true,
  "files.watcherExclude": {
    "**/.git/objects/**": true,
    "**/node_modules/**": true
  }
}
```

## Common Pitfalls and Solutions

### Pitfall 1: Case-Insensitive File Systems
**Problem**: macOS and Windows file systems are case-insensitive by default, hiding case sensitivity issues.

**Solution**: 
- Always use `--forceConsistentCasingInFileNames` in TypeScript config
- Test on case-sensitive systems (Linux) or use Docker
- Use automated checks in CI/CD pipeline

### Pitfall 2: Auto-Import Inconsistencies
**Problem**: IDE auto-imports might not match actual file names.

**Solution**:
- Configure IDE to respect file name casing
- Always verify auto-generated imports
- Use relative imports for local components

### Pitfall 3: Refactoring File Names
**Problem**: Renaming files without updating all imports.

**Solution**:
- Use IDE refactoring tools instead of manual renaming
- Search for all import references before renaming
- Run TypeScript compilation after any file renames

## File Organization Best Practices

### Directory Structure
```
src/
├── components/
│   ├── ui/           # Reusable UI components
│   │   ├── Button.tsx    # Complex interactive components (PascalCase)
│   │   ├── Input.tsx
│   │   ├── card.tsx      # Simple components (lowercase)
│   │   └── label.tsx
│   ├── dashboard/    # Feature-specific components
│   └── common/       # Shared components
```

### Naming Conventions by Category

#### UI Components (`src/components/ui/`)
- **Interactive/Complex**: PascalCase (Button.tsx, Input.tsx, Select.tsx)
- **Simple/Structural**: lowercase (card.tsx, label.tsx, dialog.tsx)

#### Feature Components (`src/components/dashboard/`, etc.)
- **All components**: PascalCase (DashboardHeader.tsx, StatCard.tsx)

#### Utility Files (`src/utils/`, `src/lib/`)
- **All files**: camelCase (apiClient.ts, formatUtils.ts)

#### Services (`src/services/`)
- **All files**: camelCase (authService.ts, dataService.ts)

## Testing Import Consistency

### Manual Testing Commands

```bash
# Check TypeScript compilation
npx tsc --noEmit --forceConsistentCasingInFileNames

# Search for potential case sensitivity issues
grep -r "from.*ui/" src/ --include="*.tsx" --include="*.ts"

# Find all Button imports
grep -r "from.*Button" src/ --include="*.tsx" --include="*.ts"
```

### Automated Testing Script

Create `scripts/check-imports.js`:

```javascript
const fs = require('fs');
const path = require('path');
const glob = require('glob');

function checkImportConsistency() {
  const files = glob.sync('src/**/*.{ts,tsx}');
  const issues = [];
  
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const importLines = content.match(/import.*from\s+['"]([^'"]+)['"]/g) || [];
    
    importLines.forEach(line => {
      // Check for potential case sensitivity issues
      const match = line.match(/from\s+['"]([^'"]+)['"]/);
      if (match) {
        const importPath = match[1];
        // Add your specific checks here
        if (importPath.includes('/ui/') && importPath !== importPath.toLowerCase() && importPath !== importPath.charAt(0).toUpperCase() + importPath.slice(1)) {
          issues.push({ file, line, importPath });
        }
      }
    });
  });
  
  return issues;
}

const issues = checkImportConsistency();
if (issues.length > 0) {
  console.error('Import consistency issues found:', issues);
  process.exit(1);
} else {
  console.log('All imports are consistent!');
}
```

## Team Guidelines

### For New Team Members
1. Read this document before starting development
2. Configure your IDE according to the settings above
3. Always run TypeScript compilation before committing
4. Ask for code review on import-heavy changes

### For Code Reviews
1. Check that all imports match file names exactly
2. Verify consistency with established patterns
3. Ensure TypeScript compilation passes
4. Look for potential case sensitivity issues

### For Project Maintenance
1. Regularly audit import consistency
2. Update this document when adding new patterns
3. Monitor for case sensitivity issues in CI/CD
4. Keep automated checks up to date

---

*Document created as part of Task 6: Document the fix and create prevention guidelines*
*Requirements addressed: 2.1, 2.4*