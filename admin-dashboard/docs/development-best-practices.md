# Development Best Practices - Admin Dashboard

## Import Best Practices

### Case Sensitivity Guidelines

**Critical Rule**: Always match import paths exactly to file names, including case sensitivity.

#### UI Components Import Patterns

**Components with Lowercase Files:**
```typescript
// File: card.tsx
import { Card, CardContent, CardHeader } from '../ui/card';

// File: label.tsx
import { Label } from '../ui/label';

// File: dialog.tsx
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
```

**Components with PascalCase Files:**
```typescript
// File: Button.tsx
import { Button } from '../ui/Button';

// File: Input.tsx
import { Input } from '../ui/Input';

// File: Select.tsx
import { Select, SelectContent, SelectItem } from '../ui/Select';
```

### Pre-Development Checklist

Before writing any imports:
- [ ] Verify the actual file name in the file system
- [ ] Check existing import patterns for similar components
- [ ] Use IDE autocomplete to ensure correct casing
- [ ] Run TypeScript compilation to verify imports

### Common Import Patterns

#### Relative Imports (Preferred for local components)
```typescript
// From component to UI component
import { Button } from '../ui/Button';
import { Card } from '../ui/card';

// From page to component
import { DashboardHeader } from '../components/dashboard/DashboardHeader';
```

#### Absolute Imports (For utilities and services)
```typescript
// Services
import { authService } from '@/services/authService';

// Utils
import { formatDate } from '@/utils/dateUtils';

// Types
import type { User } from '@/types/user';
```

### TypeScript Configuration

Ensure your development environment includes:

```json
// tsconfig.json
{
  "compilerOptions": {
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "strict": true
  }
}
```

### IDE Configuration

#### VS Code Settings
Add to your workspace `.vscode/settings.json`:

```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  },
  "files.watcherExclude": {
    "**/node_modules/**": true
  }
}
```

### Automated Checks

#### Pre-commit Hook
```bash
#!/bin/sh
# Check TypeScript compilation before commit
npx tsc --noEmit --forceConsistentCasingInFileNames
```

#### Package.json Scripts
```json
{
  "scripts": {
    "type-check": "tsc --noEmit --forceConsistentCasingInFileNames",
    "lint:imports": "eslint src/ --ext .ts,.tsx --config .eslintrc.import-case-sensitivity.json"
  }
}
```

## Component Development Guidelines

### File Naming Conventions

#### UI Components (`src/components/ui/`)
- **Complex/Interactive**: PascalCase (Button.tsx, Input.tsx, Select.tsx)
- **Simple/Structural**: lowercase (card.tsx, label.tsx, dialog.tsx)

#### Feature Components
- **All components**: PascalCase (DashboardHeader.tsx, UserProfile.tsx)

#### Utilities and Services
- **All files**: camelCase (apiClient.ts, authService.ts)

### Export Patterns

#### Named Exports (Preferred)
```typescript
// Button.tsx
export const Button = ({ children, ...props }) => {
  return <button {...props}>{children}</button>;
};

export const ButtonGroup = ({ children }) => {
  return <div className="button-group">{children}</div>;
};
```

#### Default Exports (Use sparingly)
```typescript
// Only for single-purpose components
export default function LoginPage() {
  return <div>Login Page</div>;
}
```

### Import Organization

Order imports in this sequence:
1. React and external libraries
2. Internal utilities and services
3. Components (from most general to most specific)
4. Types and interfaces
5. Styles

```typescript
// 1. External libraries
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Internal utilities/services
import { apiClient } from '@/services/apiClient';
import { formatDate } from '@/utils/dateUtils';

// 3. Components
import { Button } from '../ui/Button';
import { Card } from '../ui/card';
import { DashboardHeader } from './DashboardHeader';

// 4. Types
import type { User, ApiResponse } from '@/types';

// 5. Styles
import './ComponentName.css';
```

## Testing Best Practices

### Import Testing
Always test that your imports work correctly:

```bash
# Check TypeScript compilation
npm run type-check

# Run linting on imports
npm run lint:imports

# Full build test
npm run build
```

### Component Testing
```typescript
// Test imports in your test files
import { render, screen } from '@testing-library/react';
import { Button } from '../ui/Button'; // Verify import works

describe('Button Component', () => {
  it('renders correctly', () => {
    render(<Button>Test</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
```

## Troubleshooting Import Issues

### Common Problems and Solutions

#### "Cannot find module" Error
```
Error: Cannot find module '../ui/button'
```
**Solution**: Check the actual file name and match exactly:
```typescript
// If file is Button.tsx
import { Button } from '../ui/Button'; // ✅ Correct

// If file is button.tsx  
import { Button } from '../ui/button'; // ✅ Correct
```

#### Case Sensitivity on Different OS
**Problem**: Code works on macOS/Windows but fails on Linux
**Solution**: Always use `forceConsistentCasingInFileNames` in TypeScript config

#### Auto-import Generates Wrong Case
**Problem**: IDE auto-import creates incorrect casing
**Solution**: 
1. Configure IDE settings properly
2. Always verify auto-generated imports
3. Use manual imports for critical components

### Debugging Commands

```bash
# Find all imports of a specific component
grep -r "from.*Button" src/ --include="*.tsx" --include="*.ts"

# Check for potential case issues
find src/ -name "*.tsx" -o -name "*.ts" | xargs grep -l "from.*ui/"

# Verify TypeScript compilation
npx tsc --noEmit --forceConsistentCasingInFileNames --listFiles
```

## Code Review Guidelines

### Import Review Checklist
- [ ] All import paths match actual file names exactly
- [ ] Imports follow established naming patterns
- [ ] No case sensitivity mismatches
- [ ] TypeScript compilation passes
- [ ] Imports are organized properly
- [ ] No unused imports

### Review Focus Areas
1. **New Components**: Verify naming consistency
2. **Refactored Files**: Check all import updates
3. **Cross-platform Compatibility**: Ensure case sensitivity compliance
4. **Performance**: Look for unnecessary imports

---

*This document is part of the TypeScript import case fix implementation*
*Last updated: $(date)*
*Related: typescript-import-case-fix-documentation.md, import-naming-guidelines.md*