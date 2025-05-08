// Type declarations for various asset types
declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
  export default src;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.json' {
  const content: any;
  export default content;
}

declare module '*.css' {
  const content: Record<string, string>;
  export default content;
}

// Add declaration for Playwright assets
declare module 'playwright-core/lib/vite/recorder/assets/*' {
  const content: string;
  export default content;
}
