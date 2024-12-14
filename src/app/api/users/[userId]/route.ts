import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Delete a single user
export async function DELETE(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    await prisma.user.delete({
      where: {
        id: userId,
      },
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Failed to delete user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

// Update a single user
export async function PATCH(
  request: Request,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const data = await request.json();

    // Remove password if it's empty (for edit operations)
    if (data.password === '') {
      delete data.password;
    }

    // Remove confirmPassword as it's not needed in the database
    delete data.confirmPassword;

    const updatedUser = await prisma.user.update({
      where: {
        id: userId,
      },
      data,
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Failed to update user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}
