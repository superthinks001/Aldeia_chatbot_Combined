import React, { useState, useEffect, useRef } from 'react';

interface VoiceOutputProps {
  text: string;
  autoPlay?: boolean;
  language?: string;
  showControls?: boolean;
}

const VoiceOutput: React.FC<VoiceOutputProps> = ({
  text,
  autoPlay = false,
  language = 'en-US',
  showControls = true,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Check if Speech Synthesis is supported
    if (!('speechSynthesis' in window)) {
      console.warn('Speech Synthesis not supported in this browser');
      setIsSupported(false);
      return;
    }

    // Load available voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Select default voice for the language
      const defaultVoice = availableVoices.find(
        (voice) => voice.lang === language
      ) || availableVoices[0];

      setSelectedVoice(defaultVoice);
    };

    loadVoices();

    // Chrome requires this event listener to load voices
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }

    // Cleanup
    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [language]);

  useEffect(() => {
    if (autoPlay && text && isSupported) {
      speak();
    }
  }, [text, autoPlay, isSupported]);

  const speak = () => {
    if (!isSupported || !text) return;

    // Stop any ongoing speech
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    // Create utterance
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = selectedVoice;
    utterance.lang = language;
    utterance.rate = 1.0; // Speaking rate (0.1 to 10)
    utterance.pitch = 1.0; // Voice pitch (0 to 2)
    utterance.volume = 1.0; // Volume (0 to 1)

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
    };

    utterance.onerror = (event) => {
      console.error('Speech synthesis error:', event);
      setIsSpeaking(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const stop = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const pause = () => {
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
    }
  };

  const resume = () => {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }
  };

  if (!isSupported) {
    return null;
  }

  if (!showControls) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        background: isSpeaking ? '#e8f5e9' : '#f5f5f5',
        borderRadius: '6px',
        fontSize: '14px',
        transition: 'background 0.3s',
      }}
    >
      {!isSpeaking ? (
        <button
          onClick={speak}
          disabled={!text}
          title="Play audio"
          style={{
            padding: '6px 12px',
            background: '#667eea',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: text ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            opacity: text ? 1 : 0.5,
          }}
        >
          <span>🔊</span>
          <span>Play</span>
        </button>
      ) : (
        <>
          <button
            onClick={stop}
            title="Stop audio"
            style={{
              padding: '6px 12px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span>⏹️</span>
            <span>Stop</span>
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '12px',
              color: '#4caf50',
            }}
          >
            <div
              style={{
                width: '8px',
                height: '8px',
                background: '#4caf50',
                borderRadius: '50%',
                animation: 'pulse 1.5s ease-in-out infinite',
              }}
            />
            <span>Playing...</span>
          </div>
        </>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
};

export default VoiceOutput;
