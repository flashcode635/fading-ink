// React hooks for managing component state and side effects
import { useState, useEffect, useCallback, useRef } from 'react';
// Type definitions for document structure and decay configuration
import { DocumentState, TextBlock, DocumentPage, DECAY_CONFIG } from '@/types/document';
// Utility functions for decay calculations and block/page creation
import {
  generateId,
  calculateDecayRate,
  createNewBlock,
  createNewPage,
  generateRandomBruise,
  generateRandomStain
} from '@/lib/decay';
// Database operations for saving/loading documents
import {
  getDocument,
  saveDocument as saveDocumentToDb,
  createSnapshot,
} from '@/lib/actions';

// Auto-save interval: saves document state every 5 seconds
const AUTO_SAVE_INTERVAL = 5000;

/**
 * Creates initial document state with default values
 * @returns New DocumentState object with empty first page
 */
function createInitialState(): DocumentState {
  const now = Date.now(); // Current timestamp for creation time
  return {
    id: generateId(), // Unique identifier for the document
    title: 'Untitled Document', // Default title
    pages: [createNewPage(1)], // Start with one empty page
    currentPageIndex: 0, // Currently viewing first page
    totalEdits: 0, // No edits yet
    documentAge: 0, // Document just created
    createdAt: now, // Timestamp when document was created
    globalDecayMultiplier: 1, // Normal decay rate (can be modified)
    lastSavedAt: now, // Last save timestamp
    hasSeenWelcome: false, // Welcome screen not shown yet
  };
}

/**
 * Loads document state from database
 * @param documentId - ID of document to load, or null for new document
 * @returns DocumentState if found, null otherwise
 */
async function loadStateFromDb(documentId?: string | null): Promise<DocumentState | null> {
  if (!documentId) return null; // No document ID provided, return null

  try {
    const doc = await getDocument(documentId); // Fetch document from database
    if (doc) {
      const content = doc.content; // Extract document content
      return {
        ...content, // Spread all content properties
        id: doc.id, // Use database document ID
        title: doc.title, // Use database document title
        // Calculate document age: original age + time since last save
        documentAge: doc.documentAge + (Date.now() - new Date(doc.lastSavedAt).getTime()),
        hasSeenWelcome: true, // Mark welcome as seen for loaded documents
      };
    }
  } catch (e) {
    console.error('Failed to load document from database:', e);
  }
  return null; // Return null if loading failed
}

// Options interface for useDocumentState hook
interface UseDocumentStateOptions {
  userId?: string | null; // User ID for saving documents
  documentId?: string | null; // Document ID to load
  onSaveDialogOpen?: () => void; // Callback when save dialog opens
}

/**
 * Main hook for managing document state, decay, and persistence
 * Handles all document operations: editing, saving, decay calculation, restoration
 */
