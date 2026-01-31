'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { TextBlock, DECAY_CONFIG } from '@/types/document';
import { calculateAccuracy, corruptText, formatTime } from '@/lib/decay';

interface RestorationMiniGameProps {
  block: TextBlock;
  onSuccess: () => void;
  onFailure: () => void;
  onDismiss: () => void;
}

export function RestorationMiniGame({ 
  block, 
  onSuccess, 
  onFailure,
  onDismiss 
}: RestorationMiniGameProps) {
  const [input, setInput] = useState('');
  const [timeLeft, setTimeLeft] = useState(DECAY_CONFIG.RESTORATION_TIME);
  const [isFinished, setIsFinished] = useState(false);
  const [result, setResult] = useState<'success' | 'failure' | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  const corruptedText = corruptText(block.content, 90);
  const accuracy = calculateAccuracy(input, block.originalContent);
  const isAccurate = accuracy >= DECAY_CONFIG.RESTORATION_ACCURACY_THRESHOLD;

  // Timer countdown
  useEffect(() => {
    if (isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isFinished]);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  const handleSubmit = useCallback(() => {
    if (isFinished) return;
    
    setIsFinished(true);
    const finalAccuracy = calculateAccuracy(input, block.originalContent);
    
    if (finalAccuracy >= DECAY_CONFIG.RESTORATION_ACCURACY_THRESHOLD) {
      setResult('success');
      setTimeout(onSuccess, 1500);
    } else {
      setResult('failure');
      setTimeout(onFailure, 1500);
    }
  }, [input, block.originalContent, isFinished, onSuccess, onFailure]);

  const timerPercentage = (timeLeft / DECAY_CONFIG.RESTORATION_TIME) * 100;
  const accuracyPercentage = accuracy * 100;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 minigame-overlay"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="paper-texture corner-fold page-depth max-w-2xl w-full p-6 md:p-8 relative"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <h2 className="welcome-title text-xl text-foreground">
              Restoration Required
            </h2>
          </div>
          <button 
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            [ESC] Skip
          </button>
        </div>

        {/* Timer bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="stats-panel">{formatTime(timeLeft)}</span>
            </div>
            <span className="stats-panel text-muted-foreground">
              Time remaining
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full minigame-timer"
              style={{ width: `${timerPercentage}%` }}
              animate={{ width: `${timerPercentage}%` }}
            />
          </div>
        </div>

        {/* Instructions */}
        <p className="text-sm text-muted-foreground mb-4 italic">
          The text below has been corrupted. Retype the original text from memory to restore it.
        </p>

        {/* Corrupted text display */}
        <div className="relative mb-4 p-4 bg-card/50 rounded border border-border">
          <p className="text-corrupted text-lg text-muted-foreground leading-relaxed"
             style={{ 
               filter: 'blur(0.5px)',
               opacity: 0.7 
             }}>
            {corruptedText}
          </p>
          <span className="absolute top-2 right-2 text-xs stats-panel text-muted-foreground">
            CORRUPTED
          </span>
        </div>

        {/* Ghost hint of original (very faint) */}
        <div className="relative mb-4">
          <p className="text-sm text-muted-foreground/30 italic select-none pointer-events-none"
             style={{ userSelect: 'none' }}>
            {block.originalContent.split('').map((char, i) => (
              <span key={i} style={{ opacity: 0.15 + Math.random() * 0.1 }}>
                {char}
              </span>
            ))}
          </p>
        </div>

        {/* Input area */}
        <div className="relative mb-4">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isFinished}
            placeholder="Type the original text here..."
            className="w-full h-32 p-4 typewriter-input text-lg resize-none 
                       bg-transparent border border-border rounded"
          />
        </div>

        {/* Accuracy meter */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="stats-panel">Accuracy</span>
            <span className={`stats-panel font-bold ${
              isAccurate ? 'text-green-600' : 'text-muted-foreground'
            }`}>
              {Math.round(accuracyPercentage)}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: isAccurate 
                  ? 'hsl(120, 60%, 45%)' 
                  : `hsl(${45 + accuracy * 75}, 70%, 50%)`,
              }}
              animate={{ width: `${accuracyPercentage}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isAccurate 
              ? '✓ Accuracy threshold reached' 
              : `Need ${DECAY_CONFIG.RESTORATION_ACCURACY_THRESHOLD * 100}% to restore`}
          </p>
        </div>

        {/* Submit button */}
        <div className="flex justify-center">
          <button
            onClick={handleSubmit}
            disabled={isFinished}
            className={`btn-ink px-8 py-3 ${isFinished ? 'opacity-50' : ''}`}
          >
            {isFinished ? 'Processing...' : 'Submit Restoration'}
          </button>
        </div>

        {/* Result overlay */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 flex items-center justify-center bg-background/80 rounded"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-center"
              >
                {result === 'success' ? (
                  <>
                    <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                    <h3 className="welcome-title text-2xl text-foreground mb-2">
                      Restored!
                    </h3>
                    <p className="text-muted-foreground">
                      The text has been saved from decay.
                    </p>
                  </>
                ) : (
                  <>
                    <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                    <h3 className="welcome-title text-2xl text-foreground mb-2">
                      Failed
                    </h3>
                    <p className="text-muted-foreground">
                      The text is now permanently scarred.
                    </p>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
