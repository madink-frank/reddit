// Using Jest globals - describe, it, expect, beforeEach are available globally
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { 
  hexToRgb, 
  getLuminance, 
  getContrastRatio, 
  meetsContrastRequirement,
  validateColorAccessibility,
  getColorblindSafeAlternative,
  getVisualPattern,
  generateAccessibilityClasses,
  validateColorPalette,
  prefersHighContrast,
  prefersReducedMotion,
  getSystemColorScheme,
  COLORBLIND_SAFE_PALETTE,
  VISUAL_PATTERNS,
  CONTRAST_RATIOS
} from '../utils/colorAccessibility';
import ColorAccessibilityIndicator from '../components/ui/ColorAccessibilityIndicator';
import { ColorAccessibilityDemo } from '../components/demo/ColorAccessibilityDemo';

// Mock window.matchMedia
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
};

describe('Color Accessibility Utils', () => {
  describe('hexToRgb', () => {
    it('should convert hex colors to RGB', () => {
      expect(hexToRgb('#FFFFFF')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
      expect(hexToRgb('#FF0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('FFFFFF')).toEqual({ r: 255, g: 255, b: 255 }); // Without #
    });

    it('should return null for invalid hex colors', () => {
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('#GGG')).toBeNull();
    });
  });

  describe('getLuminance', () => {
    it('should calculate correct luminance values', () => {
      // White should have luminance of 1
      expect(getLuminance(255, 255, 255)).toBeCloseTo(1, 2);
      
      // Black should have luminance of 0
      expect(getLuminance(0, 0, 0)).toBeCloseTo(0, 2);
      
      // Gray should be somewhere in between
      const grayLuminance = getLuminance(128, 128, 128);
      expect(grayLuminance).toBeGreaterThan(0);
      expect(grayLuminance).toBeLessThan(1);
    });
  });

  describe('getContrastRatio', () => {
    it('should calculate correct contrast ratios', () => {
      // White on black should have maximum contrast (21:1)
      const whiteOnBlack = getContrastRatio('#FFFFFF', '#000000');
      expect(whiteOnBlack).toBeCloseTo(21, 0);
      
      // Same colors should have minimum contrast (1:1)
      const sameColor = getContrastRatio('#FFFFFF', '#FFFFFF');
      expect(sameColor).toBeCloseTo(1, 1);
      
      // Blue on white should have reasonable contrast
      const blueOnWhite = getContrastRatio('#0000FF', '#FFFFFF');
      expect(blueOnWhite).toBeGreaterThan(4);
    });
  });

  describe('meetsContrastRequirement', () => {
    it('should correctly identify AA compliance', () => {
      // High contrast should meet AA
      expect(meetsContrastRequirement('#000000', '#FFFFFF', 'AA', false)).toBe(true);
      
      // Low contrast should not meet AA
      expect(meetsContrastRequirement('#CCCCCC', '#FFFFFF', 'AA', false)).toBe(false);
      
      // Large text has lower requirements - check actual contrast ratio first
      const grayWhiteRatio = getContrastRatio('#999999', '#FFFFFF');
      expect(meetsContrastRequirement('#999999', '#FFFFFF', 'AA', true)).toBe(grayWhiteRatio >= 3);
    });

    it('should correctly identify AAA compliance', () => {
      // Very high contrast should meet AAA
      expect(meetsContrastRequirement('#000000', '#FFFFFF', 'AAA', false)).toBe(true);
      
      // Medium contrast might meet AA but not AAA
      const mediumContrast = getContrastRatio('#666666', '#FFFFFF');
      if (mediumContrast >= CONTRAST_RATIOS.AA_NORMAL && mediumContrast < CONTRAST_RATIOS.AAA_NORMAL) {
        expect(meetsContrastRequirement('#666666', '#FFFFFF', 'AA', false)).toBe(true);
        expect(meetsContrastRequirement('#666666', '#FFFFFF', 'AAA', false)).toBe(false);
      }
    });
  });

  describe('validateColorAccessibility', () => {
    it('should provide comprehensive accessibility reports', () => {
      const report = validateColorAccessibility('#000000', '#FFFFFF');
      
      expect(report).toHaveProperty('isAccessible');
      expect(report).toHaveProperty('contrastRatio');
      expect(report).toHaveProperty('meetsAA');
      expect(report).toHaveProperty('meetsAAA');
      expect(report).toHaveProperty('recommendations');
      
      expect(report.isAccessible).toBe(true);
      expect(report.meetsAA).toBe(true);
      expect(report.meetsAAA).toBe(true);
      expect(report.contrastRatio).toBeCloseTo(21, 0);
    });

    it('should provide recommendations for poor contrast', () => {
      const report = validateColorAccessibility('#CCCCCC', '#FFFFFF');
      
      expect(report.isAccessible).toBe(false);
      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations.some(rec => 
        rec.includes('contrast') || rec.includes('darker') || rec.includes('lighter')
      )).toBe(true);
    });
  });

  describe('getColorblindSafeAlternative', () => {
    it('should return colorblind-safe colors', () => {
      expect(getColorblindSafeAlternative('success')).toBe(COLORBLIND_SAFE_PALETTE.green);
      expect(getColorblindSafeAlternative('warning')).toBe(COLORBLIND_SAFE_PALETTE.orange);
      expect(getColorblindSafeAlternative('error')).toBe(COLORBLIND_SAFE_PALETTE.red);
      expect(getColorblindSafeAlternative('info')).toBe(COLORBLIND_SAFE_PALETTE.blue);
    });

    it('should fallback to gray for unknown types', () => {
      expect(getColorblindSafeAlternative('unknown' as any)).toBe(COLORBLIND_SAFE_PALETTE.gray);
    });
  });

  describe('getVisualPattern', () => {
    it('should return appropriate patterns for semantic types', () => {
      expect(getVisualPattern('success')).toEqual(VISUAL_PATTERNS.success);
      expect(getVisualPattern('warning')).toEqual(VISUAL_PATTERNS.warning);
      expect(getVisualPattern('error')).toEqual(VISUAL_PATTERNS.error);
      expect(getVisualPattern('info')).toEqual(VISUAL_PATTERNS.info);
    });

    it('should fallback to neutral pattern for unknown types', () => {
      expect(getVisualPattern('unknown' as any)).toEqual(VISUAL_PATTERNS.neutral);
    });
  });
});

describe('ColorAccessibilityIndicator Component', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('should render accessibility status correctly', () => {
    render(
      <ColorAccessibilityIndicator
        foregroundColor="#000000"
        backgroundColor="#FFFFFF"
        semanticType="success"
      />
    );

    expect(screen.getByText('AAA Compliant')).toBeInTheDocument();
    expect(screen.getByText(/21\.0:1/)).toBeInTheDocument();
  });

  it('should show detailed report when requested', () => {
    render(
      <ColorAccessibilityIndicator
        foregroundColor="#666666"
        backgroundColor="#FFFFFF"
        semanticType="info"
        showReport={true}
      />
    );

    expect(screen.getByText('Accessibility Report')).toBeInTheDocument();
    expect(screen.getByText('Original Colors')).toBeInTheDocument();
    expect(screen.getByText('Colorblind-Safe Alternative')).toBeInTheDocument();
  });

  it('should indicate poor accessibility for low contrast', () => {
    render(
      <ColorAccessibilityIndicator
        foregroundColor="#CCCCCC"
        backgroundColor="#FFFFFF"
        semanticType="warning"
      />
    );

    // Should show either "Needs Improvement" or "Not Accessible"
    const status = screen.getByText(/Needs Improvement|Not Accessible/);
    expect(status).toBeInTheDocument();
  });
});

