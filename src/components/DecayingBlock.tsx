import { useRef, useEffect, useState, memo } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { TextBlock } from '@/types/document';
import { 
  corruptText, 
  calculateOpacity, 
  calculateBlur, 
  calculateTextColor,
  getDecayLevelColor 
} from '@/lib/decay';

interface DecayingBlockProps {
  block: TextBlock;
  onEdit: (content: string) => void;
  onDelete: () => void;
  isOnly: boolean;
}

export const DecayingBlock = memo(function DecayingBlock({ 
  block, 
  onEdit, 
  onDelete,
  isOnly 
}: DecayingBlockProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  
  const isCritical = block.decayLevel >= 85;
  const displayText = isFocused ? block.content : corruptText(block.content, block.decayLevel);
  const opacity = calculateOpacity(block.decayLevel);
  const blur = calculateBlur(block.decayLevel);
  const textColor = calculateTextColor(block.decayLevel);

  // Handle content changes
  const handleInput = () => {
    if (contentRef.current) {
      const newContent = contentRef.current.innerText;
      onEdit(newContent);
    }
  };

  // Set initial content
  useEffect(() => {
    if (contentRef.current && !isFocused) {
      contentRef.current.innerText = displayText;
    }
  }, [displayText, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    if (contentRef.current) {
      contentRef.current.innerText = block.content;
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`relative group mb-4 ${isCritical ? 'critical-pulse' : ''}`}
    >
      {/* Age stains */}
      {block.ageStains.map(stain => (
        <motion.div
          key={stain.id}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: stain.opacity }}
          transition={{ duration: 2 }}
          className={stain.type === 'coffee' ? 'coffee-stain' : 
                     stain.type === 'bruise' ? 'bruise-mark' : 'age-stain'}
          style={{
            left: `${stain.x}%`,
            top: `${stain.y}%`,
            width: stain.size,
            height: stain.size * (stain.type === 'bruise' ? 0.6 : 1),
            transform: `rotate(${stain.rotation}deg)`,
          }}
        />
      ))}

      {/* Decay indicator */}
      <div className="flex items-center gap-2 mb-1">
        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ 
              background: getDecayLevelColor(block.decayLevel),
              width: `${block.decayLevel}%`
            }}
            initial={false}
            animate={{ width: `${block.decayLevel}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <span className="text-xs stats-panel text-muted-foreground w-12 text-right">
          {Math.round(block.decayLevel)}%
        </span>
      </div>

      {/* Content area */}
      <div className="relative">
        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          data-placeholder="Begin writing here..."
          className={`content-editable text-decaying text-lg leading-relaxed 
                     ${block.decayLevel > 50 ? 'text-corrupted' : ''}
                     ${isCritical ? 'border-2 border-destructive/30 rounded' : ''}`}
          style={{
            opacity: isFocused ? 1 : opacity,
            filter: isFocused ? 'none' : `blur(${blur}px)`,
            color: isFocused ? 'hsl(36, 30%, 13%)' : textColor,
            transition: 'all 0.3s ease',
          }}
        />

        {/* Delete button */}
        {!isOnly && (
          <button
            onClick={onDelete}
            className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 
                       group-hover:opacity-100 transition-opacity p-2 
                       hover:text-destructive"
            title="Delete section"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Critical warning */}
      {isCritical && !isFocused && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-destructive mt-1 italic"
        >
          ⚠ Critical decay — restoration imminent
        </motion.p>
      )}
    </motion.div>
  );
});
