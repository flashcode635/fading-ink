import { AnimatePresence } from 'framer-motion';
import { useDocumentState } from '@/hooks/useDocumentState';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { EditorCanvas } from '@/components/EditorCanvas';
import { StatsPanel } from '@/components/StatsPanel';
import { RestorationMiniGame } from '@/components/RestorationMiniGame';

const Index = () => {
  const {
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
  } = useDocumentState();

  // Start restoration when critical block is detected
  if (criticalBlock && !criticalBlock.isBeingRestored) {
    startRestoration(criticalBlock.id);
  }

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
          />

          {/* Editor Canvas */}
          <main className="py-8 px-4">
            <EditorCanvas
              state={state}
              onEditBlock={editBlock}
              onAddBlock={addBlock}
              onDeleteBlock={deleteBlock}
              onReset={resetDocument}
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
