import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// POST /api/documents - Create or upsert a document
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const {
      userId,
      documentId,
      title,
      content,
      currentDecayLevel = 0,
      globalDecayMultiplier = 1,
      documentAge = 0,
      totalEdits = 0,
      currentPageIndex = 0,
    } = data;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!title) {
      return NextResponse.json(
        { error: 'title is required' },
        { status: 400 }
      );
    }

    // If documentId is provided, upsert; otherwise create new
    if (documentId) {
      const doc = await prisma.document.upsert({
        where: { id: documentId },
        update: {
          title,
          content: content as object,
          currentDecayLevel,
          globalDecayMultiplier,
          documentAge: BigInt(documentAge),
          totalEdits,
          currentPageIndex,
          lastSavedAt: new Date(),
        },
        create: {
          id: documentId,
          userId,
          title,
          content: content as object,
          currentDecayLevel,
          globalDecayMultiplier,
          documentAge: BigInt(documentAge),
          totalEdits,
          currentPageIndex,
        },
      });

      return NextResponse.json({ id: doc.id });
    }

    // Create new document
    const doc = await prisma.document.create({
      data: {
        userId,
        title,
        content: content as object,
        currentDecayLevel,
        globalDecayMultiplier,
        documentAge: BigInt(documentAge),
        totalEdits,
        currentPageIndex,
      },
    });

    return NextResponse.json({ id: doc.id });
  } catch (error) {
    console.error('Error in POST /api/documents:', error);
    return NextResponse.json(
      { error: 'Failed to create document' },
      { status: 500 }
    );
  }
}
