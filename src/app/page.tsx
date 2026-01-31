'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useDocumentState } from '@/hooks/useDocumentState';
import { useUser } from '@/context/UserContext';
import { LoginScreen } from '@/components/LoginScreen';
import { DocumentList } from '@/components/DocumentList';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { EditorCanvas } from '@/components/EditorCanvas';
import { StatsPanel } from '@/components/StatsPanel';
import { RestorationMiniGame } from '@/components/RestorationMiniGame';
import { SaveDialog } from '@/components/SaveDialog';

export default function HomePage() {
  const { user, isLoggedIn, isLoading: isUserLoading } = useUser();
  const [currentDocumentId, setCurrentDocumentId] = useState<string | null>(null);
  const [showDocumentList, setShowDocumentList] = useState(true);

  const {
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
  } = useDocumentState({
    userId: user?.id,
    documentId: currentDocumentId,
  });

  // Handle document selection
  const handleSelectDocument = (docId: string | null) => {
    if (docId) {
      loadDocument(docId);
      setCurrentDocumentId(docId);
    }
    setShowDocumentList(false);
  };

  // Handle new document creation
  const handleNewDocument = () => {
    createNewDocument();
    setCurrentDocumentId(null);
    setShowDocumentList(false);
  };

  // Show document list when user logs in
  useEffect(() => {
    if (isLoggedIn) {
      setShowDocumentList(true);
    }
  }, [isLoggedIn]);

  // Start restoration when critical block is detected - must be in useEffect
  useEffect(() => {
    if (criticalBlock && !criticalBlock.isBeingRestored) {
      startRestoration(criticalBlock.id);
    }
  }, [criticalBlock, startRestoration]);

  // Show loading state while checking user session
  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not logged in, show login screen
  if (!isLoggedIn) {
    return <LoginScreen />;
  }

  // If logged in but showing document list
  if (showDocumentList) {
    return (
      <DocumentList
        onSelectDocument={handleSelectDocument}
        onNewDocument={handleNewDocument}
      />
    );
  }

  // Show loading state while loading document
  if (isLoadingDocument) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
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
              onBackToList={() => setShowDocumentList(true)}
            />
          </main>

          {/* Save Dialog */}
          <SaveDialog
            open={showSaveDialog}
            onOpenChange={setShowSaveDialog}
            currentTitle={state.title}
            onSave={saveDocument}
            isSaving={isSaving}
          />

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
}
