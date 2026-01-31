import { DocumentState } from '@/types/document';

export interface DocumentSummary {
  id: string;
  title: string;
  currentDecayLevel: number;
  updatedAt: string;
  createdAt: string;
}

export interface DocumentData {
  id: string;
  title: string;
  content: DocumentState;
  currentDecayLevel: number;
  globalDecayMultiplier: number;
  documentAge: number;
  totalEdits: number;
  currentPageIndex: number;
  createdAt: string;
  updatedAt: string;
  lastSavedAt: string;
}

/**
 * Get all documents for a user
 */
export async function getUserDocuments(userId: string): Promise<DocumentSummary[]> {
  const response = await fetch(`/api/users/${userId}/documents`);

  if (!response.ok) {
    throw new Error('Failed to get documents');
  }

  return response.json();
}

/**
 * Get a single document by ID
 */
export async function getDocument(documentId: string): Promise<DocumentData | null> {
  const response = await fetch(`/api/documents/${documentId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to get document');
  }

  return response.json();
}

/**
 * Save or update a document (upsert)
 */
export async function saveDocument(
  userId: string,
  documentId: string,
  title: string,
  content: DocumentState,
  options?: {
    currentDecayLevel?: number;
    globalDecayMultiplier?: number;
    documentAge?: number;
    totalEdits?: number;
    currentPageIndex?: number;
  }
): Promise<{ id: string }> {
  const response = await fetch('/api/documents', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      documentId,
      title,
      content,
      ...options,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to save document');
  }

  return response.json();
}

/**
 * Delete a document
 */
export async function deleteDocument(documentId: string): Promise<void> {
  const response = await fetch(`/api/documents/${documentId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Failed to delete document');
  }
}

/**
 * Create a document snapshot
 */
export async function createSnapshot(
  documentId: string,
  content: DocumentState,
  decayLevel: number,
  documentAge: number
): Promise<{ id: string }> {
  const response = await fetch(`/api/documents/${documentId}/snapshots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, decayLevel, documentAge }),
  });

  if (!response.ok) {
    throw new Error('Failed to create snapshot');
  }

  return response.json();
}

/**
 * Get snapshots for a document
 */
export async function getSnapshots(documentId: string): Promise<{
  id: string;
  decayLevel: number;
  documentAge: number;
  createdAt: string;
}[]> {
  const response = await fetch(`/api/documents/${documentId}/snapshots`);

  if (!response.ok) {
    throw new Error('Failed to get snapshots');
  }

  return response.json();
}
