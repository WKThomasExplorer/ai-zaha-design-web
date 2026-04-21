'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Sparkles, ChevronDown, ChevronUp, X, Zap, Mic, MicOff, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { STYLE_CATEGORIES, getStylesByCategory, type StyleReference } from '@/types';

interface DescriptionInputProps {
  onSubmit: () => void;
  className?: string;
}

export function DescriptionInput({ onSubmit, className }: DescriptionInputProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Curated Styles']);
  const [selectedStyleId, setSelectedStyleId] = useState<string | null>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [starting, setStarting] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [speechError, setSpeechError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<unknown>(null);
  const wantsListeningRef = useRef(false);
  const retryRef = useRef(0);

  useEffect(() => {
    const handlePrefill = (event: Event) => {
      const customEvent = event as CustomEvent<{ value?: string }>;
      const nextValue = customEvent.detail?.value;
      if (!nextValue || typeof nextValue !== 'string') return;
      try {
        const rec = recognitionRef.current as { stop?: () => void } | null;
        rec?.stop?.();
      } catch {
        // ignore
      }
      setSelectedStyleId(null);
      setValue(nextValue);
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    };

    window.addEventListener('prefillDescription', handlePrefill);
    return () => window.removeEventListener('prefillDescription', handlePrefill);
  }, []);

  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onresult: ((event: unknown) => void) | null;
        onstart: (() => void) | null;
        onend: (() => void) | null;
        onerror: ((event: unknown) => void) | null;
        start: () => void;
        stop: () => void;
        abort?: () => void;
      };
      webkitSpeechRecognition?: new () => {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onresult: ((event: unknown) => void) | null;
        onstart: (() => void) | null;
        onend: (() => void) | null;
        onerror: ((event: unknown) => void) | null;
        start: () => void;
        stop: () => void;
        abort?: () => void;
      };
    };

    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      setSpeechSupported(false);
      return;
    }

    setSpeechSupported(true);
    const recognition = new Ctor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onstart = () => {
      setSpeechError(null);
      retryRef.current = 0;
      setStarting(false);
      setListening(true);
    };

    recognition.onend = () => {
      setListening(false);
      setStarting(false);
      setInterimTranscript('');

      if (!wantsListeningRef.current) return;
      window.setTimeout(() => {
        try {
          recognition.start();
        } catch {
          wantsListeningRef.current = false;
          setSpeechError('Voice input is unavailable');
        }
      }, 250);
    };

    recognition.onerror = (event) => {
      const e = event as { error?: string };
      const err = e.error || 'unknown';

      if (err === 'aborted') {
        setSpeechError(null);
        wantsListeningRef.current = false;
        setListening(false);
        setStarting(false);
        setInterimTranscript('');
        return;
      }

      if (err === 'no-speech') {
        setSpeechError('No speech detected. Try again.');
      } else if (err === 'audio-capture') {
        setSpeechError('Microphone not available.');
      } else if (err === 'not-allowed' || err === 'service-not-allowed') {
        setSpeechError('Microphone permission is blocked.');
      } else if (err === 'network') {
        if (wantsListeningRef.current && retryRef.current < 1) {
          retryRef.current += 1;
          try {
            recognition.stop();
          } catch {
            // ignore
          }
          setSpeechError('Speech service unreachable (network). Retrying...');
          return;
        }
        setSpeechError('Speech service unreachable (network).');
      } else {
        setSpeechError(`Voice input failed (${err}).`);
      }

      wantsListeningRef.current = false;
      setListening(false);
      setStarting(false);
      setInterimTranscript('');
    };

    recognition.onresult = (event) => {
      const e = event as {
        resultIndex: number;
        results: ArrayLike<ArrayLike<{ transcript: string }>> & ArrayLike<{ isFinal?: boolean }>;
      };

      let nextInterim = '';
      const finals: string[] = [];

      for (let i = e.resultIndex; i < e.results.length; i++) {
        const result = e.results[i] as unknown as { isFinal: boolean } & ArrayLike<{ transcript: string }>;
        const transcript = (result[0]?.transcript || '').trim();
        if (!transcript) continue;
        if (result.isFinal) {
          finals.push(transcript);
        } else {
          nextInterim = transcript;
        }
      }

      setInterimTranscript(nextInterim);

      if (finals.length > 0) {
        const appended = finals.join(' ').trim();
        setValue((prev) => {
          const spacer = prev.trim().length > 0 ? ' ' : '';
          return (prev + spacer + appended).slice(0, maxChars);
        });
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort?.();
        recognition.stop();
      } catch {
        // ignore
      }
    };
  }, []);

  const toggleVoice = useCallback(() => {
    if (!speechSupported) return;
    const recognition = recognitionRef.current as {
      start?: () => void;
      stop?: () => void;
      abort?: () => void;
    } | null;
    if (!recognition) return;

    setSpeechError(null);

    if (listening || starting) {
      wantsListeningRef.current = false;
      try {
        recognition.abort?.();
        recognition.stop?.();
      } catch {
        // ignore
      }
      setStarting(false);
      setListening(false);
      setInterimTranscript('');
      return;
    }

    wantsListeningRef.current = true;
    setStarting(true);
    setInterimTranscript('');

    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((t) => t.stop());
      } catch {
        wantsListeningRef.current = false;
        setStarting(false);
        setSpeechError('Microphone permission is required.');
        return;
      }

      try {
        recognition.start?.();
      } catch {
        wantsListeningRef.current = false;
        setStarting(false);
        setSpeechError('Speech recognition failed to start.');
      }
    };

    void start();
  }, [speechSupported, listening, starting]);

  // Auto-scroll textarea to bottom when value changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [value]);

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }, []);

  // Handle style selection - auto-fill prompt
  const handleStyleSelect = useCallback(
    (style: StyleReference) => {
      setSelectedStyleId(style.id);
      setValue(style.prompt);
      // Focus the textarea for user to review and confirm
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
    },
    []
  );

  const handleSubmit = useCallback(() => {
    if (value.trim()) {
      localStorage.setItem('design_description', value.trim());
      window.dispatchEvent(new Event('descriptionSaved'));
      onSubmit();
    }
  }, [value, onSubmit]);

  const charCount = value.length;
  const maxChars = 1000;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Style Template Gallery */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-[#1a1f36]">
          <Sparkles className="w-4 h-4 text-[#00d4aa]" />
          <span className="text-sm font-medium">Choose a style template (6 options)</span>
        </div>

        {/* Category Accordion */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {STYLE_CATEGORIES.map((category) => {
            const isExpanded = expandedCategories.includes(category);
            const styles = getStylesByCategory(category);

            return (
              <div key={category} className="border border-[#2d2a4a]/10 rounded-xl overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className={cn(
                    'w-full px-4 py-3 flex items-center justify-between transition-colors',
                    'bg-gradient-to-r from-[#1a1f36]/5 to-transparent',
                    'hover:from-[#1a1f36]/10',
                    isExpanded ? 'border-b border-[#2d2a4a]/10' : ''
                  )}
                >
                  <span className="text-sm font-medium text-[#1a1f36]">
                    {category}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-[#2d2a4a]/60" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#2d2a4a]/60" />
                  )}
                </button>

                {/* Style Options */}
                {isExpanded && (
                  <div className="p-2 space-y-1">
                    {styles.map((style) => (
                      <button
                        key={style.id}
                        onClick={() => handleStyleSelect(style)}
                        className={cn(
                          'w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200',
                          selectedStyleId === style.id
                            ? 'bg-gradient-to-r from-[#00d4aa]/20 to-[#0077ff]/20 border border-[#00d4aa]/30 text-[#1a1f36]'
                            : 'hover:bg-[#f0f0f5] text-[#2d2a4a]/80 hover:text-[#1a1f36]'
                        )}
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-[#00d4aa] font-medium mt-0.5">
                            {style.id}.
                          </span>
                          <span className="line-clamp-2">{style.name.split('. ')[1]}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selectedStyleId && (
          <button
            onClick={() => {
              setSelectedStyleId(null);
              setValue('');
            }}
            className="flex items-center gap-1 text-xs text-[#2d2a4a]/60 hover:text-[#00d4aa] transition-colors"
          >
            <X className="w-3 h-3" />
            Clear selection
          </button>
        )}
      </div>

      {/* Custom Prompt Input */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-[#1a1f36]">
            Or write your own prompt
          </label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!speechSupported}
              onClick={toggleVoice}
              className={cn(
                'h-8 px-3 rounded-lg border-[#2d2a4a]/20',
                listening && 'border-red-500/40 text-red-600'
              )}
              aria-pressed={listening || starting}
              aria-label={
                speechSupported
                  ? listening
                    ? 'Stop voice input'
                    : 'Start voice input'
                  : 'Voice input not supported'
              }
            >
              {listening || starting ? (
                <MicOff className="w-4 h-4 mr-1.5" />
              ) : (
                <Mic className="w-4 h-4 mr-1.5" />
              )}
              {listening || starting ? 'Stop' : 'Voice'}
            </Button>

            <span
              className={cn(
                'text-xs transition-colors',
                charCount > maxChars * 0.9
                  ? 'text-orange-500'
                  : 'text-[#2d2a4a]/40'
              )}
            >
              {charCount}/{maxChars}
            </span>
          </div>
        </div>
        <Textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, maxChars))}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={
            selectedStyleId
              ? 'Edit the prompt if needed...'
              : 'Describe your dream facade in your own words...'
          }
          className={cn(
            'min-h-[120px] resize-none transition-all duration-300',
            'border-[#2d2a4a]/20 focus:border-[#00d4aa]',
            'rounded-xl',
            isFocused && 'shadow-lg shadow-[#00d4aa]/10'
          )}
        />
        {listening && interimTranscript && (
          <div className="text-xs text-[#2d2a4a]/60">
            <span className="text-[#00d4aa] font-medium">Listening:</span> {interimTranscript}
          </div>
        )}
        {speechError && (
          <div className="flex items-center gap-2 text-xs text-red-600">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{speechError}</span>
          </div>
        )}
        <p className="text-xs text-[#2d2a4a]/40">
          Tip: Include style, colors, materials, and specific elements you want
        </p>
      </div>

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={!value.trim()}
        className={cn(
          'w-full h-12 rounded-xl font-medium transition-all duration-300',
          'bg-gradient-to-r from-[#00d4aa] to-[#0077ff]',
          'hover:shadow-lg hover:shadow-[#00d4aa]/30',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'text-white'
        )}
      >
        <Zap className="w-4 h-4 mr-2" />
        Generate My Design
      </Button>
    </div>
  );
}
