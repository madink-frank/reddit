/// <reference types="vite/client" />

// ============================================================================
// Environment Variables
// ============================================================================

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_SITE_NAME: string;
  readonly VITE_SITE_DESCRIPTION: string;
  readonly VITE_SITE_URL: string;
  readonly VITE_GOOGLE_ANALYTICS_ID?: string;
  readonly VITE_FACEBOOK_PIXEL_ID?: string;
  readonly VITE_TWITTER_HANDLE?: string;
  readonly VITE_FACEBOOK_URL?: string;
  readonly VITE_LINKEDIN_URL?: string;
  readonly VITE_GITHUB_URL?: string;
  readonly VITE_ENABLE_COMMENTS?: string;
  readonly VITE_ENABLE_NEWSLETTER?: string;
  readonly VITE_ENABLE_SEARCH?: string;
  readonly VITE_ENABLE_DARK_MODE?: string;
}

// ImportMeta interface is already defined by Vite

// ============================================================================
// Module Declarations
// ============================================================================

declare module '*.svg' {
  import type { FunctionComponent, SVGProps } from 'react';
  export const ReactComponent: FunctionComponent<SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.png' {
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const src: string;
  export default src;
}

declare module '*.jpeg' {
  const src: string;
  export default src;
}

declare module '*.gif' {
  const src: string;
  export default src;
}

declare module '*.webp' {
  const src: string;
  export default src;
}

declare module '*.avif' {
  const src: string;
  export default src;
}

declare module '*.ico' {
  const src: string;
  export default src;
}

declare module '*.bmp' {
  const src: string;
  export default src;
}

declare module '*.svg?react' {
  import type { FunctionComponent, SVGProps } from 'react';
  const ReactComponent: FunctionComponent<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

// ============================================================================
// Global Type Augmentations
// ============================================================================

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
    dataLayer?: any[];
  }
}

// ============================================================================
// CSS Modules
// ============================================================================

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.module.sass' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

// ============================================================================
// Markdown Files
// ============================================================================

declare module '*.md' {
  const content: string;
  export default content;
}

declare module '*.mdx' {
  import { ComponentType } from 'react';
  const MDXComponent: ComponentType<any>;
  export default MDXComponent;
}

// ============================================================================
// JSON Files
// ============================================================================

declare module '*.json' {
  const value: any;
  export default value;
}

// ============================================================================
// Web Workers
// ============================================================================

declare module '*?worker' {
  const WorkerConstructor: {
    new (): Worker;
  };
  export default WorkerConstructor;
}

declare module '*?worker&inline' {
  const WorkerConstructor: {
    new (): Worker;
  };
  export default WorkerConstructor;
}

// ============================================================================
// Service Worker
// ============================================================================

declare module '*?sw' {
  const swUrl: string;
  export default swUrl;
}

// ============================================================================
// URL Imports
// ============================================================================

declare module '*?url' {
  const url: string;
  export default url;
}

declare module '*?raw' {
  const content: string;
  export default content;
}

// ============================================================================
// Vite-specific
// ============================================================================

declare module 'virtual:*' {
  const result: any;
  export default result;
}

export {};