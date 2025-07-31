import React from 'react';

interface SkipLink {
  href: string;
  text: string;
}

interface SkipLinksProps {
  links?: SkipLink[];
}

const defaultLinks: SkipLink[] = [
  { href: '#main-content', text: 'Skip to main content' },
  { href: '#navigation', text: 'Skip to navigation' },
  { href: '#dashboard-title', text: 'Skip to page title' },
  { href: '#stats-section-title', text: 'Skip to statistics' },
  { href: '#quick-actions-title', text: 'Skip to quick actions' }
];

const SkipLinks: React.FC<SkipLinksProps> = ({ links = defaultLinks }) => {
  const skipLinksStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    zIndex: 1000,
  };

  const skipLinkStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: '8px',
    transform: 'translateY(-100%)',
    opacity: 0,
    backgroundColor: '#000',
    color: '#fff',
    padding: '8px 16px',
    textDecoration: 'none',
    borderRadius: '0 0 4px 4px',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.3s ease',
    border: '2px solid #fff',
    outline: 'none',
  };

  const skipLinkFocusStyle: React.CSSProperties = {
    transform: 'translateY(0)',
    opacity: 1,
    outline: '2px solid #3b82f6',
    outlineOffset: '2px',
  };

  return (
    <>
      <style>{`
        @media (prefers-reduced-motion: reduce) {
          .skip-link {
            transition: none !important;
          }
        }
        
        @media (prefers-contrast: high) {
          .skip-link {
            border-width: 3px !important;
            font-weight: 600 !important;
          }
        }
        
        .skip-link:hover {
          background-color: #1f2937 !important;
        }
        
        .skip-link:active {
          background-color: #374151 !important;
        }
      `}</style>
      <div style={skipLinksStyle}>
        {links.map((link, index) => (
          <a
            key={index}
            href={link.href}
            className="skip-link"
            style={skipLinkStyle}
            onFocus={(e) => {
              Object.assign(e.currentTarget.style, skipLinkFocusStyle);
            }}
            onBlur={(e) => {
              e.currentTarget.style.transform = 'translateY(-100%)';
              e.currentTarget.style.opacity = '0';
              e.currentTarget.style.outline = 'none';
              e.currentTarget.style.outlineOffset = 'initial';
            }}
            onClick={(e) => {
              e.preventDefault();
              const target = document.querySelector(link.href);
              if (target) {
                (target as HTMLElement).focus();
                // Check if scrollIntoView is available (not in test environment)
                if (typeof target.scrollIntoView === 'function') {
                  target.scrollIntoView({ behavior: 'smooth' });
                }
              }
            }}
          >
            {link.text}
          </a>
        ))}
      </div>
    </>
  );
};

export default SkipLinks;