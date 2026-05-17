export type BrowserTtsVoice = {
  default: boolean;
  lang: string;
  localService: boolean;
  name: string;
  voiceURI: string;
};

export type SpeakBrowserTextOptions = {
  text: string;
  voiceURI?: string;
  lang?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
};

const MAX_UTTERANCE_CHARS = 180;

export function getBrowserTtsVoices(): BrowserTtsVoice[] {
  const speechSynthesis = getSpeechSynthesis();

  if (!speechSynthesis || !getSpeechUtteranceCtor()) {
    return [];
  }

  return speechSynthesis.getVoices().map((voice) => ({
    default: voice.default,
    lang: voice.lang,
    localService: voice.localService,
    name: voice.name,
    voiceURI: voice.voiceURI,
  }));
}

export function isBrowserSpeechReady() {
  return Boolean(getSpeechSynthesis() && getSpeechUtteranceCtor());
}

export function canAttemptBrowserSpeech() {
  return typeof window !== "undefined";
}

export function cancelBrowserSpeech() {
  getSpeechSynthesis()?.cancel();
}

export async function speakBrowserText(options: SpeakBrowserTextOptions) {
  const speechSynthesis = getSpeechSynthesis();
  const SpeechUtterance = getSpeechUtteranceCtor();

  if (!speechSynthesis || !SpeechUtterance) {
    throw new Error("Trình duyệt này chưa hỗ trợ Browser TTS.");
  }

  const chunks = splitSpeechText(options.text);

  if (!chunks.length) {
    throw new Error("Hãy nhập nội dung trước khi đọc bằng trình duyệt.");
  }

  speechSynthesis.cancel();

  for (const chunk of chunks) {
    await speakChunk(chunk, options);
  }
}

function speakChunk(text: string, options: SpeakBrowserTextOptions) {
  return new Promise<void>((resolve, reject) => {
    const speechSynthesis = getSpeechSynthesis();
    const SpeechUtterance = getSpeechUtteranceCtor();

    if (!speechSynthesis || !SpeechUtterance) {
      reject(new Error("Trình duyệt này chưa hỗ trợ Browser TTS."));
      return;
    }

    const utterance = new SpeechUtterance(text);
    const voice = getBrowserTtsVoices().find((item) => item.voiceURI === options.voiceURI);

    if (voice) {
      const nativeVoice = speechSynthesis.getVoices().find((item) => item.voiceURI === voice.voiceURI);
      if (nativeVoice) {
        utterance.voice = nativeVoice;
      }
      utterance.lang = voice.lang;
    } else if (options.lang) {
      utterance.lang = options.lang;
    }

    utterance.rate = clamp(options.rate ?? 1, 0.5, 2);
    utterance.pitch = clamp(options.pitch ?? 1, 0, 2);
    utterance.volume = clamp(options.volume ?? 1, 0, 1);
    utterance.onend = () => resolve();
    utterance.onerror = (event) => reject(new Error(event.error || "Browser TTS bị dừng."));
    speechSynthesis.speak(utterance);
  });
}

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window !== "undefined" && window.speechSynthesis) {
    return window.speechSynthesis;
  }

  if (typeof globalThis !== "undefined" && "speechSynthesis" in globalThis) {
    return (globalThis as typeof globalThis & { speechSynthesis?: SpeechSynthesis }).speechSynthesis || null;
  }

  return null;
}

function getSpeechUtteranceCtor(): typeof SpeechSynthesisUtterance | null {
  if (typeof window !== "undefined" && window.SpeechSynthesisUtterance) {
    return window.SpeechSynthesisUtterance;
  }

  if (typeof globalThis !== "undefined" && "SpeechSynthesisUtterance" in globalThis) {
    return (globalThis as typeof globalThis & { SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance }).SpeechSynthesisUtterance || null;
  }

  return null;
}

function splitSpeechText(text: string) {
  const normalized = text.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return [];
  }

  const roughParts = normalized
    .split(/(?<=[.!?。！？])\s+|\n+/u)
    .map((part) => part.trim())
    .filter(Boolean);

  const chunks: string[] = [];

  for (const part of roughParts) {
    if (part.length <= MAX_UTTERANCE_CHARS) {
      chunks.push(part);
      continue;
    }

    let current = "";
    const words = part.split(/\s+/);
    for (const word of words) {
      const next = current ? `${current} ${word}` : word;
      if (next.length > MAX_UTTERANCE_CHARS && current) {
        chunks.push(current);
        current = word;
      } else {
        current = next;
      }
    }

    if (current) {
      chunks.push(current);
    }
  }

  return chunks;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
