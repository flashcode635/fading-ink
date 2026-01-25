import { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RotateCcw, Download, ChevronLeft, ChevronRight, FilePlus, FileText } from 'lucide-react';
import { DocumentPage } from '@/types/document';
import { PageContent } from './PageContent';
import { BackgroundAging } from './BackgroundAging';
import { DecayParticles } from './DecayParticles';
import { downloadDocument } from '@/lib/decay';
import { exportToPDF } from '@/lib/pdfExport';

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
  const pageRef = useRef<HTMLDivElement>(null);
  const [titleValue, setTitleValue] = useState(title);
  const [isExporting, setIsExporting] = useState(false);

  const averageDecay = currentPage.blocks.reduce((sum, b) => sum + b.decayLevel, 0) / currentPage.blocks.length;

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleValue(e.target.value);
    onUpdateTitle(e.target.value);
  };

  const handleDownloadText = () => {
    downloadDocument(titleValue || 'Untitled Document', pages);
  };

  const handleDownloadPDF = async () => {
    if (!pageRef.current || isExporting) return;
    setIsExporting(true);
    try {
      await exportToPDF(titleValue || 'Untitled Document', pages, pageRef.current);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // iOS-like smooth page flip animation with spring physics
  const pageVariants = {
    enter: (direction: 'left' | 'right') => ({
      rotateY: direction === 'right' ? 90 : -90,
      x: direction === 'right' ? 100 : -100,
      opacity: 0,
      scale: 0.9,
      filter: 'brightness(0.7)',
    }),
    center: {
      rotateY: 0,
      x: 0,
      opacity: 1,
      scale: 1,
      filter: 'brightness(1)',
    },
    exit: (direction: 'left' | 'right') => ({
      rotateY: direction === 'right' ? -90 : 90,
      x: direction === 'right' ? -100 : 100,
      opacity: 0,
      scale: 0.9,
      filter: 'brightness(0.7)',
    }),
  };

  // iOS-like spring transition
  const pageTransition = {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
    mass: 1,
  };

  return (
    <div className="relative w-full max-w-[900px] mx-auto" style={{ perspective: '2000px' }}>
      {/* Page navigation controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <motion.button
          onClick={() => onGoToPage(currentPageIndex - 1)}
          disabled={currentPageIndex === 0}
          className="p-3 rounded-full bg-card/90 backdrop-blur-sm border border-border 
                     hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed 
                     transition-all shadow-lg"
          whileHover={{ scale: 1.1, x: -3 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronLeft className="w-5 h-5" />
        </motion.button>
        
        <motion.div 
          className="flex items-center gap-3 px-5 py-2.5 bg-card/90 backdrop-blur-sm 
                     rounded-full border border-border shadow-lg"
          layout
        >
          {/* Page dots indicator */}
          <div className="flex items-center gap-1.5">
            {pages.map((_, index) => (
              <motion.button
                key={index}
                onClick={() => onGoToPage(index)}
                className={`rounded-full transition-all ${
                  index === currentPageIndex 
                    ? 'w-6 h-2 bg-primary' 
                    : 'w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                layout
              />
            ))}
          </div>
          <span className="text-sm stats-panel text-muted-foreground">
            {currentPageIndex + 1} / {pages.length}
          </span>
        </motion.div>
        
        <motion.button
          onClick={() => onGoToPage(currentPageIndex + 1)}
          disabled={currentPageIndex === pages.length - 1}
          className="p-3 rounded-full bg-card/90 backdrop-blur-sm border border-border 
                     hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed 
                     transition-all shadow-lg"
          whileHover={{ scale: 1.1, x: 3 }}
          whileTap={{ scale: 0.95 }}
        >
          <ChevronRight className="w-5 h-5" />
        </motion.button>

        <motion.button
          onClick={onAddNewPage}
          className="p-3 rounded-full bg-primary/10 border border-primary/30 
                     hover:bg-primary/20 transition-all text-primary shadow-lg"
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.95 }}
          title="Add new page"
        >
          <FilePlus className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Main paper container with iOS-like page flip */}
      <div 
        ref={containerRef}
        className="page-flip-container relative"
        style={{ 
          transformStyle: 'preserve-3d',
          perspectiveOrigin: 'center center',
        }}
      >
        <AnimatePresence mode="wait" custom={flipDirection}>
          <motion.div
            key={currentPage.id}
            ref={pageRef}
            custom={flipDirection}
            variants={pageVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={pageTransition}
            className="document-paper paper-texture corner-fold page-depth torn-edge-bottom
                       relative min-h-[600px] md:min-h-[750px] p-6 md:p-10"
            style={{
              transformStyle: 'preserve-3d',
              transformOrigin: flipDirection === 'right' ? 'left center' : 'right center',
              backfaceVisibility: 'hidden',
            }}
          >
            {/* Background aging effects */}
            <BackgroundAging 
              yellowing={currentPage.backgroundYellowing} 
              bruises={currentPage.bruises}
              pageDecay={averageDecay}
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

              {/* Page content with Slate editor */}
              {!isFlipping && (
                <PageContent
                  page={currentPage}
                  onEditBlock={onEditBlock}
                  onDeleteBlock={onDeleteBlock}
                />
              )}

              {/* Add new section button */}
              <motion.button
                onClick={onAddBlock}
                disabled={isFlipping}
                className="w-full mt-6 py-4 border-2 border-dashed border-border/50 
                           rounded-lg text-muted-foreground hover:border-primary/40 
                           hover:text-foreground hover:bg-primary/5 transition-all 
                           flex items-center justify-center gap-2 group"
                whileHover={{ scale: 1.01, borderColor: 'hsl(var(--primary) / 0.4)' }}
                whileTap={{ scale: 0.99 }}
              >
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                <span className="text-sm stats-panel">Add New Section</span>
              </motion.button>
            </div>

            {/* Page number */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs 
                            stats-panel text-muted-foreground">
              — {currentPageIndex + 1} —
            </div>

            {/* Page curl effect */}
            <div 
              className="absolute bottom-0 right-0 w-16 h-16 pointer-events-none corner-curl"
              style={{
                background: 'linear-gradient(135deg, transparent 45%, rgba(0,0,0,0.03) 45%, rgba(0,0,0,0.08) 100%)',
                borderRadius: '0 0 4px 0',
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Page shadow underneath */}
        <div 
          className="absolute inset-0 -z-10 rounded-sm"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.1) 100%)',
            transform: 'translateY(8px) scaleX(0.95)',
            filter: 'blur(8px)',
          }}
        />
      </div>

      {/* Bottom action buttons */}
      <div className="fixed bottom-4 right-4 flex gap-2">
        <motion.button
          onClick={handleDownloadText}
          className="p-3 bg-card/90 backdrop-blur-sm border border-border rounded-full
                     shadow-lg hover:shadow-xl transition-all text-muted-foreground
                     hover:text-foreground"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Download as text"
        >
          <Download className="w-5 h-5" />
        </motion.button>

        <motion.button
          onClick={handleDownloadPDF}
          disabled={isExporting}
          className="p-3 bg-primary/10 border border-primary/30 rounded-full
                     shadow-lg hover:shadow-xl transition-all text-primary
                     hover:bg-primary/20 disabled:opacity-50"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Export as PDF"
        >
          <FileText className="w-5 h-5" />
        </motion.button>
        
        <motion.button
          onClick={onReset}
          className="p-3 bg-card/90 backdrop-blur-sm border border-border rounded-full
                     shadow-lg hover:shadow-xl transition-all text-muted-foreground
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