export function useDocumentState(options: UseDocumentStateOptions = {}) {
  // Extract options with default values
  const { userId, documentId, onSaveDialogOpen } = options;

  // Main document state - contains all pages, blocks, and metadata
  const [state, setState] = useState<DocumentState>(() => createInitialState());
  // Loading state - true while fetching document from database
  const [isLoadingDocument, setIsLoadingDocument] = useState(!!documentId);
  // Critical block - block that has reached critical decay threshold (triggers mini-game)
  const [criticalBlock, setCriticalBlock] = useState<TextBlock | null>(null);
  // Page flip animation state
  const [isFlipping, setIsFlipping] = useState(false);
  // Direction of page flip animation (left or right)
  const [flipDirection, setFlipDirection] = useState<'left' | 'right'>('right');
  // Save dialog visibility state
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  // Saving in progress state
  const [isSaving, setIsSaving] = useState(false);

  // Refs for managing intervals and avoiding stale closures
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null); // Debounced save timeout
  const decayIntervalRef = useRef<NodeJS.Timeout | null>(null); // Decay calculation interval
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null); // Auto-save interval
  const lastSnapshotRef = useRef<number>(Date.now()); // Last snapshot timestamp
  const criticalBlockRef = useRef<TextBlock | null>(null); // Current critical block (ref to avoid stale closure)
  const saveStateRef = useRef<((newState: DocumentState) => void) | null>(null); // Save function ref

  // Load document from database when documentId changes
  useEffect(() => {
    if (documentId) {
      setIsLoadingDocument(true); // Set loading state
      loadStateFromDb(documentId)
        .then((loadedState) => {
          if (loadedState) {
            setState(loadedState); // Update state with loaded document
          }
        })
        .finally(() => setIsLoadingDocument(false)); // Clear loading state
    }
  }, [documentId]); // Re-run when documentId changes

  // Get current page from state
  const currentPage = state.pages[state.currentPageIndex];

  /**
   * Calculates average decay level across all blocks in document
   * @param docState - Document state to calculate average from
   * @returns Average decay level (0-100)
   */
  const calculateAverageDecay = useCallback((docState: DocumentState) => {
    const allBlocks = docState.pages.flatMap(p => p.blocks); // Flatten all blocks from all pages
    if (allBlocks.length === 0) return 0; // No blocks, return 0
    // Sum all decay levels and divide by block count
    return allBlocks.reduce((sum, b) => sum + b.decayLevel, 0) / allBlocks.length;
  }, []); // No dependencies - pure calculation function

  /**
   * Debounced save to database - delays save to avoid excessive database writes
   * @param newState - Document state to save
   */
  const saveState = useCallback((newState: DocumentState) => {
    if (!userId) return; // No user ID, skip save

    // Clear existing timeout if one exists
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    // Set new timeout to save after delay
    saveTimeoutRef.current = setTimeout(async () => {
      const stateToSave = { ...newState, lastSavedAt: Date.now() }; // Add save timestamp
      const currentDecay = calculateAverageDecay(stateToSave); // Calculate current average decay

      try {
        // Save document to database with metadata
        await saveDocumentToDb(userId, stateToSave.id, stateToSave.title, stateToSave, {
          currentDecayLevel: currentDecay, // Average decay level
          globalDecayMultiplier: stateToSave.globalDecayMultiplier, // Decay rate multiplier
          documentAge: stateToSave.documentAge, // Document age in milliseconds
          totalEdits: stateToSave.totalEdits, // Total number of edits
          currentPageIndex: stateToSave.currentPageIndex, // Currently viewed page
        });
      } catch (e) {
        console.error('Failed to save document:', e);
      }
    }, DECAY_CONFIG.SAVE_INTERVAL); // Wait for save interval before saving
  }, [userId, calculateAverageDecay]); // Re-create when userId or calculateAverageDecay changes

  // Keep saveStateRef synchronized with saveState function
  useEffect(() => {
    saveStateRef.current = saveState; // Update ref when saveState changes
  }, [saveState]);

  // Keep criticalBlockRef synchronized with criticalBlock state
  useEffect(() => {
    criticalBlockRef.current = criticalBlock; // Update ref when criticalBlock changes
  }, [criticalBlock]);

  // Auto-save snapshot every 5 seconds for database persistence
  useEffect(() => {
    if (!userId) return; // No user ID, skip auto-save

    // Set up interval to auto-save periodically
    autoSaveIntervalRef.current = setInterval(async () => {
      const now = Date.now(); // Current timestamp
      const timeSinceLastSnapshot = now - lastSnapshotRef.current; // Time since last snapshot

      // Only save if enough time has passed
      if (timeSinceLastSnapshot >= AUTO_SAVE_INTERVAL) {
        const currentDecay = calculateAverageDecay(state); // Calculate average decay
        const stateToSave = { ...state, lastSavedAt: now }; // Add save timestamp

        try {
          // Save document to database
          await saveDocumentToDb(userId, stateToSave.id, stateToSave.title, stateToSave, {
            currentDecayLevel: currentDecay,
            globalDecayMultiplier: stateToSave.globalDecayMultiplier,
            documentAge: stateToSave.documentAge,
            totalEdits: stateToSave.totalEdits,
            currentPageIndex: stateToSave.currentPageIndex,
          });

          // Create snapshot for document history
          await createSnapshot(state.id, stateToSave, currentDecay, state.documentAge);

          lastSnapshotRef.current = now; // Update last snapshot time
          console.log('Auto-saved snapshot at decay level:', currentDecay.toFixed(2));
        } catch (e) {
          console.error('Failed to auto-save:', e);
        }
      }
    }, AUTO_SAVE_INTERVAL); // Run every 5 seconds

    // Cleanup: clear interval on unmount
    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [userId, state, calculateAverageDecay]); // Re-run when these change

  // Handle Ctrl+S (or Cmd+S on Mac) keyboard shortcut for save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if Ctrl (Windows) or Cmd (Mac) + S is pressed
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault(); // Prevent browser's default save dialog
        // Open save dialog via callback or state
        if (onSaveDialogOpen) {
          onSaveDialogOpen();
        } else {
          setShowSaveDialog(true);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown); // Add event listener
    return () => window.removeEventListener('keydown', handleKeyDown); // Cleanup on unmount
  }, [onSaveDialogOpen]); // Re-run when callback changes

  /**
   * Saves document with a specific title
   * @param title - Title to save document with
   */
  const saveDocument = useCallback(async (title: string) => {
    if (!userId) return; // No user ID, skip save

    setIsSaving(true); // Set saving state

    const currentDecay = calculateAverageDecay(state); // Calculate average decay
    const now = Date.now(); // Current timestamp
    const newState = {
      ...state, // Spread existing state
      title, // Update title
      lastSavedAt: now // Update save timestamp
    };

    setState(newState); // Update state

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

    setIsSaving(false); // Clear saving state
    setShowSaveDialog(false); // Close save dialog
  }, [userId, state, calculateAverageDecay]); // Re-create when dependencies change

  // Decay calculation loop - runs every 2 seconds to update decay levels
  useEffect(() => {
    // Set up interval to calculate decay periodically
    decayIntervalRef.current = setInterval(() => {
      setState(prev => {
        const now = Date.now(); // Current timestamp for calculations

        // Map through all pages to update decay
        const updatedPages = prev.pages.map(page => {
          const totalBlocks = page.blocks.length; // Count blocks on this page
          const decayRate = calculateDecayRate(totalBlocks); // Calculate decay rate based on block count

          // Map through all blocks to update their decay levels
          const updatedBlocks = page.blocks.map(block => {
            // Skip blocks that are being restored or are empty
            if (block.isBeingRestored || block.content.trim().length === 0) return block;

            // Calculate time since last edit in seconds
            const timeSinceEdit = (now - block.lastEditedAt) / 1000;
            // Base increment: decay rate * interval duration (converted to seconds)
            const baseIncrement = decayRate * (DECAY_CONFIG.DECAY_INTERVAL / 1000);
            // Acceleration factor: increases decay over time (older edits decay faster)
            const accelerationFactor = 1 + timeSinceEdit / 120;
            // Calculate decay increment with acceleration
            let decayIncrement = baseIncrement * accelerationFactor;

            // Ensure minimum increment to prevent decay from getting stuck at 0
            // This is especially important right after edits when timeSinceEdit is very small
            const minIncrement = 0.01; // Small but ensures progress
            decayIncrement = Math.max(minIncrement, decayIncrement); // Use minimum if calculated value is smaller

            // Calculate new decay level:
            // - Cap at 100 (maximum decay)
            // - Ensure it's at least permanentDecayFloor (minimum after failed restoration)
            // - Add decay increment to current level
            let newDecayLevel = Math.min(
              100, // Maximum decay level
              Math.max(block.permanentDecayFloor, block.decayLevel + decayIncrement) // Minimum floor or current + increment
            );

            // Add random age stains as decay increases (visual effect)
            let newStains = [...block.ageStains]; // Copy existing stains
            // 3% chance to add new stain when decay > 50%
            if (newDecayLevel > 50 && Math.random() < 0.03) {
              newStains.push(generateRandomStain(block.id)); // Add random stain
            }

            // Return updated block with new decay level and stains
            return {
              ...block, // Spread existing block properties
              decayLevel: newDecayLevel, // Update decay level
              ageStains: newStains, // Update stains array
            };
          });

          // Check for critical blocks (decay >= 89%) that need restoration
          const critical = updatedBlocks.find(
            b => b.decayLevel >= DECAY_CONFIG.CRITICAL_THRESHOLD && // Decay at critical threshold
              !b.isBeingRestored && // Not already being restored
              b.content.length > 0 // Has content to restore
          );
          
          // Monitor existing critical block - clear if decay dropped below threshold
          if (criticalBlockRef.current) {
            const currentCriticalBlock = updatedBlocks.find(
              b => b.id === criticalBlockRef.current?.id
            );
            if (!currentCriticalBlock || 
                currentCriticalBlock.decayLevel < DECAY_CONFIG.CRITICAL_THRESHOLD ||
                currentCriticalBlock.isBeingRestored ||
                currentCriticalBlock.content.length === 0) {
              criticalBlockRef.current = null;
              setCriticalBlock(null);
            }
          }
          
          // If critical block found and not already tracking one, set it
          if (critical && !criticalBlockRef.current) {
            criticalBlockRef.current = critical; // Update ref
            setCriticalBlock(critical); // Update state (triggers mini-game)
          }

          // Slowly increase background yellowing (visual aging effect)
          const newYellowing = Math.min(100, page.backgroundYellowing + 0.015);

          // Return updated page with new blocks and yellowing
          return {
            ...page, // Spread existing page properties
            blocks: updatedBlocks, // Update blocks array
            backgroundYellowing: newYellowing, // Update yellowing level
          };
        });

        // Create new state with updated pages and document age
        const newState = {
          ...prev, // Spread existing state
          pages: updatedPages, // Update pages array
          documentAge: now - prev.createdAt, // Calculate document age in milliseconds
        };

        // Save state to database using ref (avoids dependency issues)
        if (saveStateRef.current) {
          saveStateRef.current(newState); // Call save function via ref
        }
        return newState; // Return new state
      });
    }, DECAY_CONFIG.DECAY_INTERVAL); // Run every 2 seconds

    // Cleanup: clear interval on unmount
    return () => {
      if (decayIntervalRef.current) {
        clearInterval(decayIntervalRef.current); // Clear interval
        decayIntervalRef.current = null; // Reset ref
      }
    };
  }, []); // Empty dependency array - interval should run continuously

  /**
   * Edits a block's content and triggers decay acceleration on other blocks
   * @param blockId - ID of block to edit
   * @param content - New content for the block
   */
  const editBlock = useCallback((blockId: string, content: string) => {
    setState(prev => {
      const now = Date.now(); // Current timestamp

      // Map through all pages
      const updatedPages = prev.pages.map((page, pageIndex) => {
        const isCurrentPage = pageIndex === prev.currentPageIndex; // Check if this is the current page

        // Map through all blocks on this page
        const updatedBlocks = page.blocks.map(block => {
          if (block.id === blockId) {
            // This is the edited block - reset its decay
            // Clear critical block state if this was the critical block
            if (criticalBlockRef.current?.id === blockId) {
              criticalBlockRef.current = null;
              setCriticalBlock(null);
            }
            
            return {
              ...block, // Spread existing block properties
              content, // Update content
              originalContent: content || block.originalContent, // Update original content if provided
              lastEditedAt: now, // Update edit timestamp
              decayLevel: Math.max(block.permanentDecayFloor, 0), // Reset decay to 0 (or floor)
            };
          } else if (isCurrentPage) {
            // Other blocks on current page - accelerate their decay
            const decayBoost = DECAY_CONFIG.EDIT_ACCELERATION + Math.random() * 2; // Random boost (4-6)
            return {
              ...block, // Spread existing block properties
              decayLevel: Math.min(100, block.decayLevel + decayBoost), // Increase decay (cap at 100)
            };
          }
          return block; // Blocks on other pages unchanged
        });

        // Add random bruises when editing (visual effect)
        let newBruises = [...page.bruises]; // Copy existing bruises
        // 20% chance to add bruise when editing current page
        if (isCurrentPage && Math.random() < 0.2) {
          newBruises.push(generateRandomBruise()); // Add random bruise
        }

        // Return updated page
        return {
          ...page, // Spread existing page properties
          blocks: updatedBlocks, // Update blocks array
          bruises: newBruises, // Update bruises array
          // Increase background yellowing on current page
          backgroundYellowing: isCurrentPage
            ? Math.min(100, page.backgroundYellowing + DECAY_CONFIG.YELLOWING_INCREMENT)
            : page.backgroundYellowing, // Other pages unchanged
        };
      });

      // Create new state with updated pages and incremented edit count
      const newState = {
        ...prev, // Spread existing state
        pages: updatedPages, // Update pages array
        totalEdits: prev.totalEdits + 1, // Increment edit counter
      };

      saveState(newState); // Save to database
      return newState; // Return new state
    });
  }, [saveState]); // Re-create when saveState changes

  /**
   * Adds a new empty block to the current page
   */
  const addBlock = useCallback(() => {
    setState(prev => {
      const updatedPages = [...prev.pages]; // Copy pages array
      const currentPage = updatedPages[prev.currentPageIndex]; // Get current page
      const newBlock = createNewBlock(currentPage.blocks.length); // Create new block at end

      // Update current page with new block
      updatedPages[prev.currentPageIndex] = {
        ...currentPage, // Spread existing page properties
        blocks: [...currentPage.blocks, newBlock], // Add new block to blocks array
      };

      const newState = { ...prev, pages: updatedPages }; // Create new state
      saveState(newState); // Save to database
      return newState; // Return new state
    });
  }, [saveState]); // Re-create when saveState changes

  /**
   * Deletes a block from the current page
   * @param blockId - ID of block to delete
   */
  const deleteBlock = useCallback((blockId: string) => {
    setState(prev => {
      const updatedPages = [...prev.pages]; // Copy pages array
      const currentPage = updatedPages[prev.currentPageIndex]; // Get current page

      // Filter out deleted block and re-index remaining blocks
      const newBlocks = currentPage.blocks
        .filter(b => b.id !== blockId) // Remove block with matching ID
        .map((b, i) => ({ ...b, position: i })); // Re-index positions

      // Update current page with filtered blocks (or create empty block if all deleted)
      updatedPages[prev.currentPageIndex] = {
        ...currentPage, // Spread existing page properties
        blocks: newBlocks.length > 0 ? newBlocks : [createNewBlock(0)], // Keep at least one block
      };

      const newState = { ...prev, pages: updatedPages }; // Create new state
      saveState(newState); // Save to database
      return newState; // Return new state
    });
  }, [saveState]); // Re-create when saveState changes

  /**
   * Adds a new page with flip animation
   */
  const addNewPage = useCallback(() => {
    setFlipDirection('right'); // Set flip direction to right
    setIsFlipping(true); // Start flip animation

    // Wait for animation, then add page
    setTimeout(() => {
      setState(prev => {
        const newPage = createNewPage(prev.pages.length + 1); // Create new page
        const newState = {
          ...prev, // Spread existing state
          pages: [...prev.pages, newPage], // Add new page to pages array
          currentPageIndex: prev.pages.length, // Navigate to new page
        };
        saveState(newState); // Save to database
        return newState; // Return new state
      });

      // End flip animation after short delay
      setTimeout(() => setIsFlipping(false), 100);
    }, 600); // Wait 600ms for flip animation
  }, [saveState]); // Re-create when saveState changes

  /**
   * Navigates to a specific page with flip animation
   * @param index - Page index to navigate to
   */
  const goToPage = useCallback((index: number) => {
    // Validate index - must be valid and different from current
    if (index === state.currentPageIndex || index < 0 || index >= state.pages.length) return;

    // Set flip direction based on navigation direction
    setFlipDirection(index > state.currentPageIndex ? 'right' : 'left');
    setIsFlipping(true); // Start flip animation

    // Wait for animation, then change page
    setTimeout(() => {
      setState(prev => ({ ...prev, currentPageIndex: index })); // Update current page index
      setTimeout(() => setIsFlipping(false), 100); // End flip animation
    }, 600); // Wait 600ms for flip animation
  }, [state.currentPageIndex, state.pages.length]); // Re-create when page index or count changes

  /**
   * Updates document title
   * @param title - New title for the document
   */
  const updateTitle = useCallback((title: string) => {
    setState(prev => {
      const newState = { ...prev, title }; // Update title
      saveState(newState); // Save to database
      return newState; // Return new state
    });
  }, [saveState]); // Re-create when saveState changes

  /**
   * Handles successful restoration of a critical block
   * @param blockId - ID of block that was successfully restored
   */
  const handleRestorationSuccess = useCallback((blockId: string) => {
    setState(prev => {
      // Map through all pages to find and update restored block
      const updatedPages = prev.pages.map(page => ({
        ...page, // Spread existing page properties
        blocks: page.blocks.map(block => {
          if (block.id === blockId) {
            // This is the restored block - reset its decay completely
            return {
              ...block, // Spread existing block properties
              decayLevel: 0, // Reset decay to 0
              permanentDecayFloor: 0, // Reset floor to 0
              isBeingRestored: false, // Clear restoration flag
              lastEditedAt: Date.now(), // Update edit timestamp
            };
          }
          return block; // Other blocks unchanged
        }),
      }));

      const newState = { ...prev, pages: updatedPages }; // Create new state
      saveState(newState); // Save to database
      return newState; // Return new state
    });
    criticalBlockRef.current = null; // Clear critical block ref
    setCriticalBlock(null); // Clear critical block state
  }, [saveState]); // Re-create when saveState changes

  /**
   * Handles failed restoration of a critical block
   * @param blockId - ID of block that failed restoration
   */
  const handleRestorationFailure = useCallback((blockId: string) => {
    setState(prev => {
      // Calculate random penalty for failed restoration (5-10 decay points)
      const penalty = DECAY_CONFIG.FAILED_RESTORATION_PENALTY_MIN +
        Math.random() * (DECAY_CONFIG.FAILED_RESTORATION_PENALTY_MAX -
          DECAY_CONFIG.FAILED_RESTORATION_PENALTY_MIN);

      // Map through all pages to find and update failed block
      const updatedPages = prev.pages.map(page => ({
        ...page, // Spread existing page properties
        blocks: page.blocks.map(block => {
          if (block.id === blockId) {
            // This is the failed block - increase its permanent decay floor
            return {
              ...block, // Spread existing block properties
              permanentDecayFloor: Math.min(50, block.permanentDecayFloor + penalty), // Increase floor (cap at 50)
              isBeingRestored: false, // Clear restoration flag
            };
          }
          return block; // Other blocks unchanged
        }),
      }));

      const newState = { ...prev, pages: updatedPages }; // Create new state
      saveState(newState); // Save to database
      return newState; // Return new state
    });
    criticalBlockRef.current = null; // Clear critical block ref
    setCriticalBlock(null); // Clear critical block state
  }, [saveState]); // Re-create when saveState changes

  /**
   * Starts restoration process for a critical block
   * @param blockId - ID of block to start restoring
   */
  const startRestoration = useCallback((blockId: string) => {
    setState(prev => {
      // Map through all pages to find and mark block as being restored
      const updatedPages = prev.pages.map(page => ({
        ...page, // Spread existing page properties
        blocks: page.blocks.map(block => {
          if (block.id === blockId) {
            const updatedBlock = { ...block, isBeingRestored: true }; // Mark as being restored
            // Update ref if this is the current critical block
            if (criticalBlockRef.current?.id === blockId) {
              criticalBlockRef.current = updatedBlock; // Update ref
            }
            return updatedBlock; // Return updated block
          }
          return block; // Other blocks unchanged
        }),
      }));
      return { ...prev, pages: updatedPages }; // Return new state
    });
  }, []); // No dependencies - pure function

  /**
   * Dismisses restoration mini-game without restoring
   */
  const dismissRestoration = useCallback(() => {
    if (criticalBlockRef.current) {
      setState(prev => {
        // Map through all pages to find and unmark block
        const updatedPages = prev.pages.map(page => ({
          ...page, // Spread existing page properties
          blocks: page.blocks.map(block => {
            if (block.id === criticalBlockRef.current?.id) {
              return { ...block, isBeingRestored: false }; // Clear restoration flag
            }
            return block; // Other blocks unchanged
          }),
        }));
        return { ...prev, pages: updatedPages }; // Return new state
      });
    }
    criticalBlockRef.current = null; // Clear critical block ref
    setCriticalBlock(null); // Clear critical block state
  }, []); // No dependencies - pure function

  /**
   * Marks welcome screen as seen
   */
  const markWelcomeSeen = useCallback(() => {
    setState(prev => {
      const newState = { ...prev, hasSeenWelcome: true }; // Mark welcome as seen
      saveState(newState); // Save to database
      return newState; // Return new state
    });
  }, [saveState]); // Re-create when saveState changes

  /**
   * Resets document to initial state
   */
  const resetDocument = useCallback(() => {
    const newState = createInitialState(); // Create fresh initial state
    newState.hasSeenWelcome = true; // Mark welcome as seen
    setState(newState); // Update state
  }, []); // No dependencies - pure function

  /**
   * Loads a specific document from database
   * @param docId - ID of document to load
   */
  const loadDocument = useCallback(async (docId: string) => {
    const loadedState = await loadStateFromDb(docId); // Load from database
    if (loadedState) {
      setState(loadedState); // Update state with loaded document
    }
  }, []); // No dependencies - pure function

  /**
   * Creates a new empty document
   */
  const createNewDocument = useCallback(() => {
    const newState = createInitialState(); // Create fresh initial state
    newState.hasSeenWelcome = true; // Mark welcome as seen
    setState(newState); // Update state
  }, []); // No dependencies - pure function

  // Calculate statistics for display
  const allBlocks = state.pages.flatMap(p => p.blocks); // Flatten all blocks from all pages
  const stats = {
    totalSections: allBlocks.length, // Total number of blocks
    // Average decay: sum of all decay levels divided by block count
    averageDecay: allBlocks.length > 0
      ? allBlocks.reduce((sum, b) => sum + b.decayLevel, 0) / allBlocks.length
      : 0, // Return 0 if no blocks
    // Count blocks at or above critical threshold (85%)
    criticalSections: allBlocks.filter(b => b.decayLevel >= DECAY_CONFIG.CRITICAL_THRESHOLD).length,
    documentAge: state.documentAge, // Document age in milliseconds
    totalEdits: state.totalEdits, // Total number of edits
    totalPages: state.pages.length, // Total number of pages
    currentPage: state.currentPageIndex + 1, // Current page number (1-indexed)
  };

  // Return all state and functions for component use
  return {
    state, // Full document state
    currentPage, // Currently viewed page
    stats, // Calculated statistics
    criticalBlock, // Block that needs restoration
    isFlipping, // Page flip animation state
    flipDirection, // Direction of page flip
    showSaveDialog, // Save dialog visibility
    setShowSaveDialog, // Function to toggle save dialog
    isSaving, // Saving in progress state
    isLoadingDocument, // Document loading state
    editBlock, // Function to edit a block
    addBlock, // Function to add a new block
    deleteBlock, // Function to delete a block
    addNewPage, // Function to add a new page
    goToPage, // Function to navigate to a page
    updateTitle, // Function to update document title
    handleRestorationSuccess, // Function to handle successful restoration
    handleRestorationFailure, // Function to handle failed restoration
    startRestoration, // Function to start restoration
    dismissRestoration, // Function to dismiss restoration
    markWelcomeSeen, // Function to mark welcome as seen
    resetDocument, // Function to reset document
    saveDocument, // Function to save document with title
    loadDocument, // Function to load a document
    createNewDocument, // Function to create new document
  };
}
