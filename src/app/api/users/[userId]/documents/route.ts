import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// GET /api/users/[userId]/documents - Get all documents for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const documents = await prisma.document.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        currentDecayLevel: true,
        updatedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      documents.map((doc) => ({
        id: doc.id,
        title: doc.title,
        currentDecayLevel: doc.currentDecayLevel,
        updatedAt: doc.updatedAt.toISOString(),
        createdAt: doc.createdAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error('Error in GET /api/users/[userId]/documents:', error);
    return NextResponse.json(
      { error: 'Failed to get documents' },
      { status: 500 }
    );
  }
}
