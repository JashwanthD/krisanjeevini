import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

// Hotword → tab mapping
const HOTWORD_MAP: Record<string, string> = {
  // English hotwords
  'sowing': 'sowing',
  'sow': 'sowing',
  'crop': 'sowing',
  'plant': 'sowing',
  'seed': 'sowing',
  'market': 'market',
  'mandi': 'market',
  'price': 'market',
  'sell': 'market',
  'forecast': 'market',
  'leaf': 'leafScan',
  'disease': 'leafScan',
  'scan': 'leafScan',
  'camera': 'leafScan',
  'photo': 'leafScan',
  // Kannada transliterations
  'bittane': 'sowing',
  'marukattte': 'market',
  'ele': 'leafScan',
  'roga': 'leafScan',
};

interface VoiceAccessibilityProps {
  onNavigate: (tab: string) => void;
  lastResult?: string | null;
}

/**
 * Bhashini Voice Accessibility Layer
 * - Press-and-hold mic → records audio → ASR transcription → hotword parsing
 * - Falls back to browser-native SpeechRecognition when Bhashini credentials missing
 * - TTS output for speaking results aloud
 */
export default function VoiceAccessibility({ onNavigate, lastResult }: VoiceAccessibilityProps) {
  const { t, lang } = useLanguage();
  const [isListening, setIsListening] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Show toast notification
  const showToast = useCallback((message: string, duration = 2500) => {
    setToast(message);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), duration);
  }, []);

  // Process transcription text for hotwords
  const processTranscription = useCallback((text: string) => {
    const lower = text.toLowerCase().trim();
    console.log('[Voice] Transcription:', lower);

    for (const [hotword, tab] of Object.entries(HOTWORD_MAP)) {
      if (lower.includes(hotword)) {
        const toastKey = `voice.hotwords.${hotword}`;
        const toastText = t(toastKey);
        showToast(toastText !== toastKey ? toastText : `Navigating to ${tab}...`);
        onNavigate(tab);
        return;
      }
    }

    showToast(text);
  }, [t, onNavigate, showToast]);

  // Start listening via browser SpeechRecognition (fallback)
  const startBrowserRecognition = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast(t('voice.notSupported'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'kn' ? 'kn-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      processTranscription(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('[Voice] Recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [lang, processTranscription, showToast, t]);

  // Speak text aloud via TTS
  const speakResult = useCallback((text: string) => {
    if (!text) return;

    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'kn' ? 'kn-IN' : 'en-IN';
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }, [lang]);

  // Handle mic press
  const handleMicPress = useCallback(() => {
    if (isListening) {
      // Stop listening
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    startBrowserRecognition();
  }, [isListening, startBrowserRecognition]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  return (
    <>
      {/* Floating Mic Button */}
      <button
        id="voice-fab"
        className={`voice-fab ${isListening ? 'listening' : ''}`}
        onClick={handleMicPress}
        aria-label={isListening ? t('voice.listening') : t('voice.holdToSpeak')}
        title={t('voice.holdToSpeak')}
      >
        {isListening ? '⏹' : '🎤'}
      </button>

      {/* Speak Result button (if there's a result to speak) */}
      {lastResult && (
        <button
          id="voice-speak-result"
          className="voice-fab"
          style={{ bottom: 140, backgroundColor: '#1565C0' }}
          onClick={() => speakResult(lastResult)}
          aria-label={t('voice.speakResult')}
          title={t('voice.speakResult')}
        >
          🔊
        </button>
      )}

      {/* Toast Notification */}
      <div className={`toast ${toast ? 'show' : ''}`}>
        {toast}
      </div>
    </>
  );
}
