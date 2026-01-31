'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Plus, Trash2, Clock, AlertTriangle, LogOut, RefreshCw } from 'lucide-react';
import { useUser } from '@/context/UserContext';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getUserDocuments, deleteDocument as deleteDocumentAction, type DocumentSummary } from '@/lib/actions';

interface DocumentListProps {
  onSelectDocument: (documentId: string | null) => void;
  onNewDocument: () => void;
}

export function DocumentList({ onSelectDocument, onNewDocument }: DocumentListProps) {
  const { user, logout } = useUser();
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const docs = await getUserDocuments(user.id);
      setDocuments(docs);
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleDelete = async (docId: string) => {
    if (!user) return;
    setIsDeleting(true);
    try {
      await deleteDocumentAction(docId);
      await loadDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDecayColor = (decay: number) => {
    if (decay >= 85) return 'text-red-500';
    if (decay >= 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-background p-4"
    >
      <div className="paper-texture corner-fold page-depth max-w-2xl w-full p-8 md:p-12 relative max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="welcome-title text-2xl text-foreground flex items-center gap-2">
              <FileText className="w-6 h-6 text-accent" />
              Your Documents
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Welcome back, <span className="font-medium">{user?.username}</span>
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={logout}
            className="text-muted-foreground hover:text-foreground"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2">
          <AnimatePresence>
            {isLoading ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <RefreshCw className="w-8 h-8 text-muted-foreground/50 mx-auto mb-4 animate-spin" />
                <p className="text-muted-foreground">Loading documents...</p>
              </motion.div>
            ) : documents.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <FileText className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">No documents yet</p>
                <p className="text-muted-foreground text-sm mt-1">
                  Create your first document to begin
                </p>
              </motion.div>
            ) : (
              documents.map((doc, index) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="group flex items-center gap-4 p-4 rounded-sm bg-card/50 border border-border/50 hover:border-accent/50 cursor-pointer transition-colors"
                  onClick={() => onSelectDocument(doc.id)}
                >
                  <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground truncate">
                      {doc.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(doc.updatedAt)}
                      </span>
                      <span className={`flex items-center gap-1 ${getDecayColor(doc.currentDecayLevel)}`}>
                        {doc.currentDecayLevel >= 85 && <AlertTriangle className="w-3 h-3" />}
                        {Math.round(doc.currentDecayLevel)}% decay
                      </span>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteId(doc.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <Button
          onClick={onNewDocument}
          className="w-full btn-ink text-lg py-3"
        >
          <Plus className="w-5 h-5 mr-2" />
          New Document
        </Button>

        <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Document?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. The document and all its history will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteId && handleDelete(deleteId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </motion.div>
  );
}
