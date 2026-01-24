import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RotateCcw, Download, ChevronLeft, ChevronRight, FilePlus } from 'lucide-react';
import { DocumentPage } from '@/types/document';
import { DecayingBlock } from './DecayingBlock';
import { BackgroundAging } from './BackgroundAging';
import { DecayParticles } from './DecayParticles';
import { downloadDocument } from '@/lib/decay';

interface EditorCanvasProps {
  title: string;
  currentPage: DocumentPage;
  pages: DocumentPage[];
  currentPageIndex: number;
  isFlipping: boolean;
  flipDirection: 'left' | 'right';
  onEditBlock: (blockId: string, content: string) => void;
  onAddBlock: () => void;
  onDeleteBlock: (blockId: string) => void;
  onAddNewPage: () => void;
  onGoToPage: (index: number) => void;
  onUpdateTitle: (title: string) => void;
  onReset: () => void;
  createdAt: number;
}

export function EditorCanvas({
  title,
  currentPage,
  pages,
  currentPageIndex,
  isFlipping,
  flipDirection,
  onEditBlock,
  onAddBlock,
  onDeleteBlock,
  onAddNewPage,
  onGoToPage,
  onUpdateTitle,
  onReset,
  createdAt,
}: EditorCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [titleValue, setTitleValue] = useState(title);

  const averageDecay = currentPage.blocks.reduce((sum, b) => sum + b.decayLevel, 0) / currentPage.blocks.length;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(e.target.value);
    onUpdateTitle(e.target.value);
  };

  const handleDownload = () => {
    downloadDocument(titleValue || 'Untitled Document', pages);
  };

  // Page flip animation variants
  const pageVariants = {
    enter: (direction: 'left' | 'right') => ({
      rotateY: direction === 'right' ? 90 : -90,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      rotateY: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: 'left' | 'right') => ({
      rotateY: direction === 'right' ? -90 : 90,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <div className="relative w-full max-w-[900px] mx-auto perspective-1200">
      {/* Page navigation controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button
          onClick={() => onGoToPage(currentPageIndex - 1)}
          disabled={currentPageIndex === 0}
          className="p-2 rounded-full bg-card border border-border hover:bg-secondary 
                     disabled:opacity-30 disabled:cursor-not-allowed transition-all
                     hover:scale-110 active:scale-95"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        
        <div className="flex items-center gap-2 px-4 py-2 bg-card/80 rounded-full border border-border">
          <span className="stats-panel text-sm">
            Page {currentPageIndex + 1} of {pages.length}
          </span>
        </div>
        
        <button
          onClick={() => onGoToPage(currentPageIndex + 1)}
          disabled={currentPageIndex === pages.length - 1}
          className="p-2 rounded-full bg-card border border-border hover:bg-secondary 
                     disabled:opacity-30 disabled:cursor-not-allowed transition-all
                     hover:scale-110 active:scale-95"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <button
          onClick={onAddNewPage}
          className="p-2 rounded-full bg-accent/10 border border-accent/30 
                     hover:bg-accent/20 transition-all hover:scale-110 active:scale-95
                     text-accent"
          title="Add new page"
        >
          <FilePlus className="w-5 h-5" />
        </button>
      </div>

      {/* Main paper container with page flip */}
      <div className="page-flip-container" style={{ perspective: '1200px' }}>
        <AnimatePresence mode="wait" custom={flipDirection}>
          <motion.div
            key={currentPage.id}
            ref={containerRef}
            custom={flipDirection}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              duration: 0.6,
              ease: [0.43, 0.13, 0.23, 0.96],
            }}
            className="document-paper paper-texture corner-fold page-depth torn-edge-bottom
                       relative min-h-[600px] md:min-h-[750px] p-6 md:p-10"
            style={{
              transformStyle: 'preserve-3d',
              transformOrigin: flipDirection === 'right' ? 'left center' : 'right center',
            }}
          >
            {/* Background aging effects */}
            <BackgroundAging 
              yellowing={currentPage.backgroundYellowing} 
              bruises={currentPage.bruises} 
            />

            {/* Decay particles */}
            <DecayParticles 
              averageDecay={averageDecay} 
              containerRef={containerRef} 
            />

            {/* Content area */}
            <div className="relative z-10">
              {/* Document title */}
              <div className="mb-8 pb-4 border-b border-border/50">
                <input
                  type="text"
                  value={titleValue}
                  onChange={handleTitleChange}
                  className="w-full bg-transparent text-2xl md:text-3xl welcome-title 
                             text-foreground border-none outline-none placeholder:text-muted-foreground/50"
                  placeholder="Untitled Document"
                />
                <p className="text-xs stats-panel text-muted-foreground mt-2">
                  Created {new Date(createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Text blocks */}
              <AnimatePresence mode="popLayout">
                {!isFlipping && currentPage.blocks.map((block) => (
                  <DecayingBlock
                    key={block.id}
                    block={block}
                    onEdit={(content) => onEditBlock(block.id, content)}
                    onDelete={() => onDeleteBlock(block.id)}
                    isOnly={currentPage.blocks.length === 1}
                  />
                ))}
              </AnimatePresence>

              {/* Add new section button */}
              <motion.button
                onClick={onAddBlock}
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

            {/* Page number */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs 
                            stats-panel text-muted-foreground">
              — {currentPageIndex + 1} —
            </div>

            {/* Page curl shadow effect */}
            <div 
              className="absolute bottom-0 right-0 w-12 h-12 pointer-events-none"
              style={{
                background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.03) 50%)',
              }}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom action buttons */}
      <div className="fixed bottom-4 right-4 flex gap-2">
        <motion.button
          onClick={handleDownload}
          className="p-3 bg-card border border-border rounded-full
                     shadow-lg hover:shadow-xl transition-shadow text-muted-foreground
                     hover:text-foreground"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Download document"
        >
          <Download className="w-5 h-5" />
        </motion.button>
        
        <motion.button
          onClick={onReset}
          className="p-3 bg-card border border-border rounded-full
                     shadow-lg hover:shadow-xl transition-shadow text-muted-foreground
                     hover:text-destructive"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Reset document"
        >
          <RotateCcw className="w-5 h-5" />
        </motion.button>
      </div>
    </div>
  );
}
