/**
 * Web Speech API Abstraction Helper
 * STT: SpeechRecognition / webkitSpeechRecognition
 * TTS: SpeechSynthesis
 */

export const isSpeechRecognitionSupported = () => {
  return typeof window !== "undefined" && Boolean(
    window.SpeechRecognition || window.webkitSpeechRecognition
  );
};

export const isSpeechSynthesisSupported = () => {
  return typeof window !== "undefined" && Boolean(window.speechSynthesis);
};

/**
 * Initialize Speech Recognition instance
 */
export function createSpeechRecognizer({
  onResult,
  onError,
  onEnd,
  lang = "en-US",
}) {
  if (!isSpeechRecognitionSupported()) return null;

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognizer = new SpeechRecognition();

  recognizer.continuous = false;
  recognizer.interimResults = true;
  recognizer.lang = lang;

  recognizer.onresult = (event) => {
    let transcript = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      transcript += event.results[i][0].transcript;
    }
    if (onResult) onResult(transcript);
  };

  recognizer.onerror = (event) => {
    if (onError) onError(event.error);
  };

  recognizer.onend = () => {
    if (onEnd) onEnd();
  };

  return recognizer;
}

/**
 * Clean markdown for smooth text-to-speech reading
 */
export function sanitizeMarkdownForSpeech(markdown) {
  if (!markdown) return "";
  return markdown
    .replace(/```[\s\S]*?```/g, "Code block omitted.") // strip code blocks
    .replace(/`([^\`]+)`/g, "$1") // inline code
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1") // links
    .replace(/[*_~#]/g, "") // markdown formatting
    .replace(/\n+/g, " ") // newlines to spaces
    .trim();
}

/**
 * Text-to-Speech Speak
 */
export function speakText(text, onStart, onEnd) {
  if (!isSpeechSynthesisSupported()) return;

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const clean = sanitizeMarkdownForSpeech(text);
  if (!clean) return;

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 1.0;
  utterance.pitch = 1.0;

  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  utterance.onerror = () => {
    if (onEnd) onEnd();
  };

  window.speechSynthesis.speak(utterance);
}

/**
 * Stop any ongoing SpeechSynthesis
 */
export function stopSpeech() {
  if (isSpeechSynthesisSupported()) {
    window.speechSynthesis.cancel();
  }
}
