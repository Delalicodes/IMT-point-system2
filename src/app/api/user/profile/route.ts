import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        imageUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    console.log('Session in PATCH:', session);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const data = await request.json();
    console.log('Update data:', data);

    const { firstName, lastName, email, phoneNumber, username } = data;

    // Validate required fields
    if (!firstName || !lastName) {
      return NextResponse.json(
        { error: 'First name and last name are required' },
        { status: 400 }
      );
    }

    // Check if username is already taken
    if (username) {
      const existingUser = await prisma.user.findFirst({
        where: {
          username,
          id: { not: session.user.id },
        },
      });

      if (existingUser) {
        return NextResponse.json(
          { error: 'Username is already taken' },
          { status: 400 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
        username,
      },
      select: {
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
        username: true,
        imageUrl: true,
      },
    });

    console.log('Updated user:', updatedUser);

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });

    return NextResponse.json(
      { error: 'Failed to update user profile', details: error.message },
      { status: 500 }
    );
  }
}
