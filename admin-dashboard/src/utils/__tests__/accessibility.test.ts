import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { 
  FocusManager,
  ScreenReaderUtils,
  ColorContrast,
  ReducedMotion,
  initializeAccessibility
} from '../accessibility'

describe('Accessibility Utils', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  describe('ScreenReaderUtils', () => {
    it('creates and removes announcement element', () => {
      ScreenReaderUtils.announce('Test announcement')
      
      const announcement = document.querySelector('[aria-live="polite"]')
      expect(announcement).toBeInTheDocument()
      expect(announcement?.textContent).toBe('Test announcement')
      
      // Should be removed after timeout
      setTimeout(() => {
        expect(document.querySelector('[aria-live="polite"]')).not.toBeInTheDocument()
      }, 1100)
    })

    it('creates assertive announcement', () => {
      ScreenReaderUtils.announce('Urgent message', 'assertive')
      
      const announcement = document.querySelector('[aria-live="assertive"]')
      expect(announcement).toBeInTheDocument()
      expect(announcement?.textContent).toBe('Urgent message')
    })

    it('creates screen reader only element', () => {
      const element = ScreenReaderUtils.createScreenReaderOnly('Hidden text')
      expect(element.textContent).toBe('Hidden text')
      expect(element.className).toBe('sr-only')
    })
  })

  describe('FocusManager', () => {
    it('traps focus within container', () => {
      document.body.innerHTML = `
        <div>
          <button id="outside">Outside</button>
        </div>
        <div id="modal">
          <button id="first">First</button>
          <button id="second">Second</button>
          <button id="last">Last</button>
        </div>
      `
      
      const modal = document.getElementById('modal')!
      const first = document.getElementById('first')!
      const last = document.getElementById('last')!
      
      const cleanup = FocusManager.trapFocus(modal)
      
      // Simulate tab on last element
      last.focus()
      const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' })
      modal.dispatchEvent(tabEvent)
      
      // Should focus first element
      expect(document.activeElement).toBe(first)
      
      cleanup()
    })

    it('handles shift+tab to go backwards', () => {
      document.body.innerHTML = `
        <div id="modal">
          <button id="first">First</button>
          <button id="second">Second</button>
          <button id="last">Last</button>
        </div>
      `
      
      const modal = document.getElementById('modal')!
      const first = document.getElementById('first')!
      const last = document.getElementById('last')!
      
      const cleanup = FocusManager.trapFocus(modal)
      
      // Simulate shift+tab on first element
      first.focus()
      const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true })
      modal.dispatchEvent(shiftTabEvent)
      
      // Should focus last element
      expect(document.activeElement).toBe(last)
      
      cleanup()
    })

    it('gets focusable elements', () => {
      document.body.innerHTML = `
        <div id="container">
          <button>Button</button>
          <input type="text" />
          <a href="#">Link</a>
          <button disabled>Disabled</button>
        </div>
      `
      
      const container = document.getElementById('container')!
      const focusableElements = FocusManager.getFocusableElements(container)
      
      expect(focusableElements).toHaveLength(3) // button, input, link (not disabled button)
    })

    it('checks if element is visible', () => {
      document.body.innerHTML = `
        <div id="visible">Visible</div>
        <div id="hidden" style="display: none">Hidden</div>
      `
      
      const visible = document.getElementById('visible')!
      const hidden = document.getElementById('hidden')!
      
      expect(FocusManager.isVisible(visible)).toBe(true)
      expect(FocusManager.isVisible(hidden)).toBe(false)
    })
  })

  describe('ColorContrast', () => {
    it('calculates contrast ratio', () => {
      const ratio = ColorContrast.getContrastRatio('#000000', '#ffffff')
      expect(ratio).toBeCloseTo(21, 0) // Black on white has ~21:1 ratio
    })

    it('checks WCAG AA compliance', () => {
      expect(ColorContrast.meetsWCAGAA('#000000', '#ffffff')).toBe(true)
      expect(ColorContrast.meetsWCAGAA('#777777', '#ffffff')).toBe(false)
    })

    it('checks WCAG AAA compliance', () => {
      expect(ColorContrast.meetsWCAGAAA('#000000', '#ffffff')).toBe(true)
      expect(ColorContrast.meetsWCAGAAA('#666666', '#ffffff')).toBe(false)
    })
  })

  describe('ReducedMotion', () => {
    it('checks user preference for reduced motion', () => {
      // Mock matchMedia
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      })

      expect(ReducedMotion.prefersReducedMotion()).toBe(true)
    })

    it('gets appropriate transition duration', () => {
      expect(ReducedMotion.getTransitionDuration(300)).toBe(0) // Reduced motion
    })
  })

  describe('initializeAccessibility', () => {
    it('adds skip link and aria-live regions', () => {
      initializeAccessibility()
      
      const skipLink = document.querySelector('a[href="#main-content"]')
      expect(skipLink).toBeInTheDocument()
      expect(skipLink?.textContent).toBe('Skip to main content')
      
      const politeRegion = document.getElementById('aria-live-polite')
      expect(politeRegion).toBeInTheDocument()
      expect(politeRegion?.getAttribute('aria-live')).toBe('polite')
      
      const assertiveRegion = document.getElementById('aria-live-assertive')
      expect(assertiveRegion).toBeInTheDocument()
      expect(assertiveRegion?.getAttribute('aria-live')).toBe('assertive')
    })
  })
})