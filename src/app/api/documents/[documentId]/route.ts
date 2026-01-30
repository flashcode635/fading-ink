import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/documents/[documentId] - Get a document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;

    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: doc.id,
      title: doc.title,
      content: doc.content,
      currentDecayLevel: doc.currentDecayLevel,
      globalDecayMultiplier: doc.globalDecayMultiplier,
      documentAge: Number(doc.documentAge),
      totalEdits: doc.totalEdits,
      currentPageIndex: doc.currentPageIndex,
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      lastSavedAt: doc.lastSavedAt.toISOString(),
    });
  } catch (error) {
    console.error('Error in GET /api/documents/[documentId]:', error);
    return NextResponse.json(
      { error: 'Failed to get document' },
      { status: 500 }
    );
  }
}

// PATCH /api/documents/[documentId] - Update a document
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const data = await request.json();

    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    if (data.currentDecayLevel !== undefined) updateData.currentDecayLevel = data.currentDecayLevel;
    if (data.globalDecayMultiplier !== undefined) updateData.globalDecayMultiplier = data.globalDecayMultiplier;
    if (data.documentAge !== undefined) updateData.documentAge = BigInt(data.documentAge);
    if (data.totalEdits !== undefined) updateData.totalEdits = data.totalEdits;
    if (data.currentPageIndex !== undefined) updateData.currentPageIndex = data.currentPageIndex;

    updateData.lastSavedAt = new Date();

    await prisma.document.update({
      where: { id: documentId },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in PATCH /api/documents/[documentId]:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// DELETE /api/documents/[documentId] - Delete a document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;

    await prisma.document.delete({
      where: { id: documentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/documents/[documentId]:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
