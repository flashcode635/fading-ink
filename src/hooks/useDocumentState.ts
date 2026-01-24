import { useState, useEffect, useCallback, useRef } from 'react';
import { DocumentState, TextBlock, DECAY_CONFIG } from '@/types/document';
import { 
  generateId, 
  calculateDecayRate, 
  createNewBlock, 
  generateRandomBruise,
  generateRandomStain 
} from '@/lib/decay';

const STORAGE_KEY = 'aging-document-state';

function createInitialState(): DocumentState {
  const now = Date.now();
  return {
    id: generateId(),
    title: 'Untitled Document',
    blocks: [createNewBlock(0, '')],
    totalEdits: 0,
    documentAge: 0,
    createdAt: now,
    globalDecayMultiplier: 1,
    backgroundYellowing: 0,
    bruises: [],
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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const decayIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
        const decayRate = calculateDecayRate(prev.blocks.length);
        
        const updatedBlocks = prev.blocks.map(block => {
          if (block.isBeingRestored) return block;
          
          const timeSinceEdit = (now - block.lastEditedAt) / 1000;
          const decayIncrement = decayRate * (DECAY_CONFIG.DECAY_INTERVAL / 1000) * 
                                  (1 + timeSinceEdit / 60); // Accelerate with time
          
          let newDecayLevel = Math.min(
            100, 
            Math.max(block.permanentDecayFloor, block.decayLevel + decayIncrement)
          );

          // Add random stains as decay increases
          let newStains = [...block.ageStains];
          if (newDecayLevel > 40 && Math.random() < 0.05) {
            newStains.push(generateRandomStain(block.id));
          }

          return {
            ...block,
            decayLevel: newDecayLevel,
            ageStains: newStains,
          };
        });

        // Check for critical blocks (but don't interrupt if already restoring)
        const critical = updatedBlocks.find(
          b => b.decayLevel >= DECAY_CONFIG.CRITICAL_THRESHOLD && 
               !b.isBeingRestored &&
               b.content.length > 0
        );
        if (critical && !criticalBlock) {
          setCriticalBlock(critical);
        }

        // Slowly increase background yellowing
        const newYellowing = Math.min(100, prev.backgroundYellowing + 0.02);

        const newState = {
          ...prev,
          blocks: updatedBlocks,
          documentAge: now - prev.createdAt,
          backgroundYellowing: newYellowing,
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
      
      const updatedBlocks = prev.blocks.map(block => {
        if (block.id === blockId) {
          // Reset decay on edited block
          return {
            ...block,
            content,
            originalContent: content || block.originalContent,
            lastEditedAt: now,
            decayLevel: Math.max(block.permanentDecayFloor, 0),
          };
        } else {
          // Accelerate decay on other blocks
          const decayBoost = DECAY_CONFIG.EDIT_ACCELERATION + Math.random() * 2;
          return {
            ...block,
            decayLevel: Math.min(100, block.decayLevel + decayBoost),
          };
        }
      });

      // Add new bruises when editing
      let newBruises = [...prev.bruises];
      if (Math.random() < 0.3) {
        newBruises.push(generateRandomBruise());
        if (Math.random() < 0.3) {
          newBruises.push(generateRandomBruise());
        }
      }

      const newState = {
        ...prev,
        blocks: updatedBlocks,
        totalEdits: prev.totalEdits + 1,
        backgroundYellowing: Math.min(100, prev.backgroundYellowing + DECAY_CONFIG.YELLOWING_INCREMENT),
        bruises: newBruises,
      };

      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // Add a new block
  const addBlock = useCallback(() => {
    setState(prev => {
      const newBlock = createNewBlock(prev.blocks.length);
      const newState = {
        ...prev,
        blocks: [...prev.blocks, newBlock],
      };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // Delete a block
  const deleteBlock = useCallback((blockId: string) => {
    setState(prev => {
      const newBlocks = prev.blocks
        .filter(b => b.id !== blockId)
        .map((b, i) => ({ ...b, position: i }));
      
      const newState = {
        ...prev,
        blocks: newBlocks.length > 0 ? newBlocks : [createNewBlock(0)],
      };
      saveState(newState);
      return newState;
    });
  }, [saveState]);

  // Handle restoration success
  const handleRestorationSuccess = useCallback((blockId: string) => {
    setState(prev => {
      const updatedBlocks = prev.blocks.map(block => {
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
      });

      const newState = {
        ...prev,
        blocks: updatedBlocks,
      };
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
      
      const updatedBlocks = prev.blocks.map(block => {
        if (block.id === blockId) {
          return {
            ...block,
            permanentDecayFloor: Math.min(50, block.permanentDecayFloor + penalty),
            isBeingRestored: false,
          };
        }
        return block;
      });

      const newState = {
        ...prev,
        blocks: updatedBlocks,
      };
      saveState(newState);
      return newState;
    });
    setCriticalBlock(null);
  }, [saveState]);

  // Start restoration (mark block as being restored)
  const startRestoration = useCallback((blockId: string) => {
    setState(prev => {
      const updatedBlocks = prev.blocks.map(block => {
        if (block.id === blockId) {
          return { ...block, isBeingRestored: true };
        }
        return block;
      });
      return { ...prev, blocks: updatedBlocks };
    });
  }, []);

  // Dismiss restoration without penalty (escape)
  const dismissRestoration = useCallback(() => {
    if (criticalBlock) {
      setState(prev => {
        const updatedBlocks = prev.blocks.map(block => {
          if (block.id === criticalBlock.id) {
            return { ...block, isBeingRestored: false };
          }
          return block;
        });
        return { ...prev, blocks: updatedBlocks };
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
  const stats = {
    totalSections: state.blocks.length,
    averageDecay: state.blocks.reduce((sum, b) => sum + b.decayLevel, 0) / state.blocks.length,
    criticalSections: state.blocks.filter(b => b.decayLevel >= DECAY_CONFIG.CRITICAL_THRESHOLD).length,
    documentAge: state.documentAge,
    totalEdits: state.totalEdits,
    backgroundYellowing: state.backgroundYellowing,
  };

  return {
    state,
    stats,
    criticalBlock,
    editBlock,
    addBlock,
    deleteBlock,
    handleRestorationSuccess,
    handleRestorationFailure,
    startRestoration,
    dismissRestoration,
    markWelcomeSeen,
    resetDocument,
  };
}
