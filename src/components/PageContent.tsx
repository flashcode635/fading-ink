import { memo, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { DocumentPage } from '@/types/document';
import { SlateEditor } from './SlateEditor';
import { 
  corruptText, 
  calculateOpacity, 
  calculateBlur, 
  calculateTextColor,
  getDecayLevelColor 
} from '@/lib/decay';

interface PageContentProps {
  page: DocumentPage;
  onEditBlock: (blockId: string, content: string) => void;
  onDeleteBlock: (blockId: string) => void;
}

export const PageContent = memo(function PageContent({ 
  page, 
  onEditBlock, 
  onDeleteBlock 
}: PageContentProps) {
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  
  // Calculate page-level decay (average of all blocks)
  const pageDecay = page.blocks.reduce((sum, b) => sum + b.decayLevel, 0) / Math.max(page.blocks.length, 1);
  const isCritical = pageDecay >= 85;

  return (
    <div className="page-content-wrapper">
      {/* Page-level decay indicator */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-2 bg-muted/50 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ 
              background: `linear-gradient(90deg, ${getDecayLevelColor(0)}, ${getDecayLevelColor(pageDecay)})`,
            }}
            initial={false}
            animate={{ width: `${pageDecay}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <span className="text-sm stats-panel text-muted-foreground min-w-[4rem] text-right font-medium">
          {Math.round(pageDecay)}% decay
        </span>
      </div>

      {isCritical && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 p-3 bg-destructive/10 border border-destructive/30 rounded-md"
        >
          <p className="text-sm text-destructive font-medium">
            ⚠ Page reaching critical decay — restoration imminent
          </p>
        </motion.div>
      )}

      {/* All content blocks */}
      {page.blocks.map((block, index) => {
        const isFocused = focusedBlockId === block.id;
        const displayText = isFocused ? block.content : corruptText(block.content, block.decayLevel);
        const opacity = calculateOpacity(block.decayLevel);
        const blur = calculateBlur(block.decayLevel);
        const textColor = calculateTextColor(block.decayLevel);
        
        return (
          <motion.div
            key={block.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`relative group mb-4 ${block.decayLevel >= 85 ? 'critical-pulse' : ''}`}
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

            {/* Content area with Slate editor */}
            <div className="relative">
              <SlateEditor
                content={isFocused ? block.content : displayText}
                onChange={(content) => onEditBlock(block.id, content)}
                onFocus={() => setFocusedBlockId(block.id)}
                onBlur={() => setFocusedBlockId(null)}
                decayLevel={block.decayLevel}
                isFocused={isFocused}
                className={`content-editable text-decaying leading-relaxed min-h-[3rem]
                           ${block.decayLevel > 60 ? 'text-corrupted' : ''}
                           ${block.decayLevel >= 85 ? 'border-2 border-destructive/20 rounded bg-destructive/5' : ''}`}
                style={{
                  opacity: isFocused ? 1 : opacity,
                  filter: isFocused ? 'none' : blur > 0 ? `blur(${blur}px)` : 'none',
                  color: isFocused ? 'hsl(32, 35%, 12%)' : textColor,
                  transition: 'all 0.4s ease',
                }}
              />

              {/* Delete button */}
              {page.blocks.length > 1 && (
                <button
                  onClick={() => onDeleteBlock(block.id)}
                  className="absolute -right-2 top-1/2 -translate-y-1/2 opacity-0 
                             group-hover:opacity-100 transition-opacity p-2 
                             hover:text-destructive"
                  title="Delete section"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Separator between blocks */}
            {index < page.blocks.length - 1 && (
              <div className="my-4 border-b border-border/30" />
            )}
          </motion.div>
        );
      })}
    </div>
  );
});
