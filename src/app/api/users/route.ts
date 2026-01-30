import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

// POST /api/users - Find or create user
export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json();

    if (!username || typeof username !== 'string' || username.trim() === '') {
      return NextResponse.json(
        { error: 'Username is required' },
        { status: 400 }
      );
    }

    const normalizedUsername = username.trim().toLowerCase();

    // Try to find existing user
    let user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    // Create new user if not found
    if (!user) {
      user = await prisma.user.create({
        data: { username: normalizedUsername },
      });
    }

    return NextResponse.json({
      id: user.id,
      username: user.username,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('Error in POST /api/users:', error);
    return NextResponse.json(
      { error: 'Failed to find or create user' },
      { status: 500 }
    );
  }
}
