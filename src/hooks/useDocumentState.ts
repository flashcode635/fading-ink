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
import {
  getDocument,
  saveDocument as saveDocumentToDb,
  createSnapshot,
} from '@/lib/actions';

const AUTO_SAVE_INTERVAL = 5000; // 5 seconds

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

async function loadStateFromDb(documentId?: string | null): Promise<DocumentState | null> {
  if (!documentId) return null;
  
  try {
    const doc = await getDocument(documentId);
    if (doc) {
      // Reconstruct DocumentState from database document
      const content = doc.content;
      return {
        ...content,
        id: doc.id,
        title: doc.title,
        documentAge: doc.documentAge + (Date.now() - new Date(doc.lastSavedAt).getTime()),
        hasSeenWelcome: true,
      };
    }
  } catch (e) {
    console.error('Failed to load document from database:', e);
  }
  return null;
}

interface UseDocumentStateOptions {
  userId?: string | null;
  documentId?: string | null;
  onSaveDialogOpen?: () => void;
}

export function useDocumentState(options: UseDocumentStateOptions = {}) {
  const { userId, documentId, onSaveDialogOpen } = options;
  const [state, setState] = useState<DocumentState>(() => createInitialState());
  const [isLoadingDocument, setIsLoadingDocument] = useState(!!documentId);
  const [criticalBlock, setCriticalBlock] = useState<TextBlock | null>(null);
  const [isFlipping, setIsFlipping] = useState(false);
  const [flipDirection, setFlipDirection] = useState<'left' | 'right'>('right');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const decayIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSnapshotRef = useRef<number>(Date.now());

  // Load document from database on mount
  useEffect(() => {
    if (documentId) {
      setIsLoadingDocument(true);
      loadStateFromDb(documentId)
        .then((loadedState) => {
          if (loadedState) {
            setState(loadedState);
          }
        })
        .finally(() => setIsLoadingDocument(false));
    }
  }, [documentId]);

  const currentPage = state.pages[state.currentPageIndex];
  
  // Calculate average decay level
  const calculateAverageDecay = useCallback((docState: DocumentState) => {
    const allBlocks = docState.pages.flatMap(p => p.blocks);
    if (allBlocks.length === 0) return 0;
    return allBlocks.reduce((sum, b) => sum + b.decayLevel, 0) / allBlocks.length;
  }, []);

  // Debounced save to database
  const saveState = useCallback((newState: DocumentState) => {
    if (!userId) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      const stateToSave = { ...newState, lastSavedAt: Date.now() };
      const currentDecay = calculateAverageDecay(stateToSave);
      
      try {
        await saveDocumentToDb(userId, stateToSave.id, stateToSave.title, stateToSave, {
          currentDecayLevel: currentDecay,
          globalDecayMultiplier: stateToSave.globalDecayMultiplier,
          documentAge: stateToSave.documentAge,
          totalEdits: stateToSave.totalEdits,
          currentPageIndex: stateToSave.currentPageIndex,
        });
      } catch (e) {
        console.error('Failed to save document:', e);
      }
    }, DECAY_CONFIG.SAVE_INTERVAL);
  }, [userId, calculateAverageDecay]);

  // Auto-save snapshot every 5 seconds (for DB persistence)
  useEffect(() => {
    if (!userId) return;
    
    autoSaveIntervalRef.current = setInterval(async () => {
      const now = Date.now();
      const timeSinceLastSnapshot = now - lastSnapshotRef.current;
      
      if (timeSinceLastSnapshot >= AUTO_SAVE_INTERVAL) {
        const currentDecay = calculateAverageDecay(state);
        const stateToSave = { ...state, lastSavedAt: now };
        
        try {
          // Save document to database
          await saveDocumentToDb(userId, stateToSave.id, stateToSave.title, stateToSave, {
            currentDecayLevel: currentDecay,
            globalDecayMultiplier: stateToSave.globalDecayMultiplier,
            documentAge: stateToSave.documentAge,
            totalEdits: stateToSave.totalEdits,
            currentPageIndex: stateToSave.currentPageIndex,
          });
          
          // Create snapshot
          await createSnapshot(state.id, stateToSave, currentDecay, state.documentAge);
          
          lastSnapshotRef.current = now;
          console.log('Auto-saved snapshot at decay level:', currentDecay.toFixed(2));
        } catch (e) {
          console.error('Failed to auto-save:', e);
        }
      }
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [userId, state, calculateAverageDecay]);

  // Handle Ctrl+S keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (onSaveDialogOpen) {
          onSaveDialogOpen();
        } else {
          setShowSaveDialog(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSaveDialogOpen]);

  // Save document with title
  const saveDocument = useCallback(async (title: string) => {
    if (!userId) return;
    
    setIsSaving(true);
    
    const currentDecay = calculateAverageDecay(state);
    const now = Date.now();
    const newState = { 
      ...state, 
      title, 
      lastSavedAt: now 
    };
    
    setState(newState);
    
    // Save to database
    try {
      await saveDocumentToDb(userId, newState.id, title, newState, {
        currentDecayLevel: currentDecay,
        globalDecayMultiplier: newState.globalDecayMultiplier,
        documentAge: newState.documentAge,
        totalEdits: newState.totalEdits,
        currentPageIndex: newState.currentPageIndex,
      });
    } catch (e) {
      console.error('Failed to save document:', e);
    }
    
    setIsSaving(false);
    setShowSaveDialog(false);
  }, [userId, state, calculateAverageDecay]);

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
    const newState = createInitialState();
    newState.hasSeenWelcome = true;
    setState(newState);
  }, []);

  // Load a specific document from database
  const loadDocument = useCallback(async (docId: string) => {
    const loadedState = await loadStateFromDb(docId);
    if (loadedState) {
      setState(loadedState);
    }
  }, []);

  // Create new document
  const createNewDocument = useCallback(() => {
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
    showSaveDialog,
    setShowSaveDialog,
    isSaving,
    isLoadingDocument,
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
    saveDocument,
    loadDocument,
    createNewDocument,
  };
}
