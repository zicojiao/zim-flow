// Chrome Built-in Translator API Types
declare global {
  interface Window {
    Translator?: any;
  }

  const Translator: {
    availability(options: {
      sourceLanguage: string;
      targetLanguage: string;
    }): Promise<'unavailable' | 'downloadable' | 'downloading' | 'available'>;

    create(options: {
      sourceLanguage: string;
      targetLanguage: string;
      monitor?: (monitor: any) => void;
    }): Promise<{
      translate(text: string): Promise<string>;
      destroy(): void;
    }>;
  };
}

export { }; 