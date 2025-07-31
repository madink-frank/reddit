# Visual Regression Testing Guide

This document provides comprehensive guidance on the visual regression testing system implemented for the Reddit Content Platform admin dashboard.

## Overview

Visual regression testing helps ensure that UI changes don't introduce unintended visual changes. Our testing system includes:

1. **Component Snapshot Tests** - Unit-level visual testing of individual components
2. **Accessibility Regression Tests** - Automated accessibility validation
3. **Responsive Design Tests** - Cross-viewport testing for responsive behavior
4. **End-to-End Visual Tests** - Full application visual testing with Playwright

## Test Structure

### 1. Component Snapshot Tests (`visual-regression.test.tsx`)

Tests individual components in isolation with various props and states:

```typescript
// Example test
it('should render primary button consistently', () => {
  const { container } = render(
    <TestWrapper>
      <Button variant="primary" size="md">
        Primary Button
      </Button>
    </TestWrapper>
  )
  expect(container.firstChild).toMatchSnapshot()
})
```

**Covered Components:**
- StatCard (default, loading, decrease states)
- Button (all variants, loading, disabled, with icons)
- Form components (Input, Select with various states)
- Loading components (Skeleton, Spinner, ProgressBar)
- Status indicators (healthy, warning, error states)
- Icons (various sizes and states)
- Theme components
- Modal components
- Accessibility components

### 2. Accessibility Regression Tests (`accessibility-regression.test.tsx`)

Automated accessibility testing using jest-axe:

```typescript
// Example accessibility test
it('should have no accessibility violations in StatCard', async () => {
  const { container } = render(<StatCard {...props} />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

**Test Categories:**
- WCAG compliance validation
- Color contrast verification
- ARIA labels and roles validation
- Keyboard navigation testing
- Focus management verification
- Screen reader compatibility

### 3. Responsive Design Tests (`responsive-regression.test.tsx`)

Cross-viewport testing for responsive behavior:

```typescript
// Example responsive test
Object.entries(viewports).forEach(([viewportName, { width, height }]) => {
  it(`should render correctly on ${viewportName}`, () => {
    setViewport(width, height)
    const { container } = render(<Component />)
    expect(container.firstChild).toMatchSnapshot(`component-${viewportName}`)
  })
})
```

**Tested Viewports:**
- Mobile (375x667)
- Tablet (768x1024)
- Desktop (1024x768)
- Large Desktop (1440x900)
- Ultra Wide (1920x1080)

### 4. End-to-End Visual Tests (`visual-regression.spec.ts`)

Full application testing with Playwright:

```typescript
// Example E2E visual test
test('should render dashboard correctly on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto('/dashboard')
  await expect(page).toHaveScreenshot('dashboard-mobile.png')
})
```

**Test Scenarios:**
- Login page rendering
- Dashboard layouts
- Component interactions (hover, focus)
- Form validation states
- Theme switching
- Loading and error states
- Accessibility features

## Running Tests

### Individual Test Suites

```bash
# Component snapshot tests
npm run test:visual

# Accessibility regression tests
npm run test:visual:accessibility

# Responsive design tests
npm run test:visual:responsive

# End-to-end visual tests
npm run test:visual:e2e

# Run all visual tests
npm run test:visual:all
```

### Updating Snapshots

When intentional visual changes are made:

```bash
# Update component snapshots
npm run test:visual:update

# Update E2E screenshots
npm run test:visual:e2e -- --update-snapshots
```

## Test Configuration

### Viewport Configurations

```typescript
const viewports = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1024, height: 768 },
  largeDesktop: { width: 1440, height: 900 },
  ultraWide: { width: 1920, height: 1080 },
}
```

### Accessibility Rules

```typescript
const accessibilityRules = {
  'color-contrast': { enabled: true },
  'color-contrast-enhanced': { enabled: true },
  'focus-order-semantics': { enabled: true },
  'focusable-content': { enabled: true },
  'tabindex': { enabled: true },
  'aria-allowed-attr': { enabled: true },
  'aria-required-attr': { enabled: true },
  'aria-valid-attr-value': { enabled: true },
  'aria-valid-attr': { enabled: true },
  'role-img-alt': { enabled: true },
}
```

## Best Practices

### 1. Component Testing

- Test all component variants and states
- Include loading and error states
- Test with different prop combinations
- Ensure consistent styling across themes

### 2. Accessibility Testing

- Test with screen readers in mind
- Verify keyboard navigation
- Check color contrast ratios
- Validate ARIA labels and roles

### 3. Responsive Testing

- Test all major breakpoints
- Verify touch-friendly interfaces on mobile
- Check layout integrity across viewports
- Test component behavior at viewport boundaries

### 4. E2E Testing

- Test real user interactions
- Include authentication flows
- Test error scenarios
- Verify loading states

## Troubleshooting

### Common Issues

1. **Snapshot Mismatches**
   - Review changes carefully
   - Update snapshots if changes are intentional
   - Check for timing issues in async components

2. **Accessibility Violations**
   - Review WCAG guidelines
   - Add missing ARIA labels
   - Fix color contrast issues
   - Ensure proper focus management

3. **Responsive Issues**
   - Check CSS media queries
   - Verify Tailwind responsive classes
   - Test component behavior at breakpoints

4. **E2E Test Failures**
   - Check for timing issues
   - Verify selectors are correct
   - Ensure test data is consistent

### Debugging Tips

```bash
# Run tests in watch mode
npm run test:visual -- --watch

# Run specific test file
npm run test:visual -- visual-regression.test.tsx

# Run with verbose output
npm run test:visual -- --verbose

# Debug E2E tests
npm run test:visual:e2e -- --debug
```

## Continuous Integration

### GitHub Actions Integration

```yaml
- name: Run Visual Regression Tests
  run: |
    npm run test:visual:all
    
- name: Upload Screenshots
  uses: actions/upload-artifact@v3
  if: failure()
  with:
    name: screenshots
    path: test-results/
```

### Pre-commit Hooks

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm run test:visual && lint-staged"
    }
  }
}
```

## Maintenance

### Regular Tasks

1. **Review and Update Snapshots**
   - After intentional design changes
   - When adding new components
   - During major refactoring

2. **Accessibility Audits**
   - Run accessibility tests regularly
   - Update ARIA labels as needed
   - Review color contrast ratios

3. **Responsive Testing**
   - Test on new device sizes
   - Update viewport configurations
   - Verify touch interactions

4. **Performance Monitoring**
   - Monitor test execution time
   - Optimize slow tests
   - Update test configurations

## Resources

- [Jest Snapshot Testing](https://jestjs.io/docs/snapshot-testing)
- [jest-axe Documentation](https://github.com/nickcolley/jest-axe)
- [Playwright Visual Testing](https://playwright.dev/docs/test-screenshots)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Responsive Design Testing](https://web.dev/responsive-web-design-basics/)

## Contributing

When adding new components or features:

1. Add component snapshot tests
2. Include accessibility tests
3. Test responsive behavior
4. Add E2E tests for user flows
5. Update documentation
6. Review test coverage

For questions or issues, please refer to the development team or create an issue in the project repository.