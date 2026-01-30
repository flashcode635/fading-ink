import { DocumentState } from '@/types/document';

const API_BASE = '/api';

// User API
export async function findOrCreateUser(username: string): Promise<{
  id: string;
  username: string;
  createdAt: string;
}> {
  const response = await fetch(`${API_BASE}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });
  if (!response.ok) throw new Error('Failed to find or create user');
  return response.json();
}

// Document API
export interface DocumentSummary {
  id: string;
  title: string;
  currentDecayLevel: number;
  updatedAt: string;
  createdAt: string;
}

export async function getUserDocuments(userId: string): Promise<DocumentSummary[]> {
  const response = await fetch(`${API_BASE}/users/${userId}/documents`);
  if (!response.ok) throw new Error('Failed to fetch documents');
  return response.json();
}

export async function getDocument(documentId: string): Promise<{
  id: string;
  title: string;
  content: DocumentState;
  currentDecayLevel: number;
  globalDecayMultiplier: number;
  documentAge: number;
  totalEdits: number;
  currentPageIndex: number;
}> {
  const response = await fetch(`${API_BASE}/documents/${documentId}`);
  if (!response.ok) throw new Error('Failed to fetch document');
  return response.json();
}

export async function createDocument(
  userId: string,
  title: string,
  content: DocumentState
): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, title, content }),
  });
  if (!response.ok) throw new Error('Failed to create document');
  return response.json();
}

export async function updateDocument(
  documentId: string,
  data: {
    title?: string;
    content?: DocumentState;
    currentDecayLevel?: number;
    globalDecayMultiplier?: number;
    documentAge?: number;
    totalEdits?: number;
    currentPageIndex?: number;
  }
): Promise<void> {
  const response = await fetch(`${API_BASE}/documents/${documentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to update document');
}

export async function deleteDocument(documentId: string): Promise<void> {
  const response = await fetch(`${API_BASE}/documents/${documentId}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete document');
}

// Snapshot API
export async function createSnapshot(
  documentId: string,
  content: DocumentState,
  decayLevel: number,
  documentAge: number
): Promise<{ id: string }> {
  const response = await fetch(`${API_BASE}/documents/${documentId}/snapshots`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, decayLevel, documentAge }),
  });
  if (!response.ok) throw new Error('Failed to create snapshot');
  return response.json();
}

export async function getSnapshots(documentId: string): Promise<{
  id: string;
  decayLevel: number;
  documentAge: number;
  createdAt: string;
}[]> {
  const response = await fetch(`${API_BASE}/documents/${documentId}/snapshots`);
  if (!response.ok) throw new Error('Failed to fetch snapshots');
  return response.json();
}
