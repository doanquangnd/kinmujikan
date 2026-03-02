/// <reference types="vite/client" />

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          theme?: string;
          size?: string;
          language?: string;
          'error-callback'?: (errorCode: string) => boolean | void;
        }
      ) => string;
      getResponse: (widgetId: string) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export {};
