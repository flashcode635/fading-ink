import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/documents/[documentId]/snapshots - Get all snapshots for a document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;

    const snapshots = await prisma.documentSnapshot.findMany({
      where: { documentId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        decayLevel: true,
        documentAge: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      snapshots.map((s) => ({
        id: s.id,
        decayLevel: s.decayLevel,
        documentAge: Number(s.documentAge),
        createdAt: s.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Error in GET /api/documents/[documentId]/snapshots:', error);
    return NextResponse.json(
      { error: 'Failed to get snapshots' },
      { status: 500 }
    );
  }
}

// POST /api/documents/[documentId]/snapshots - Create a snapshot
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ documentId: string }> }
) {
  try {
    const { documentId } = await params;
    const { content, decayLevel, documentAge } = await request.json();

    const snapshot = await prisma.documentSnapshot.create({
      data: {
        documentId,
        content: content as object,
        decayLevel,
        documentAge: BigInt(documentAge),
      },
    });

    return NextResponse.json({ id: snapshot.id });
  } catch (error) {
    console.error('Error in POST /api/documents/[documentId]/snapshots:', error);
    return NextResponse.json(
      { error: 'Failed to create snapshot' },
      { status: 500 }
    );
  }
}
