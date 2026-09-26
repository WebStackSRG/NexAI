import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * Custom hook for Web Speech API speech-to-text dictation.
 * Safe in SSR / unsupported browser environments with automatic feature detection.
 *
 * @param {Object} options
 * @param {Function} [options.onResult] - Callback fired with transcribed text
 * @param {Function} [options.onError] - Callback fired when recognition errors
 * @param {boolean} [options.continuous=false] - Keep listening across pauses
 * @param {string} [options.lang='en-US'] - Language locale
 */
export function useSpeechRecognition({
  onResult,
  onError,
  continuous = false,
  lang = 'en-US',
} = {}) {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop on inactive instance
      }
      setIsListening(false);
    }
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) {
      const errMsg = 'Voice input not supported in this browser';
      setError(errMsg);
      onErrorRef.current?.(errMsg);
      return;
    }

    try {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = continuous;
      recognition.interimResults = false;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          if (item.isFinal || !continuous) {
            finalTranscript += item[0]?.transcript || '';
          }
        }
        if (finalTranscript.trim()) {
          onResultRef.current?.(finalTranscript.trim());
        }
      };

      recognition.onerror = (event) => {
        // Ignore innocuous errors like no-speech
        if (event.error !== 'no-speech') {
          const errMsg = event.error || 'Speech recognition error';
          setError(errMsg);
          onErrorRef.current?.(errMsg);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      const errMsg = err?.message || 'Failed to start speech recognition';
      setError(errMsg);
      onErrorRef.current?.(errMsg);
      setIsListening(false);
    }
  }, [isSupported, continuous, lang]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Teardown on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    error,
    startListening,
    stopListening,
    toggleListening,
  };
}
