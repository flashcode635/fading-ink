import { useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useDocumentState } from '@/hooks/useDocumentState';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { EditorCanvas } from '@/components/EditorCanvas';
import { StatsPanel } from '@/components/StatsPanel';
import { RestorationMiniGame } from '@/components/RestorationMiniGame';

const Index = () => {
  const {
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
  } = useDocumentState();

  // Start restoration when critical block is detected - must be in useEffect
  useEffect(() => {
    if (criticalBlock && !criticalBlock.isBeingRestored) {
      startRestoration(criticalBlock.id);
    }
  }, [criticalBlock, startRestoration]);

  return (
    <div className="min-h-screen bg-background">
      {/* Welcome Screen */}
      <AnimatePresence>
        {!state.hasSeenWelcome && (
          <WelcomeScreen onStart={markWelcomeSeen} />
        )}
      </AnimatePresence>

      {/* Main Editor */}
      {state.hasSeenWelcome && (
        <>
          {/* Stats Panel */}
          <StatsPanel
            totalSections={stats.totalSections}
            averageDecay={stats.averageDecay}
            criticalSections={stats.criticalSections}
            documentAge={stats.documentAge}
            totalEdits={stats.totalEdits}
            totalPages={stats.totalPages}
            currentPage={stats.currentPage}
          />

          {/* Editor Canvas */}
          <main className="py-6 px-4">
            <EditorCanvas
              title={state.title}
              currentPage={currentPage}
              pages={state.pages}
              currentPageIndex={state.currentPageIndex}
              isFlipping={isFlipping}
              flipDirection={flipDirection}
              onEditBlock={editBlock}
              onAddBlock={addBlock}
              onDeleteBlock={deleteBlock}
              onAddNewPage={addNewPage}
              onGoToPage={goToPage}
              onUpdateTitle={updateTitle}
              onReset={resetDocument}
              createdAt={state.createdAt}
            />
          </main>

          {/* Restoration Mini-Game */}
          <AnimatePresence>
            {criticalBlock && criticalBlock.isBeingRestored && (
              <RestorationMiniGame
                block={criticalBlock}
                onSuccess={() => handleRestorationSuccess(criticalBlock.id)}
                onFailure={() => handleRestorationFailure(criticalBlock.id)}
                onDismiss={dismissRestoration}
              />
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default Index;
