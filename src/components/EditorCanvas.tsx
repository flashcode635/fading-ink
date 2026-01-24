import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RotateCcw } from 'lucide-react';
import { DocumentState } from '@/types/document';
import { DecayingBlock } from './DecayingBlock';
import { BackgroundAging } from './BackgroundAging';
import { DecayParticles } from './DecayParticles';
import { PageFlipAnimation } from './PageFlipAnimation';

interface EditorCanvasProps {
  state: DocumentState;
  onEditBlock: (blockId: string, content: string) => void;
  onAddBlock: () => void;
  onDeleteBlock: (blockId: string) => void;
  onReset: () => void;
}

export function EditorCanvas({
  state,
  onEditBlock,
  onAddBlock,
  onDeleteBlock,
  onReset,
}: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [showNewBlock, setShowNewBlock] = useState(true);

  const handleAddBlock = () => {
    setIsFlipping(true);
    setShowNewBlock(false);
    
    setTimeout(() => {
      onAddBlock();
      setIsFlipping(false);
      setShowNewBlock(true);
    }, 600);
  };

  const averageDecay = state.blocks.reduce((sum, b) => sum + b.decayLevel, 0) / state.blocks.length;

  return (
    <div className="relative w-full max-w-[900px] mx-auto">
      {/* Main paper container */}
      <motion.div
        ref={containerRef}
        className="document-paper paper-texture corner-fold page-depth torn-edge-bottom
                   relative min-h-[600px] md:min-h-[800px] p-6 md:p-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          aspectRatio: '210/297', // A4 proportions
        }}
      >
        {/* Background aging effects */}
        <BackgroundAging 
          yellowing={state.backgroundYellowing} 
          bruises={state.bruises} 
        />

        {/* Decay particles */}
        <DecayParticles 
          averageDecay={averageDecay} 
          containerRef={containerRef} 
        />

        {/* Content area */}
        <PageFlipAnimation isFlipping={isFlipping}>
          <div className="relative z-10">
            {/* Document title */}
            <div className="mb-8 pb-4 border-b border-border/50">
              <input
                type="text"
                defaultValue={state.title}
                className="w-full bg-transparent text-2xl md:text-3xl welcome-title 
                           text-foreground border-none outline-none"
                placeholder="Untitled Document"
              />
              <p className="text-xs stats-panel text-muted-foreground mt-2">
                Created {new Date(state.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* Text blocks */}
            <AnimatePresence mode="popLayout">
              {showNewBlock && state.blocks.map((block) => (
                <DecayingBlock
                  key={block.id}
                  block={block}
                  onEdit={(content) => onEditBlock(block.id, content)}
                  onDelete={() => onDeleteBlock(block.id)}
                  isOnly={state.blocks.length === 1}
                />
              ))}
            </AnimatePresence>

            {/* Add new section button */}
            <motion.button
              onClick={handleAddBlock}
              disabled={isFlipping}
              className="w-full mt-6 py-4 border-2 border-dashed border-border/50 
                         rounded-sm text-muted-foreground hover:border-foreground/30 
                         hover:text-foreground transition-all flex items-center 
                         justify-center gap-2 group"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
              <span className="text-sm stats-panel">Add New Section</span>
            </motion.button>
          </div>
        </PageFlipAnimation>

        {/* Page number */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs 
                        stats-panel text-muted-foreground">
          — 1 —
        </div>
      </motion.div>

      {/* Reset button */}
      <motion.button
        onClick={onReset}
        className="fixed bottom-4 right-4 p-3 bg-card border border-border rounded-full
                   shadow-lg hover:shadow-xl transition-shadow text-muted-foreground
                   hover:text-foreground"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        title="Reset document"
      >
        <RotateCcw className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
