/**
 * Color Accessibility Utilities
 * Provides tools for ensuring color accessibility compliance
 */

// WCAG 2.1 contrast ratio requirements
export const CONTRAST_RATIOS = {
  AA_NORMAL: 4.5,
  AA_LARGE: 3,
  AAA_NORMAL: 7,
  AAA_LARGE: 4.5,
} as const;

// Color contrast calculation utilities
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

export function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  isLargeText: boolean = false
): boolean {
  const ratio = getContrastRatio(foreground, background);
  const requirement = level === 'AA' 
    ? (isLargeText ? CONTRAST_RATIOS.AA_LARGE : CONTRAST_RATIOS.AA_NORMAL)
    : (isLargeText ? CONTRAST_RATIOS.AAA_LARGE : CONTRAST_RATIOS.AAA_NORMAL);
  
  return ratio >= requirement;
}

// Colorblind-friendly color palette
export const COLORBLIND_SAFE_PALETTE = {
  // Primary colors that work for all types of color vision deficiency
  blue: '#0173B2',      // Safe blue
  orange: '#DE8F05',    // Safe orange
  green: '#029E73',     // Safe green
  red: '#CC78BC',       // Safe red/pink
  yellow: '#ECE133',    // Safe yellow
  purple: '#56B4E9',    // Safe light blue/purple
  brown: '#D55E00',     // Safe vermillion
  gray: '#999999',      // Safe gray
  
  // Status colors optimized for colorblind users
  success: '#029E73',   // Green that's distinguishable
  warning: '#DE8F05',   // Orange instead of yellow
  error: '#CC78BC',     // Pink instead of red
  info: '#0173B2',      // Blue
  neutral: '#999999',   // Gray
} as const;

// Pattern and texture alternatives for color coding
export const VISUAL_PATTERNS = {
  success: {
    pattern: 'checkered',
    icon: 'check-circle',
    texture: 'solid',
  },
  warning: {
    pattern: 'diagonal-stripes',
    icon: 'alert-triangle',
    texture: 'hatched',
  },
  error: {
    pattern: 'dots',
    icon: 'x-circle',
    texture: 'dotted',
  },
  info: {
    pattern: 'horizontal-lines',
    icon: 'info',
    texture: 'lined',
  },
  neutral: {
    pattern: 'solid',
    icon: 'circle',
    texture: 'solid',
  },
} as const;

// High contrast color combinations
export const HIGH_CONTRAST_COMBINATIONS = {
  light: {
    background: '#FFFFFF',
    text: '#000000',
    border: '#000000',
    accent: '#0000FF',
  },
  dark: {
    background: '#000000',
    text: '#FFFFFF',
    border: '#FFFFFF',
    accent: '#FFFF00',
  },
} as const;

// Color accessibility validation
export interface ColorAccessibilityReport {
  isAccessible: boolean;
  contrastRatio: number;
  meetsAA: boolean;
  meetsAAA: boolean;
  recommendations: string[];
}

export function validateColorAccessibility(
  foreground: string,
  background: string,
  isLargeText: boolean = false
): ColorAccessibilityReport {
  const contrastRatio = getContrastRatio(foreground, background);
  const meetsAA = meetsContrastRequirement(foreground, background, 'AA', isLargeText);
  const meetsAAA = meetsContrastRequirement(foreground, background, 'AAA', isLargeText);
  
  const recommendations: string[] = [];
  
  if (!meetsAA) {
    recommendations.push('Increase contrast ratio to meet WCAG AA standards');
    recommendations.push('Consider using a darker foreground or lighter background');
  }
  
  if (!meetsAAA) {
    recommendations.push('Consider increasing contrast for AAA compliance');
  }
  
  if (contrastRatio < 3) {
    recommendations.push('Add visual indicators beyond color (icons, patterns, borders)');
  }
  
  return {
    isAccessible: meetsAA,
    contrastRatio,
    meetsAA,
    meetsAAA,
    recommendations,
  };
}

// Generate accessible color variants
export function generateAccessibleVariant(
  baseColor: string,
  targetBackground: string,
  targetRatio: number = CONTRAST_RATIOS.AA_NORMAL
): string {
  const baseRgb = hexToRgb(baseColor);
  const bgRgb = hexToRgb(targetBackground);
  
  if (!baseRgb || !bgRgb) return baseColor;
  
  const bgLuminance = getLuminance(bgRgb.r, bgRgb.g, bgRgb.b);
  
  // Determine if we need to make the color lighter or darker
  const targetLuminance = bgLuminance > 0.5 
    ? (bgLuminance - targetRatio * (bgLuminance + 0.05) + 0.05) // Darker
    : (targetRatio * (bgLuminance + 0.05) - 0.05); // Lighter
  
  // Simple approximation - in a real implementation, you'd want more sophisticated color adjustment
  const factor = targetLuminance > bgLuminance ? 1.2 : 0.8;
  
  const adjustedR = Math.min(255, Math.max(0, Math.round(baseRgb.r * factor)));
  const adjustedG = Math.min(255, Math.max(0, Math.round(baseRgb.g * factor)));
  const adjustedB = Math.min(255, Math.max(0, Math.round(baseRgb.b * factor)));
  
  return `#${adjustedR.toString(16).padStart(2, '0')}${adjustedG.toString(16).padStart(2, '0')}${adjustedB.toString(16).padStart(2, '0')}`;
}

// Utility to get colorblind-safe alternative
export function getColorblindSafeAlternative(semanticColor: keyof typeof COLORBLIND_SAFE_PALETTE): string {
  return COLORBLIND_SAFE_PALETTE[semanticColor] || COLORBLIND_SAFE_PALETTE.gray;
}

// Utility to get visual pattern for semantic meaning
export function getVisualPattern(semanticType: keyof typeof VISUAL_PATTERNS) {
  return VISUAL_PATTERNS[semanticType] || VISUAL_PATTERNS.neutral;
}

// Check if user prefers high contrast
export function prefersHighContrast(): boolean {
  return window.matchMedia('(prefers-contrast: high)').matches;
}

// Check if user prefers reduced motion (affects color transitions)
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Get system color scheme preference
export function getSystemColorScheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

// Color accessibility CSS class generator
export function generateAccessibilityClasses(_element: HTMLElement, semanticType: string): string[] {
  const classes: string[] = [];
  
  if (prefersHighContrast()) {
    classes.push('high-contrast');
  }
  
  if (prefersReducedMotion()) {
    classes.push('reduced-motion');
  }
  
  // Add pattern class for colorblind users
  const pattern = getVisualPattern(semanticType as keyof typeof VISUAL_PATTERNS);
  classes.push(`pattern-${pattern.pattern}`);
  
  return classes;
}

// Validate entire color palette
export function validateColorPalette(palette: Record<string, string>, background: string = '#FFFFFF'): Record<string, ColorAccessibilityReport> {
  const results: Record<string, ColorAccessibilityReport> = {};
  
  Object.entries(palette).forEach(([name, color]) => {
    results[name] = validateColorAccessibility(color, background);
  });
  
  return results;
}