describe('ColorAccessibilityDemo Component', () => {
  beforeEach(() => {
    mockMatchMedia(false);
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(() => null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true,
    });
  });

  it('should render demo sections', () => {
    render(<ColorAccessibilityDemo />);

    expect(screen.getByText('Color Accessibility Demo')).toBeInTheDocument();
    expect(screen.getByText('Status Messages')).toBeInTheDocument();
    expect(screen.getByText('Interactive Elements')).toBeInTheDocument();
    expect(screen.getByText('Data Visualization')).toBeInTheDocument();
    expect(screen.getByText('Color Contrast Testing')).toBeInTheDocument();
  });

  it('should open accessibility panel when button is clicked', async () => {
    render(<ColorAccessibilityDemo />);

    const settingsButton = screen.getByRole('button', { name: /accessibility settings/i });
    fireEvent.click(settingsButton);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /accessibility settings/i })).toBeInTheDocument();
    });
  });

  it('should display current accessibility settings', () => {
    render(<ColorAccessibilityDemo />);

    expect(screen.getByText('Current Settings')).toBeInTheDocument();
    expect(screen.getByText(/High Contrast:/)).toBeInTheDocument();
    expect(screen.getByText(/Colorblind Safe:/)).toBeInTheDocument();
    expect(screen.getByText(/Enhanced Focus:/)).toBeInTheDocument();
    expect(screen.getByText(/Reduced Motion:/)).toBeInTheDocument();
  });

  it('should show status examples with proper semantic types', () => {
    render(<ColorAccessibilityDemo />);

    expect(screen.getByText('Success Status')).toBeInTheDocument();
    expect(screen.getByText('Warning Status')).toBeInTheDocument();
    expect(screen.getByText('Error Status')).toBeInTheDocument();
    expect(screen.getByText('Information')).toBeInTheDocument();
  });
});

describe('Media Query Integration', () => {
  it('should detect high contrast preference', () => {
    mockMatchMedia(true);
    
    // Test the function directly from the imported module
    expect(prefersHighContrast()).toBe(true);
  });

  it('should detect reduced motion preference', () => {
    mockMatchMedia(true);
    
    expect(prefersReducedMotion()).toBe(true);
  });

  it('should detect dark color scheme preference', () => {
    mockMatchMedia(true);
    
    expect(getSystemColorScheme()).toBe('dark');
  });
});

describe('Accessibility Class Generation', () => {
  beforeEach(() => {
    mockMatchMedia(false);
  });

  it('should generate appropriate CSS classes', () => {
    const mockElement = document.createElement('div');
    
    const classes = generateAccessibilityClasses(mockElement, 'success');
    
    expect(classes).toContain('pattern-checkered');
    expect(Array.isArray(classes)).toBe(true);
  });
});

describe('Color Palette Validation', () => {
  it('should validate entire color palettes', () => {
    const testPalette = {
      primary: '#3B82F6',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    };
    
    const results = validateColorPalette(testPalette, '#FFFFFF');
    
    expect(results).toHaveProperty('primary');
    expect(results).toHaveProperty('success');
    expect(results).toHaveProperty('warning');
    expect(results).toHaveProperty('error');
    
    Object.values(results).forEach(result => {
      expect(result).toHaveProperty('isAccessible');
      expect(result).toHaveProperty('contrastRatio');
      expect(result).toHaveProperty('meetsAA');
      expect(result).toHaveProperty('meetsAAA');
    });
  });
});