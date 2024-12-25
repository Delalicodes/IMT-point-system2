import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    console.log('GET /api/user/profile - Start');
    const session = await getServerSession(authOptions);
    console.log('Session:', JSON.stringify(session, null, 2));

    if (!session?.user?.id) {
      console.log('No session or user ID found');
      return NextResponse.json(
        { error: 'Unauthorized', session: session },
        { status: 401 }
      );
    }

    console.log('Fetching user with ID:', session.user.id);

    const user = await prisma.user.findUnique({
      where: { 
        id: session.user.id 
      },
    });

    console.log('Database response:', JSON.stringify(user, null, 2));

    if (!user) {
      console.log('User not found in database');
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Remove sensitive data
    const safeUser = {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      username: user.username,
      imageUrl: user.imageUrl,
    };

    console.log('Returning user data:', JSON.stringify(safeUser, null, 2));
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { error: 'Failed to fetch user profile', details: error.message },
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
