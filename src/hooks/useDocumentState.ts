import { useState, useEffect, useCallback, useRef } from 'react';
import { DocumentState, TextBlock, DocumentPage, DECAY_CONFIG } from '@/types/document';
import { 
  generateId, 
  calculateDecayRate, 
  createNewBlock,
  createNewPage,
  generateRandomBruise,
  generateRandomStain 
} from '@/lib/decay';

const STORAGE_KEY = 'aging-document-state-v2';

function createInitialState(): DocumentState {
  const now = Date.now();
  return {
    id: generateId(),
    title: 'Untitled Document',
    pages: [createNewPage(1)],
    currentPageIndex: 0,
    totalEdits: 0,
    documentAge: 0,
    createdAt: now,
    globalDecayMultiplier: 1,
    lastSavedAt: now,
    hasSeenWelcome: false,
  };
}

function loadState(): DocumentState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Update document age based on time since last save
      parsed.documentAge += Date.now() - parsed.lastSavedAt;
      return parsed;
    }
  } catch (e) {
    console.error('Failed to load document state:', e);
  }
  return createInitialState();
}

export function useDocumentState() {
  const [state, setState] = useState<DocumentState>(loadState);
  const [criticalBlock, setCriticalBlock] = useState<TextBlock | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'left' | 'right'>('right');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const decayIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const currentPage = state.pages[state.currentPageIndex];

  // Debounced save to localStorage
  const saveState = useCallback((newState: DocumentState) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      const stateToSave = { ...newState, lastSavedAt: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, DECAY_CONFIG.SAVE_INTERVAL);
  }, []);

  // Decay calculation loop
  useEffect(() => {
    decayIntervalRef.current = setInterval(() => {
      setState(prev => {
        const now = Date.now();
        
        const updatedPages = prev.pages.map(page => {
          const totalBlocks = page.blocks.length;
          const decayRate = calculateDecayRate(totalBlocks);
          
          const updatedBlocks = page.blocks.map(block => {
            if (block.isBeingRestored) return block;
            
            const timeSinceEdit = (now - block.lastEditedAt) / 1000;
            const decayIncrement = decayRate * (DECAY_CONFIG.DECAY_INTERVAL / 1000) * 
                                    (1 + timeSinceEdit / 120); // Slower acceleration
            
            let newDecayLevel = Math.min(
              100, 
              Math.max(block.permanentDecayFloor, block.decayLevel + decayIncrement)
            );

            // Add random stains as decay increases
            let newStains = [...block.ageStains];
            if (newDecayLevel > 50 && Math.random() < 0.03) {
              newStains.push(generateRandomStain(block.id));
            }

            return {
              ...block,
              decayLevel: newDecayLevel,
              ageStains: newStains,
            };
          });

          // Check for critical blocks
          const critical = updatedBlocks.find(
            b => b.decayLevel >= DECAY_CONFIG.CRITICAL_THRESHOLD && 
                 !b.isBeingRestored &&
                 b.content.length > 0
          );
          if (critical && !criticalBlock) {
            setCriticalBlock(critical);
          }

          // Slowly increase background yellowing
          const newYellowing = Math.min(100, page.backgroundYellowing + 0.015);

          return {
            ...page,
            blocks: updatedBlocks,
            backgroundYellowing: newYellowing,
          };
        });

        const newState = {
          ...prev,
          pages: updatedPages,
          documentAge: now - prev.createdAt,
        };

        saveState(newState);
        return newState;
      });
    }, DECAY_CONFIG.DECAY_INTERVAL);

    return () => {
      if (decayIntervalRef.current) {
        clearInterval(decayIntervalRef.current);
      }
    };
  }, [criticalBlock, saveState]);

  // Edit a block (this triggers decay acceleration on other blocks)
  const editBlock = useCallback((blockId: string, content: string) => {
    setState(prev => {
      const now = Date.now();
      
      const updatedPages = prev.pages.map((page, pageIndex) => {
        const isCurrentPage = pageIndex === prev.currentPageIndex;
        
        const updatedBlocks = page.blocks.map(block => {
          if (block.id === blockId) {
            // Reset decay on edited block
            return {
              ...block,
              content,
              originalContent: content || block.originalContent,
              lastEditedAt: now,
              decayLevel: Math.max(block.permanentDecayFloor, 0),
            };
          } else if (isCurrentPage) {
            // Accelerate decay on other blocks in current page
            const decayBoost = DECAY_CONFIG.EDIT_ACCELERATION + Math.random() * 2;
            return {
              ...block,
              decayLevel: Math.min(100, block.decayLevel + decayBoost),
            };
          }
          return block;
        });

        // Add bruises when editing
        let newBruises = [...page.bruises];
        if (isCurrentPage && Math.random() < 0.2) {
          newBruises.push(generateRandomBruise());
        }

        return {
          ...page,
          blocks: updatedBlocks,
          bruises: newBruises,
          backgroundYellowing: isCurrentPage 
            ? Math.min(100, page.backgroundYellowing + DECAY_CONFIG.YELLOWING_INCREMENT)
            : page.backgroundYellowing,
        };
      });

      const newState = {
        ...prev,
        pages: updatedPages,
        totalEdits: prev.totalEdits + 1,
      };

      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // Add a new block to current page
  const addBlock = useCallback(() => {
    setState(prev => {
      const updatedPages = [...prev.pages];
      const currentPage = updatedPages[prev.currentPageIndex];
      const newBlock = createNewBlock(currentPage.blocks.length);
      
      updatedPages[prev.currentPageIndex] = {
        ...currentPage,
        blocks: [...currentPage.blocks, newBlock],
      };

      const newState = { ...prev, pages: updatedPages };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // Delete a block
  const deleteBlock = useCallback((blockId: string) => {
    setState(prev => {
      const updatedPages = [...prev.pages];
      const currentPage = updatedPages[prev.currentPageIndex];
      
      const newBlocks = currentPage.blocks
        .filter(b => b.id !== blockId)
        .map((b, i) => ({ ...b, position: i }));
      
      updatedPages[prev.currentPageIndex] = {
        ...currentPage,
        blocks: newBlocks.length > 0 ? newBlocks : [createNewBlock(0)],
      };

      const newState = { ...prev, pages: updatedPages };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // Add new page with flip animation
  const addNewPage = useCallback(() => {
    setFlipDirection('right');
    setIsFlipping(true);
    
    setTimeout(() => {
      setState(prev => {
        const newPage = createNewPage(prev.pages.length + 1);
        const newState = {
          ...prev,
          pages: [...prev.pages, newPage],
          currentPageIndex: prev.pages.length,
        };
        saveState(newState);
        return newState;
      });
      
      setTimeout(() => setIsFlipping(false), 100);
    }, 600);
  }, [saveState]);

  // Navigate to page with flip animation
  const goToPage = useCallback((index: number) => {
    if (index === state.currentPageIndex || index < 0 || index >= state.pages.length) return;
    
    setFlipDirection(index > state.currentPageIndex ? 'right' : 'left');
    setIsFlipping(true);
    
    setTimeout(() => {
      setState(prev => ({ ...prev, currentPageIndex: index }));
      setTimeout(() => setIsFlipping(false), 100);
    }, 600);
  }, [state.currentPageIndex, state.pages.length]);

  // Update title
  const updateTitle = useCallback((title: string) => {
    setState(prev => {
      const newState = { ...prev, title };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // Handle restoration success
  const handleRestorationSuccess = useCallback((blockId: string) => {
    setState(prev => {
      const updatedPages = prev.pages.map(page => ({
        ...page,
        blocks: page.blocks.map(block => {
          if (block.id === blockId) {
            return {
              ...block,
              decayLevel: 0,
              permanentDecayFloor: 0,
              isBeingRestored: false,
              lastEditedAt: Date.now(),
            };
          }
          return block;
        }),
      }));

      const newState = { ...prev, pages: updatedPages };
      saveState(newState);
      return newState;
    });
    setCriticalBlock(null);
  }, [saveState]);

  // Handle restoration failure
  const handleRestorationFailure = useCallback((blockId: string) => {
    setState(prev => {
      const penalty = DECAY_CONFIG.FAILED_RESTORATION_PENALTY_MIN + 
                      Math.random() * (DECAY_CONFIG.FAILED_RESTORATION_PENALTY_MAX - 
                                        DECAY_CONFIG.FAILED_RESTORATION_PENALTY_MIN);
      
      const updatedPages = prev.pages.map(page => ({
        ...page,
        blocks: page.blocks.map(block => {
          if (block.id === blockId) {
            return {
              ...block,
              permanentDecayFloor: Math.min(50, block.permanentDecayFloor + penalty),
              isBeingRestored: false,
            };
          }
          return block;
        }),
      }));

      const newState = { ...prev, pages: updatedPages };
      saveState(newState);
      return newState;
    });
    setCriticalBlock(null);
  }, [saveState]);

  // Start restoration
  const startRestoration = useCallback((blockId: string) => {
    setState(prev => {
      const updatedPages = prev.pages.map(page => ({
        ...page,
        blocks: page.blocks.map(block => {
          if (block.id === blockId) {
            return { ...block, isBeingRestored: true };
          }
          return block;
        }),
      }));
      return { ...prev, pages: updatedPages };
    });
  }, []);

  // Dismiss restoration
  const dismissRestoration = useCallback(() => {
    if (criticalBlock) {
      setState(prev => {
        const updatedPages = prev.pages.map(page => ({
          ...page,
          blocks: page.blocks.map(block => {
            if (block.id === criticalBlock.id) {
              return { ...block, isBeingRestored: false };
            }
            return block;
          }),
        }));
        return { ...prev, pages: updatedPages };
      });
    }
    setCriticalBlock(null);
  }, [criticalBlock]);

  // Mark welcome as seen
  const markWelcomeSeen = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, hasSeenWelcome: true };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // Reset document
  const resetDocument = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    const newState = createInitialState();
    newState.hasSeenWelcome = true;
    setState(newState);
  }, []);

  // Calculate statistics
  const allBlocks = state.pages.flatMap(p => p.blocks);
  const stats = {
    totalSections: allBlocks.length,
    averageDecay: allBlocks.length > 0 
      ? allBlocks.reduce((sum, b) => sum + b.decayLevel, 0) / allBlocks.length 
      : 0,
    criticalSections: allBlocks.filter(b => b.decayLevel >= DECAY_CONFIG.CRITICAL_THRESHOLD).length,
    documentAge: state.documentAge,
    totalEdits: state.totalEdits,
    totalPages: state.pages.length,
    currentPage: state.currentPageIndex + 1,
  };

  return {
    state,
    currentPage,
    stats,
    criticalBlock,
    isFlipping,
    flipDirection,
    editBlock,
    addBlock,
    deleteBlock,
    addNewPage,
    goToPage,
    updateTitle,
    handleRestorationSuccess,
    handleRestorationFailure,
    startRestoration,
    dismissRestoration,
    markWelcomeSeen,
    resetDocument,
  };
}
