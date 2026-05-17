export type ExtractTextBody = {
  urls?: string[];
  selector?: string;
};

export type ExtractLinksBody = {
  url?: string;
  selector?: string;
};

export type ExtractedTextItem = {
  ok: boolean;
  url: string;
  title?: string;
  text: string;
  characterCount: number;
  error?: string;
};

export type ExtractedLinkItem = {
  href: string;
  text: string;
};

export type ExtractTextResponse = {
  ok: boolean;
  selector: string;
  combinedText: string;
  characterCount: number;
  results: ExtractedTextItem[];
};

export type ExtractLinksResponse = {
  ok: boolean;
  url: string;
  selector: string;
  count: number;
  links: ExtractedLinkItem[];
};
