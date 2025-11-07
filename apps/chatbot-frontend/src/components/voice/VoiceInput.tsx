import React, { useState, useEffect, useRef } from 'react';

interface VoiceInputProps {
  onTranscript: (transcript: string) => void;
  isDisabled?: boolean;
}

const VoiceInput: React.FC<VoiceInputProps> = ({ onTranscript, isDisabled = false }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if Speech Recognition is supported
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn('Speech Recognition not supported in this browser');
      setIsSupported(false);
      return;
    }

    // Initialize Speech Recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop after one result
    recognition.interimResults = true; // Show interim results
    recognition.lang = 'en-US'; // Default language

    recognition.onstart = () => {
      setIsListening(true);
      console.log('Voice recognition started');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;
      setTranscript(transcriptText);

      // If it's a final result, call the callback
      if (event.results[current].isFinal) {
        onTranscript(transcriptText);
        setTranscript('');
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);

      if (event.error === 'no-speech') {
        console.log('No speech detected, please try again');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      console.log('Voice recognition ended');
    };

    recognitionRef.current = recognition;

    // Cleanup
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  if (!isSupported) {
    return (
      <button
        disabled
        title="Voice input not supported in this browser"
        style={{
          padding: '8px 12px',
          background: '#ccc',
          border: 'none',
          borderRadius: '6px',
          cursor: 'not-allowed',
          opacity: 0.5,
        }}
      >
        🎤 Not supported
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      <button
        onClick={toggleListening}
        disabled={isDisabled}
        title={isListening ? 'Stop listening' : 'Start voice input'}
        style={{
          padding: '10px 16px',
          background: isListening ? '#e74c3c' : '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          transition: 'all 0.2s',
          opacity: isDisabled ? 0.5 : 1,
        }}
      >
        <span>{isListening ? '🛑' : '🎤'}</span>
        <span>{isListening ? 'Listening...' : 'Voice Input'}</span>
      </button>

      {transcript && (
        <div
          style={{
            padding: '10px',
            background: '#f0f0f0',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#333',
            fontStyle: 'italic',
          }}
        >
          {transcript}
        </div>
      )}

      {isListening && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px',
            background: '#fff3cd',
            borderRadius: '6px',
            fontSize: '13px',
          }}
        >
          <div
            style={{
              width: '12px',
              height: '12px',
              background: '#e74c3c',
              borderRadius: '50%',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          <span>Listening for your voice...</span>
        </div>
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

export default VoiceInput;
